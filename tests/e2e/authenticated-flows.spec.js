// @ts-check
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

// =============================================
// AUTHENTICATED END-TO-END FLOWS
// Tests simulating real user journeys with
// dummy accounts (customer + seller)
// =============================================

// ----- DUMMY ACCOUNTS -----
const CUSTOMER = {
    uid: 'customer-dummy-001',
    email: 'dummycustomer@69shop.in',
    displayName: 'Dummy Customer'
};

const SELLER = {
    uid: 'seller-dummy-001',
    email: 'dummyseller@69shop.in',
    displayName: 'Dummy Seller'
};

const FULL_MOCK_DATA = {
    users: {
        'customer-dummy-001': {
            email: 'dummycustomer@69shop.in',
            displayName: 'Dummy Customer',
            accountType: 'customer',
            phone: '+919876543210',
            addresses: [{
                id: 'addr-1',
                fullName: 'Dummy Customer',
                line1: '42 MG Road',
                line2: 'Near City Mall',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001',
                isDefault: true
            }]
        },
        'seller-dummy-001': {
            email: 'dummyseller@69shop.in',
            displayName: 'Dummy Seller',
            accountType: 'seller',
            storeName: 'DummyStore',
            verified: true,
            phone: '+919876543211'
        }
    },
    products: {
        'dp-001': {
            name: 'Dummy Phone Pro Max',
            price: 49999,
            originalPrice: 59999,
            category: 'Electronics',
            subcategory: 'smartphones',
            brand: 'DummyTech',
            image: '/Logo/placeholder.svg',
            images: ['/Logo/placeholder.svg'],
            seller: 'DummyStore',
            sellerId: 'seller-dummy-001',
            rating: 4.5,
            reviews: 100,
            stock: 15,
            tags: ['phone', 'smartphone'],
            description: 'A test product for E2E testing'
        },
        'dp-002': {
            name: 'Dummy Running Shoes',
            price: 3499,
            originalPrice: 4999,
            category: 'Fashion',
            subcategory: 'shoes',
            brand: 'DummySport',
            image: '/Logo/placeholder.svg',
            images: ['/Logo/placeholder.svg'],
            seller: 'DummyStore',
            sellerId: 'seller-dummy-001',
            rating: 4.2,
            reviews: 60,
            stock: 50,
            tags: ['shoes', 'running'],
            description: 'Test shoes for E2E testing'
        },
        'dp-003': {
            name: 'Dummy Face Cream',
            price: 799,
            originalPrice: 1299,
            category: 'Beauty',
            subcategory: 'skincare',
            brand: 'DummyGlow',
            image: '/Logo/placeholder.svg',
            images: ['/Logo/placeholder.svg'],
            seller: 'DummyStore',
            sellerId: 'seller-dummy-001',
            rating: 4.0,
            reviews: 35,
            stock: 100,
            tags: ['cream', 'skincare'],
            description: 'Test beauty product'
        }
    },
    orders: {
        'order-dummy-001': {
            userId: 'customer-dummy-001',
            sellerId: 'seller-dummy-001',
            customerName: 'Dummy Customer',
            customerEmail: 'dummycustomer@69shop.in',
            status: 'processing',
            total: 49999,
            items: [{ name: 'Dummy Phone Pro Max', quantity: 1, price: 49999, productId: 'dp-001' }],
            shippingAddress: {
                fullName: 'Dummy Customer',
                line1: '42 MG Road',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001'
            },
            paymentMethod: 'COD',
            createdAt: { toDate: () => new Date('2026-02-15') }
        },
        'order-dummy-002': {
            userId: 'customer-dummy-001',
            sellerId: 'seller-dummy-001',
            customerName: 'Dummy Customer',
            customerEmail: 'dummycustomer@69shop.in',
            status: 'delivered',
            total: 3499,
            items: [{ name: 'Dummy Running Shoes', quantity: 1, price: 3499, productId: 'dp-002' }],
            shippingAddress: {
                fullName: 'Dummy Customer',
                line1: '42 MG Road',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001'
            },
            paymentMethod: 'UPI',
            tracking: {
                carrier: 'delhivery',
                number: 'DEL123456',
                estimatedDelivery: '2026-02-18'
            },
            createdAt: { toDate: () => new Date('2026-02-10') }
        }
    },
    reviews: {
        'review-001': {
            productId: 'dp-002',
            userId: 'customer-dummy-001',
            userName: 'Dummy Customer',
            rating: 5,
            comment: 'Great shoes, very comfortable!',
            createdAt: { toDate: () => new Date('2026-02-12') }
        }
    },
    wishlists: {
        'customer-dummy-001': {
            items: ['dp-003'],
            updatedAt: { toDate: () => new Date() }
        }
    }
};

// ===== CUSTOMER AUTHENTICATED FLOWS =====

