/**
 * 69Shop.in Internal Acceptance Testing
 * Deep testing to find issues before production
 * 
 * Run: npx playwright test tests/e2e/internal-acceptance-test.spec.js --reporter=html
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://shop69-1.web.app';

// All pages to test
const PAGES = {
  public: [
    { path: '/', name: 'Landing Page' },
    { path: '/shop.html', name: 'Shop Page' },
    { path: '/services.html', name: 'Services Page' },
    { path: '/shop-login.html', name: 'Login Page' },
    { path: '/product.html', name: 'Product Page' },
    { path: '/profile.html', name: 'Profile Page' },
    { path: '/order-tracking.html', name: 'Order Tracking' },
  ],
  category: [
    { path: '/category-electronics.html', name: 'Electronics Category' },
    { path: '/category-fashion.html', name: 'Fashion Category' },
    { path: '/category-home.html', name: 'Home Category' },
    { path: '/category-beauty.html', name: 'Beauty Category' },
    { path: '/category-sports.html', name: 'Sports Category' },
    { path: '/category-books.html', name: 'Books Category' },
    { path: '/category-toys.html', name: 'Toys Category' },
    { path: '/category-groceries.html', name: 'Groceries Category' },
    { path: '/category-jewelry.html', name: 'Jewelry Category' },
    { path: '/category-automotive.html', name: 'Automotive Category' },
  ],
  seller: [
    { path: '/seller-login.html', name: 'Seller Login' },
    { path: '/seller-dashboard.html', name: 'Seller Dashboard' },
    { path: '/seller-products.html', name: 'Seller Products' },
    { path: '/seller-orders.html', name: 'Seller Orders' },
    { path: '/seller-analytics.html', name: 'Seller Analytics' },
  ],
  admin: [
    { path: '/admin-login.html', name: 'Admin Login' },
    { path: '/admin-dashboard.html', name: 'Admin Dashboard' },
  ],
  legacy: [
    { path: '/appliances.html', name: 'Appliances (Legacy)' },
    { path: '/mobiles.html', name: 'Mobiles (Legacy)' },
    { path: '/headphones.html', name: 'Headphones (Legacy)' },
    { path: '/electronics.html', name: 'Electronics (Legacy)' },
    { path: '/fashion.html', name: 'Fashion (Legacy)' },
    { path: '/beauty.html', name: 'Beauty (Legacy)' },
    { path: '/sports.html', name: 'Sports (Legacy)' },
    { path: '/grocery.html', name: 'Grocery (Legacy)' },
    { path: '/books.html', name: 'Books (Legacy)' },
    { path: '/home-needs.html', name: 'Home Needs (Legacy)' },
  ]
};

// Track all found issues
const issues = [];

function logIssue(severity, page, category, description, details = '') {
  issues.push({ severity, page, category, description, details });
  console.log(`[${severity}] ${page}: ${description}`);
}

test.describe('Deep Page Loading Tests', () => {
  
  test('All public pages load without errors', async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];
    
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    for (const p of PAGES.public) {
      const response = await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
      
      // Check HTTP status
      if (!response || response.status() >= 400) {
        logIssue('CRITICAL', p.name, 'HTTP', `Page returned ${response?.status() || 'no response'}`);
      }
      
      // Check for page errors during load
      if (pageErrors.length > 0) {
        pageErrors.forEach(err => logIssue('HIGH', p.name, 'JavaScript', 'Page error', err));
        pageErrors.length = 0;
      }
      
      // Check console errors
      const relevantErrors = consoleErrors.filter(e => 
        !e.includes('Firebase') && 
        !e.includes('favicon') &&
        !e.includes('net::ERR')
      );
      if (relevantErrors.length > 0) {
        relevantErrors.forEach(err => logIssue('MEDIUM', p.name, 'Console', 'Console error', err));
        consoleErrors.length = 0;
      }
    }
    
    expect(issues.filter(i => i.severity === 'CRITICAL')).toHaveLength(0);
  });

  test('All category pages load without errors', async ({ page }) => {
    for (const p of PAGES.category) {
      const response = await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
      
      if (!response || response.status() >= 400) {
        logIssue('CRITICAL', p.name, 'HTTP', `Page returned ${response?.status() || 'no response'}`);
      }
      
      // Check trending section exists
      const trendingSection = await page.$('.trending-section');
      if (!trendingSection) {
        logIssue('MEDIUM', p.name, 'Structure', 'Missing trending section');
      }
      
      // Check section header structure
      const sectionHeader = await page.$('.section-header');
      if (!sectionHeader) {
        logIssue('MEDIUM', p.name, 'Structure', 'Missing section header');
      }
    }
  });
});

test.describe('Navigation & Link Tests', () => {
  
  test('Header navigation links work', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    // Check logo link
    const logoLink = await page.$('.logo');
    if (!logoLink) {
      logIssue('HIGH', 'Shop Page', 'Navigation', 'Logo link missing');
    }
    
    // Check cart button
    const cartBtn = await page.$('.cart-btn, #cartBtn, [onclick*="cart"]');
    if (!cartBtn) {
      logIssue('HIGH', 'Shop Page', 'Navigation', 'Cart button missing');
    }
    
    // Check wishlist button
    const wishlistBtn = await page.$('#wishlistBtn, .wishlist-btn, [onclick*="wishlist"]');
    if (!wishlistBtn) {
      logIssue('MEDIUM', 'Shop Page', 'Navigation', 'Wishlist button missing');
    }
  });

  test('Footer links are valid', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    
    const footerLinks = await page.$$('footer a[href]');
    
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const fullUrl = href.startsWith('/') ? `${BASE_URL}${href}` : href;
        
        // Check if link is valid (doesn't 404)
        try {
          const response = await page.request.head(fullUrl);
          if (response.status() >= 400) {
            logIssue('MEDIUM', 'Footer', 'Links', `Broken link: ${href}`, `Status: ${response.status()}`);
          }
        } catch (e) {
          // External link or network issue
        }
      }
    }
  });
});

test.describe('CSS & Layout Tests', () => {
  
  test('Shop page layout elements exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    // Check hero section (carousel or category grid)
    const heroSection = await page.$('.hero-carousel, #heroCarousel, .category-grid-hero, #categoryGridHero');
    if (!heroSection) {
      logIssue('HIGH', 'Shop Page', 'Layout', 'Hero section missing');
    }
    
    // Check products grid
    const productsGrid = await page.$('.products-grid, #productsGrid');
    if (!productsGrid) {
      logIssue('HIGH', 'Shop Page', 'Layout', 'Products grid missing');
    }
    
    // Check filter sidebar
    const filterSidebar = await page.$('.filter-sidebar, .filters-sidebar');
    if (!filterSidebar) {
      logIssue('MEDIUM', 'Shop Page', 'Layout', 'Filter sidebar missing');
    }
    
    // Check cart sidebar
    const cartSidebar = await page.$('.cart-sidebar, #cartSidebar');
    if (!cartSidebar) {
      logIssue('HIGH', 'Shop Page', 'Layout', 'Cart sidebar missing');
    }
  });

  test('Category page layout elements exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/category-electronics.html`, { waitUntil: 'domcontentloaded' });
    
    // Check category hero
    const categoryHero = await page.$('.category-hero, .hero-section');
    if (!categoryHero) {
      logIssue('HIGH', 'Category Page', 'Layout', 'Category hero missing');
    }
    
    // Check trending carousel
    const trendingCarousel = await page.$('.trending-carousel, #trendingCarousel');
    if (!trendingCarousel) {
      logIssue('MEDIUM', 'Category Page', 'Layout', 'Trending carousel missing');
    }
    
    // Check View All link
    const viewAllLink = await page.$('.section-view-all, .view-all-link');
    if (!viewAllLink) {
      logIssue('MEDIUM', 'Category Page', 'Layout', 'View All link missing');
    }
    
    // Check navigation buttons
    const navBtns = await page.$$('.section-nav-btn');
    if (navBtns.length < 2) {
      logIssue('MEDIUM', 'Category Page', 'Layout', 'Section navigation buttons missing or incomplete');
    }
  });

  test('Product page layout elements exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/product.html`, { waitUntil: 'domcontentloaded' });
    
    // Check related section
    const relatedSection = await page.$('.related-section, #relatedSection');
    if (!relatedSection) {
      logIssue('MEDIUM', 'Product Page', 'Layout', 'Related products section missing');
    }
    
    // Check section header (new format)
    const sectionHeader = await page.$('.section-header');
    if (!sectionHeader) {
      logIssue('MEDIUM', 'Product Page', 'Layout', 'Section header missing');
    }
  });
});

test.describe('Interactive Element Tests', () => {
  
  test('Cart sidebar opens and closes', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    // Wait for page to be interactive
    await page.waitForTimeout(2000);
    
    // Try to open cart
    const cartBtn = await page.$('.cart-btn, #cartBtn');
    if (cartBtn) {
      await cartBtn.click();
      await page.waitForTimeout(500);
      
      const cartSidebar = await page.$('.cart-sidebar.active');
      if (!cartSidebar) {
        logIssue('HIGH', 'Shop Page', 'Interaction', 'Cart sidebar does not open on click');
      } else {
        // Try to close cart
        const closeBtn = await page.$('.close-cart, #closeCart');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          
          const closedCart = await page.$('.cart-sidebar:not(.active)');
          if (!closedCart) {
            logIssue('MEDIUM', 'Shop Page', 'Interaction', 'Cart sidebar does not close');
          }
        }
      }
    } else {
      logIssue('HIGH', 'Shop Page', 'Interaction', 'Cart button not found');
    }
  });

  test('Search functionality works', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    const searchInput = await page.$('.search-input, #searchInput, input[type="search"]');
    if (searchInput) {
      await searchInput.fill('laptop');
      await page.waitForTimeout(500);
      
      // Check if search results appear
      const searchResults = await page.$('.search-results, .search-dropdown');
      if (!searchResults) {
        logIssue('MEDIUM', 'Shop Page', 'Search', 'Search results dropdown not appearing');
      }
    } else {
      logIssue('HIGH', 'Shop Page', 'Search', 'Search input not found');
    }
  });

  test('Scroll navigation works on category pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/category-electronics.html`, { waitUntil: 'networkidle' });
    
    // Check if scrollTrending function exists
    const hasScrollFunction = await page.evaluate(() => {
      return typeof window.scrollTrending === 'function';
    });
    
    if (!hasScrollFunction) {
      logIssue('HIGH', 'Category Page', 'JavaScript', 'scrollTrending function not defined');
    }
    
    // Try clicking navigation button
    const nextBtn = await page.$('.section-nav-btn:last-child');
    if (nextBtn) {
      await nextBtn.click();
      // If no error, navigation should work
    }
  });
});

test.describe('Form Validation Tests', () => {
  
  test('Login form has proper validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop-login.html`, { waitUntil: 'domcontentloaded' });
    
    // Check email input
    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    if (!emailInput) {
      logIssue('HIGH', 'Login Page', 'Form', 'Email input missing');
    }
    
    // Check password input
    const passwordInput = await page.$('input[type="password"], input[name="password"], #password');
    if (!passwordInput) {
      logIssue('HIGH', 'Login Page', 'Form', 'Password input missing');
    }
    
    // Check submit button
    const submitBtn = await page.$('button[type="submit"], .login-btn, #loginBtn');
    if (!submitBtn) {
      logIssue('HIGH', 'Login Page', 'Form', 'Submit button missing');
    }
  });
});

test.describe('Responsive Design Tests', () => {
  
  test('Mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    // Check for mobile menu toggle
    const mobileMenuToggle = await page.$('.mobile-menu-toggle, .hamburger-menu, .menu-toggle');
    if (!mobileMenuToggle) {
      logIssue('MEDIUM', 'Shop Page', 'Responsive', 'Mobile menu toggle not found');
    }
    
    // Check for mobile filters toggle
    const mobileFiltersToggle = await page.$('.mobile-filters-toggle, #mobileFiltersToggle');
    if (!mobileFiltersToggle) {
      logIssue('LOW', 'Shop Page', 'Responsive', 'Mobile filters toggle not found');
    }
  });

  test('Elements are not overflowing on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/category-electronics.html`, { waitUntil: 'domcontentloaded' });
    
    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    
    if (hasOverflow) {
      logIssue('MEDIUM', 'Category Page', 'Responsive', 'Horizontal overflow detected on mobile');
    }
  });
});

test.describe('Accessibility Tests', () => {
  
  test('Images have alt attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    const imagesWithoutAlt = await page.$$('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      logIssue('MEDIUM', 'Shop Page', 'Accessibility', `${imagesWithoutAlt.length} images missing alt attribute`);
    }
  });

  test('Buttons have accessible labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    // Check for buttons without aria-label or visible text
    const buttonsWithoutLabel = await page.$$eval('button', buttons => 
      buttons.filter(btn => !btn.getAttribute('aria-label') && !btn.textContent.trim()).length
    );
    if (buttonsWithoutLabel > 0) {
      logIssue('LOW', 'Shop Page', 'Accessibility', `${buttonsWithoutLabel} buttons missing accessible labels`);
    }
  });

  test('Form inputs have labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop-login.html`, { waitUntil: 'domcontentloaded' });
    
    const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"])');
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (!id && !ariaLabel && !placeholder) {
        logIssue('MEDIUM', 'Login Page', 'Accessibility', 'Input field without label or accessible name');
      }
    }
  });
});

test.describe('JavaScript Function Tests', () => {
  
  test('Essential functions are defined on shop page', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const functions = [
      'openCart',
      'closeCart',
      'addToCart',
      'updateCartCount',
    ];
    
    for (const fn of functions) {
      const exists = await page.evaluate((fnName) => {
        return typeof window[fnName] === 'function';
      }, fn);
      
      if (!exists) {
        logIssue('HIGH', 'Shop Page', 'JavaScript', `Function ${fn} not defined`);
      }
    }
  });

  test('Essential functions are defined on category pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/category-electronics.html`, { waitUntil: 'networkidle' });
    
    const functions = [
      'scrollTrending',
      'loadProducts',
    ];
    
    for (const fn of functions) {
      const exists = await page.evaluate((fnName) => {
        return typeof window[fnName] === 'function';
      }, fn);
      
      if (!exists) {
        logIssue('HIGH', 'Category Page', 'JavaScript', `Function ${fn} not defined`);
      }
    }
  });

  test('scrollRelated function exists on product page', async ({ page }) => {
    await page.goto(`${BASE_URL}/product.html`, { waitUntil: 'networkidle' });
    
    const exists = await page.evaluate(() => {
      return typeof window.scrollRelated === 'function';
    });
    
    if (!exists) {
      logIssue('HIGH', 'Product Page', 'JavaScript', 'scrollRelated function not defined');
    }
  });
});

test.describe('Data Loading Tests', () => {
  
  test('Products load on shop page', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded' });
    
    // Wait for products to potentially load
    await page.waitForTimeout(3000);
    
    const productCards = await page.$$('.product-card');
    const skeletonCards = await page.$$('.skeleton-card');
    
    if (productCards.length === 0 && skeletonCards.length > 0) {
      logIssue('MEDIUM', 'Shop Page', 'Data', 'Products still loading (skeleton visible) after 3s');
    }
    
    if (productCards.length === 0) {
      // Check if empty state is shown
      const emptyState = await page.$('.empty-state');
      if (!emptyState) {
        logIssue('HIGH', 'Shop Page', 'Data', 'No products loaded and no empty state shown');
      }
    }
  });

  test('Trending products load on category pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/category-electronics.html`, { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(2000);
    
    const trendingCards = await page.$$('.trending-carousel .product-card, .trending-carousel .trending-card');
    
    if (trendingCards.length === 0) {
      logIssue('MEDIUM', 'Category Page', 'Data', 'No trending products loaded');
    }
  });
});

// Summary test that runs last
test.afterAll(async () => {
  console.log('\n=== INTERNAL ACCEPTANCE TEST SUMMARY ===\n');
  
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');
  
  console.log(`CRITICAL: ${critical.length}`);
  console.log(`HIGH: ${high.length}`);
  console.log(`MEDIUM: ${medium.length}`);
  console.log(`LOW: ${low.length}`);
  console.log(`TOTAL: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n--- All Issues ---\n');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.severity}] ${issue.page} - ${issue.category}: ${issue.description}`);
      if (issue.details) console.log(`   Details: ${issue.details}`);
    });
  }
});
