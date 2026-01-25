/**
 * 69Shop.in - Seller Pages Smoke Test
 * ====================================
 * 
 * Automated smoke test for all seller pages.
 * Run in browser console on any seller page while logged in.
 * 
 * Usage:
 * 1. Login to seller account
 * 2. Open browser DevTools (F12)
 * 3. Paste this script in Console
 * 4. Press Enter to run
 */

const SellerSmokeTest = {
    results: [],
    startTime: null,
    
    sellerPages: [
        { name: 'Dashboard', path: '/seller-dashboard.html' },
        { name: 'Products', path: '/seller-products.html' },
        { name: 'Orders', path: '/seller-orders.html' },
        { name: 'Services', path: '/seller-services.html' },
        { name: 'Analytics', path: '/seller-analytics.html' },
        { name: 'Payments', path: '/seller-payments.html' },
        { name: 'Reviews', path: '/seller-reviews.html' },
        { name: 'Settings', path: '/seller-settings.html' },
        { name: 'Verification', path: '/seller-verification.html' }
    ],
    
    log(type, message, details = '') {
        const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
        const colors = { pass: '#22C55E', fail: '#EF4444', warn: '#F59E0B', info: '#3B82F6' };
        console.log(
            `%c${icons[type]} ${message}`,
            `color: ${colors[type]}; font-weight: bold;`,
            details
        );
        this.results.push({ type, message, details, timestamp: new Date().toISOString() });
    },
    
    async runAllTests() {
        this.startTime = Date.now();
        console.clear();
        console.log('%c🧪 Seller Pages Smoke Test', 'color: #7C3AED; font-size: 24px; font-weight: bold;');
        console.log('%c' + '═'.repeat(60), 'color: #94A3B8;');
        console.log('');
        
        // Test 1: Firebase Connection
        await this.testFirebaseConnection();
        
        // Test 2: Current User Authentication
        await this.testAuthentication();
        
        // Test 3: Seller Data Access
        await this.testSellerDataAccess();
        
        // Test 4: Verification Status Detection
        await this.testVerificationStatus();
        
        // Test 5: SellerShell Integration
        this.testSellerShellIntegration();
        
        // Test 6: Navigation Links
        this.testNavigationLinks();
        
        // Test 7: UI Components
        this.testUIComponents();
        
        // Test 8: CSS Variables
        this.testCSSVariables();
        
        // Test 9: Responsive Design
        this.testResponsiveDesign();
        
        // Test 10: Console Errors
        this.checkConsoleErrors();
        
        // Print Summary
        this.printSummary();
        
        return this.results;
    },
    
    async testFirebaseConnection() {
        console.log('%c📡 Testing Firebase Connection...', 'color: #7C3AED; font-weight: bold;');
        
        try {
            if (typeof firebase === 'undefined') {
                this.log('fail', 'Firebase SDK not loaded');
                return;
            }
            
            if (!firebase.apps.length) {
                this.log('fail', 'Firebase not initialized');
                return;
            }
            
            const db = firebase.firestore();
            // Try a simple read
            await db.collection('sellers').limit(1).get();
            this.log('pass', 'Firebase connection successful');
            
        } catch (error) {
            this.log('fail', 'Firebase connection failed', error.message);
        }
    },
    
    async testAuthentication() {
        console.log('%c🔐 Testing Authentication...', 'color: #7C3AED; font-weight: bold;');
        
        try {
            const auth = firebase.auth();
            const user = auth.currentUser;
            
            if (!user) {
                this.log('warn', 'No user logged in - some tests will be skipped');
                return;
            }
            
            this.log('pass', 'User authenticated', user.email);
            
            // Check if user has seller account
            const db = firebase.firestore();
            const sellerDoc = await db.collection('sellers').doc(user.uid).get();
            
            if (sellerDoc.exists) {
                this.log('pass', 'Seller account found', sellerDoc.data().businessName || 'No business name');
            } else {
                this.log('warn', 'No seller account found for user');
            }
            
        } catch (error) {
            this.log('fail', 'Authentication test failed', error.message);
        }
    },
    
    async testSellerDataAccess() {
        console.log('%c📦 Testing Seller Data Access...', 'color: #7C3AED; font-weight: bold;');
        
        try {
            const auth = firebase.auth();
            const user = auth.currentUser;
            if (!user) {
                this.log('warn', 'Skipped - no user logged in');
                return;
            }
            
            const db = firebase.firestore();
            
            // Test sellers collection
            const sellerDoc = await db.collection('sellers').doc(user.uid).get();
            this.log(sellerDoc.exists ? 'pass' : 'warn', 'Sellers collection access', 
                sellerDoc.exists ? 'Document found' : 'No document');
            
            // Test sellerVerification collection
            const verDoc = await db.collection('sellerVerification').doc(user.uid).get();
            this.log(verDoc.exists ? 'pass' : 'info', 'SellerVerification collection access',
                verDoc.exists ? 'Document found' : 'No document');
            
            // Test products collection
            const products = await db.collection('products').where('sellerId', '==', user.uid).limit(1).get();
            this.log('pass', 'Products collection access', `${products.size} products found`);
            
            // Test orders collection
            const orders = await db.collection('orders').where('sellerId', '==', user.uid).limit(1).get();
            this.log('pass', 'Orders collection access', `${orders.size} orders found`);
            
        } catch (error) {
            this.log('fail', 'Data access test failed', error.message);
        }
    },
    
    async testVerificationStatus() {
        console.log('%c✓ Testing Verification Status...', 'color: #7C3AED; font-weight: bold;');
        
        try {
            const auth = firebase.auth();
            const user = auth.currentUser;
            if (!user) {
                this.log('warn', 'Skipped - no user logged in');
                return;
            }
            
            const db = firebase.firestore();
            const sellerDoc = await db.collection('sellers').doc(user.uid).get();
            const verDoc = await db.collection('sellerVerification').doc(user.uid).get();
            
            const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
            const verData = verDoc.exists ? verDoc.data() : {};
            
            // Log verification status
            this.log('info', 'Verification data:', JSON.stringify({
                'seller.verified': sellerData.verified,
                'seller.status': sellerData.status,
                'verification.status': verData.status
            }));
            
            // Check if verified
            const isVerified = 
                sellerData.verified === true || 
                sellerData.status === 'approved' ||
                verData.status === 'approved';
            
            if (isVerified) {
                this.log('pass', 'Seller is verified');
            } else {
                this.log('info', 'Seller is not verified (pending or not submitted)');
            }
            
            // Check UI reflects status
            const statusEl = document.querySelector('[data-seller-status]');
            if (statusEl) {
                const hasVerifiedClass = statusEl.classList.contains('verified');
                const hasPendingClass = statusEl.classList.contains('pending');
                
                if (isVerified && hasVerifiedClass) {
                    this.log('pass', 'UI correctly shows verified status');
                } else if (!isVerified && hasPendingClass) {
                    this.log('pass', 'UI correctly shows pending status');
                } else if (isVerified && !hasVerifiedClass) {
                    this.log('fail', 'UI shows pending but seller is verified!');
                } else {
                    this.log('warn', 'Verification UI state unclear', 
                        `Classes: ${statusEl.className}`);
                }
            }
            
        } catch (error) {
            this.log('fail', 'Verification status test failed', error.message);
        }
    },
    
    testSellerShellIntegration() {
        console.log('%c🐚 Testing SellerShell Integration...', 'color: #7C3AED; font-weight: bold;');
        
        // Check if SellerShell exists
        if (typeof window.SellerShell !== 'undefined') {
            this.log('pass', 'SellerShell loaded');
        } else {
            this.log('warn', 'SellerShell not found - may not be required on this page');
            return;
        }
        
        // Check data-seller-* elements
        const nameEl = document.querySelector('[data-seller-name]');
        const avatarEl = document.querySelector('[data-seller-avatar]');
        const statusEl = document.querySelector('[data-seller-status]');
        
        if (nameEl) {
            this.log('pass', 'Seller name element found', nameEl.textContent);
        } else {
            this.log('warn', 'Seller name element not found');
        }
        
        if (avatarEl) {
            this.log('pass', 'Seller avatar element found', avatarEl.textContent);
        }
        
        if (statusEl) {
            this.log('pass', 'Seller status element found', statusEl.textContent);
        }
    },
    
    testNavigationLinks() {
        console.log('%c🔗 Testing Navigation Links...', 'color: #7C3AED; font-weight: bold;');
        
        const navLinks = document.querySelectorAll('.nav-link, .sidebar-nav a');
        let validLinks = 0;
        let brokenLinks = 0;
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/') && !href.includes('#')) {
                // Check if it's a valid seller page
                const isValid = this.sellerPages.some(p => p.path === href) || 
                               ['/shop.html', '/'].includes(href);
                if (isValid) {
                    validLinks++;
                } else {
                    brokenLinks++;
                    this.log('warn', 'Unknown navigation link', href);
                }
            }
        });
        
        this.log(brokenLinks === 0 ? 'pass' : 'warn', 
            `Navigation links: ${validLinks} valid, ${brokenLinks} unknown`);
        
        // Check active state
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            this.log('pass', 'Active navigation state set', activeLink.getAttribute('href'));
        } else {
            this.log('warn', 'No active navigation link found');
        }
    },
    
    testUIComponents() {
        console.log('%c🎨 Testing UI Components...', 'color: #7C3AED; font-weight: bold;');
        
        // Sidebar
        const sidebar = document.querySelector('.seller-sidebar, .sidebar');
        this.log(sidebar ? 'pass' : 'warn', 'Sidebar', sidebar ? 'Found' : 'Not found');
        
        // Header
        const header = document.querySelector('.seller-header, .header');
        this.log(header ? 'pass' : 'warn', 'Header', header ? 'Found' : 'Not found');
        
        // Main content
        const main = document.querySelector('.seller-main, main, .container');
        this.log(main ? 'pass' : 'warn', 'Main content area', main ? 'Found' : 'Not found');
        
        // Loading overlay
        const loading = document.querySelector('.loading-overlay, #loadingOverlay');
        if (loading) {
            const isHidden = loading.style.display === 'none' || 
                            getComputedStyle(loading).display === 'none';
            this.log(isHidden ? 'pass' : 'warn', 'Loading overlay', 
                isHidden ? 'Hidden (good)' : 'Still visible');
        }
        
        // Toast notification
        const toast = document.querySelector('.toast, #toast');
        this.log(toast ? 'pass' : 'info', 'Toast notification element', 
            toast ? 'Found' : 'Not found (may be optional)');
    },
    
    testCSSVariables() {
        console.log('%c🎨 Testing CSS Variables...', 'color: #7C3AED; font-weight: bold;');
        
        const root = getComputedStyle(document.documentElement);
        
        const requiredVars = [
            '--seller-primary',
            '--seller-gradient',
            '--white',
            '--success',
            '--warning'
        ];
        
        let missing = 0;
        requiredVars.forEach(varName => {
            const value = root.getPropertyValue(varName).trim();
            if (!value) {
                this.log('warn', `Missing CSS variable: ${varName}`);
                missing++;
            }
        });
        
        this.log(missing === 0 ? 'pass' : 'warn', 
            `CSS Variables: ${requiredVars.length - missing}/${requiredVars.length} found`);
    },
    
    testResponsiveDesign() {
        console.log('%c📱 Testing Responsive Design...', 'color: #7C3AED; font-weight: bold;');
        
        const width = window.innerWidth;
        const breakpoint = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
        
        this.log('info', `Current viewport: ${width}px (${breakpoint})`);
        
        // Check mobile menu toggle
        const menuToggle = document.querySelector('#menuToggle, .menu-toggle');
        if (menuToggle) {
            const isVisible = getComputedStyle(menuToggle).display !== 'none';
            this.log('info', 'Mobile menu toggle', 
                `${isVisible ? 'Visible' : 'Hidden'} at ${breakpoint} breakpoint`);
        }
        
        // Check sidebar visibility on mobile
        const sidebar = document.querySelector('.seller-sidebar');
        if (sidebar && width < 768) {
            const sidebarStyle = getComputedStyle(sidebar);
            this.log('info', 'Sidebar on mobile', 
                sidebarStyle.transform !== 'none' || sidebarStyle.left === '-280px' 
                    ? 'Hidden (correct)' : 'May need attention');
        }
    },
    
    checkConsoleErrors() {
        console.log('%c🐛 Checking for Errors...', 'color: #7C3AED; font-weight: bold;');
        
        // We can't access console history, but we can check for common issues
        const issues = [];
        
        // Check for undefined Firebase
        if (typeof firebase === 'undefined') {
            issues.push('Firebase SDK not loaded');
        }
        
        // Check for undefined elements that are commonly accessed
        const commonSelectors = ['#loadingOverlay', '#toast', '.seller-sidebar'];
        commonSelectors.forEach(sel => {
            if (!document.querySelector(sel)) {
                // Not necessarily an error, just note it
            }
        });
        
        if (issues.length === 0) {
            this.log('pass', 'No critical JavaScript issues detected');
        } else {
            issues.forEach(issue => this.log('fail', issue));
        }
    },
    
    printSummary() {
        const duration = Date.now() - this.startTime;
        
        console.log('');
        console.log('%c' + '═'.repeat(60), 'color: #94A3B8;');
        console.log('%c📊 Test Summary', 'color: #7C3AED; font-size: 18px; font-weight: bold;');
        
        const pass = this.results.filter(r => r.type === 'pass').length;
        const fail = this.results.filter(r => r.type === 'fail').length;
        const warn = this.results.filter(r => r.type === 'warn').length;
        const info = this.results.filter(r => r.type === 'info').length;
        
        console.log(`
✅ Passed: ${pass}
❌ Failed: ${fail}
⚠️ Warnings: ${warn}
ℹ️ Info: ${info}
⏱️ Duration: ${duration}ms
📄 Page: ${window.location.pathname}
        `);
        
        if (fail > 0) {
            console.log('%c⚠️ Some tests failed! Review the results above.', 
                'color: #EF4444; font-weight: bold;');
        } else if (warn > 0) {
            console.log('%c⚠️ Tests passed with warnings.', 
                'color: #F59E0B; font-weight: bold;');
        } else {
            console.log('%c✅ All tests passed!', 
                'color: #22C55E; font-weight: bold;');
        }
        
        console.log('%c' + '═'.repeat(60), 'color: #94A3B8;');
    }
};

// Auto-run
SellerSmokeTest.runAllTests();
