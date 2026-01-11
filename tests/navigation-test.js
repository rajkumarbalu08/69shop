/**
 * 69Shop.in Navigation & Link Validation Test Script
 * Run this in browser console on https://shop69-1.web.app
 * 
 * Usage: Copy and paste this script in browser console
 */

(async function runNavigationTests() {
    console.log('%c🔍 69Shop.in Navigation Test Suite', 'font-size: 18px; font-weight: bold; color: #7C3AED;');
    console.log('=' .repeat(60));
    
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        tests: []
    };
    
    // Define all pages and their expected links
    const siteMap = {
        '/': {
            name: 'Home/Landing Page',
            expectedLinks: [
                { href: '/shop.html', label: 'Shop' },
                { href: '/#sell', label: 'Sell Section' },
                { href: '/#about', label: 'About' },
                { href: '/#contact', label: 'Contact' },
                { href: '/seller-dashboard.html', label: 'Seller Dashboard (Footer)' }
            ]
        },
        '/shop.html': {
            name: 'Shop Page',
            expectedLinks: [
                { href: '/seller-dashboard.html', label: 'Seller Dashboard (Footer)' },
                { href: '/shop-login.html', label: 'Login (if guest)' },
                { href: '/#sell', label: 'Become a Seller' }
            ]
        },
        '/shop-login.html': {
            name: 'Login Page',
            expectedLinks: [
                { href: '/shop.html', label: 'Shop Link' },
                { href: '/', label: 'Home' }
            ]
        },
        '/seller-login.html': {
            name: 'Seller Login Page',
            expectedLinks: [
                { href: '/shop.html', label: 'Shop Link' }
            ]
        },
        '/seller-dashboard.html': {
            name: 'Seller Dashboard',
            requiresAuth: true,
            expectedLinks: [
                { href: '/seller-products.html', label: 'Products' },
                { href: '/seller-orders.html', label: 'Orders' },
                { href: '/shop.html', label: 'View Shop' }
            ]
        },
        '/seller-products.html': {
            name: 'Manage Products',
            requiresAuth: true,
            expectedLinks: [
                { href: '/seller-dashboard.html', label: 'Dashboard' },
                { href: '/seller-orders.html', label: 'Orders' }
            ]
        },
        '/seller-orders.html': {
            name: 'Manage Orders',
            requiresAuth: true,
            expectedLinks: [
                { href: '/seller-dashboard.html', label: 'Dashboard' },
                { href: '/seller-products.html', label: 'Products' }
            ]
        },
        '/seller-services.html': {
            name: 'Manage Services',
            requiresAuth: true,
            expectedLinks: [
                { href: '/seller-dashboard.html', label: 'Dashboard' }
            ]
        },
        '/services.html': {
            name: 'Services Page',
            expectedLinks: [
                { href: '/', label: 'Home' },
                { href: '/shop.html', label: 'Shop' }
            ]
        }
    };
    
    // Test current page
    function testCurrentPage() {
        const currentPath = window.location.pathname;
        console.log(`\n%c📍 Testing: ${currentPath}`, 'font-weight: bold; color: #0066ff;');
        
        // Get all links on page
        const allLinks = document.querySelectorAll('a[href]');
        const linkMap = new Map();
        
        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!linkMap.has(href)) {
                linkMap.set(href, []);
            }
            linkMap.set(href, [...linkMap.get(href), link.textContent.trim().substring(0, 50)]);
        });
        
        console.log(`Found ${allLinks.length} links on this page`);
        
        // Check for broken patterns
        const brokenPatterns = [
            { pattern: /profile\.html\?section=dashboard/g, issue: 'Points to buyer profile instead of seller-dashboard.html' },
            { pattern: /javascript:void/g, issue: 'Empty JavaScript link' },
            { pattern: /^#$/g, issue: 'Empty anchor' }
        ];
        
        linkMap.forEach((labels, href) => {
            brokenPatterns.forEach(({ pattern, issue }) => {
                if (pattern.test(href)) {
                    console.warn(`⚠️ ${href} - ${issue} (found in: ${labels[0]})`);
                    results.warnings++;
                }
            });
        });
        
        // Check for 404-prone links
        const checkableLinks = [];
        linkMap.forEach((labels, href) => {
            if (href.startsWith('/') && !href.startsWith('/#') && href.endsWith('.html')) {
                checkableLinks.push({ href, label: labels[0] });
            }
        });
        
        console.log(`\n%c🔗 Internal HTML Links Found:`, 'font-weight: bold;');
        checkableLinks.forEach(({ href, label }) => {
            console.log(`  ${href} (${label})`);
        });
        
        return { links: Array.from(linkMap.entries()), checkableLinks };
    }
    
    // Test navigation elements
    function testNavigation() {
        console.log(`\n%c🧭 Testing Navigation Elements`, 'font-weight: bold; color: #22C55E;');
        
        // Check header
        const header = document.querySelector('header, .header, nav');
        if (header) {
            console.log('✅ Header/Navigation found');
            results.passed++;
        } else {
            console.error('❌ No header/navigation element found');
            results.failed++;
        }
        
        // Check footer
        const footer = document.querySelector('footer, .footer');
        if (footer) {
            console.log('✅ Footer found');
            results.passed++;
            
            // Check seller dashboard link in footer
            const sellerDashboardLink = footer.querySelector('a[href*="seller-dashboard"]');
            if (sellerDashboardLink) {
                console.log('✅ Seller Dashboard link in footer points correctly');
                results.passed++;
            } else {
                const wrongLink = footer.querySelector('a[href*="profile.html?section=dashboard"]');
                if (wrongLink && wrongLink.textContent.includes('Seller')) {
                    console.error('❌ Seller Dashboard link in footer points to buyer profile!');
                    results.failed++;
                }
            }
        } else {
            console.warn('⚠️ No footer found');
            results.warnings++;
        }
        
        // Check logo link
        const logo = document.querySelector('.logo, a[class*="logo"]');
        if (logo) {
            const logoHref = logo.getAttribute('href');
            console.log(`Logo links to: ${logoHref}`);
            results.passed++;
        }
    }
    
    // Test auth-related UI
    function testAuthUI() {
        console.log(`\n%c🔐 Testing Auth UI Elements`, 'font-weight: bold; color: #F59E0B;');
        
        const isLoggedIn = window.firebase?.auth?.()?.currentUser;
        console.log(`Auth State: ${isLoggedIn ? 'Logged In' : 'Guest/Logged Out'}`);
        
        // Profile sidebar elements
        const logoutBtn = document.getElementById('logoutBtn');
        const profileFooterLoggedIn = document.getElementById('profileFooterLoggedIn');
        const profileFooterGuest = document.getElementById('profileFooterGuest');
        
        if (logoutBtn) {
            console.log('✅ Logout button exists');
        }
        
        if (profileFooterGuest) {
            console.log('✅ Guest footer exists');
        }
        
        // Seller dashboard link visibility
        const sellerDashboardLink = document.getElementById('sellerDashboardLink');
        const becomeSellerLink = document.getElementById('becomeSellerLink');
        
        if (sellerDashboardLink) {
            console.log(`Seller Dashboard link display: ${sellerDashboardLink.style.display || 'default'}`);
        }
        if (becomeSellerLink) {
            console.log(`Become a Seller link display: ${becomeSellerLink.style.display || 'default'}`);
        }
    }
    
    // Test seller pages navigation
    function testSellerNav() {
        console.log(`\n%c🏪 Testing Seller Navigation`, 'font-weight: bold; color: #7C3AED;');
        
        const sellerNav = document.querySelector('.seller-nav, .seller-sidebar');
        if (sellerNav) {
            const navLinks = sellerNav.querySelectorAll('a[href]');
            console.log(`Found ${navLinks.length} seller nav links`);
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent.trim();
                console.log(`  ${text}: ${href}`);
            });
        }
        
        // Check View Shop link
        const viewShopLink = document.querySelector('a[href="/shop.html"]');
        if (viewShopLink) {
            console.log('✅ View Shop link found');
            results.passed++;
        }
    }
    
    // Run all tests
    console.log('\n%c🚀 Starting Tests...', 'font-size: 14px; font-weight: bold;');
    
    testCurrentPage();
    testNavigation();
    testAuthUI();
    testSellerNav();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('%c📊 Test Summary', 'font-size: 16px; font-weight: bold; color: #7C3AED;');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️ Warnings: ${results.warnings}`);
    
    if (results.failed === 0) {
        console.log('\n%c🎉 All critical tests passed!', 'color: #22C55E; font-weight: bold;');
    } else {
        console.log('\n%c⚠️ Some tests failed. Review the errors above.', 'color: #EF4444; font-weight: bold;');
    }
    
    console.log('\n%c📝 To test other pages:', 'font-weight: bold;');
    console.log('1. Navigate to each page listed in siteMap');
    console.log('2. Re-run this script in the console');
    console.log('3. Or use the automated version below\n');
    
    return results;
})();

/**
 * Full Site Navigation Test
 * This opens each page in sequence and validates links
 * Use carefully - will navigate away from current page
 */
window.testAllPages = async function() {
    const pages = [
        '/',
        '/shop.html',
        '/shop-login.html', 
        '/seller-login.html',
        '/services.html'
    ];
    
    console.log('🔄 Testing all public pages...');
    console.log('This will open each page in a new tab for validation.');
    
    for (const page of pages) {
        window.open(`https://shop69-1.web.app${page}`, '_blank');
        await new Promise(r => setTimeout(r, 500));
    }
    
    console.log('✅ Opened all pages. Run the test script in each tab.');
};

console.log('\n💡 Tip: Run testAllPages() to open all public pages in new tabs');
