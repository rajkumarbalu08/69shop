#!/usr/bin/env node
/**
 * Normalize seller verification statuses and ensure sellers/{id}.verified reflects approval state.
 * Usage:
 *   node scripts/normalize-seller-statuses.js            # Dry run (default)
 *   node scripts/normalize-seller-statuses.js --apply    # Actually persist updates
 *   node scripts/normalize-seller-statuses.js --apply --limit 100
 */
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const shouldApply = args.includes('--apply') || args.includes('--fix');
const helpRequested = args.includes('--help') || args.includes('-h');
const limitIndex = args.findIndex((token) => token === '--limit');
const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : null;

if (helpRequested) {
    console.log(`\nNormalize seller verification statuses.\n\nFlags:\n  --apply        Persist changes (otherwise dry run)\n  --fix          Alias for --apply\n  --limit <n>    Process at most n verification docs\n  -h, --help     Show this message\n`);
    process.exit(0);
}

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const STATUS_ALIASES = {
    approved: ['approved', 'approve', 'verified', 'verification-complete', 'verification_complete', 'accept', 'accepted', 'completed', 'ok', 'allow'],
    pending: ['pending', 'in_review', 'in-review', 'review', 'awaiting-review', 'awaiting_review', 'new', 'submitted', 'processing'],
    rejected: ['rejected', 'reject', 'declined', 'denied', 'failed', 'blocked']
};

function normalizeStatus(value) {
    const safeValue = (value || '').toString().trim().toLowerCase();
    if (!safeValue) return 'pending';
    for (const [canonical, aliases] of Object.entries(STATUS_ALIASES)) {
        if (aliases.includes(safeValue)) {
            return canonical;
        }
    }
    if (Object.keys(STATUS_ALIASES).includes(safeValue)) {
        return safeValue;
    }
    return 'pending';
}

async function run() {
    const snapshot = await db.collection('sellerVerification').orderBy('submittedAt', 'desc').get();
    console.log(`Scanning ${snapshot.size} seller verification documents${limit ? ` (limit ${limit})` : ''}...`);

    let processed = 0;
    let statusUpdates = 0;
    let verifiedTrue = 0;
    let verifiedFalse = 0;
    let skipped = 0;
    const unknownStatuses = new Set();

    for (const doc of snapshot.docs) {
        if (limit && processed >= limit) break;
        processed += 1;
        const data = doc.data() || {};
        const rawStatus = (data.status || 'pending').toString();
        const normalized = normalizeStatus(rawStatus);
        if (!STATUS_ALIASES.approved.includes(rawStatus.trim().toLowerCase()) &&
            !STATUS_ALIASES.pending.includes(rawStatus.trim().toLowerCase()) &&
            !STATUS_ALIASES.rejected.includes(rawStatus.trim().toLowerCase()) &&
            !['approved', 'pending', 'rejected'].includes(rawStatus.trim().toLowerCase())) {
            unknownStatuses.add(rawStatus);
        }

        const verificationUpdates = {};
        if ((rawStatus || '').toLowerCase() !== normalized) {
            verificationUpdates.status = normalized;
        }

        const sellerRef = db.collection('sellers').doc(doc.id);
        let sellerSnap = null;
        try {
            sellerSnap = await sellerRef.get();
        } catch (error) {
            console.warn(`Failed to read sellers/${doc.id}:`, error.message);
        }
        const shouldBeVerified = normalized === 'approved';
        const currentVerified = sellerSnap?.exists ? !!sellerSnap.data().verified : null;
        const needsVerifiedUpdate = sellerSnap?.exists && currentVerified !== shouldBeVerified;

        if (!Object.keys(verificationUpdates).length && !needsVerifiedUpdate) {
            skipped += 1;
            continue;
        }

        if (shouldApply) {
            if (Object.keys(verificationUpdates).length) {
                await doc.ref.update(verificationUpdates);
                statusUpdates += 1;
            }
            if (needsVerifiedUpdate) {
                await sellerRef.set({ verified: shouldBeVerified }, { merge: true });
                if (shouldBeVerified) {
                    verifiedTrue += 1;
                } else {
                    verifiedFalse += 1;
                }
            }
        } else {
            const preview = {
                sellerId: doc.id,
                from: rawStatus,
                to: normalized,
                verified: shouldBeVerified
            };
            console.log('[DRY RUN]', preview);
        }
    }

    console.log('\nSummary');
    console.log('-------');
    console.log(`Processed: ${processed}`);
    console.log(`Verification status updates: ${statusUpdates}`);
    console.log(`Sellers marked verified=true: ${verifiedTrue}`);
    console.log(`Sellers marked verified=false: ${verifiedFalse}`);
    console.log(`Skipped (already normalized or seller missing): ${skipped}`);
    if (unknownStatuses.size) {
        console.log(`Unknown status values encountered: ${Array.from(unknownStatuses).join(', ')}`);
    }
    if (!shouldApply) {
        console.log('\nDry run complete. Re-run with --apply when ready.');
    }
}

run().then(() => {
    console.log(`\nDone ${shouldApply ? '(changes applied)' : '(no changes written)'}.`);
    process.exit(0);
}).catch((error) => {
    console.error('Normalization script failed:', error);
    process.exit(1);
});
