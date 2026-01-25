// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const LOCAL_BASE_URL = 'http://127.0.0.1:4173';
const hasCustomBaseUrl = Boolean(process.env.E2E_BASE_URL);

/**
 * Playwright configuration for 69Shop smoke tests.
 * The baseURL can be overridden via the E2E_BASE_URL environment variable.
 */
module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 45_000,
    retries: 0,
    use: {
        baseURL: process.env.E2E_BASE_URL || LOCAL_BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: hasCustomBaseUrl ? undefined : {
        command: 'npx http-server ./dist -p 4173 -c-1 --silent',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    }
});
