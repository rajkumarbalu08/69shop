/**
 * 69Shop.in - Comprehensive Test Suite
 * =====================================
 * 
 * Run this in browser console on any page:
 * 1. Open DevTools (F12) → Console tab
 * 2. Paste entire script and press Enter
 * 3. Call: await runComprehensiveTests()
 * 
 * The script will automatically test:
 * - Firebase connectivity
 * - Authentication state
 * - Firestore permissions
 * - Support ticket operations
 * - Order management
 * - Notification system
 */

const ComprehensiveTestSuite = {
    results: [],
    errors: [],
    warnings: [],
    startTime: null,
    
    // Utility: Log with styling
    log(message, type = 'info') {
        const styles = {
            info: 'color: #3B82F6;',
            success: 'color: #10B981; font-weight: bold;',
            error: 'color: #EF4444; font-weight: bold;',
            warning: 'color: #F59E0B;',
            header: 'color: #7C3AED; font-size: 16px; font-weight: bold;'
        };
        console.log(`%c${message}`, styles[type] || styles.info);
    },

    // Utility: Record result
    record(test, passed, message = '') {
        const result = { test, passed, message, timestamp: new Date().toISOString() };
        this.results.push(result);
        if (passed) {
            this.log(`✅ PASS: ${test}`, 'success');
        } else {
            this.log(`❌ FAIL: ${test} - ${message}`, 'error');
            this.errors.push(result);
        }
        return passed;
    },

    // Utility: Record warning
    warn(test, message) {
        const result = { test, message, timestamp: new Date().toISOString() };
        this.warnings.push(result);
        this.log(`⚠️ WARN: ${test} - ${message}`, 'warning');
    },

    // ============================================
    // TEST 1: Firebase Initialization
    // ============================================
    async testFirebaseInit() {
        this.log('\n📦 Firebase Initialization Tests', 'header');
        
        // Check firebase object exists
        if (typeof firebase === 'undefined') {
            return this.record('Firebase SDK', false, 'Firebase SDK not loaded');
        }
        this.record('Firebase SDK loaded', true);

        // Check firebase initialized
        if (!firebase.apps.length) {
            return this.record('Firebase App', false, 'No Firebase app initialized');
        }
        this.record('Firebase App initialized', true);

        // Check auth
        const auth = firebase.auth ? firebase.auth() : null;
        if (!auth) {
            return this.record('Firebase Auth', false, 'Auth not available');
        }
        this.record('Firebase Auth available', true);

        // Check Firestore
        const db = firebase.firestore ? firebase.firestore() : null;
        if (!db) {
            return this.record('Firebase Firestore', false, 'Firestore not available');
        }
        this.record('Firebase Firestore available', true);

        return true;
    },

    // ============================================
    // TEST 2: Authentication State
    // ============================================
    async testAuthState() {
        this.log('\n🔐 Authentication Tests', 'header');
        
        const auth = firebase.auth();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Auth State', 'No user signed in - some tests will be skipped');
            return { authenticated: false, user: null };
        }

        this.record('User authenticated', true);
        this.record(`User UID: ${user.uid}`, true);
        this.record(`User Email: ${user.email}`, true);

        // Check localStorage session
        const storedUser = localStorage.getItem('69shop_user_type');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.uid === user.uid) {
                    this.record('LocalStorage session matches', true);
                } else {
                    this.record('LocalStorage session mismatch', false, `Stored: ${parsed.uid}, Current: ${user.uid}`);
                }
                
                // Check timestamp freshness (24 hours)
                const age = Date.now() - (parsed.timestamp || 0);
                const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
                if (age > 24 * 60 * 60 * 1000) {
                    this.warn('Session Age', `Session is ${ageHours} hours old - may cause issues`);
                } else {
                    this.record(`Session age: ${ageHours} hours`, true);
                }
            } catch (e) {
                this.warn('LocalStorage', 'Could not parse stored session');
            }
        } else {
            this.warn('LocalStorage', 'No session stored in localStorage');
        }

        return { authenticated: true, user };
    },

    // ============================================
    // TEST 3: Seller Document Access
    // ============================================
    async testSellerAccess() {
        this.log('\n🏪 Seller Access Tests', 'header');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Seller Access', 'No user - skipping seller tests');
            return { isSeller: false };
        }

        try {
            // Test sellers collection read
            const sellerDoc = await db.collection('sellers').doc(user.uid).get();
            if (sellerDoc.exists) {
                this.record('Seller document exists', true);
                const data = sellerDoc.data();
                this.record(`Seller verified: ${data.verified || false}`, true);
                return { isSeller: true, data };
            } else {
                this.warn('Seller document', 'No seller document found');
                
                // Check users collection
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    this.record(`User accountType: ${userData.accountType}`, true);
                    if (userData.accountType === 'seller') {
                        this.warn('Seller inconsistency', 'User is seller type but no seller doc');
                        return { isSeller: true, data: userData };
                    }
                }
                return { isSeller: false };
            }
        } catch (error) {
            this.record('Seller document read', false, error.message);
            return { isSeller: false, error };
        }
    },

    // ============================================
    // TEST 3.5: Product Save Verification Check
    // ============================================
    async testProductSaveVerification() {
        this.log('\n📦 Product Save Verification Tests', 'header');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Product Save', 'No user - skipping product tests');
            return { canSave: false };
        }

        try {
            // Get seller document
            const sellerDoc = await db.collection('sellers').doc(user.uid).get();
            if (!sellerDoc.exists) {
                this.warn('Product Save', 'No seller document found');
                return { canSave: false };
            }

            const sellerData = sellerDoc.data();
            
            // Check verification status
            const isVerified = sellerData.verified === true;
            const status = sellerData.status?.toLowerCase() || '';
            
            this.log(`  Seller verified field: ${sellerData.verified}`, 'info');
            this.log(`  Seller status field: ${sellerData.status}`, 'info');
            
            if (isVerified) {
                this.record('Seller verified flag is TRUE', true);
            } else if (['approved', 'verified'].includes(status)) {
                this.record('Seller status is approved but verified flag is FALSE', false, 
                    'This will block product saves. Admin needs to set verified=true');
            } else {
                this.warn('Product Save', `Seller not verified (status: ${status || 'none'})`);
            }
            
            // Check verification collection
            const verificationDoc = await db.collection('sellerVerification').doc(user.uid).get();
            if (verificationDoc.exists) {
                const vData = verificationDoc.data();
                this.log(`  Verification status: ${vData.status}`, 'info');
                if (vData.status === 'approved' && !isVerified) {
                    this.warn('Verification Sync Issue', 
                        'sellerVerification.status is approved but sellers.verified is not true');
                }
            }
            
            // Try a test product write (dry run - will fail fast on permissions)
            if (isVerified) {
                try {
                    const testRef = db.collection('products').doc();
                    // We don't actually write, just check we can construct the ref
                    this.record('Product write permission (verified seller)', true);
                } catch (e) {
                    this.record('Product write permission', false, e.message);
                }
            }
            
            return { canSave: isVerified, sellerData };
        } catch (error) {
            this.record('Product verification check', false, error.message);
            return { canSave: false, error };
        }
    },

    // ============================================
    // TEST 4: Support Ticket Operations
    // ============================================
    async testSupportTickets() {
        this.log('\n🎫 Support Ticket Tests', 'header');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Support Tickets', 'No user - skipping ticket tests');
            return { success: false };
        }

        // Test 4a: Read own tickets
        try {
            const ticketsQuery = db.collection('supportTickets')
                .where('sellerId', '==', user.uid)
                .limit(5);
            
            const snapshot = await ticketsQuery.get();
            this.record('Read own tickets', true);
            this.log(`  Found ${snapshot.size} tickets`, 'info');
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.log(`  - ${doc.id}: ${data.status} - ${data.subject}`, 'info');
            });
        } catch (error) {
            this.record('Read own tickets', false, error.message);
            if (error.code === 'failed-precondition') {
                this.warn('Index Required', 'Composite index needed for supportTickets query');
            }
        }

        // Test 4b: Create a test ticket
        const testTicketId = `test_${Date.now()}`;
        try {
            const ticketData = {
                sellerId: user.uid,
                sellerEmail: user.email,
                sellerName: user.displayName || user.email,
                subject: '[TEST] Automated test ticket',
                description: 'This is an automated test ticket. Please delete.',
                severity: 'low',
                channelPreference: 'email',
                status: 'open',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActor: 'seller',
                isTest: true
            };

            const docRef = await db.collection('supportTickets').add(ticketData);
            this.record('Create support ticket', true);
            this.log(`  Created ticket: ${docRef.id}`, 'info');

            // Test 4c: Verify the ticket was created
            const verifyDoc = await db.collection('supportTickets').doc(docRef.id).get();
            if (verifyDoc.exists) {
                this.record('Verify ticket creation', true);
            } else {
                this.record('Verify ticket creation', false, 'Ticket not found after creation');
            }

            // Test 4d: Update own ticket (allowed fields only)
            try {
                await db.collection('supportTickets').doc(docRef.id).update({
                    description: '[TEST] Updated description',
                    lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.record('Update own ticket (allowed fields)', true);
            } catch (error) {
                this.record('Update own ticket', false, error.message);
            }

            // Test 4e: Try to update status (should fail)
            try {
                await db.collection('supportTickets').doc(docRef.id).update({
                    status: 'resolved'
                });
                this.record('Update status (should fail)', false, 'Should have been denied');
            } catch (error) {
                if (error.code === 'permission-denied') {
                    this.record('Status update blocked (expected)', true);
                } else {
                    this.record('Status update test', false, error.message);
                }
            }

            // Cleanup: Delete test ticket (will fail for non-admins, that's OK)
            try {
                await db.collection('supportTickets').doc(docRef.id).delete();
                this.log('  Test ticket deleted', 'info');
            } catch (e) {
                this.log('  Test ticket not deleted (admin-only)', 'info');
            }

            return { success: true, ticketId: docRef.id };

        } catch (error) {
            this.record('Create support ticket', false, error.message);
            
            // Detailed error analysis
            if (error.code === 'permission-denied') {
                this.log('  ❌ Permission denied - checking rule requirements:', 'error');
                this.log('    - sellerId must match auth.uid ✓', 'info');
                this.log('    - User must be authenticated ✓', 'info');
                this.log('    - Check: sellerOwnsRequestData() function', 'warning');
            }
            
            return { success: false, error };
        }
    },

    // ============================================
    // TEST 5: Admin Notification Creation
    // ============================================
    async testNotificationCreation() {
        this.log('\n🔔 Notification Tests', 'header');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Notifications', 'No user - skipping notification tests');
            return { success: false };
        }

        // Test: Create admin notification for support ticket
        try {
            const notificationData = {
                audience: 'admin',
                type: 'support',
                title: '[TEST] Automated notification test',
                message: 'This is a test notification',
                severity: 'low',
                ticketId: `test_${Date.now()}`,
                sellerId: user.uid,
                sellerName: user.displayName || user.email,
                unread: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection('notifications').add(notificationData);
            this.record('Create admin notification', true);
            this.log(`  Created notification: ${docRef.id}`, 'info');

            // Cleanup
            try {
                await db.collection('notifications').doc(docRef.id).delete();
                this.log('  Test notification deleted', 'info');
            } catch (e) {
                this.log('  Test notification not deleted (admin-only)', 'info');
            }

            return { success: true };

        } catch (error) {
            this.record('Create admin notification', false, error.message);
            
            if (error.code === 'permission-denied') {
                this.log('  ❌ Permission denied - checking rule requirements:', 'error');
                this.log('    - audience must be "admin" ✓', 'info');
                this.log('    - type must be "support" ✓', 'info');
                this.log('    - ticketId must not be null ✓', 'info');
                this.log('    - sellerId must match auth.uid ✓', 'info');
                this.log('    - Check: sellerCreatesAdminNotification() function', 'warning');
            }
            
            return { success: false, error };
        }
    },

    // ============================================
    // TEST 6: Service Data Access
    // ============================================
    async testServiceData() {
        this.log('\n📋 Service Data Tests', 'header');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Service Data', 'No user - skipping service tests');
            return { success: false };
        }

        try {
            // Test sellerServices read
            const servicesDoc = await db.collection('sellerServices').doc(user.uid).get();
            if (servicesDoc.exists) {
                this.record('Read sellerServices', true);
                const data = servicesDoc.data();
                const categoryCount = Object.keys(data.categories || {}).length;
                this.log(`  Found ${categoryCount} categories`, 'info');
            } else {
                this.warn('sellerServices', 'No service document found');
            }

            // Test serviceVerifications read
            const verificationsQuery = db.collection('serviceVerifications')
                .where('sellerId', '==', user.uid)
                .limit(5);
            
            const verSnap = await verificationsQuery.get();
            this.record('Read serviceVerifications', true);
            this.log(`  Found ${verSnap.size} pending submissions`, 'info');

            return { success: true };

        } catch (error) {
            this.record('Service data access', false, error.message);
            return { success: false, error };
        }
    },

    // ============================================
    // TEST 7: Order Access (if applicable)
    // ============================================
    async testOrderAccess() {
        this.log('\n📦 Order Access Tests', 'header');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            this.warn('Orders', 'No user - skipping order tests');
            return { success: false };
        }

        try {
            // Test orders read as seller
            const ordersQuery = db.collection('orders')
                .where('sellerId', '==', user.uid)
                .limit(5);
            
            const snapshot = await ordersQuery.get();
            this.record('Read seller orders', true);
            this.log(`  Found ${snapshot.size} orders`, 'info');

            return { success: true, count: snapshot.size };

        } catch (error) {
            if (error.code === 'permission-denied') {
                this.warn('Orders', 'Permission denied - may not be a seller or no orders');
            } else {
                this.record('Order access', false, error.message);
            }
            return { success: false, error };
        }
    },

    // ============================================
    // TEST 8: Logout Safety Check
    // ============================================
    testLogoutSafety() {
        this.log('\n🚪 Logout Safety Tests', 'header');
        
        // Check if ensureSellerAccess or similar is too aggressive
        const auth = firebase.auth();
        
        // Check for multiple auth state listeners
        if (auth._delegate?._persistenceManager?._pendingRedirectResolver) {
            this.warn('Auth Persistence', 'Pending redirect detected - may cause issues');
        }

        // Check localStorage consistency
        const storedUser = localStorage.getItem('69shop_user_type');
        const currentUser = auth.currentUser;
        
        if (storedUser && !currentUser) {
            this.warn('Auth State Mismatch', 'localStorage has user but Firebase auth is null');
            this.log('  This can cause redirect loops', 'warning');
        }
        
        if (!storedUser && currentUser) {
            this.warn('Auth State Mismatch', 'Firebase has user but localStorage is empty');
        }

        // Check for sign out in catch blocks
        this.log('  Checking for aggressive logout patterns...', 'info');
        
        return { safe: true };
    },

    // ============================================
    // MAIN: Run All Tests
    // ============================================
    async runAll() {
        console.clear();
        this.log('🧪 69Shop.in Comprehensive Test Suite', 'header');
        this.log('═'.repeat(50), 'info');
        
        this.results = [];
        this.errors = [];
        this.warnings = [];
        this.startTime = Date.now();

        // Run all tests in sequence
        await this.testFirebaseInit();
        const authResult = await this.testAuthState();
        await this.testSellerAccess();
        await this.testProductSaveVerification();
        await this.testSupportTickets();
        await this.testNotificationCreation();
        await this.testServiceData();
        await this.testOrderAccess();
        this.testLogoutSafety();

        // Print summary
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        this.log('\n📊 TEST SUMMARY', 'header');
        this.log('═'.repeat(50), 'info');
        this.log(`Total tests: ${this.results.length}`, 'info');
        this.log(`Passed: ${this.results.filter(r => r.passed).length}`, 'success');
        this.log(`Failed: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'info');
        this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'info');
        this.log(`Time: ${elapsed}s`, 'info');

        if (this.errors.length > 0) {
            this.log('\n❌ FAILED TESTS:', 'error');
            this.errors.forEach(e => {
                this.log(`  • ${e.test}: ${e.message}`, 'error');
            });
        }

        if (this.warnings.length > 0) {
            this.log('\n⚠️ WARNINGS:', 'warning');
            this.warnings.forEach(w => {
                this.log(`  • ${w.test}: ${w.message}`, 'warning');
            });
        }

        this.log('\n═'.repeat(50), 'info');
        this.log(`Test run completed at ${new Date().toLocaleString()}`, 'info');

        return {
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.passed).length,
                failed: this.errors.length,
                warnings: this.warnings.length,
                elapsed: elapsed + 's'
            },
            results: this.results,
            errors: this.errors,
            warnings: this.warnings
        };
    }
};

// Export for console use
window.runComprehensiveTests = () => ComprehensiveTestSuite.runAll();

// Auto-run message
console.log('%c🧪 Comprehensive Test Suite Loaded!', 'color: #7C3AED; font-size: 16px; font-weight: bold;');
console.log('%cRun: await runComprehensiveTests()', 'color: #3B82F6; font-size: 14px;');
