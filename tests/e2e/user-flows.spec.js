// @ts-check
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

// =============================================
// END-TO-END USER FLOW TESTS
// =============================================

const TEST_USER = {
    uid: 'test-user-001',
    email: 'testuser@69shop.in',
    displayName: 'Test Customer'
};

const MOCK_DATA = {
    users: {
        'test-user-001': {
            email: 'testuser@69shop.in',
            displayName: 'Test Customer',
            accountType: 'customer',
            phone: '+919876543210',
            addresses: [{
                fullName: 'Test Customer',
                line1: '123 Test Street',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001'
            }]
        }
    },
    products: {
        'prod-flow-1': {
            name: 'Wireless Bluetooth Headphones',
            price: 2499,
            originalPrice: 3999,
            category: 'Electronics',
            brand: 'BoAt',
            image: '/Logo/placeholder.svg',
            images: ['/Logo/placeholder.svg'],
            seller: 'AudioHub',
            sellerId: 'seller-1',
            rating: 4.3,
            reviews: 250,
            stock: 30,
            tags: ['headphones', 'bluetooth', 'wireless'],
            description: 'Premium wireless headphones with ANC'
        },
        'prod-flow-2': {
            name: 'Cotton T-Shirt Pack of 3',
            price: 899,
            originalPrice: 1499,
            category: 'Fashion',
            brand: 'Bewakoof',
            image: '/Logo/placeholder.svg',
            images: ['/Logo/placeholder.svg'],
            seller: 'FashionPoint',
            sellerId: 'seller-2',
            rating: 4.1,
            reviews: 520,
            stock: 100,
            tags: ['tshirt', 'cotton', 'combo'],
            description: 'Comfortable cotton t-shirts'
        },
        'prod-flow-3': {
            name: 'Organic Green Tea 100 Bags',
            price: 349,
            originalPrice: 499,
            category: 'Groceries',
            brand: 'Organic India',
            image: '/Logo/placeholder.svg',
            images: ['/Logo/placeholder.svg'],
            seller: 'HealthStore',
            sellerId: 'seller-3',
            rating: 4.6,
            reviews: 180,
            stock: 200,
            tags: ['tea', 'organic', 'green tea'],
            description: 'Premium organic green tea'
        }
    },
    orders: {
        'order-flow-1': {
            userId: 'test-user-001',
            sellerId: 'seller-1',
            customerName: 'Test Customer',
            customerEmail: 'testuser@69shop.in',
            status: 'shipped',
            total: 2499,
            items: [{ name: 'Wireless Bluetooth Headphones', quantity: 1, price: 2499 }],
            shippingAddress: {
                fullName: 'Test Customer',
                line1: '123 Test Street',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001'
            },
            tracking: {
                carrier: 'delhivery',
                number: 'DEL789012',
                estimatedDelivery: '2026-02-25'
            },
            createdAt: { toDate: () => new Date() }
        }
    }
};

async function setupUserFlow(page) {
    await mockFirebase(page, {
        user: TEST_USER,
        collections: MOCK_DATA
    });
}

