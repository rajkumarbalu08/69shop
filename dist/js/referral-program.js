/* ===================================================
   69SHOP.IN — Referral Program Module
   Invite friends, track referrals, earn rewards.
   =================================================== */

(function () {
    'use strict';

    let _db = null;
    let _auth = null;

    // Reward configs
    const REFERRAL_REWARD = 100;     // Points per successful referral
    const REFEREE_DISCOUNT = 50;     // Discount (₹) for the referred friend
    const REFERRAL_BONUS_TIERS = [
        { count: 5,  bonus: 200,  label: '5 Referrals Milestone' },
        { count: 10, bonus: 500,  label: '10 Referrals Milestone' },
        { count: 25, bonus: 1500, label: '25 Referrals Milestone' },
        { count: 50, bonus: 5000, label: '50 Referrals Milestone' }
    ];

    function init({ db, auth }) {
        if (db) _db = db;
        if (auth) _auth = auth;
    }

    /**
     * Generate or retrieve the user's unique referral code.
     */
    async function getReferralCode() {
        if (!_db || !_auth?.currentUser) return null;

        const userId = _auth.currentUser.uid;
        const docRef = _db.collection('referralCodes').doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            return doc.data().code;
        }

        // Generate a unique code
        const name = (_auth.currentUser.displayName || _auth.currentUser.email || 'user').split(/[\s@]/)[0].toUpperCase();
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = name.substring(0, 4) + suffix;

        await docRef.set({
            code: code,
            userId: userId,
            userName: _auth.currentUser.displayName || _auth.currentUser.email?.split('@')[0] || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            totalReferrals: 0,
            successfulReferrals: 0,
            totalEarnings: 0,
            status: 'active'
        });

        return code;
    }

    /**
     * Look up a referral code to find the referrer.
     */
    async function lookupCode(code) {
        if (!_db || !code) return null;

        const snapshot = await _db.collection('referralCodes')
            .where('code', '==', code.toUpperCase().trim())
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    /**
     * Record a referral when a new user signs up with a code.
     */
    async function recordReferral(referralCode, newUserId) {
        if (!_db || !referralCode || !newUserId) return null;

        const referrer = await lookupCode(referralCode);
        if (!referrer) throw new Error('Invalid referral code');
        if (referrer.userId === newUserId) throw new Error('Cannot refer yourself');

        // Check if this user was already referred
        const existing = await _db.collection('referrals')
            .where('refereeId', '==', newUserId)
            .limit(1)
            .get();

        if (!existing.empty) throw new Error('User already referred');

        // Create referral record
        const referralDoc = await _db.collection('referrals').add({
            referrerId: referrer.userId,
            referrerName: referrer.userName,
            referralCode: referralCode.toUpperCase(),
            refereeId: newUserId,
            status: 'pending',    // pending → completed (after first purchase)
            rewardGiven: false,
            referrerReward: REFERRAL_REWARD,
            refereeDiscount: REFEREE_DISCOUNT,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Increment total referrals count
        await _db.collection('referralCodes').doc(referrer.userId).update({
            totalReferrals: firebase.firestore.FieldValue.increment(1)
        });

        return referralDoc.id;
    }

    /**
     * Complete a referral (called after referee's first purchase).
     */
    async function completeReferral(refereeId) {
        if (!_db) return;

        const snapshot = await _db.collection('referrals')
            .where('refereeId', '==', refereeId)
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        if (snapshot.empty) return;

        const referral = snapshot.docs[0];
        const data = referral.data();

        // Update referral status
        await referral.ref.update({
            status: 'completed',
            rewardGiven: true,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update referrer stats
        await _db.collection('referralCodes').doc(data.referrerId).update({
            successfulReferrals: firebase.firestore.FieldValue.increment(1),
            totalEarnings: firebase.firestore.FieldValue.increment(REFERRAL_REWARD)
        });
    }

    /**
     * Get referral stats for the current user.
     */
    async function getStats() {
        if (!_db || !_auth?.currentUser) return null;

        const userId = _auth.currentUser.uid;
        const codeDoc = await _db.collection('referralCodes').doc(userId).get();

        if (!codeDoc.exists) {
            return {
                code: null,
                totalReferrals: 0,
                successfulReferrals: 0,
                totalEarnings: 0,
                pendingReferrals: 0,
                nextMilestone: REFERRAL_BONUS_TIERS[0]
            };
        }

        const data = codeDoc.data();
        const successful = data.successfulReferrals || 0;

        // Find next milestone
        let nextMilestone = null;
        for (const tier of REFERRAL_BONUS_TIERS) {
            if (successful < tier.count) {
                nextMilestone = tier;
                break;
            }
        }

        return {
            code: data.code,
            totalReferrals: data.totalReferrals || 0,
            successfulReferrals: successful,
            totalEarnings: data.totalEarnings || 0,
            pendingReferrals: (data.totalReferrals || 0) - successful,
            nextMilestone: nextMilestone
        };
    }

    /**
     * Get list of referrals for the current user.
     */
    async function getReferralList(limit) {
        if (!_db || !_auth?.currentUser) return [];

        let query = _db.collection('referrals')
            .where('referrerId', '==', _auth.currentUser.uid)
            .orderBy('createdAt', 'desc');

        if (limit) query = query.limit(limit);

        const snapshot = await query.get();
        return snapshot.docs.map(function(doc) {
            var d = doc.data();
            return {
                id: doc.id,
                refereeId: d.refereeId,
                status: d.status,
                reward: d.referrerReward || REFERRAL_REWARD,
                createdAt: d.createdAt,
                completedAt: d.completedAt || null
            };
        });
    }

    /**
     * Build the referral invite link.
     */
    function getInviteLink(code) {
        if (!code) return '';
        var baseUrl = window.location.origin || 'https://69shop.in';
        return baseUrl + '/shop-login.html?ref=' + encodeURIComponent(code);
    }

    /**
     * Copy invite link to clipboard.
     */
    async function copyInviteLink(code) {
        var link = getInviteLink(code);
        if (!link) return false;

        try {
            await navigator.clipboard.writeText(link);
            return true;
        } catch (e) {
            // Fallback
            var textarea = document.createElement('textarea');
            textarea.value = link;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            return ok;
        }
    }

    /**
     * Share via Web Share API or fallback.
     */
    async function shareInvite(code) {
        var link = getInviteLink(code);
        var text = 'Join 69Shop.in with my referral code ' + code + ' and get ₹' + REFEREE_DISCOUNT + ' off your first purchase!';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join 69Shop.in',
                    text: text,
                    url: link
                });
                return true;
            } catch (e) {
                if (e.name !== 'AbortError') console.error('Share failed:', e);
                return false;
            }
        }

        // Fallback to copy
        return copyInviteLink(code);
    }

    /**
     * Check and store referral code from URL on signup pages.
     */
    function captureReferralFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var refCode = params.get('ref');
        if (refCode) {
            localStorage.setItem('69shop_referral_code', refCode.toUpperCase().trim());
        }
        return refCode || localStorage.getItem('69shop_referral_code') || null;
    }

    /**
     * Apply captured referral after signup.
     */
    async function applyPendingReferral(newUserId) {
        var code = localStorage.getItem('69shop_referral_code');
        if (!code || !newUserId) return;

        try {
            await recordReferral(code, newUserId);
            localStorage.removeItem('69shop_referral_code');
        } catch (err) {
            console.warn('Referral application failed:', err.message);
        }
    }

    // Expose module
    window.ReferralProgram = {
        init: init,
        getReferralCode: getReferralCode,
        lookupCode: lookupCode,
        recordReferral: recordReferral,
        completeReferral: completeReferral,
        getStats: getStats,
        getReferralList: getReferralList,
        getInviteLink: getInviteLink,
        copyInviteLink: copyInviteLink,
        shareInvite: shareInvite,
        captureReferralFromUrl: captureReferralFromUrl,
        applyPendingReferral: applyPendingReferral,
        REFERRAL_REWARD: REFERRAL_REWARD,
        REFEREE_DISCOUNT: REFEREE_DISCOUNT,
        REFERRAL_BONUS_TIERS: REFERRAL_BONUS_TIERS
    };
})();
