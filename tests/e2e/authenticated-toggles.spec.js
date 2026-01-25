const { test, expect } = require('@playwright/test');
const { mockFirebase } = require('./utils/firebaseMock');

const SELLER_ID = 'seller-test-001';
const ADMIN_EMAIL = 'rajkumarbalu81@gmail.com';

async function expectWrite(page, collection) {
    await page.waitForFunction((target) => {
        return (window.__mockWrites || []).some((entry) => entry.collection === target);
    }, collection, { timeout: 5000 });
    const writes = await page.evaluate((target) => {
        return (window.__mockWrites || []).filter((entry) => entry.collection === target);
    }, collection);
    return writes;
}

test.describe('Seller toggle auto-save queues', () => {
    test('service manager toggles debounce before persisting', async ({ page }) => {
        await mockFirebase(page, {
            user: { uid: SELLER_ID, email: 'seller@example.com', displayName: 'Seller Example' },
            collections: {
                sellers: {
                    [SELLER_ID]: { businessName: 'Example Seller', notifications: { marketing: false } }
                },
                sellerServices: {
                    [SELLER_ID]: {
                        categories: {
                            prepleating: {
                                enabled: true,
                                options: {
                                    'studio-drop': { enabled: true, price: 350 }
                                }
                            }
                        }
                    }
                }
            }
        });

        await page.goto('/seller-services.html');
        const toggle = page.locator('#prepleatingCategory .service-category-toggle input');
        const toggleControl = page.locator('#prepleatingCategory .service-category-toggle label.toggle-switch');
        await expect(toggle).toBeChecked();
        await toggleControl.click();
        await expect(toggle).not.toBeChecked();

        const saveStatus = page.locator('#saveStatus');
        await expect(saveStatus).toContainText('Unsaved', { timeout: 1000 });
        await expect(saveStatus).toContainText('All changes saved', { timeout: 6000 });

        const serviceWrites = await expectWrite(page, 'sellerServices');
        const latest = serviceWrites.at(-1);
        expect(latest?.payload?.categories?.prepleating?.enabled).toBe(false);
    });

    test('notification toggles auto-save preferences', async ({ page }) => {
        await mockFirebase(page, {
            user: { uid: SELLER_ID, email: 'seller@example.com', displayName: 'Seller Example' },
            collections: {
                sellers: {
                    [SELLER_ID]: {
                        businessName: 'Example Seller',
                        notifications: {
                            orders: true,
                            payments: true,
                            stock: true,
                            marketing: false
                        }
                    }
                }
            }
        });

        await page.goto('/seller-settings.html');
        const marketingToggle = page.locator('#notifyMarketing');
        const marketingControl = page.locator('label.toggle-switch:has(#notifyMarketing)');
        await expect(marketingToggle).not.toBeChecked();
        await marketingControl.click();
        await expect(marketingToggle).toBeChecked();

        const syncStatus = page.locator('#notificationSyncStatus');
        await expect(syncStatus).toContainText('Unsaved', { timeout: 1000 });
        await expect(syncStatus).toContainText('Preferences saved', { timeout: 5000 });

        const sellerWrites = await expectWrite(page, 'sellers');
        const latest = sellerWrites.at(-1);
        expect(latest?.payload?.notifications?.marketing).toBe(true);
    });
});

test.describe('Admin platform toggles', () => {
    test('weekly report toggle auto-saves and logs activity', async ({ page }) => {
        await mockFirebase(page, {
            user: { uid: 'admin-001', email: ADMIN_EMAIL, displayName: 'Lead Admin' },
            collections: {
                platformSettings: {
                    global: {
                        notifications: {
                            sellerVerification: true,
                            productModeration: true,
                            orderIssues: true,
                            weeklyReports: false
                        },
                        platform: {
                            maintenanceMode: false,
                            newSellerRegistration: true
                        }
                    }
                },
                adminActivity: {},
                admins: {
                    [ADMIN_EMAIL]: { email: ADMIN_EMAIL, role: 'general', addedAt: { toDate: () => new Date() } }
                }
            }
        });

        await page.goto('/admin-settings.html');
        const weeklyToggle = page.locator('#notificationWeeklyReports');
        const weeklyControl = page.locator('label.toggle-switch:has(#notificationWeeklyReports)');
        await expect(weeklyToggle).not.toBeChecked();
        await weeklyControl.click();
        await expect(weeklyToggle).toBeChecked();

        const platformWrites = await expectWrite(page, 'platformSettings');
        const latest = platformWrites.at(-1);
        expect(latest?.payload?.notifications?.weeklyReports).toBe(true);

        const activityWrites = await expectWrite(page, 'adminActivity');
        expect(activityWrites.some((entry) => entry.payload?.action === 'platform-settings-updated')).toBe(true);
    });
});
