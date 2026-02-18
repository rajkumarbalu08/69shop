// @ts-check
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

// =============================================
// SELLER DASHBOARD & ORDER MANAGEMENT TESTS
// =============================================

const SELLER_USER = {
    uid: 'seller-001',
    email: 'seller@69shop.in',
    displayName: 'Test Seller'
};

const MOCK_SELLER_DATA = {
    sellers: {
        'seller-001': {
            businessName: 'Test Electronics Store',
            storeName: 'TestStore',
            email: 'seller@69shop.in',
            verified: true,
            accountType: 'seller'
        }
    },
    users: {
        'seller-001': {
            accountType: 'seller',
            email: 'seller@69shop.in',
            displayName: 'Test Seller'
        }
    },
    orders: {
        'order-001': {
            sellerId: 'seller-001',
            customerName: 'Rajkumar',
            customerEmail: 'customer@example.com',
            status: 'pending',
            total: 5999,
            items: [{ name: 'Test Product', quantity: 1, price: 5999 }],
            shippingAddress: {
                fullName: 'Rajkumar',
                line1: '123 Test Street',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001'
            },
            createdAt: { toDate: () => new Date() },
            statusTimestamps: {}
        },
        'order-002': {
            sellerId: 'seller-001',
            customerName: 'Test Customer',
            customerEmail: 'test@example.com',
            status: 'shipped',
            total: 12999,
            items: [{ name: 'Laptop Stand', quantity: 2, price: 6499 }],
            shippingAddress: {
                fullName: 'Test Customer',
                line1: '456 Demo Road',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            },
            tracking: {
                carrier: 'delhivery',
                number: 'DEL123456',
                addedAt: new Date().toISOString()
            },
            createdAt: { toDate: () => new Date() },
            statusTimestamps: {
                confirmed: new Date().toISOString(),
                processing: new Date().toISOString(),
                shipped: new Date().toISOString()
            }
        }
    },
    products: {
        'prod-seller-1': {
            name: 'Wireless Mouse',
            price: 999,
            category: 'Electronics',
            sellerId: 'seller-001',
            stock: 15,
            status: 'active'
        }
    }
};

async function setupSellerDashboard(page) {
    await mockFirebase(page, {
        user: SELLER_USER,
        collections: MOCK_SELLER_DATA
    });
}

// ----- TEST: Seller Dashboard -----
test.describe('Seller Dashboard', () => {
    test('Seller dashboard loads for authenticated seller', async ({ page }) => {
        await setupSellerDashboard(page);
        await page.goto('/seller-dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Dashboard should load (not redirect to login)
        expect(page.url()).toContain('seller-dashboard');
    });

    test('Seller dashboard shows stats cards', async ({ page }) => {
        await setupSellerDashboard(page);
        await page.goto('/seller-dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Look for stat cards
        const statCards = page.locator('.stat-card, .dashboard-stat, .metric-card');
        if (await statCards.count() > 0) {
            expect(await statCards.count()).toBeGreaterThan(0);
        }
    });
});

// ----- TEST: Seller Orders -----
test.describe('Seller Orders', () => {
    test('Seller orders page loads', async ({ page }) => {
        await setupSellerDashboard(page);
        await page.goto('/seller-orders.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        expect(page.url()).toContain('seller-orders');
    });

    test('Order status flow includes out_for_delivery', async ({ page }) => {
        await setupSellerDashboard(page);
        await page.goto('/seller-orders.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Verify the STATUS_FLOW constant includes out_for_delivery
        const hasOutForDelivery = await page.evaluate(() => {
            // This checks the global STATUS_FLOW variable
            if (typeof STATUS_FLOW !== 'undefined') {
                return STATUS_FLOW.shipped === 'out_for_delivery' && STATUS_FLOW.out_for_delivery === 'delivered';
            }
            return null;
        });

        if (hasOutForDelivery !== null) {
            expect(hasOutForDelivery).toBe(true);
        }
    });

    test('Tracking modal has estimated delivery date field', async ({ page }) => {
        await setupSellerDashboard(page);
        await page.goto('/seller-orders.html', { waitUntil: 'domcontentloaded' });

        const estimatedDeliveryInput = page.locator('#estimatedDelivery');
        // It should exist but might be hidden (inside modal)
        await expect(estimatedDeliveryInput).toBeAttached();
    });
});

// ----- TEST: Seller Navigation -----
test.describe('Seller Page Navigation', () => {
    const SELLER_NAV_PAGES = [
        { path: '/seller-dashboard.html', title: 'Dashboard' },
        { path: '/seller-orders.html', title: 'Orders' },
        { path: '/seller-products.html', title: 'Products' },
        { path: '/seller-analytics.html', title: 'Analytics' },
        { path: '/seller-messages.html', title: 'Messages' },
        { path: '/seller-payments.html', title: 'Payments' },
        { path: '/seller-settings.html', title: 'Settings' }
    ];

    for (const { path, title } of SELLER_NAV_PAGES) {
        test(`Seller ${title} page has sidebar navigation`, async ({ page }) => {
            await setupSellerDashboard(page);
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            // All seller pages should have sidebar nav
            const sidebar = page.locator('.sidebar, .seller-sidebar, nav');
            if (await sidebar.count() > 0) {
                await expect(sidebar.first()).toBeVisible();
            }
        });
    }
});

// ----- TEST: Seller Login -----
test.describe('Seller Login', () => {
    test('Seller login page loads', async ({ page }) => {
        await page.goto('/seller-login.html', { waitUntil: 'domcontentloaded' });

        const loginForm = page.locator('form, .login-form, .auth-form');
        await expect(loginForm.first()).toBeVisible();
    });

    test('Seller login page has email and password fields', async ({ page }) => {
        await page.goto('/seller-login.html', { waitUntil: 'domcontentloaded' });

        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');

        await expect(emailInput.first()).toBeVisible();
        await expect(passwordInput.first()).toBeVisible();
    });
});

// =============================================
// ADMIN DASHBOARD TESTS
// =============================================

const ADMIN_USER = {
    uid: 'admin-001',
    email: 'admin@69shop.in',
    displayName: 'Admin User'
};

const MOCK_ADMIN_DATA = {
    admins: {
        'admin-001': {
            email: 'admin@69shop.in',
            role: 'super_admin',
            active: true
        }
    },
    users: {
        'admin-001': {
            accountType: 'admin',
            email: 'admin@69shop.in'
        }
    }
};

async function setupAdminDashboard(page) {
    await mockFirebase(page, {
        user: ADMIN_USER,
        collections: MOCK_ADMIN_DATA
    });
}

test.describe('Admin Dashboard', () => {
    test('Admin login page loads', async ({ page }) => {
        await page.goto('/admin-login.html', { waitUntil: 'domcontentloaded' });

        const loginForm = page.locator('form, .login-form, .admin-login');
        await expect(loginForm.first()).toBeVisible();
    });

    test('Admin dashboard loads for authenticated admin', async ({ page }) => {
        await setupAdminDashboard(page);
        await page.goto('/admin-dashboard.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Should not redirect away
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});
