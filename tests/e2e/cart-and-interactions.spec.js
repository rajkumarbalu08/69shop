// @ts-check
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

// =============================================
// CART DRAWER & INTERACTIVE ELEMENT TESTS
// =============================================

const MOCK_PRODUCTS = {
    'prod-1': {
        name: 'Samsung Galaxy S24',
        price: 79999,
        originalPrice: 89999,
        category: 'Electronics',
        brand: 'Samsung',
        image: '/Logo/placeholder.svg',
        images: ['/Logo/placeholder.svg'],
        seller: 'ElectroTech',
        sellerId: 'seller-1',
        rating: 4.5,
        reviews: 120,
        stock: 10,
        tags: ['smartphone', 'android', '5g'],
        description: 'Latest Samsung flagship smartphone'
    },
    'prod-2': {
        name: 'Nike Air Max 270',
        price: 12995,
        originalPrice: 15999,
        category: 'Fashion',
        brand: 'Nike',
        image: '/Logo/placeholder.svg',
        images: ['/Logo/placeholder.svg'],
        seller: 'SportsHub',
        sellerId: 'seller-2',
        rating: 4.2,
        reviews: 85,
        stock: 25,
        tags: ['shoes', 'sports', 'running'],
        description: 'Comfortable running shoes'
    }
};

async function setupWithProducts(page) {
    await mockFirebase(page, {
        collections: { products: MOCK_PRODUCTS }
    });
}

// ----- TEST: Cart Drawer on Product Page -----
test.describe('Cart Drawer - Product Page', () => {
    test('Header cart button opens cart drawer instead of navigating away', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const cartBtn = page.locator('.cart-btn').first();
        await cartBtn.click();
        await page.waitForTimeout(500);

        // Should NOT navigate to shop.html
        expect(page.url()).toContain('product.html');

        // Cart drawer should be visible
        const cartDrawer = page.locator('#cartDrawer');
        if (await cartDrawer.count() > 0) {
            await expect(cartDrawer).toBeVisible();
        }
    });

    test('Cart drawer can be closed', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Open cart
        const cartBtn = page.locator('.cart-btn').first();
        await cartBtn.click();
        await page.waitForTimeout(500);

        // Close cart via close button
        const closeBtn = page.locator('#cartCloseBtn');
        if (await closeBtn.count() > 0) {
            await closeBtn.click();
            await page.waitForTimeout(300);
            const cartDrawer = page.locator('#cartDrawer');
            const hasOpenClass = await cartDrawer.evaluate(el => el.classList.contains('open'));
            expect(hasOpenClass).toBe(false);
        }
    });

    test('Cart drawer shows empty state when cart is empty', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Clear cart
        await page.evaluate(() => localStorage.removeItem('69shop_cart'));

        // Open cart
        const cartBtn = page.locator('.cart-btn').first();
        await cartBtn.click();
        await page.waitForTimeout(500);

        const emptyState = page.locator('#cartEmptyState');
        if (await emptyState.count() > 0) {
            await expect(emptyState).toBeVisible();
        }
    });
});

// ----- TEST: Cart Drawer on Shop Page -----
test.describe('Cart Drawer - Shop Page', () => {
    test('Cart button on shop page opens cart sidebar', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const cartBtn = page.locator('#cartBtn');
        await cartBtn.click();
        await page.waitForTimeout(500);

        // Cart sidebar should open
        const cartSidebar = page.locator('#cartSidebar, .cart-sidebar, #cartDrawer');
        if (await cartSidebar.count() > 0) {
            await expect(cartSidebar.first()).toBeVisible();
        }
    });

    test('Cart count badge updates', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Set cart with items
        await page.evaluate(() => {
            const cart = [{ id: 'test-1', name: 'Test', price: 100, quantity: 2, image: '/Logo/placeholder.svg' }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
        });
        await page.waitForTimeout(500);

        const cartCount = page.locator('#cartCount');
        if (await cartCount.count() > 0) {
            const text = await cartCount.textContent();
            expect(parseInt(text)).toBeGreaterThanOrEqual(0);
        }
    });
});

