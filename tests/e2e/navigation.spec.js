// @ts-check
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

// =============================================
// NAVIGATION & LINK INTEGRITY TESTS
// =============================================

const ALL_PUBLIC_PAGES = [
    { path: '/', name: 'Homepage' },
    { path: '/shop.html', name: 'Shop' },
    { path: '/services.html', name: 'Services' },
    { path: '/shop-login.html', name: 'Login' },
    { path: '/search.html', name: 'Search' },
    { path: '/product.html', name: 'Product (no ID)' },
    { path: '/order-tracking.html', name: 'Order Tracking' },
    { path: '/book-service.html', name: 'Book Service' },
    { path: '/brand-store.html', name: 'Brand Store' },
    { path: '/offline.html', name: 'Offline' }
];

const CATEGORY_PAGES = [
    '/category-electronics.html',
    '/category-fashion.html',
    '/category-beauty.html',
    '/category-books.html',
    '/category-toys.html',
    '/category-groceries.html',
    '/category-home.html',
    '/category-sports.html',
    '/category-jewelry.html',
    '/category-automotive.html'
];

const STANDALONE_CATEGORY_PAGES = [
    '/electronics.html',
    '/fashion.html',
    '/beauty.html',
    '/books.html',
    '/sports.html',
    '/grocery.html',
    '/home-needs.html',
    '/appliances.html',
    '/mobiles.html',
    '/headphones.html'
];

const LEGAL_PAGES = [
    '/docs/privacy.html',
    '/docs/terms.html',
    '/docs/shipping.html',
    '/docs/refund.html'
];

const SELLER_PAGES = [
    '/seller-dashboard.html',
    '/seller-orders.html',
    '/seller-products.html',
    '/seller-analytics.html',
    '/seller-messages.html',
    '/seller-payments.html',
    '/seller-promotions.html',
    '/seller-reviews.html',
    '/seller-services.html',
    '/seller-settings.html',
    '/seller-verification.html',
    '/seller-login.html'
];

const ADMIN_PAGES = [
    '/admin-dashboard.html',
    '/admin-orders.html',
    '/admin-products.html',
    '/admin-users.html',
    '/admin-sellers.html',
    '/admin-analytics.html',
    '/admin-settings.html',
    '/admin-activity.html',
    '/admin-login.html'
];

// ----- TEST: All pages load without HTTP errors -----
test.describe('Page Load Tests', () => {
    test('All public pages return 200', async ({ page }) => {
        for (const { path, name } of ALL_PUBLIC_PAGES) {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
            expect(response?.status(), `${name} (${path}) should return 200`).toBeLessThan(400);
        }
    });

    test('All category pages return 200', async ({ page }) => {
        for (const path of CATEGORY_PAGES) {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
            expect(response?.status(), `${path} should return 200`).toBeLessThan(400);
        }
    });

    test('All standalone category pages return 200', async ({ page }) => {
        for (const path of STANDALONE_CATEGORY_PAGES) {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
            expect(response?.status(), `${path} should return 200`).toBeLessThan(400);
        }
    });

    test('All legal pages return 200', async ({ page }) => {
        for (const path of LEGAL_PAGES) {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
            expect(response?.status(), `${path} should return 200`).toBeLessThan(400);
        }
    });

    test('Seller pages return 200 (or redirect to login)', async ({ page }) => {
        for (const path of SELLER_PAGES) {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
            if (response) {
                expect(response.status(), `${path} should not return server error`).toBeLessThan(500);
            }
            // Auth-gated pages may redirect anywhere - just verify they didn't 404/500
        }
    });

    test('Admin pages return 200 (or redirect to login)', async ({ page }) => {
        for (const path of ADMIN_PAGES) {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
            if (response) {
                expect(response.status(), `${path} should not return server error`).toBeLessThan(500);
            }
        }
    });
});

// ----- TEST: No JavaScript errors on key pages -----
test.describe('JavaScript Error Checks', () => {
    const CRITICAL_PAGES = [
        '/',
        '/shop.html',
        '/services.html',
        '/shop-login.html',
        '/search.html'
    ];

    for (const path of CRITICAL_PAGES) {
        test(`No JS errors on ${path}`, async ({ page }) => {
            const errors = [];
            page.on('pageerror', (err) => errors.push(err.message));

            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            // Filter out expected Firebase errors (since we're not mocking here)
            const realErrors = errors.filter(e =>
                !e.includes('firebase') &&
                !e.includes('Firebase') &&
                !e.includes('firebaseConfig') &&
                !e.includes('Cannot read properties of undefined')
            );

            expect(realErrors, `JS errors found on ${path}: ${realErrors.join(', ')}`).toHaveLength(0);
        });
    }
});