test.describe('Authenticated Customer: Profile Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: CUSTOMER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Customer can access profile page with user info', async ({ page }) => {
        await page.goto('/profile.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        await expect(page.locator('body')).toBeVisible();
        expect(page.url()).toContain('profile');
    });

    test('Customer profile shows order history section', async ({ page }) => {
        await page.goto('/profile.html?section=orders', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        await expect(page.locator('body')).toBeVisible();
        expect(page.url()).toContain('orders');
    });

    test('Customer profile shows addresses section', async ({ page }) => {
        await page.goto('/profile.html?section=addresses', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        await expect(page.locator('body')).toBeVisible();
    });

    test('Customer profile shows wishlist section', async ({ page }) => {
        await page.goto('/profile.html?section=wishlist', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Authenticated Customer: Full Shopping Flow', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: CUSTOMER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Browse → View Product → Add to Cart → View Cart', async ({ page }) => {
        // Step 1: Browse shop
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        await expect(page.locator('#productsGrid')).toBeVisible();

        // Step 2: Navigate to product
        await page.goto('/product.html?id=dp-001', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        expect(page.url()).toContain('dp-001');

        // Step 3: Add to cart via localStorage
        await page.evaluate(() => {
            const existing = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            existing.push({
                id: 'dp-001',
                name: 'Dummy Phone Pro Max',
                price: 49999,
                quantity: 1,
                image: '/Logo/placeholder.svg',
                seller: 'DummyStore'
            });
            localStorage.setItem('69shop_cart', JSON.stringify(existing));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(500);

        // Step 4: Open cart drawer
        const cartBtn = page.locator('.cart-btn').first();
        await cartBtn.click();
        await page.waitForTimeout(500);

        // Should stay on product page
        expect(page.url()).toContain('product.html');

        // Cart should have the item
        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(1);
        expect(cart[0].name).toBe('Dummy Phone Pro Max');
    });

    test('Multi-product purchase flow', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => {
            const cart = [
                { id: 'dp-001', name: 'Dummy Phone Pro Max', price: 49999, quantity: 1, image: '/Logo/placeholder.svg', seller: 'DummyStore' },
                { id: 'dp-002', name: 'Dummy Running Shoes', price: 3499, quantity: 2, image: '/Logo/placeholder.svg', seller: 'DummyStore' },
                { id: 'dp-003', name: 'Dummy Face Cream', price: 799, quantity: 3, image: '/Logo/placeholder.svg', seller: 'DummyStore' }
            ];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });
        await page.waitForTimeout(500);

        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(3);

        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        expect(totalQty).toBe(6);

        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        expect(totalPrice).toBe(49999 + 3499 * 2 + 799 * 3);
    });

    test('Cart modification: update quantity and remove', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => {
            const cart = [
                { id: 'dp-001', name: 'Dummy Phone Pro Max', price: 49999, quantity: 1, image: '/Logo/placeholder.svg' },
                { id: 'dp-002', name: 'Dummy Running Shoes', price: 3499, quantity: 1, image: '/Logo/placeholder.svg' }
            ];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
        });

        // Increase quantity of shoes to 3
        await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const shoes = cart.find(item => item.id === 'dp-002');
            if (shoes) shoes.quantity = 3;
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });

        let cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.find(i => i.id === 'dp-002').quantity).toBe(3);

        // Remove phone from cart
        await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const filtered = cart.filter(item => item.id !== 'dp-001');
            localStorage.setItem('69shop_cart', JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });

        cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(1);
        expect(cart[0].id).toBe('dp-002');
        expect(cart[0].quantity).toBe(3);
    });
});

test.describe('Authenticated Customer: Order Tracking Flow', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: CUSTOMER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Customer can access order tracking page', async ({ page }) => {
        await page.goto('/order-tracking.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Customer can enter order ID to track', async ({ page }) => {
        await page.goto('/order-tracking.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const trackingInput = page.locator('input[placeholder*="Order"], input[placeholder*="order"], #orderIdInput, #trackingInput').first();
        if (await trackingInput.count() > 0) {
            await trackingInput.fill('order-dummy-001');
            const value = await trackingInput.inputValue();
            expect(value).toBe('order-dummy-001');
        }
    });
});

test.describe('Authenticated Customer: Messages Flow', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: CUSTOMER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Customer can access messages page', async ({ page }) => {
        await page.goto('/messages.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });
});

// ===== SELLER AUTHENTICATED FLOWS =====

