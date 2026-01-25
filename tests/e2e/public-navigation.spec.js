const { test, expect } = require('@playwright/test');

const PUBLIC_PATHS = ['/', '/shop.html', '/services.html', '/shop-login.html'];

async function gotoAndAssert(page, path) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response, `No response when visiting ${path}`).toBeTruthy();
    expect(response.status(), `Unexpected status for ${path}`).toBeLessThan(400);
}

test.describe('Public navigation smoke tests', () => {
    test('Landing page renders hero content', async ({ page }) => {
        await gotoAndAssert(page, '/');
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('a', { hasText: /Shop/i }).first()).toBeVisible();
    });

    test('Core public pages respond successfully', async ({ page }) => {
        const errors = [];
        const errorListener = (err) => errors.push(err.message);
        page.on('pageerror', errorListener);
        try {
            for (const path of PUBLIC_PATHS) {
                errors.length = 0;
                await gotoAndAssert(page, path);
                await page.waitForTimeout(250);
                expect(errors, `Console errors detected on ${path}`).toHaveLength(0);
            }
        } finally {
            page.off('pageerror', errorListener);
        }
    });

    test('Footer links expose Seller Hub entry points', async ({ page }) => {
        await gotoAndAssert(page, '/');
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
        await expect(footer.locator('a', { hasText: /Seller Dashboard/i }).first()).toBeVisible();
    });
});