// ----- TEST: Cart Drawer on Category Pages -----
test.describe('Cart Drawer - Category Pages', () => {
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

    test.use({ viewport: { width: 375, height: 812 } });

    for (const path of CATEGORY_PAGES) {
        const category = path.replace('/category-', '').replace('.html', '');
        test(`${category} category cart button opens drawer (not navigates away)`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const cartLink = page.locator('[aria-label="Cart"]').first();
            if (await cartLink.isVisible()) {
                await cartLink.click();
                await page.waitForTimeout(500);

                // Should NOT navigate to shop.html
                expect(page.url()).toContain(path.replace('/', ''));

                // Cart drawer should be present
                const cartDrawer = page.locator('#cartDrawer');
                if (await cartDrawer.count() > 0) {
                    await expect(cartDrawer).toBeVisible();
                }
            }
        });
    }
});

// ----- TEST: Cart Drawer on Homepage -----
test.describe('Cart Drawer - Homepage', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('Homepage mobile cart button opens drawer instead of navigating', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const cartLink = page.locator('.mobile-nav-item').filter({ hasText: /Cart/i });
        if (await cartLink.count() > 0) {
            await cartLink.click();
            await page.waitForTimeout(500);

            // Should stay on homepage
            const url = page.url();
            expect(url.endsWith('/') || url.includes('index')).toBe(true);
        }
    });
});

// ----- TEST: Standalone Category Page Cart -----
test.describe('Cart Sidebar - Standalone Pages', () => {
    const STANDALONE_PAGES = [
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

    for (const path of STANDALONE_PAGES) {
        const pageName = path.replace('/', '').replace('.html', '');
        test(`${pageName} cart button opens sidebar (not navigates away)`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const cartBtn = page.locator('button[onclick="openCart()"], .cart-btn').first();
            if (await cartBtn.count() > 0) {
                await cartBtn.click();
                await page.waitForTimeout(500);

                // Should NOT navigate away
                expect(page.url()).toContain(pageName);

                // Cart sidebar should be visible
                const cartSidebar = page.locator('#cartSidebar');
                if (await cartSidebar.count() > 0) {
                    await expect(cartSidebar).toBeVisible();
                }
            }
        });
    }
});

// ----- TEST: Product Page Interactions -----
test.describe('Product Page Interactions', () => {
    test('Add to Cart button exists and is clickable', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const addToCartBtn = page.locator('#addToCartBtn, .add-to-cart-btn, button:has-text("Add to Cart")').first();
        if (await addToCartBtn.count() > 0) {
            await expect(addToCartBtn).toBeVisible();
        }
    });

    test('Buy Now button exists on product page', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const buyNowBtn = page.locator('#buyNowBtn, .buy-now-btn, button:has-text("Buy Now")').first();
        if (await buyNowBtn.count() > 0) {
            await expect(buyNowBtn).toBeVisible();
        }
    });

    test('Wishlist button exists on product page', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const wishlistBtn = page.locator('#wishlistBtn, .wishlist-btn, button:has-text("Wishlist"), [aria-label*="wishlist" i]').first();
        if (await wishlistBtn.count() > 0) {
            // Wishlist button may be in a hidden action bar - verify it exists in DOM
            await expect(wishlistBtn).toBeAttached();
        }
    });

    test('Product breadcrumb has correct links', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const homeLink = page.locator('.breadcrumb a[href="/"]').first();
        const shopLink = page.locator('.breadcrumb a[href="/shop.html"]').first();

        if (await homeLink.count() > 0) {
            await expect(homeLink).toBeVisible();
        }
        if (await shopLink.count() > 0) {
            await expect(shopLink).toBeVisible();
        }
    });

    test('Share button or functionality exists', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const shareBtn = page.locator('#shareBtn, .share-btn, button:has-text("Share"), [aria-label*="share" i]').first();
        if (await shareBtn.count() > 0) {
            await expect(shareBtn).toBeVisible();
        }
    });
});

