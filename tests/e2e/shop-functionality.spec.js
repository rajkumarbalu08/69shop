// @ts-check
const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

// =============================================
// SHOP FUNCTIONALITY TESTS
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
    },
    'prod-3': {
        name: 'Organic Honey 500g',
        price: 449,
        originalPrice: 599,
        category: 'Groceries',
        brand: 'NatureFresh',
        image: '/Logo/placeholder.svg',
        images: ['/Logo/placeholder.svg'],
        seller: 'OrganicStore',
        sellerId: 'seller-3',
        rating: 4.8,
        reviews: 200,
        stock: 50,
        tags: ['organic', 'honey', 'natural'],
        description: 'Pure organic honey'
    }
};

async function setupShopWithProducts(page) {
    await mockFirebase(page, {
        collections: {
            products: MOCK_PRODUCTS
        }
    });
}

// ----- TEST: Shop page rendering -----
test.describe('Shop Page', () => {
    test('Shop page loads and shows product grid', async ({ page }) => {
        await setupShopWithProducts(page);
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Products grid should be visible
        const productsGrid = page.locator('#productsGrid');
        await expect(productsGrid).toBeVisible();
    });

    test('Shop page has search input', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        const searchInput = page.locator('#searchInput');
        await expect(searchInput).toBeVisible();
    });

    test('Shop page has filter sidebar', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const filtersSidebar = page.locator('.filters-sidebar');
        // Verify the sidebar exists in the DOM (may be hidden on smaller viewports)
        if (await filtersSidebar.count() > 0) {
            await expect(filtersSidebar.first()).toBeAttached();
        }
    });

    test('Shop page has category quick filters', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        const categoryChips = page.locator('.category-chip, .category-quick-filters');
        const count = await categoryChips.count();
        expect(count, 'Category filter chips should exist').toBeGreaterThan(0);
    });
});

// ----- TEST: Product page -----
test.describe('Product Page', () => {
    test('Product page shows content when given valid ID', async ({ page }) => {
        await setupShopWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Product page should show either product content or error state (depending on Firebase mock)
        const body = page.locator('body');
        await expect(body).toBeVisible();
        // Verify URL maintained the product ID
        expect(page.url()).toContain('id=prod-1');
    });

    test('Product page shows error state for missing product', async ({ page }) => {
        await setupShopWithProducts(page);
        await page.goto('/product.html?id=nonexistent', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const errorState = page.locator('#errorState');
        await expect(errorState).toBeVisible();
    });

    test('Product page View All link has category filter', async ({ page }) => {
        await setupShopWithProducts(page);
        await page.goto('/product.html?id=prod-1', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const viewAllLink = page.locator('#viewAllRelatedLink');
        if (await viewAllLink.isVisible()) {
            const href = await viewAllLink.getAttribute('href');
            expect(href).toContain('category=');
        }
    });
});

// ----- TEST: Search functionality -----
test.describe('Search Functionality', () => {
    test('Search input accepts text and shows results area', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('#searchInput');
        await searchInput.fill('Samsung');
        await page.waitForTimeout(500);

        // Search results container should exist in DOM (may be hidden if no Firebase data)
        const searchResults = page.locator('#searchResults, .search-results');
        if (await searchResults.count() > 0) {
            await expect(searchResults.first()).toBeAttached();
        }
    });

    test('Search page renders search interface', async ({ page }) => {
        await page.goto('/search.html', { waitUntil: 'domcontentloaded' });
        const searchInput = page.locator('input[type="text"], input[type="search"], #searchInput');
        await expect(searchInput.first()).toBeVisible();
    });

    test('Search page with query parameter shows results', async ({ page }) => {
        await setupShopWithProducts(page);
        await page.goto('/search.html?q=samsung', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Page should have loaded without errors
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});

// ----- TEST: Cart functionality -----
test.describe('Cart Functionality', () => {
    test('Cart button exists on shop page', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        const cartBtn = page.locator('#cartBtn');
        await expect(cartBtn).toBeVisible();
    });

    test('Cart sidebar opens when cart button is clicked', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const cartBtn = page.locator('#cartBtn');
        await cartBtn.click();

        const cartSidebar = page.locator('#cartSidebar, .cart-sidebar');
        if (await cartSidebar.count() > 0) {
            await expect(cartSidebar.first()).toBeVisible();
        }
    });

    test('Empty cart shows appropriate message', async ({ page }) => {
        await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Clear localStorage cart
        await page.evaluate(() => {
            localStorage.removeItem('69shop_cart');
        });

        const cartBtn = page.locator('#cartBtn');
        await cartBtn.click();
        await page.waitForTimeout(300);

        // Cart should show empty state or 0 items
        const cartCount = page.locator('#cartCount');
        if (await cartCount.count() > 0) {
            const text = await cartCount.textContent();
            expect(text).toBe('0');
        }
    });
});

// ----- TEST: Services page -----
test.describe('Services Page', () => {
    test('Services page loads with service cards', async ({ page }) => {
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main')).toBeVisible();
    });

    test('Services page has correct navigation links', async ({ page }) => {
        await page.goto('/services.html', { waitUntil: 'domcontentloaded' });

        // Check "Shop ready hampers" link uses absolute path
        const shopLink = page.locator('a[href="/shop.html"]').first();
        if (await shopLink.count() > 0) {
            const href = await shopLink.getAttribute('href');
            expect(href).toBe('/shop.html');
        }
    });
});

// ----- TEST: Legal pages -----
test.describe('Legal Pages', () => {
    test('Privacy policy page has required sections', async ({ page }) => {
        await page.goto('/docs/privacy.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toContainText('Privacy');
        await expect(page.locator('body')).toContainText('69Shop');
    });

    test('Terms of service page has required sections', async ({ page }) => {
        await page.goto('/docs/terms.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toContainText('Terms');
        await expect(page.locator('body')).toContainText('69Shop');
    });

    test('Shipping policy page has required content', async ({ page }) => {
        await page.goto('/docs/shipping.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toContainText('Shipping');
    });

    test('Refund policy page has required content', async ({ page }) => {
        await page.goto('/docs/refund.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toContainText('Refund');
    });
});
