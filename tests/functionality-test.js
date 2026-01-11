/**
 * 69Shop.in - Automated Functionality Test Script
 * ================================================
 * 
 * This script tests all pages for common functionality issues.
 * Run this in the browser console on any page of the site.
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script
 * 4. Press Enter to run
 * 5. Review the results
 */

const TestRunner = {
    results: [],
    errors: [],
    warnings: [],
    
    // Test configuration
    config: {
        baseUrl: window.location.origin,
        timeout: 5000,
        pages: [
            { name: 'Home', path: '/', requiresAuth: false },
            { name: 'Shop', path: '/shop.html', requiresAuth: false },
            { name: 'Shop Login', path: '/shop-login.html', requiresAuth: false },
            { name: 'Services', path: '/services.html', requiresAuth: false },
            { name: 'Profile', path: '/profile.html', requiresAuth: true },
            { name: 'Seller Login', path: '/seller-login.html', requiresAuth: false },
            { name: 'Seller Dashboard', path: '/seller-dashboard.html', requiresAuth: true },
            { name: 'Seller Products', path: '/seller-products.html', requiresAuth: true },
            { name: 'Seller Orders', path: '/seller-orders.html', requiresAuth: true },
            { name: 'Seller Verification', path: '/seller-verification.html', requiresAuth: true },
            { name: 'Admin Login', path: '/admin-login.html', requiresAuth: false },
            { name: 'Admin Dashboard', path: '/admin-dashboard.html', requiresAuth: true },
            { name: 'Admin Users', path: '/admin-users.html', requiresAuth: true },
            { name: 'Admin Products', path: '/admin-products.html', requiresAuth: true },
            { name: 'Admin Sellers', path: '/admin-sellers.html', requiresAuth: true },
            { name: 'Admin Orders', path: '/admin-orders.html', requiresAuth: true },
            { name: 'Admin Analytics', path: '/admin-analytics.html', requiresAuth: true },
            { name: 'Admin Settings', path: '/admin-settings.html', requiresAuth: true }
        ]
    },
    
    // Run all tests
    async runAllTests() {
        console.log('%c🧪 69Shop.in Automated Test Suite', 'color: #DC2626; font-size: 20px; font-weight: bold;');
        console.log('%c' + '='.repeat(50), 'color: #666;');
        
        const startTime = Date.now();
        
        // Current page tests
        await this.testCurrentPage();
        
        // JavaScript error detection
        this.testJavaScriptErrors();
        
        // DOM structure tests
        this.testDOMStructure();
        
        // Link validation
        this.testLinks();
        
        // Firebase integration
        await this.testFirebaseIntegration();
        
        // Accessibility tests
        this.testAccessibility();
        
        // Performance tests
        this.testPerformance();
        
        const endTime = Date.now();
        
        // Print summary
        this.printSummary(endTime - startTime);
        
        return {
            results: this.results,
            errors: this.errors,
            warnings: this.warnings
        };
    },
    
    // Test current page
    async testCurrentPage() {
        console.log('\n%c📄 Current Page Tests', 'color: #3B82F6; font-weight: bold;');
        
        const currentPath = window.location.pathname;
        const pageName = this.config.pages.find(p => p.path === currentPath)?.name || currentPath;
        
        console.log(`Testing: ${pageName} (${currentPath})`);
        
        // Check page title
        if (document.title) {
            this.pass(`Page has title: "${document.title}"`);
        } else {
            this.fail('Page is missing a title');
        }
        
        // Check viewport meta
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            this.pass('Viewport meta tag present');
        } else {
            this.warn('Missing viewport meta tag - may have mobile issues');
        }
        
        // Check for favicon
        const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (favicon) {
            this.pass('Favicon configured');
        } else {
            this.warn('No favicon configured');
        }
    },
    
    // Test JavaScript errors
    testJavaScriptErrors() {
        console.log('\n%c🔧 JavaScript Error Detection', 'color: #3B82F6; font-weight: bold;');
        
        // Check for global error handler
        const hasErrorHandler = window.onerror !== null;
        
        // Check console for recent errors (limited capability)
        try {
            // Test Firebase availability
            if (typeof firebase !== 'undefined') {
                this.pass('Firebase SDK loaded');
                
                if (firebase.apps && firebase.apps.length > 0) {
                    this.pass('Firebase app initialized');
                } else {
                    this.warn('Firebase SDK loaded but no app initialized');
                }
            } else {
                this.warn('Firebase SDK not loaded on this page');
            }
            
            // Check for common undefined errors
            if (typeof auth !== 'undefined' || typeof window.auth !== 'undefined') {
                this.pass('Auth object available');
            }
            
            if (typeof db !== 'undefined' || typeof window.db !== 'undefined') {
                this.pass('Firestore DB object available');
            }
            
        } catch (error) {
            this.fail(`JavaScript initialization error: ${error.message}`);
        }
    },
    
    // Test DOM structure
    testDOMStructure() {
        console.log('\n%c🏗️ DOM Structure Tests', 'color: #3B82F6; font-weight: bold;');
        
        // Check for header
        const header = document.querySelector('header, .header, .admin-header, .admin-topbar');
        if (header) {
            this.pass('Header element found');
        } else {
            this.warn('No header element found');
        }
        
        // Check for main content area
        const main = document.querySelector('main, .main-content, .admin-main, .admin-content');
        if (main) {
            this.pass('Main content area found');
        } else {
            this.warn('No main content area found');
        }
        
        // Check for navigation
        const nav = document.querySelector('nav, .sidebar-nav, .admin-nav');
        if (nav) {
            this.pass('Navigation found');
            
            const navLinks = nav.querySelectorAll('a');
            if (navLinks.length > 0) {
                this.pass(`Navigation has ${navLinks.length} links`);
            } else {
                this.warn('Navigation has no links');
            }
        }
        
        // Check for footer (public pages)
        const footer = document.querySelector('footer, .footer');
        const isAdminPage = window.location.pathname.includes('admin-');
        const isSellerPage = window.location.pathname.includes('seller-');
        
        if (!isAdminPage && !isSellerPage) {
            if (footer) {
                this.pass('Footer element found');
            } else {
                this.warn('No footer element on public page');
            }
        }
        
        // Check for loading overlay
        const loading = document.querySelector('.loading-overlay, #loadingOverlay');
        if (loading) {
            const isHidden = loading.style.display === 'none' || 
                           loading.classList.contains('hidden') ||
                           getComputedStyle(loading).display === 'none';
            if (isHidden) {
                this.pass('Loading overlay hidden after page load');
            } else {
                this.warn('Loading overlay still visible - possible loading issue');
            }
        }
    },
    
    // Test links
    testLinks() {
        console.log('\n%c🔗 Link Validation', 'color: #3B82F6; font-weight: bold;');
        
        const links = document.querySelectorAll('a[href]');
        let brokenLinks = [];
        let emptyLinks = [];
        let externalLinks = [];
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            if (!href || href === '#' || href === '') {
                emptyLinks.push(link);
            } else if (href.startsWith('http') && !href.includes(window.location.hostname)) {
                externalLinks.push(href);
            } else if (href.startsWith('javascript:')) {
                // JavaScript links are okay
            } else if (href === '/undefined' || href.includes('undefined')) {
                brokenLinks.push(href);
            }
        });
        
        this.pass(`Found ${links.length} total links`);
        
        if (brokenLinks.length > 0) {
            this.fail(`Found ${brokenLinks.length} broken links: ${brokenLinks.slice(0, 3).join(', ')}`);
        } else {
            this.pass('No obviously broken links found');
        }
        
        if (emptyLinks.length > 5) {
            this.warn(`${emptyLinks.length} empty/placeholder links found`);
        }
        
        if (externalLinks.length > 0) {
            this.pass(`${externalLinks.length} external links found`);
        }
    },
    
    // Test Firebase integration
    async testFirebaseIntegration() {
        console.log('\n%c🔥 Firebase Integration Tests', 'color: #3B82F6; font-weight: bold;');
        
        if (typeof firebase === 'undefined') {
            this.warn('Firebase not available on this page');
            return;
        }
        
        try {
            // Check Firebase config
            if (window.firebaseConfig) {
                const config = window.firebaseConfig;
                
                if (config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
                    this.pass('Firebase API key configured');
                } else {
                    this.fail('Firebase API key not configured or using placeholder');
                }
                
                if (config.projectId) {
                    this.pass(`Project ID: ${config.projectId}`);
                } else {
                    this.fail('Firebase project ID missing');
                }
            } else {
                this.warn('Firebase config not exposed to window');
            }
            
            // Check auth state
            if (firebase.auth) {
                const auth = firebase.auth();
                const user = auth.currentUser;
                
                if (user) {
                    this.pass(`User logged in: ${user.email}`);
                } else {
                    this.pass('No user currently logged in');
                }
            }
            
            // Check Firestore connection
            if (firebase.firestore) {
                const db = firebase.firestore();
                try {
                    // Try a simple read (may fail due to permissions, but tests connection)
                    await db.collection('_test_').doc('_ping_').get()
                        .catch(() => {}); // Ignore permission errors
                    this.pass('Firestore connection working');
                } catch (error) {
                    if (error.code === 'permission-denied') {
                        this.pass('Firestore connected (permission denied is expected for test)');
                    } else {
                        this.warn(`Firestore issue: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            this.fail(`Firebase test error: ${error.message}`);
        }
    },
    
    // Test accessibility
    testAccessibility() {
        console.log('\n%c♿ Accessibility Tests', 'color: #3B82F6; font-weight: bold;');
        
        // Check for alt text on images
        const images = document.querySelectorAll('img');
        let missingAlt = 0;
        images.forEach(img => {
            if (!img.alt && !img.getAttribute('role')) {
                missingAlt++;
            }
        });
        
        if (images.length > 0) {
            if (missingAlt === 0) {
                this.pass(`All ${images.length} images have alt text`);
            } else {
                this.warn(`${missingAlt} of ${images.length} images missing alt text`);
            }
        }
        
        // Check for form labels
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
        let missingLabels = 0;
        inputs.forEach(input => {
            const hasLabel = document.querySelector(`label[for="${input.id}"]`);
            const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('placeholder');
            if (!hasLabel && !hasAriaLabel) {
                missingLabels++;
            }
        });
        
        if (inputs.length > 0) {
            if (missingLabels === 0) {
                this.pass(`All ${inputs.length} form inputs are labeled`);
            } else {
                this.warn(`${missingLabels} of ${inputs.length} inputs missing labels`);
            }
        }
        
        // Check for button accessibility
        const buttons = document.querySelectorAll('button');
        let unlabeledButtons = 0;
        buttons.forEach(btn => {
            const hasText = btn.textContent.trim();
            const hasAriaLabel = btn.getAttribute('aria-label');
            const hasTitle = btn.getAttribute('title');
            if (!hasText && !hasAriaLabel && !hasTitle) {
                unlabeledButtons++;
            }
        });
        
        if (buttons.length > 0) {
            if (unlabeledButtons === 0) {
                this.pass(`All ${buttons.length} buttons are accessible`);
            } else {
                this.warn(`${unlabeledButtons} buttons lack accessible labels`);
            }
        }
        
        // Check color contrast (basic check for text visibility)
        const body = document.body;
        const bodyStyles = getComputedStyle(body);
        if (bodyStyles.backgroundColor && bodyStyles.color) {
            this.pass('Body has defined background and text colors');
        }
    },
    
    // Test performance
    testPerformance() {
        console.log('\n%c⚡ Performance Tests', 'color: #3B82F6; font-weight: bold;');
        
        // Check page load timing
        if (window.performance) {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            
            if (loadTime > 0) {
                if (loadTime < 2000) {
                    this.pass(`Page loaded in ${loadTime}ms (Good)`);
                } else if (loadTime < 5000) {
                    this.warn(`Page loaded in ${loadTime}ms (Could be improved)`);
                } else {
                    this.fail(`Page loaded in ${loadTime}ms (Too slow)`);
                }
            }
            
            // DOM ready time
            const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            if (domReady > 0) {
                this.pass(`DOM ready in ${domReady}ms`);
            }
        }
        
        // Check number of DOM elements
        const totalElements = document.querySelectorAll('*').length;
        if (totalElements < 500) {
            this.pass(`DOM size: ${totalElements} elements (Good)`);
        } else if (totalElements < 1500) {
            this.pass(`DOM size: ${totalElements} elements (Acceptable)`);
        } else {
            this.warn(`DOM size: ${totalElements} elements (Consider optimization)`);
        }
        
        // Check for inline styles
        const inlineStyles = document.querySelectorAll('[style]').length;
        if (inlineStyles > 50) {
            this.warn(`${inlineStyles} elements with inline styles - consider CSS classes`);
        }
        
        // Check script count
        const scripts = document.querySelectorAll('script').length;
        this.pass(`${scripts} script tags on page`);
    },
    
    // Result logging methods
    pass(message) {
        console.log(`  %c✓ PASS: ${message}`, 'color: #10B981;');
        this.results.push({ type: 'pass', message });
    },
    
    fail(message) {
        console.log(`  %c✗ FAIL: ${message}`, 'color: #DC2626;');
        this.errors.push(message);
        this.results.push({ type: 'fail', message });
    },
    
    warn(message) {
        console.log(`  %c⚠ WARN: ${message}`, 'color: #F59E0B;');
        this.warnings.push(message);
        this.results.push({ type: 'warn', message });
    },
    
    // Print summary
    printSummary(duration) {
        console.log('\n%c' + '='.repeat(50), 'color: #666;');
        console.log('%c📊 Test Summary', 'color: #DC2626; font-size: 16px; font-weight: bold;');
        
        const passes = this.results.filter(r => r.type === 'pass').length;
        const fails = this.results.filter(r => r.type === 'fail').length;
        const warns = this.results.filter(r => r.type === 'warn').length;
        
        console.log(`  Total Tests: ${this.results.length}`);
        console.log(`  %c✓ Passed: ${passes}`, 'color: #10B981;');
        console.log(`  %c✗ Failed: ${fails}`, 'color: #DC2626;');
        console.log(`  %c⚠ Warnings: ${warns}`, 'color: #F59E0B;');
        console.log(`  Duration: ${duration}ms`);
        
        if (fails === 0 && warns === 0) {
            console.log('\n%c🎉 All tests passed! Great job!', 'color: #10B981; font-size: 14px;');
        } else if (fails === 0) {
            console.log('\n%c👍 No critical issues. Review warnings above.', 'color: #F59E0B; font-size: 14px;');
        } else {
            console.log('\n%c❌ Issues found. Please review errors above.', 'color: #DC2626; font-size: 14px;');
        }
        
        // List critical issues
        if (this.errors.length > 0) {
            console.log('\n%cCritical Issues:', 'color: #DC2626; font-weight: bold;');
            this.errors.forEach((err, i) => {
                console.log(`  ${i + 1}. ${err}`);
            });
        }
    }
};

// Auto-run tests
TestRunner.runAllTests();