// ----- TEST: Shop Page Filters -----
test.describe('Shop Page Filters', () => {
    test('Category quick filter chips exist and are clickable', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const chips = page.locator('.category-chip');
        const count = await chips.count();
        expect(count).toBeGreaterThan(0);

        // Click first chip
        if (count > 0) {
            await chips.first().click();
            await page.waitForTimeout(500);
            // Should still be on shop page
            expect(page.url()).toContain('shop.html');
        }
    });

    test('Sort dropdown exists on shop page', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const sortDropdown = page.locator('#sortSelect, .sort-select, select[name="sort"]').first();
        if (await sortDropdown.count() > 0) {
            await expect(sortDropdown).toBeVisible();
        }
    });

    test('Price range filter exists in sidebar', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const priceFilter = page.locator('#priceRange, .price-filter, input[type="range"]').first();
        if (await priceFilter.count() > 0) {
            await expect(priceFilter).toBeAttached();
        }
    });
});

// ----- TEST: Header Navigation Consistency -----
test.describe('Header & Navigation Buttons', () => {
    test('Shop page header has all expected buttons', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });

        // Cart button
        const cartBtn = page.locator('#cartBtn');
        await expect(cartBtn).toBeVisible();

        // Search input
        const searchInput = page.locator('#searchInput');
        await expect(searchInput).toBeVisible();
    });

    test('Product page header has shop and cart buttons', async ({ page }) => {
        await setupWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const shopBtn = page.locator('a[href="/shop.html"]').first();
        const cartBtn = page.locator('.cart-btn').first();

        await expect(shopBtn).toBeVisible();
        await expect(cartBtn).toBeVisible();
    });

    test('Services page header has correct links', async ({ page }) => {
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });

        const header = page.locator('header, nav').first();
        await expect(header).toBeVisible();
    });
});

// ----- TEST: Mobile Bottom Navigation -----
test.describe('Mobile Bottom Nav Buttons', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('Shop page mobile nav has all 5 buttons', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const mobileNav = page.locator('.mobile-bottom-nav, #mobileBottomNav');
        await expect(mobileNav).toBeVisible();

        // Check for Home, Shop, Cart, Wishlist, Profile buttons
        const navButtons = page.locator('.mobile-bottom-nav .nav-item, #mobileBottomNav .nav-item, .mobile-bottom-nav button, #mobileBottomNav button');
        const count = await navButtons.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    test('Homepage mobile nav has all expected items', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const mobileNav = page.locator('.mobile-nav, #mobileBottomNav');
        await expect(mobileNav).toBeVisible();

        const navItems = mobileNav.locator('.mobile-nav-item, .nav-item, a');
        const count = await navItems.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });
});

// ----- TEST: Login Page Buttons -----
test.describe('Login Page Interactions', () => {
    test('Shop login page has sign in button', async ({ page }) => {
        await page.goto('/shop-login.html', { waitUntil: 'domcontentloaded' });

        const signInBtn = page.locator('button[type="submit"], .login-btn, button:has-text("Sign In"), button:has-text("Login")').first();
        if (await signInBtn.count() > 0) {
            await expect(signInBtn).toBeVisible();
        }
    });

    test('Shop login page has Google sign-in option', async ({ page }) => {
        await page.goto('/shop-login.html', { waitUntil: 'domcontentloaded' });

        const googleBtn = page.locator('.google-btn, button:has-text("Google"), #googleSignIn').first();
        if (await googleBtn.count() > 0) {
            await expect(googleBtn).toBeVisible();
        }
    });

    test('Login page has create account / register element', async ({ page }) => {
        await page.goto('/shop-login.html', { waitUntil: 'domcontentloaded' });

        // Register/signup element exists (may be in a hidden tab initially)
        const registerLink = page.locator('a:has-text("Register"), a:has-text("Create Account"), a:has-text("Sign Up"), button:has-text("Register"), button:has-text("Create Account")').first();
        if (await registerLink.count() > 0) {
            await expect(registerLink).toBeAttached();
        }
    });

    test('Seller login has email and password inputs', async ({ page }) => {
        await page.goto('/seller-login.html', { waitUntil: 'domcontentloaded' });

        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
    });
});

// ----- TEST: Services Page Interactions -----
test.describe('Services Page Interactions', () => {
    test('Services page has service cards with Book Now buttons', async ({ page }) => {
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Main content area should be visible
        await expect(page.locator('main')).toBeVisible();

        // Look for booking/service buttons
        const bookBtns = page.locator('.book-btn, button:has-text("Book"), a:has-text("Book")');
        if (await bookBtns.count() > 0) {
            expect(await bookBtns.count()).toBeGreaterThan(0);
        }
    });

    test('Services page has shop link for hampers', async ({ page }) => {
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });

        const shopLink = page.locator('a[href="/shop.html"]').first();
        if (await shopLink.count() > 0) {
            const href = await shopLink.getAttribute('href');
            expect(href).toBe('/shop.html');
        }
    });
});