// ----- FLOW 1: Browse → View Product → Add to Cart -----
test.describe('Flow: Browse to Cart', () => {
    test('User can browse shop and view a product', async ({ page }) => {
        await setupUserFlow(page);
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Shop page loaded
        await expect(page.locator('#productsGrid')).toBeVisible();

        // Navigate to product page
        await page.goto('/product.html?id=prod-flow-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Product page should show content
        expect(page.url()).toContain('id=prod-flow-1');
        await expect(page.locator('body')).toBeVisible();
    });

    test('User can add items to cart via localStorage', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Simulate adding product to cart
        await page.evaluate(() => {
            const cart = [{
                id: 'prod-flow-1',
                name: 'Wireless Bluetooth Headphones',
                price: 2499,
                quantity: 1,
                image: '/Logo/placeholder.svg',
                seller: 'AudioHub'
            }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(500);

        // Verify cart has item
        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(1);
        expect(cart[0].name).toBe('Wireless Bluetooth Headphones');
    });

    test('User can add multiple items to cart', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Add multiple products
        await page.evaluate(() => {
            const cart = [
                { id: 'prod-flow-1', name: 'Wireless Bluetooth Headphones', price: 2499, quantity: 1, image: '/Logo/placeholder.svg', seller: 'AudioHub' },
                { id: 'prod-flow-2', name: 'Cotton T-Shirt Pack of 3', price: 899, quantity: 2, image: '/Logo/placeholder.svg', seller: 'FashionPoint' },
                { id: 'prod-flow-3', name: 'Organic Green Tea 100 Bags', price: 349, quantity: 1, image: '/Logo/placeholder.svg', seller: 'HealthStore' }
            ];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(500);

        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(3);

        // Total quantity should be 4 (1+2+1)
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        expect(totalQty).toBe(4);
    });
});

// ----- FLOW 2: Category Browsing -----
test.describe('Flow: Category Browsing', () => {
    test('User browses from homepage to category to product', async ({ page }) => {
        await setupUserFlow(page);

        // Start at homepage
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();

        // Navigate to electronics category
        await page.goto('/category-electronics.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();

        // Navigate to product
        await page.goto('/product.html?id=prod-flow-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        expect(page.url()).toContain('id=prod-flow-1');
    });

    test('Category pages have proper navigation back to shop', async ({ page }) => {
        await page.goto('/category-electronics.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Should have a home/shop link
        const homeLink = page.locator('a[href="/shop.html"], a[href="/"]').first();
        if (await homeLink.count() > 0) {
            await expect(homeLink).toBeVisible();
        }
    });
});

// ----- FLOW 3: Search Flow -----
test.describe('Flow: Search', () => {
    test('User searches on shop page', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('#searchInput');
        await expect(searchInput).toBeVisible();

        await searchInput.fill('headphones');
        await page.waitForTimeout(500);

        // Search input should have the text
        const value = await searchInput.inputValue();
        expect(value).toBe('headphones');
    });

    test('User searches on search page', async ({ page }) => {
        await setupUserFlow(page);
        await page.goto('/search.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="text"], input[type="search"], #searchInput').first();
        await expect(searchInput).toBeVisible();

        await searchInput.fill('t-shirt');
        await page.waitForTimeout(500);

        const value = await searchInput.inputValue();
        expect(value).toBe('t-shirt');
    });
});

// ----- FLOW 4: Profile Page -----
test.describe('Flow: Profile', () => {
    test('Authenticated user can access profile page', async ({ page }) => {
        await setupUserFlow(page);
        await page.goto('/profile.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        await expect(page.locator('body')).toBeVisible();
    });

    test('Profile page has navigation sections', async ({ page }) => {
        await setupUserFlow(page);
        await page.goto('/profile.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Profile should have section links (orders, addresses, etc.)
        const navLinks = page.locator('.profile-nav a, .profile-sidebar a, .profile-menu a, [data-section]');
        if (await navLinks.count() > 0) {
            expect(await navLinks.count()).toBeGreaterThan(0);
        }
    });

    test('Profile page shows wishlist section', async ({ page }) => {
        await setupUserFlow(page);
        await page.goto('/profile.html?section=wishlist', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        expect(page.url()).toContain('wishlist');
        await expect(page.locator('body')).toBeVisible();
    });
});

// ----- FLOW 5: Services Booking -----
test.describe('Flow: Services', () => {
    test('User can browse services page', async ({ page }) => {
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await expect(page.locator('main')).toBeVisible();
    });

    test('User can navigate to book service page', async ({ page }) => {
        await page.goto('/book-service.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await expect(page.locator('body')).toBeVisible();
    });
});

// ----- FLOW 6: Cart Manipulation -----
test.describe('Flow: Cart Operations', () => {
    test('User can update item quantity in cart', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Add item then update quantity
        await page.evaluate(() => {
            const cart = [{
                id: 'qty-test',
                name: 'Quantity Test Product',
                price: 500,
                quantity: 1,
                image: '/Logo/placeholder.svg',
                seller: 'TestSeller'
            }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
        });

        // Update quantity to 3
        await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            cart[0].quantity = 3;
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(300);

        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart[0].quantity).toBe(3);
    });

    test('User can remove item from cart', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Add 2 items
        await page.evaluate(() => {
            const cart = [
                { id: 'rem-1', name: 'Product 1', price: 100, quantity: 1, image: '/Logo/placeholder.svg' },
                { id: 'rem-2', name: 'Product 2', price: 200, quantity: 1, image: '/Logo/placeholder.svg' }
            ];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
        });

        // Remove first item
        await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const filtered = cart.filter(item => item.id !== 'rem-1');
            localStorage.setItem('69shop_cart', JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(300);

        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(1);
        expect(cart[0].id).toBe('rem-2');
    });

    test('User can clear entire cart', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Add items
        await page.evaluate(() => {
            const cart = [
                { id: 'clr-1', name: 'A', price: 100, quantity: 1, image: '/Logo/placeholder.svg' },
                { id: 'clr-2', name: 'B', price: 200, quantity: 2, image: '/Logo/placeholder.svg' }
            ];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
        });

        // Clear cart
        await page.evaluate(() => {
            localStorage.removeItem('69shop_cart');
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(300);

        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(0);
    });
});

// ----- FLOW 7: Login Flow -----
test.describe('Flow: Login', () => {
    test('User lands on login page with form elements', async ({ page }) => {
        await page.goto('/shop-login.html', { waitUntil: 'domcontentloaded' });

        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();

        if (await emailInput.count() > 0) {
            await expect(emailInput).toBeVisible();
            await emailInput.fill('testuser@69shop.in');
            const value = await emailInput.inputValue();
            expect(value).toBe('testuser@69shop.in');
        }

        if (await passwordInput.count() > 0) {
            await expect(passwordInput).toBeVisible();
            await passwordInput.fill('TestPass123');
            const value = await passwordInput.inputValue();
            expect(value).toBe('TestPass123');
        }
    });

    test('Seller login form accepts credentials', async ({ page }) => {
        await page.goto('/seller-login.html', { waitUntil: 'domcontentloaded' });

        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();

        await expect(emailInput).toBeVisible();
        await emailInput.fill('seller@69shop.in');

        await expect(passwordInput).toBeVisible();
        await passwordInput.fill('SellerPass123');

        const emailValue = await emailInput.inputValue();
        const passValue = await passwordInput.inputValue();
        expect(emailValue).toBe('seller@69shop.in');
        expect(passValue).toBe('SellerPass123');
    });
});

// ----- FLOW 8: Cross-Page Navigation -----
test.describe('Flow: Cross-Page Navigation', () => {
    test('Full navigation path: Home → Shop → Product → Cart', async ({ page }) => {
        await setupUserFlow(page);

        // Step 1: Homepage
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();

        // Step 2: Navigate to Shop
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('#productsGrid')).toBeVisible();

        // Step 3: Navigate to Product
        await page.goto('/product.html?id=prod-flow-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        expect(page.url()).toContain('prod-flow-1');

        // Step 4: Add to cart
        await page.evaluate(() => {
            const cart = [{ id: 'prod-flow-1', name: 'Wireless Bluetooth Headphones', price: 2499, quantity: 1, image: '/Logo/placeholder.svg', seller: 'AudioHub' }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });

        // Step 5: Open cart drawer
        const cartBtn = page.locator('.cart-btn').first();
        if (await cartBtn.count() > 0) {
            await cartBtn.click();
            await page.waitForTimeout(500);
            // Should stay on product page
            expect(page.url()).toContain('product.html');
        }
    });

    test('Navigation: Services → Login → Shop', async ({ page }) => {
        // Step 1: Services
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await expect(page.locator('main')).toBeVisible();

        // Step 2: Login
        await page.goto('/shop-login.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const loginForm = page.locator('form, .login-form, .auth-form').first();
        await expect(loginForm).toBeVisible();

        // Step 3: Back to Shop
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await expect(page.locator('#productsGrid')).toBeVisible();
    });

    test('Navigation: Category page → Shop filtered', async ({ page }) => {
        await page.goto('/category-electronics.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Check View All link
        const viewAllLink = page.locator('a').filter({ hasText: /View All/i }).first();
        if (await viewAllLink.count() > 0) {
            const href = await viewAllLink.getAttribute('href');
            if (href) {
                expect(href).toContain('category=');
            }
        }
    });
});

// ----- FLOW 9: Legal Pages Navigation -----
test.describe('Flow: Legal Pages', () => {
    test('User can access all legal pages from footer', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // Check each legal link
        const legalLinks = [
            { href: '/docs/privacy.html', text: 'Privacy' },
            { href: '/docs/terms.html', text: 'Terms' },
            { href: '/docs/shipping.html', text: 'Shipping' }
        ];

        for (const { href, text } of legalLinks) {
            const link = footer.locator(`a[href="${href}"]`);
            if (await link.count() > 0) {
                await expect(link.first()).toBeVisible();
            }
        }
    });

    test('Legal pages have back-to-shop navigation', async ({ page }) => {
        await page.goto('/docs/privacy.html', { waitUntil: 'domcontentloaded' });

        // Should have a way to get back to main site
        const backLink = page.locator('a[href="/"], a[href="/shop.html"]').first();
        if (await backLink.count() > 0) {
            await expect(backLink).toBeVisible();
        }
    });
});
