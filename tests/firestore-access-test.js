/**
 * 69Shop.in - Firestore Access Test Suite
 * Run this script from the browser console on any admin page after logging in.
 */
(function firestoreAccessSuite() {
    const AccessTest = {
        results: [],

        normalizeEmail(value) {
            return (value || '').toString().trim().toLowerCase();
        },

        get timestamp() {
            return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        },

        async ensureContext() {
            if (typeof firebase === 'undefined') {                throw new Error('Firebase SDK is not available on this page.');
            }
            const auth = firebase.auth?.();
            if (!auth) {
                throw new Error('Auth module not initialized.');
            }
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No user is signed in. Please log in and rerun the test.');
            }
            const db = firebase.firestore?.();
            if (!db) {
                throw new Error('Firestore is not initialized.');
            }
            return { auth, db, user };
        },

        async verifyAdminDocument({ db, user }) {
            const normalized = this.normalizeEmail(user.email);
            const raw = (user.email || '').trim();
            const adminsRef = db.collection('admins');

            const normalizedDoc = normalized ? await adminsRef.doc(normalized).get() : null;
            if (normalizedDoc?.exists) {
                return `Admin doc resolved via normalized id (${normalized}).`;
            }

            if (raw) {
                const rawDoc = await adminsRef.doc(raw).get();
                if (rawDoc.exists) {
                    return `Admin doc resolved via raw id (${raw}).`;
                }
                const query = await adminsRef.where('email', '==', raw).limit(1).get();
                if (!query.empty) {
                    return `Admin doc resolved via email field at ${query.docs[0].id}.`;
                }
            }

            throw new Error('Unable to locate admin document for current user.');
        },

        defaultTests: [
            {
                name: 'Admin document access',
                run: async (ctx, helpers) => helpers.verifyAdminDocument(ctx)
            },
            {
                name: 'Admins collection listing',
                run: async ({ db }) => {
                    const snapshot = await db.collection('admins').limit(10).get();
                    return `Fetched ${snapshot.size} admin docs.`;
                }
            },
            {
                name: 'Seller verification queue',
                run: async ({ db }) => {
                    await db.collection('sellerVerification').limit(5).get();
                    return 'Seller verification documents readable.';
                }
            },
            {
                name: 'Orders collection access',
                run: async ({ db }) => {
                    await db.collection('orders').limit(5).get();
                    return 'Orders collection readable.';
                }
            },
            {
                name: 'Products collection access',
                run: async ({ db }) => {
                    await db.collection('products').limit(5).get();
                    return 'Products collection readable.';
                }
            },
            {
                name: 'Platform settings document',
                run: async ({ db }) => {
                    const doc = await db.collection('platformSettings').doc('global').get();
                    if (!doc.exists) {
                        throw new Error('platformSettings/global document is missing.');
                    }
                    return 'Platform settings document loaded.';
                }
            },
            {
                name: 'Admin activity feed access',
                run: async ({ db }) => {
                    await db.collection('adminActivity').orderBy('timestamp', 'desc').limit(5).get();
                    return 'Admin activity feed readable.';
                }
            }
        ],

        formatDuration(start) {
            return Math.round((this.timestamp - start)) + 'ms';
        },

        logStatus(label, status, detail, duration) {
            const color = status === 'passed' ? '#22C55E' : '#EF4444';
            console.log(`%c${status === 'passed' ? '✔' : '✖'} ${label}%c (${duration}) - ${detail}`, `color:${color};font-weight:bold;`, 'color:#374151;');
        },

        async run(customTests) {
            this.results = [];
            console.log('%c🔥 Firestore Access Test Suite', 'font-size:18px;font-weight:bold;color:#DC2626;');
            console.log('Starting tests...');
            const context = await this.ensureContext();
            const tests = Array.isArray(customTests) && customTests.length ? customTests : this.defaultTests;
            let passed = 0;
            let failed = 0;

            for (const test of tests) {
                const start = this.timestamp;
                try {
                    const message = await test.run(context, this);
                    passed += 1;
                    const duration = this.formatDuration(start);
                    this.results.push({ name: test.name, status: 'passed', message, duration });
                    this.logStatus(test.name, 'passed', message, duration);
                } catch (error) {
                    failed += 1;
                    const reason = error.message || 'Unknown error';
                    const duration = this.formatDuration(start);
                    this.results.push({ name: test.name, status: 'failed', error: reason, duration });
                    const code = error.code ? ` [${error.code}]` : '';
                    this.logStatus(test.name, 'failed', `${reason}${code}`, duration);
                }
            }

            console.log('\n%cTest summary', 'font-weight:bold;color:#1F2937;');
            console.log(`Passed: ${passed}, Failed: ${failed}`);
            return { passed, failed, results: this.results };
        }
    };

    window.FirestoreAccessTest = AccessTest;
    window.runFirestoreAccessTests = () => AccessTest.run();
    console.log('Run %crunFirestoreAccessTests()%c to execute Firestore access tests.', 'color:#DC2626;font-weight:bold;', 'color:inherit;');
})();