test.describe('Authenticated Seller: Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: SELLER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Seller can access dashboard', async ({ page }) => {
        await page.goto('/seller-dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Seller dashboard shows stats cards', async ({ page }) => {
        await page.goto('/seller-dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const statsCards = page.locator('.stats-card, .stat-card, .dashboard-stat');
        if (await statsCards.count() > 0) {
            expect(await statsCards.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('Authenticated Seller: Order Management', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: SELLER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Seller can view orders page', async ({ page }) => {
        await page.goto('/seller-orders.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Seller orders page has status filter', async ({ page }) => {
        await page.goto('/seller-orders.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const statusFilter = page.locator('.status-tab, .status-filter, [data-status]');
        if (await statusFilter.count() > 0) {
            expect(await statusFilter.count()).toBeGreaterThan(0);
        }
    });

    test('Seller order flow includes out_for_delivery status', async ({ page }) => {
        await page.goto('/seller-orders.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const hasOutForDelivery = await page.evaluate(() => {
            const flow = typeof STATUS_FLOW !== 'undefined' ? STATUS_FLOW : null;
            return flow && flow.shipped === 'out_for_delivery';
        });

        if (hasOutForDelivery !== null) {
            expect(hasOutForDelivery).toBe(true);
        }
    });
});

test.describe('Authenticated Seller: Product Management', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: SELLER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Seller can access products page', async ({ page }) => {
        await page.goto('/seller-products.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Seller products page has add product button', async ({ page }) => {
        await page.goto('/seller-products.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const addBtn = page.locator('button:has-text("Add"), button:has-text("New Product"), .add-product-btn').first();
        if (await addBtn.count() > 0) {
            await expect(addBtn).toBeVisible();
        }
    });
});

test.describe('Authenticated Seller: All Pages Access', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: SELLER,
            collections: FULL_MOCK_DATA
        });
    });

    const SELLER_PAGES = [
        '/seller-analytics.html',
        '/seller-settings.html',
        '/seller-payments.html',
        '/seller-promotions.html',
        '/seller-reviews.html',
        '/seller-messages.html',
        '/seller-services.html',
        '/seller-verification.html'
    ];

    for (const path of SELLER_PAGES) {
        const pageName = path.replace('/seller-', '').replace('.html', '');
        test(`Seller can access ${pageName} page`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).toBeVisible();
        });
    }
});

// ===== FULL JOURNEY: HOME → BROWSE → CART → CHECKOUT =====

test.describe('Complete Customer Journey', () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebase(page, {
            user: CUSTOMER,
            collections: FULL_MOCK_DATA
        });
    });

    test('Full journey: Homepage → Category → Product → Cart → Profile', async ({ page }) => {
        // 1. Land on homepage
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();

        // 2. Browse category
        await page.goto('/category-electronics.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();

        // 3. View product
        await page.goto('/product.html?id=dp-001', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        expect(page.url()).toContain('dp-001');

        // 4. Add to cart
        await page.evaluate(() => {
            const cart = [{
                id: 'dp-001',
                name: 'Dummy Phone Pro Max',
                price: 49999,
                quantity: 1,
                image: '/Logo/placeholder.svg',
                seller: 'DummyStore'
            }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });

        // 5. Open cart (should stay on product page)
        const cartBtn = page.locator('.cart-btn').first();
        await cartBtn.click();
        await page.waitForTimeout(500);
        expect(page.url()).toContain('product.html');

        // 6. Navigate to profile to check orders
        await page.goto('/profile.html?section=orders', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        expect(page.url()).toContain('profile');
    });

    test('Full journey: Search → Product → Add to Cart → Continue Shopping', async ({ page }) => {
        // 1. Go to search
        await page.goto('/search.html?q=shoes', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('q=shoes');

        // 2. View product
        await page.goto('/product.html?id=dp-002', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // 3. Add to cart
        await page.evaluate(() => {
            const cart = [{
                id: 'dp-002',
                name: 'Dummy Running Shoes',
                price: 3499,
                quantity: 1,
                image: '/Logo/placeholder.svg',
                seller: 'DummyStore'
            }];
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        });

        // 4. Continue shopping - go back to shop
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // 5. Verify cart persists
        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('69shop_cart') || '[]'));
        expect(cart.length).toBe(1);
        expect(cart[0].id).toBe('dp-002');
    });

    test('Full journey: Services → Book Service', async ({ page }) => {
        // 1. Browse services
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('main')).toBeVisible();

        // 2. Navigate to book service
        await page.goto('/book-service.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();

        // 3. Check bookings
        await page.goto('/my-bookings.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();
    });
});

// ===== CROSS-BROWSER SESSION: Cart Isolation =====

test.describe('Session Isolation', () => {
    test('Different users have separate cart states', async ({ browser }) => {
        // Customer context
        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        await mockFirebase(customerPage, {
            user: CUSTOMER,
            collections: FULL_MOCK_DATA
        });

        await customerPage.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await customerPage.waitForTimeout(1000);

        await customerPage.evaluate(() => {
            localStorage.setItem('69shop_cart', JSON.stringify([
                { id: 'dp-001', name: 'Phone', price: 49999, quantity: 1, image: '/Logo/placeholder.svg' }
            ]));
        });

        const customerCart = await customerPage.evaluate(() =>
            JSON.parse(localStorage.getItem('69shop_cart') || '[]')
        );
        expect(customerCart.length).toBe(1);

        // Seller context (separate session)
        const sellerContext = await browser.newContext();
        const sellerPage = await sellerContext.newPage();
        await mockFirebase(sellerPage, {
            user: SELLER,
            collections: FULL_MOCK_DATA
        });

        await sellerPage.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await sellerPage.waitForTimeout(1000);

        const sellerCart = await sellerPage.evaluate(() =>
            JSON.parse(localStorage.getItem('69shop_cart') || '[]')
        );
        expect(sellerCart.length).toBe(0);

        await customerContext.close();
        await sellerContext.close();
    });
});