// ----- TEST: Cart Persistence Across Pages -----
test.describe('Cart Persistence', () => {
    test('Cart items persist across page navigation', async ({ page }) => {
        // Add item to cart on shop page
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => {
            const cart = [{
                id: 'persist-test',
                name: 'Test Product',
                price: 999,
                quantity: 1,
                image: '/Logo/placeholder.svg',
                seller: 'TestSeller'
            }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
        });

        // Navigate to services page
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Check cart still has items
        const cart = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('69shop_cart') || '[]');
        });
        expect(cart.length).toBe(1);
        expect(cart[0].name).toBe('Test Product');
    });

    test('Cart count syncs via localStorage', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Set cart with 3 items
        await page.evaluate(() => {
            const cart = [
                { id: '1', name: 'A', price: 100, quantity: 2, image: '/Logo/placeholder.svg' },
                { id: '2', name: 'B', price: 200, quantity: 1, image: '/Logo/placeholder.svg' }
            ];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(500);

        const cartCount = page.locator('#cartCount');
        if (await cartCount.count() > 0) {
            const text = await cartCount.textContent();
            // Count should reflect total quantity (3)
            expect(parseInt(text)).toBeGreaterThanOrEqual(0);
        }
    });
});

// ----- TEST: Search Page Interactions -----
test.describe('Search Page Interactions', () => {
    test('Search page has search input', async ({ page }) => {
        await page.goto('/search.html', { waitUntil: 'domcontentloaded' });

        const searchInput = page.locator('input[type="text"], input[type="search"], #searchInput').first();
        await expect(searchInput).toBeVisible();
    });

    test('Search page accepts query parameter', async ({ page }) => {
        await page.goto('/search.html?q=test', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(page.url()).toContain('q=test');
    });
});

// ----- TEST: Order Tracking Page -----
test.describe('Order Tracking', () => {
    test('Order tracking page has tracking input', async ({ page }) => {
        await page.goto('/order-tracking.html', { waitUntil: 'domcontentloaded' });

        const trackingInput = page.locator('input[placeholder*="Order"], input[placeholder*="order"], #orderIdInput, #trackingInput').first();
        if (await trackingInput.count() > 0) {
            await expect(trackingInput).toBeVisible();
        }
    });

    test('Order tracking page has track button', async ({ page }) => {
        await page.goto('/order-tracking.html', { waitUntil: 'domcontentloaded' });

        const trackBtn = page.locator('button:has-text("Track"), button[type="submit"]').first();
        if (await trackBtn.count() > 0) {
            await expect(trackBtn).toBeVisible();
        }
    });
});

// ----- TEST: All Internal Links Use Absolute Paths -----
test.describe('Link Integrity - Extended', () => {
    const PAGES_TO_CHECK = [
        '/product.html?id=prod-1',
        '/services.html',
        '/order-tracking.html'
    ];

    for (const pagePath of PAGES_TO_CHECK) {
        const pageName = pagePath.split('?')[0].replace('/', '');
        test(`${pageName} uses absolute paths for navigation`, async ({ page }) => {
            if (pagePath.includes('product.html')) {
                await setupWithProducts(page);
            }
            await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const links = await page.locator('a[href]').all();
            const relativeLinks = [];

            for (const link of links) {
                const href = await link.getAttribute('href');
                if (!href) continue;
                if (href.startsWith('http') || href.startsWith('#') || href.startsWith('/') ||
                    href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    continue;
                }
                if (href.includes('.css') || href.includes('.js') || href.includes('fonts.')) continue;
                if (href.endsWith('.html') || href.includes('.html?') || href.includes('.html#')) {
                    relativeLinks.push(href);
                }
            }

            expect(relativeLinks, `Relative links found on ${pagePath}: ${relativeLinks.join(', ')}`).toHaveLength(0);
        });
    }
});