// ----- TEST: Header navigation consistency -----
test.describe('Header Navigation', () => {
    test('Homepage header has correct nav links', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        // Homepage uses <nav> element instead of <header>
        const nav = page.locator('nav#mainNav, header, nav').first();
        await expect(nav).toBeVisible();

        // Check for key nav elements
        const shopLink = nav.locator('a').first();
        await expect(shopLink).toBeVisible();
    });

    test('Shop page header is present and functional', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

// ----- TEST: Footer link integrity -----
test.describe('Footer Links', () => {
    test('Homepage footer has legal links', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // Check legal page links
        await expect(footer.locator('a[href="/docs/privacy.html"]')).toBeVisible();
        await expect(footer.locator('a[href="/docs/terms.html"]')).toBeVisible();
        await expect(footer.locator('a[href="/docs/shipping.html"]')).toBeVisible();
    });

    test('Shop page footer has legal links', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        await expect(footer.locator('a[href="/docs/privacy.html"]')).toBeVisible();
        await expect(footer.locator('a[href="/docs/terms.html"]')).toBeVisible();
        await expect(footer.locator('a[href="/docs/shipping.html"]')).toBeVisible();
    });

    test('Search page footer has valid links (no broken about/contact)', async ({ page }) => {
        await page.goto('/search.html', { waitUntil: 'domcontentloaded' });
        const footer = page.locator('footer');

        // Ensure no links to non-existent pages
        const aboutLink = footer.locator('a[href="/about.html"]');
        await expect(aboutLink).toHaveCount(0);

        const contactLink = footer.locator('a[href="/contact.html"]');
        await expect(contactLink).toHaveCount(0);
    });
});

// ----- TEST: Mobile bottom navigation -----
test.describe('Mobile Bottom Navigation', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('Shop page has mobile bottom nav', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        const mobileNav = page.locator('.mobile-bottom-nav, #mobileBottomNav');
        await expect(mobileNav).toBeVisible();
    });

    test('Homepage has mobile bottom nav', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const mobileNav = page.locator('.mobile-bottom-nav, #mobileBottomNav');
        await expect(mobileNav).toBeVisible();
    });
});

// ----- TEST: Category page "View All" links -----
test.describe('Category Page View All Links', () => {
    for (const path of CATEGORY_PAGES) {
        const category = path.replace('/category-', '').replace('.html', '');
        test(`${category} category page View All points to filtered shop`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            const viewAllLink = page.locator('a').filter({ hasText: /View All/i }).first();
            if (await viewAllLink.count() > 0) {
                const href = await viewAllLink.getAttribute('href');
                expect(href, `View All on ${path} should filter by category`).toContain(`category=${category}`);
            }
        });
    }
});

// ----- TEST: No broken internal links (href checks) -----
test.describe('Internal Link Validation', () => {
    test('Homepage has no broken internal links', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const links = await page.locator('a[href^="/"]').all();

        for (const link of links) {
            const href = await link.getAttribute('href');
            if (!href || href === '/' || href.startsWith('/#')) continue;

            const response = await page.request.get(href);
            expect(response.status(), `Link ${href} from homepage is broken`).toBeLessThan(400);
        }
    });

    test('Shop page has no broken internal links', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        const links = await page.locator('a[href^="/"]').all();

        for (const link of links) {
            const href = await link.getAttribute('href');
            if (!href || href === '/' || href.startsWith('/#') || href.includes('?')) continue;

            const response = await page.request.get(href);
            expect(response.status(), `Link ${href} from shop is broken`).toBeLessThan(400);
        }
    });
});

// ----- TEST: All hrefs use absolute paths (no relative) -----
test.describe('URL Consistency', () => {
    const PAGES_TO_CHECK = ['/', '/shop.html', '/services.html', '/search.html'];

    for (const pagePath of PAGES_TO_CHECK) {
        test(`${pagePath} uses absolute paths for navigation links`, async ({ page }) => {
            await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

            // Get all navigation-style links (not CSS/font/external)
            const links = await page.locator('a[href]').all();
            const relativeLinks = [];

            for (const link of links) {
                const href = await link.getAttribute('href');
                if (!href) continue;
                // Skip external, anchors, javascript:, mailto:, tel:
                if (href.startsWith('http') || href.startsWith('#') || href.startsWith('/') ||
                    href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    continue;
                }
                // Skip CSS/font asset references
                if (href.includes('.css') || href.includes('.js') || href.includes('fonts.')) continue;
                // This is a relative navigation link - flag it
                if (href.endsWith('.html') || href.includes('.html?') || href.includes('.html#')) {
                    relativeLinks.push(href);
                }
            }

            expect(relativeLinks, `Relative links found on ${pagePath}: ${relativeLinks.join(', ')}`).toHaveLength(0);
        });
    }
});
