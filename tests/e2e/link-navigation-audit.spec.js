// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * 69Shop.in — Comprehensive Link & Navigation Audit
 * Crawls every page, collects every <a> href, checks for broken links,
 * and writes results to docs/Link_Navigation_Audit.csv
 */

const ALL_PAGES = [
    '/',
    '/shop.html',
    '/services.html',
    '/shop-login.html',
    '/profile.html',
    '/product.html',
    '/brand-store.html',
    '/book-service.html',
    '/search.html',
    '/messages.html',
    '/my-bookings.html',
    '/order-tracking.html',
    '/category.html',
    '/category-electronics.html',
    '/category-fashion.html',
    '/category-beauty.html',
    '/category-books.html',
    '/category-groceries.html',
    '/category-home.html',
    '/category-jewelry.html',
    '/category-sports.html',
    '/category-toys.html',
    '/category-automotive.html',
    '/category-template.html',
    '/electronics.html',
    '/fashion.html',
    '/beauty.html',
    '/books.html',
    '/grocery.html',
    '/home-needs.html',
    '/headphones.html',
    '/mobiles.html',
    '/appliances.html',
    '/sports.html',
    '/seller-login.html',
    '/seller-dashboard.html',
    '/seller-products.html',
    '/seller-orders.html',
    '/seller-analytics.html',
    '/seller-messages.html',
    '/seller-payments.html',
    '/seller-promotions.html',
    '/seller-reviews.html',
    '/seller-services.html',
    '/seller-settings.html',
    '/seller-verification.html',
    '/admin-login.html',
    '/admin-dashboard.html',
    '/admin-products.html',
    '/admin-orders.html',
    '/admin-sellers.html',
    '/admin-users.html',
    '/admin-analytics.html',
    '/admin-settings.html',
    '/admin-activity.html',
    '/offline.html',
];

const CSV_PATH = path.resolve(__dirname, '..', '..', 'docs', 'Link_Navigation_Audit.csv');

function csvEscape(s) {
    return '"' + String(s).replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
}

function appendToCSV(rows) {
    if (rows.length === 0) return;
    fs.appendFileSync(CSV_PATH, rows.join('\n') + '\n', 'utf-8');
}

test.describe('Link & Navigation Audit', () => {

    test.beforeAll(async () => {
        const header = 'Source Page,Page Status,Link Text,Link Href,Link Status,Result\n';
        fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
        fs.writeFileSync(CSV_PATH, header, 'utf-8');
    });

    for (const pagePath of ALL_PAGES) {
        test(`Audit: ${pagePath}`, async ({ page }) => {
            const rows = [];

            function addRow(ps, lt, lh, ls, res) {
                rows.push([csvEscape(pagePath), csvEscape(ps), csvEscape(lt), csvEscape(lh), csvEscape(ls), csvEscape(res)].join(','));
            }

            let pageStatus = 'OK';

            // 1. Load the page
            try {
                const response = await page.goto(pagePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
                pageStatus = response ? String(response.status()) : 'No response';
                if (response && response.status() >= 400) {
                    addRow(pageStatus, '(page itself)', pagePath, 'FAIL', 'HTTP ' + response.status());
                    appendToCSV(rows);
                    return;
                }
            } catch (err) {
                addRow('ERROR', '(page itself)', pagePath, 'FAIL', 'Load failed: ' + err.message.substring(0, 100));
                appendToCSV(rows);
                return;
            }

            // 2. Wait for any JS redirects to settle
            await page.waitForTimeout(600);

            // 3. Collect all <a> links
            let links = [];
            try {
                links = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                        text: (a.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 60) || '(no text)',
                        href: a.getAttribute('href') || '',
                    }));
                });
            } catch (_) {
                addRow(pageStatus, '(page redirected)', pagePath, 'REDIRECT', 'Page navigated away before links could be collected');
                appendToCSV(rows);
                return;
            }

            if (links.length === 0) {
                addRow(pageStatus, '(no links)', '-', 'INFO', 'Page has no <a> links');
                appendToCSV(rows);
                return;
            }

            // 4. De-duplicate
            const seen = new Set();
            const unique = links.filter(l => { if (seen.has(l.href)) return false; seen.add(l.href); return true; });

            // 5. Check each link
            let passCount = 0, failCount = 0, skipCount = 0;

            for (const link of unique) {
                const href = link.href;

                if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:')) {
                    addRow(pageStatus, link.text, href, 'SKIP', 'Non-navigable link');
                    skipCount++;
                    continue;
                }

                if (href.startsWith('http://') || href.startsWith('https://')) {
                    addRow(pageStatus, link.text, href, 'EXTERNAL', 'External — not tested');
                    skipCount++;
                    continue;
                }

                if (href.startsWith('#')) {
                    addRow(pageStatus, link.text, href, 'ANCHOR', 'Same-page anchor');
                    skipCount++;
                    continue;
                }

                // Internal link — resolve path
                let targetPath = href.split('#')[0].split('?')[0];
                if (!targetPath) {
                    addRow(pageStatus, link.text, href, 'ANCHOR', 'Same-page query/anchor');
                    skipCount++;
                    continue;
                }
                if (!targetPath.startsWith('/')) {
                    const dir = pagePath.substring(0, pagePath.lastIndexOf('/') + 1);
                    targetPath = dir + targetPath;
                }

                try {
                    const resp = await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 10000 });
                    const status = resp ? resp.status() : 0;
                    if (status >= 200 && status < 400) {
                        addRow(pageStatus, link.text, href, 'PASS', 'HTTP ' + status);
                        passCount++;
                    } else {
                        addRow(pageStatus, link.text, href, 'FAIL', 'HTTP ' + status);
                        failCount++;
                    }
                } catch (err) {
                    addRow(pageStatus, link.text, href, 'WARN', 'Nav error: ' + err.message.substring(0, 80));
                    failCount++;
                }
            }

            // Page summary row
            addRow(pageStatus, 'PAGE SUMMARY: ' + unique.length + ' unique links | ' + passCount + ' pass | ' + failCount + ' fail | ' + skipCount + ' skip', pagePath, 'SUMMARY', 'Audit complete');

            appendToCSV(rows);
        });
    }
});
