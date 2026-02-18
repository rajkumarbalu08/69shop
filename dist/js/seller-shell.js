(function (global) {
    if (global.SellerShell) {
        return;
    }

    const ORDER_BADGE_SELECTOR = '[data-orders-badge]';
    const MESSAGES_BADGE_SELECTOR = '[data-messages-badge]';
    const NAME_SELECTOR = '[data-seller-name]';
    const AVATAR_SELECTOR = '[data-seller-avatar]';
    const STATUS_SELECTOR = '[data-seller-status]';
    const VERIFICATION_LINK_SELECTOR = '[data-verification-link]';
    const LOGO_SELECTOR = '[data-seller-logo]';
    const ORDER_BADGE_MAX = 99;
    const ORDER_PENDING_STATES = ['pending', 'processing', 'awaiting_payment', 'awaiting_shipment'];

    const STATUS_CONFIG = {
        approved: {
            label: 'Verified Seller',
            icon: 'fas fa-check-circle',
            className: 'profile-status verified'
        },
        pending: {
            label: 'Verification Pending',
            icon: 'fas fa-clock',
            className: 'profile-status pending'
        },
        rejected: {
            label: 'Verification Rejected',
            icon: 'fas fa-times-circle',
            className: 'profile-status',
            color: 'var(--danger, #EF4444)'
        },
        reverify: {
            label: 'Reverification Required',
            icon: 'fas fa-arrows-rotate',
            className: 'profile-status pending'
        }
    };

    const state = {
        sellerId: null,
        sellerName: '',
        avatarInitial: 'S',
        status: null,
        pendingOrders: 0,
        updatedAt: 0
    };

    function normalizeStatus(value) {
        if (!value) return '';
        return String(value).trim().toLowerCase();
    }

    function requiresReverification(source = {}) {
        return Boolean(
            source.requiresReverification ||
            source.reverificationRequired ||
            source.forceReverify ||
            source.forceReverification ||
            source.needsReverification
        );
    }

    function formatDisplayName(sellerData = {}, email = '') {
        return (
            sellerData.businessName ||
            sellerData.storeName ||
            sellerData.name ||
            (email ? email.split('@')[0] : '') ||
            'Seller'
        );
    }

    function applyTextContent(selector, text) {
        if (!selector) return;
        document.querySelectorAll(selector).forEach((node) => {
            node.textContent = text;
        });
    }

    function applyAvatar(initial) {
        document.querySelectorAll(AVATAR_SELECTOR).forEach((node) => {
            if (node.dataset.keepContent === 'true') {
                return;
            }
            node.textContent = initial;
        });
    }

    function applyLogo(url) {
        if (!url) return;
        document.querySelectorAll(LOGO_SELECTOR).forEach((node) => {
            node.innerHTML = `<img src="${url}" alt="Seller logo">`;
        });
    }

    function renderStatus(payload) {
        if (!payload) return;
        document.querySelectorAll(STATUS_SELECTOR).forEach((node) => {
            node.className = payload.className || 'profile-status';
            node.style.color = payload.color || '';
            node.innerHTML = `<i class="${payload.icon}"></i><span>${payload.label}</span>`;
        });
    }

    function toggleVerificationLink(disabled, tooltip = '') {
        document.querySelectorAll(VERIFICATION_LINK_SELECTOR).forEach((link) => {
            if (disabled) {
                if (!link.dataset.originalHref && link.getAttribute('href')) {
                    link.dataset.originalHref = link.getAttribute('href');
                }
                link.removeAttribute('href');
                link.classList.add('disabled');
                link.setAttribute('aria-disabled', 'true');
                link.setAttribute('tabindex', '-1');
                if (tooltip) {
                    link.title = tooltip;
                }
            } else {
                const restored = link.dataset.originalHref || '/seller-verification.html';
                link.setAttribute('href', restored);
                link.classList.remove('disabled');
                link.removeAttribute('aria-disabled');
                link.removeAttribute('tabindex');
                link.removeAttribute('title');
            }
        });
    }

    function updateOrdersBadge(count) {
        document.querySelectorAll(ORDER_BADGE_SELECTOR).forEach((badge) => {
            if (count > 0) {
                const displayValue = count > ORDER_BADGE_MAX ? `${ORDER_BADGE_MAX}+` : count;
                badge.textContent = displayValue;
                badge.style.display = 'inline-flex';
            } else {
                badge.textContent = '';
                badge.style.display = 'none';
            }
        });
    }

    function updateMessagesBadge(count) {
        document.querySelectorAll(MESSAGES_BADGE_SELECTOR).forEach((badge) => {
            if (count > 0) {
                const displayValue = count > ORDER_BADGE_MAX ? `${ORDER_BADGE_MAX}+` : count;
                badge.textContent = displayValue;
                badge.style.display = 'inline-flex';
            } else {
                badge.textContent = '';
                badge.style.display = 'none';
            }
        });
    }

    async function countUnreadMessages(db, sellerId) {
        try {
            const snapshot = await db.collection('conversations')
                .where('sellerId', '==', sellerId)
                .get();
            let unread = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                unread += (data.unreadSeller || 0);
            });
            return unread;
        } catch (error) {
            console.warn('SellerShell: unable to load unread messages', error);
            return 0;
        }
    }

    function deriveStatusPayload(sellerData = {}, verificationData = {}) {
        const sellerStatus = normalizeStatus(sellerData.status || sellerData.verificationStatus);
        const verificationStatus = normalizeStatus(verificationData.status || verificationData.verificationStatus);
        const rawStatus = verificationStatus || sellerStatus;
        const isVerified = sellerData.verified === true || verificationData.verified === true || rawStatus === 'approved';
        const needsReverify = requiresReverification(sellerData) || requiresReverification(verificationData);
        let code = rawStatus;
        if (needsReverify) {
            code = 'reverify';
        } else if (!code && isVerified) {
            code = 'approved';
        } else if (!code) {
            code = 'pending';
        }
        const config = STATUS_CONFIG[code] || STATUS_CONFIG.pending;
        return {
            code,
            label: config.label,
            icon: config.icon,
            className: config.className,
            color: config.color || '',
            isVerified,
            needsReverify,
            tooltip: isVerified && !needsReverify ? 'You are already a verified seller.' : ''
        };
    }

    async function countPendingOrders(db, sellerId) {
        try {
            const snapshot = await db.collection('orders').where('sellerId', '==', sellerId).get();
            let pending = 0;
            snapshot.forEach((doc) => {
                const status = normalizeStatus(doc.data()?.status);
                if (ORDER_PENDING_STATES.includes(status)) {
                    pending += 1;
                }
            });
            return pending;
        } catch (error) {
            console.warn('SellerShell: unable to load pending orders', error);
            return 0;
        }
    }

    async function loadSellerDoc(db, sellerId, fallback) {
        if (fallback) return fallback;
        const doc = await db.collection('sellers').doc(sellerId).get();
        return doc.exists ? doc.data() : {};
    }

    async function loadVerificationDoc(db, sellerId, fallback) {
        if (fallback) return fallback;
        try {
            const doc = await db.collection('sellerVerification').doc(sellerId).get();
            return doc.exists ? doc.data() : {};
        } catch (error) {
            console.warn('SellerShell: verification lookup failed', error);
            return {};
        }
    }

    async function sync(options = {}) {
        const { db, auth, user, sellerDoc, sellerId, verificationDoc, pendingOrders } = options;
        if (!db) {
            throw new Error('SellerShell.sync requires a Firestore instance');
        }
        const activeUser = user || auth?.currentUser;
        const uid = sellerId || activeUser?.uid;
        if (!uid) {
            throw new Error('SellerShell.sync requires an authenticated seller');
        }

        const resolvedSeller = await loadSellerDoc(db, uid, sellerDoc);
        const resolvedVerification = await loadVerificationDoc(db, uid, verificationDoc);
        const displayName = formatDisplayName(resolvedSeller, activeUser?.email);
        const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'S';

        applyTextContent(NAME_SELECTOR, displayName);
        applyAvatar(avatarInitial);
        applyLogo(resolvedSeller.logoUrl);

        const statusPayload = deriveStatusPayload(resolvedSeller, resolvedVerification);
        renderStatus(statusPayload);
        toggleVerificationLink(statusPayload.isVerified && !statusPayload.needsReverify, statusPayload.tooltip);

        let badgeCount = typeof pendingOrders === 'number' ? pendingOrders : await countPendingOrders(db, uid);
        updateOrdersBadge(badgeCount);

        let unreadMessages = await countUnreadMessages(db, uid);
        updateMessagesBadge(unreadMessages);

        state.sellerId = uid;
        state.sellerName = displayName;
        state.avatarInitial = avatarInitial;
        state.status = statusPayload;
        state.pendingOrders = badgeCount;
        state.unreadMessages = unreadMessages;
        state.updatedAt = Date.now();

        return { ...state };
    }

    global.SellerShell = {
        sync,
        updateOrdersBadge,
        updateMessagesBadge,
        renderStatus,
        disableVerificationLink: toggleVerificationLink
    };
})(window);
