# 69Shop.in - Final Project Document

> **Version:** 1.0 (Final Pre-Launch)
> **Date:** February 17, 2026
> **Project:** 69Shop.in - Multi-Vendor E-Commerce Marketplace
> **Domain:** 69shop.in
> **Firebase Project:** shop69-1
> **Hosting:** https://shop69-1.web.app
> **Repository:** https://github.com/rajkumarbalu08/69shop

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Completed Features Summary](#3-completed-features-summary)
4. [Pending / In-Progress Items](#4-pending--in-progress-items)
5. [Recommended Enhancements](#5-recommended-enhancements)
6. [Architecture & File Structure](#6-architecture--file-structure)
7. [Database Schema (Firestore Collections)](#7-database-schema-firestore-collections)
8. [Cloud Functions Reference](#8-cloud-functions-reference)
9. [Security Rules Summary](#9-security-rules-summary)
10. [Full Configuration Guide](#10-full-configuration-guide)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Testing Summary](#12-testing-summary)
13. [Go-Live Checklist](#13-go-live-checklist)
14. [Known Limitations](#14-known-limitations)
15. [Cost Estimates](#15-cost-estimates)
16. [Risk Register](#16-risk-register)

---

## 1. Project Overview

### What is 69Shop?

69Shop.in is a **multi-vendor e-commerce marketplace** built on Firebase, designed for the Indian market. It connects buyers, sellers, and service providers on a single platform with three distinct portals:

- **Buyer Portal** - Browse products, shop, checkout, track orders, book services
- **Seller Portal** - Manage products, orders, analytics, payments, reviews, messaging
- **Admin Portal** - Platform governance, user management, seller approvals, analytics

### Key Highlights

| Metric | Value |
|--------|-------|
| HTML Pages | 50+ |
| JavaScript Modules | 38+ |
| CSS Stylesheets | 20+ |
| Firestore Collections | 22+ |
| Cloud Functions | 8+ (HTTP + Triggers + Scheduled) |
| Test Cases | 193 (100% pass rate) |
| Documentation Files | 24+ |

### Business Model

- Multi-vendor marketplace with category-based seller commissions (5%-15%)
- Service booking platform (services marketplace)
- Lead generation and seller onboarding
- Razorpay payment integration (pending KYC approval)

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure (50+ static pages) |
| CSS3 | Styling with custom design system, dark mode support |
| Vanilla JavaScript (ES6+) | All interactivity, no framework dependency |
| Font Awesome 6.4.0 | Icon library |
| Google Fonts (Inter, Poppins) | Typography |
| jsPDF | Invoice/receipt PDF generation |

### Backend (Firebase)
| Service | Purpose |
|---------|---------|
| Firebase Authentication | Email/Password + Google SSO |
| Cloud Firestore | NoSQL database (22+ collections) |
| Cloud Storage | Product images, seller documents, profiles |
| Cloud Functions (Node.js 20) | Server-side logic, triggers, scheduled tasks |
| Firebase Hosting | Static site hosting |
| Firebase Cloud Messaging (FCM) | Push notifications |

### External Services
| Service | Purpose | Status |
|---------|---------|--------|
| Razorpay | Payment gateway (UPI, Cards, Netbanking) | SDK integrated, KYC pending |
| EmailJS | Client-side transactional emails | Configured |
| Gmail SMTP (Nodemailer) | Server-side order emails | Deployed |

### Testing
| Tool | Purpose |
|------|---------|
| Playwright | E2E browser testing (Chromium) |
| http-server | Local dev server (port 4173) |

### DevOps
| Tool | Purpose |
|------|---------|
| Git/GitHub | Version control |
| Firebase CLI | Deployment |
| No build process | Direct HTML/CSS/JS editing |

---

## 3. Completed Features Summary

### Phase 1: Core Platform (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| User Registration & Login | DONE | Email/Password + Google OAuth |
| Role-Based Access Control | DONE | Buyer, Seller, Admin roles |
| Product Catalog | DONE | Categories, search, filtering |
| Shopping Cart | DONE | localStorage persistence, real-time updates |
| Wishlist | DONE | Save products, sync with Firebase |
| Product Quick View | DONE | Modal preview without page change |
| Product Detail Page | DONE | Images, specs, pricing, sharing |
| Recently Viewed Products | DONE | Last 10 items tracked |
| Service Booking System | DONE | Service marketplace with enquiry forms |
| Real-time Messaging | DONE | Customer-seller chat with Firestore |
| Seller Dashboard | DONE | KPIs, order summary, quick actions |
| Seller KYC Verification | DONE | 4-step verification process (PAN, GST, Bank) |
| Admin Dashboard | DONE | User management, seller approvals, analytics |
| Order Management | DONE | Create, track, update order status |
| Product Sharing | DONE | WhatsApp, social media sharing |
| Skeleton Loading | DONE | Loading animations for perceived performance |
| Header/Footer Components | DONE | Reusable components across pages |

### Phase 2: Enhanced Features (90% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| Cart Drawer Component | DONE | Slide-out cart sidebar |
| ProductCard Component | DONE | Reusable product display card |
| Wishlist Sharing | DONE | Unique links, gift registry, social share |
| Real-Time Chat System | DONE | Bidirectional messaging, typing indicators, read receipts |
| Push Notifications (FCM) | DONE | Foreground/background, topic subscriptions |
| Invoice PDF Generation | DONE | A4 + thermal formats, GST compliance |
| Abandoned Cart Recovery | DONE | 30-min threshold, recovery discounts |
| Flash Sales System | DONE | Countdown timers, stock limits, urgency UI |
| Customer Support Ticketing | DONE | 8 categories, 4 priority levels, SLA tracking |
| Order Returns & RMA | DONE | 7-day window, 9 reasons, photo upload |
| PWA Support | DONE | Service worker, manifest, offline page, installable |
| Loyalty Rewards System | DONE | 5 tiers (Bronze-Diamond), discount application |
| Advanced Search Engine | DONE | Relevance ranking, auto-suggest, recommendations |
| Shipping Manager | DONE | Multi-provider, zone-based, weight-based |
| Premium Features | DONE | Live purchase notifications, mega menu, scroll effects |
| Hero Carousel | DONE | Ken Burns effect, staggered animations |
| Category Pages (10) | DONE | Electronics, Fashion, Beauty, Books, Groceries, Home, Jewelry, Sports, Automotive, Toys |
| Mobile Bottom Navigation | PARTIAL | Implemented on 5 pages, missing on 8+ pages |
| Mobile Responsiveness | PARTIAL | ~10% complete across all pages |

### Backend Infrastructure (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| Firestore Security Rules | DONE | 550+ lines, 22+ collections secured |
| Composite Indexes | DONE | 8 indexes for fast queries |
| Order Processing Functions | DONE | Status tracking, notifications, stock decrement |
| Email Notifications | DONE | Order confirmation, shipped, delivered emails |
| Payment Splits System | DONE | Category-based commissions, seller wallets |
| Seller Analytics Aggregation | DONE | Daily metrics at 2 AM IST |
| Seller Performance Scoring | DONE | Weekly scoring at 3 AM IST (Sunday) |
| Review Rating Aggregation | DONE | Real-time average recalculation |
| Daily Settlement Reports | DONE | Scheduled at 6 AM IST |
| Admin Email Normalization | DONE | Case-insensitive admin matching |

---

## 4. Pending / In-Progress Items

### Critical Blockers (Must Fix Before Go-Live)

| Item | Status | Impact | Action Required |
|------|--------|--------|-----------------|
| Razorpay KYC Verification | BLOCKED | No live payments | Complete KYC on Razorpay dashboard |
| Admin Account Setup | PENDING | No admin access post-deploy | Create admin document in Firestore |
| DNS Configuration | PENDING | 69shop.in won't resolve | Point domain to Firebase Hosting |
| Policy Pages | MISSING | Legal compliance | Create Terms, Privacy, Shipping, Refund pages |

### High Priority (Should Fix Before Launch)

| Item | Status | Location |
|------|--------|----------|
| Mobile Bottom Navigation | PARTIAL (5/13 pages) | Missing on 8+ HTML pages |
| Mobile Responsiveness | 10% complete | All pages need responsive testing |
| Review/Rating Frontend UI | 0% (backend ready) | product.html - review submission form |
| Order Tracking UI | 50% (backend ready) | seller-orders.html - status filters, timeline |
| XSS Input Sanitization | NOT DONE | All user input fields |
| End-to-End Payment Testing | NOT DONE | Full checkout with Razorpay |
| shop.html Modularization | NOT DONE | Currently 9000+ lines, needs splitting |

### Medium Priority

| Item | Status | Description |
|------|--------|-------------|
| Error Monitoring (Sentry/Crashlytics) | NOT SET UP | No production error tracking |
| Image Lazy Loading | NOT DONE | Performance optimization |
| CORS Configuration Verification | PENDING | cors.json needs production URL |
| Mobile Testing on Physical Devices | NOT DONE | Only browser testing completed |
| localStorage / Firebase Auth Sync | POTENTIAL ISSUE | Can desync between tabs |

---

## 5. Recommended Enhancements

### Priority 1: Launch-Critical Enhancements

These should be addressed before or immediately after launch:

| # | Enhancement | Pages Affected | Why It Matters |
|---|-------------|----------------|----------------|
| 1 | Complete Mobile Responsiveness | All pages | 70%+ of Indian e-commerce traffic is mobile |
| 2 | Customer Reviews UI | product.html | Social proof drives conversions |
| 3 | Real Order Data in Profile | profile.html | Currently shows placeholder data |
| 4 | Address Management (CRUD) | profile.html | Required for delivery |
| 5 | Online Payment Integration | shop.html | Revenue collection (currently COD only) |
| 6 | Edit Profile Information | profile.html | Users need to update their details |

### Priority 2: Post-Launch Growth Enhancements

| # | Enhancement | Impact |
|---|-------------|--------|
| 7 | Bulk Order Processing | Seller efficiency for high-volume stores |
| 8 | CSV Product Import/Export | Faster seller onboarding |
| 9 | Product Variants (Size/Color) | Required for fashion/apparel category |
| 10 | Quantity Selector on Product Page | Basic e-commerce expectation |
| 11 | "Buy Now" Button | Skip cart for impulse purchases |
| 12 | Pincode Delivery Check | Service area validation |
| 13 | Coupon Code System | Marketing and promotions |
| 14 | Guest Checkout | Reduce friction for first-time buyers |
| 15 | Order Cancellation | Customer self-service |
| 16 | Print Shipping Labels | Seller fulfillment efficiency |

### Priority 3: Competitive Feature Enhancements

| # | Enhancement | Impact |
|---|-------------|--------|
| 17 | Dark Mode Toggle | User preference, modern UX |
| 18 | Phone OTP Login | Preferred auth method in India |
| 19 | WhatsApp Business API | Customer communication channel |
| 20 | Google Analytics / Facebook Pixel | Marketing attribution |
| 21 | Voice Search | Accessibility and convenience |
| 22 | Compare Products | Purchase decision support |
| 23 | Calendar Booking for Services | Appointment scheduling |
| 24 | AI Product Descriptions | Seller listing quality |
| 25 | Advanced Seller Analytics (Charts) | Seller retention |

### Priority 4: Future Roadmap

| # | Enhancement | Category |
|---|-------------|----------|
| 26 | Shipping Carrier API Integration (Delhivery/Shiprocket) | Logistics |
| 27 | Accounting Software Integration (Tally/Zoho) | Finance |
| 28 | Two-Factor Authentication | Security |
| 29 | Video KYC for Sellers | Trust & Safety |
| 30 | Predictive Analytics | Intelligence |
| 31 | EMI Options Display | Payments |
| 32 | Affiliate/Referral System | Growth |

---

## 6. Architecture & File Structure

```
69shop/
├── dist/                              # Production frontend (deployed to Firebase Hosting)
│   ├── index.html                     # Landing page / Lead generation
│   ├── shop.html                      # Main buyer shopping page
│   ├── product.html                   # Product detail page
│   ├── profile.html                   # Customer account/orders
│   ├── shop-login.html                # Buyer authentication
│   ├── messages.html                  # Customer-seller messaging
│   ├── order-tracking.html            # Order status tracking
│   ├── services.html                  # Service marketplace
│   ├── search.html                    # Search results page
│   ├── book-service.html              # Service booking form
│   ├── brand-store.html               # Brand store page
│   ├── my-bookings.html               # Customer bookings
│   ├── category.html                  # Generic category template
│   ├── category-*.html (10 files)     # Category-specific pages
│   │   ├── category-electronics.html
│   │   ├── category-fashion.html
│   │   ├── category-beauty.html
│   │   ├── category-books.html
│   │   ├── category-groceries.html
│   │   ├── category-home.html
│   │   ├── category-jewelry.html
│   │   ├── category-sports.html
│   │   ├── category-automotive.html
│   │   └── category-toys.html
│   ├── seller-*.html (10 files)       # Seller Portal
│   │   ├── seller-dashboard.html
│   │   ├── seller-products.html
│   │   ├── seller-orders.html
│   │   ├── seller-analytics.html
│   │   ├── seller-messages.html
│   │   ├── seller-payments.html
│   │   ├── seller-reviews.html
│   │   ├── seller-services.html
│   │   ├── seller-settings.html
│   │   ├── seller-verification.html
│   │   └── seller-login.html
│   ├── admin-*.html (10 files)        # Admin Portal
│   │   ├── admin-dashboard.html
│   │   ├── admin-users.html
│   │   ├── admin-sellers.html
│   │   ├── admin-products.html
│   │   ├── admin-orders.html
│   │   ├── admin-analytics.html
│   │   ├── admin-activity.html
│   │   ├── admin-settings.html
│   │   └── admin-login.html
│   ├── assets/
│   │   ├── css/                       # 20+ stylesheets
│   │   │   ├── design-system.css      # Core design tokens
│   │   │   ├── dark-theme-global.css  # Dark mode variables
│   │   │   ├── premium-shop.css       # Premium shopping UI
│   │   │   ├── premium-carousels.css  # Carousel styles
│   │   │   ├── category-page.css      # Category listings
│   │   │   ├── category-grid-hero.css # Category hero grids
│   │   │   ├── profile.css            # Profile page
│   │   │   ├── profile-v2.css         # Profile v2 styles
│   │   │   ├── hero-carousel.css      # Hero section
│   │   │   ├── cart-sidebar.css       # Cart drawer
│   │   │   ├── modern-filters.css     # Filter UI
│   │   │   ├── elegant-shop.css       # Shop refinements
│   │   │   ├── shop.css               # Main shop styles
│   │   │   ├── services.css           # Services marketplace
│   │   │   ├── seller-header.css      # Seller portal header
│   │   │   ├── mall-directory.css     # Mall directory
│   │   │   ├── mobile-enhancements.css # Mobile responsive
│   │   │   └── shop-dark-theme.css    # Shop dark theme
│   │   └── js/                        # Additional JS assets
│   ├── js/                            # 38+ JavaScript modules
│   │   ├── components/
│   │   │   ├── header.js              # Navigation header
│   │   │   ├── footer.js              # Page footer
│   │   │   ├── product-card.js        # Product card component
│   │   │   └── cart-drawer.js         # Shopping cart sidebar
│   │   ├── elite-shop.js              # Core e-commerce engine
│   │   ├── category-page.js           # Category browsing
│   │   ├── product-carousel.js        # Product sliders
│   │   ├── offers-carousel.js         # Offers display
│   │   ├── home-lead-gen.js           # Lead capture
│   │   ├── abandoned-cart.js          # Cart recovery
│   │   ├── flash-sales.js            # Flash sale system
│   │   ├── loyalty-rewards.js         # Loyalty tiers
│   │   ├── customer-support.js        # Support tickets
│   │   ├── order-returns.js           # RMA system
│   │   ├── realtime-chat.js           # Real-time messaging
│   │   ├── push-notifications.js      # FCM notifications
│   │   ├── search-recommendations.js  # Search engine
│   │   ├── shipping-manager.js        # Shipping calculator
│   │   ├── invoice-generator.js       # PDF invoices
│   │   ├── wishlist-sharing.js        # Wishlist social share
│   │   ├── premium-features.js        # Premium UX features
│   │   ├── pwa-init.js               # PWA initialization
│   │   └── [15+ more modules]
│   ├── products-data.js               # Static product catalog
│   ├── firebase-config.js             # Firebase SDK initialization
│   ├── firebase-messaging-sw.js       # FCM service worker
│   ├── sw.js                          # PWA service worker
│   ├── manifest.json                  # PWA manifest
│   └── Logo/                          # Brand assets
├── functions/                          # Firebase Cloud Functions
│   ├── index.js                       # Main entry (triggers, HTTP, scheduled)
│   ├── orders.js                      # Order processing logic
│   ├── payment-splits.js             # Commission & wallet system
│   ├── scripts/
│   │   ├── encrypt-mail-config.js     # Email config encryption
│   │   ├── admin-audit.js             # Admin normalization
│   │   └── normalize-seller-statuses.js
│   ├── utils/
│   │   └── secretVault.js             # Secret management
│   ├── secrets/                       # Encrypted config files
│   └── package.json                   # Node.js 20 dependencies
├── tests/                              # Testing suite
│   └── e2e/                           # Playwright E2E tests (5 specs)
├── docs/                               # 24+ documentation files
├── firebase.json                       # Firebase deployment config
├── .firebaserc                         # Project targeting (shop69-1)
├── firestore.rules                     # Database security (550+ lines)
├── firestore.indexes.json             # Composite indexes (8)
├── storage.rules                       # Cloud Storage security
├── cors.json                           # CORS configuration
├── package.json                        # Root project config
└── playwright.config.js               # Test configuration
```

---

## 7. Database Schema (Firestore Collections)

### Authentication & User Management

| Collection | Purpose | Access |
|------------|---------|--------|
| `users` | Customer profiles (name, email, phone, addresses) | Owner + Admin |
| `sellers` | Seller profiles (store info, verification status, bank details) | Owner + Admin |
| `admins` | Admin user records | Admin only |
| `sellerVerification` | KYC documents (PAN, GST, bank proof) | Seller + Admin |

### Product & Catalog

| Collection | Purpose | Access |
|------------|---------|--------|
| `products` | Product listings (title, price, stock, images, specs) | Public read, Seller write |
| `categories` | Product category definitions | Public read, Admin write |
| `productSearchIndex` | Denormalized search data | Cloud Functions managed |
| `promotions` | Seller promotional offers/coupons | Public read, Verified Seller write |

### Orders & Transactions

| Collection | Purpose | Access |
|------------|---------|--------|
| `orders` | Purchase records (items, totals, status, timestamps) | Owner + Seller + Admin |
| `orderNotifications` | Order status change notifications | Owner + Admin |
| `transactions` | Financial ledger (credits, debits, refunds) | Seller + Admin |
| `transactionsSplit` | Commission split records | Admin only |
| `refunds` | Refund processing records | Admin only |

### Seller Financial

| Collection | Purpose | Access |
|------------|---------|--------|
| `sellerWallet` | Wallet balance (available, pending, total) | Seller + Admin |
| `withdrawalRequests` | Payout requests from sellers | Seller create, Admin approve |
| `platformEarnings` | Platform commission tracking | Admin only |
| `sellerPaymentGateways` | Seller payment config | Seller + Admin |

### Seller Operations

| Collection | Purpose | Access |
|------------|---------|--------|
| `sellerAnalytics` | Daily aggregated metrics per seller | Seller + Admin |
| `sellerPerformance` | Weekly performance scores (Bronze/Silver/Gold) | Seller + Admin |
| `sellerServices` | Services offered by sellers | Seller + Admin |
| `sellerShipping` | Shipping settings per seller | Seller + Admin |
| `supportTickets` | Seller support requests | Seller + Admin |

### Reviews & Ratings

| Collection | Purpose | Access |
|------------|---------|--------|
| `reviews` | Customer product/seller reviews | Public read, Customer write |
| `sellerRatings` | Aggregated seller ratings | Public read, Functions write |

### Communication

| Collection | Purpose | Access |
|------------|---------|--------|
| `conversations` | Chat conversation metadata | Participants only |
| `conversations/{id}/messages` | Individual chat messages | Participants only |
| `service_messages` | Service provider messaging | Participants only |
| `notifications` | System notifications (all, seller, buyer) | Target audience |
| `fcmTokens` | Push notification device tokens | Owner only |
| `notificationPreferences` | User notification settings | Owner only |

### Enhanced Features

| Collection | Purpose | Access |
|------------|---------|--------|
| `wishlists` | User wishlist items | Owner only |
| `sharedWishlists` | Public shareable wishlists | Public read |
| `abandonedCarts` | Cart recovery tracking | System managed |
| `flashSales` | Time-limited sales events | Public read, Seller write |
| `flashSaleReservations` | Temporary stock holds | System managed |
| `loyaltyTransactions` | Loyalty point history | Owner only |
| `loyaltyPoints` | Loyalty tier summary | Owner only |
| `customerTickets` | Customer support tickets | Owner + Admin |
| `returnRequests` | Return/RMA requests | Owner + Seller + Admin |
| `searchAnalytics` | Search query tracking | Admin only |
| `shipments` | Shipment records | Seller + Admin |
| `awbTracking` | Airway bill tracking | Public read |

---

## 8. Cloud Functions Reference

### HTTP Callable Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `sendServiceEmail` | HTTP Call | Send service enquiry emails to sellers |
| `sendOrderEmail` | HTTP Call | Send order-related emails (confirmation, updates) |
| `requestWithdrawal` | HTTP Call | Seller requests payout (min Rs.500, Rs.5 fee) |
| `processWithdrawal` | HTTP Call | Admin approves/rejects withdrawal |
| `getSellerWallet` | HTTP Call | Returns wallet balance, transactions, pending |
| `processRefund` | HTTP Call | Admin processes customer refund |

### Firestore Triggers

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onNewOrderPlaced` | orders/{orderId} create | Creates seller notification, decrements stock |
| `onOrderStatusUpdate` | orders/{orderId} update | Sends status email (shipped/delivered) |
| `updateSellerRatings` | reviews/{reviewId} write | Recalculates average rating (non-flagged) |
| `processOrderPayment` | orders/{orderId} update (delivered) | Credits seller wallet with commission deducted |
| `ensureAdminDocNormalized` | admins/{docId} write | Normalizes admin email to lowercase |

### Scheduled Functions (Pub/Sub Cron)

| Function | Schedule | Purpose |
|----------|----------|---------|
| `aggregateDailyMetrics` | 2:00 AM IST daily | Aggregates seller revenue, orders, peak hours |
| `calculateSellerPerformance` | 3:00 AM IST Sunday | Scores sellers (fulfillment 40%, rating 40%, response 20%) |
| `dailySettlementReport` | 6:00 AM IST daily | Platform-wide settlement reconciliation |

### Commission Rates (Implemented in payment-splits.js)

| Category | Commission Rate |
|----------|----------------|
| Electronics | 8% |
| Fashion | 12% |
| Groceries | 5% |
| Services | 15% |
| Beauty | 12% |
| Books | 6% |
| Jewelry | 10% |
| Sports | 10% |
| Toys | 12% |
| Automotive | 8% |
| Home | 10% |
| Default | 10% |

---

## 9. Security Rules Summary

### Lead Admin
- **Email:** rajkumarbalu81@gmail.com (full platform control)

### Access Control Model

| Role | Can Do |
|------|--------|
| **Public (Unauthenticated)** | Read products, categories, reviews, seller ratings, shared wishlists, promotions, flash sales, AWB tracking |
| **Buyer (Authenticated)** | Create orders, reviews, support tickets, return requests; read own data; participate in conversations |
| **Seller (Verified)** | Create/update own products, promotions; manage orders; read own analytics/wallet; request withdrawals |
| **Admin** | Full read/write on all collections; approve sellers, withdrawals, refunds; manage platform settings |

### Key Security Features
- Email normalization for case-insensitive admin verification
- Seller verification gating (only verified sellers can list products)
- Owner-only restrictions on profiles, wallets, notifications
- Cloud Functions-only writes for sensitive data (transactions, ratings, wallet)
- No direct client writes to financial collections

---

## 10. Full Configuration Guide

### 10.1 Firebase Project Setup

```
Project ID:     shop69-1
Region:         asia-south1 (Mumbai, India)
Hosting URL:    https://shop69-1.web.app
Console:        https://console.firebase.google.com/project/shop69-1/overview
```

**Firebase Services to Enable:**
1. Authentication → Email/Password + Google Sign-In
2. Cloud Firestore → asia-south1 region
3. Cloud Storage → Default bucket
4. Cloud Functions → Node.js 20
5. Firebase Hosting → Connect to dist/ folder
6. Cloud Messaging → For push notifications

### 10.2 Firebase Config (Client-Side)

Located in `dist/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "<YOUR_API_KEY>",
  authDomain: "shop69-1.firebaseapp.com",
  projectId: "shop69-1",
  storageBucket: "shop69-1.appspot.com",
  messagingSenderId: "<YOUR_SENDER_ID>",
  appId: "<YOUR_APP_ID>",
  measurementId: "<YOUR_MEASUREMENT_ID>"
};
```

**How to get these values:**
1. Go to Firebase Console → Project Settings → General
2. Under "Your apps", find the web app config
3. Copy values into `dist/firebase-config.js`

### 10.3 Firebase CLI Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting           # Frontend only
firebase deploy --only functions          # Cloud Functions only
firebase deploy --only firestore:rules    # Security rules only
firebase deploy --only firestore:indexes  # Indexes only
firebase deploy --only storage            # Storage rules only
```

### 10.4 Cloud Functions Configuration

**Dependencies (functions/package.json):**
```json
{
  "engines": { "node": "20" },
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.9.0",
    "nodemailer": "^6.9.8"
  }
}
```

**Runtime Configuration (Email SMTP):**

Option A - Firebase Runtime Config:
```bash
firebase functions:config:set mail.host="smtp.gmail.com"
firebase functions:config:set mail.port="587"
firebase functions:config:set mail.user="your-email@gmail.com"
firebase functions:config:set mail.pass="your-app-password"
firebase functions:config:set mail.from="69Shop <your-email@gmail.com>"
```

Option B - Encrypted Config File:
```bash
# Use the encryption script
node functions/scripts/encrypt-mail-config.js
# Stores encrypted config in functions/secrets/
```

**Gmail App Password Setup:**
1. Go to Google Account → Security → 2-Step Verification (enable)
2. Go to App Passwords → Generate new password
3. Select "Mail" and your device
4. Use the 16-character password in the config above

### 10.5 Razorpay Configuration

**Dashboard Setup:**
1. Create account at https://dashboard.razorpay.com
2. Complete KYC verification (2-3 business days)
3. Get API keys from Settings → API Keys

**Test Mode Keys:**
```
Key ID:     rzp_test_XXXXXXXXXX
Key Secret: XXXXXXXXXXXXXXXX
```

**Live Mode Keys (after KYC):**
```
Key ID:     rzp_live_XXXXXXXXXX
Key Secret: XXXXXXXXXXXXXXXX
```

**Store in Firebase:**
```bash
firebase functions:config:set razorpay.key_id="rzp_live_XXXXXXXXXX"
firebase functions:config:set razorpay.key_secret="XXXXXXXXXXXXXXXX"
```

**Webhook Setup (Razorpay Dashboard):**
- URL: `https://us-central1-shop69-1.cloudfunctions.net/razorpayWebhook`
- Events: `payment.captured`, `payment.failed`, `refund.processed`
- Secret: Generate and store securely

### 10.6 EmailJS Configuration (Client-Side Emails)

1. Create account at https://www.emailjs.com (200 emails/month free)
2. Add email service (Gmail recommended)
3. Create email templates:
   - `welcome_email` - New user welcome
   - `order_confirmation` - Order placed
   - `contact_form` - Contact enquiries
4. Get credentials:
   - Service ID: `service_XXXXXX`
   - Template IDs: `template_XXXXXX`
   - Public Key: `XXXXXXXXXXXXXX`

### 10.7 Firebase Cloud Messaging (Push Notifications)

1. Firebase Console → Project Settings → Cloud Messaging
2. Generate Web Push certificate (VAPID key)
3. Update `dist/firebase-messaging-sw.js` with your config
4. Update `dist/js/push-notifications.js` with VAPID key

### 10.8 Domain Configuration (69shop.in)

1. Firebase Console → Hosting → Add custom domain
2. Enter `69shop.in` and `www.69shop.in`
3. Add DNS records at your domain registrar:
   - Type A: `69shop.in` → Firebase IP addresses
   - Type CNAME: `www.69shop.in` → `shop69-1.web.app`
4. Wait for SSL certificate provisioning (automatic)

### 10.9 CORS Configuration

File: `cors.json`
```json
[
  {
    "origin": [
      "https://shop69-1.web.app",
      "https://69shop.in",
      "http://localhost:5000"
    ],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:
```bash
gsutil cors set cors.json gs://shop69-1.appspot.com
```

### 10.10 Local Development Setup

```bash
# Clone repository
git clone https://github.com/rajkumarbalu08/69shop.git
cd 69shop

# Install root dependencies
npm install

# Install function dependencies
cd functions && npm install && cd ..

# Start local server (for frontend)
npx http-server dist -p 4173

# Start Firebase emulators (optional)
firebase emulators:start

# Run E2E tests
npx playwright test
```

**Local Functions Config:**
Create `functions/.runtimeconfig.json`:
```json
{
  "mail": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "your-email@gmail.com",
    "pass": "your-app-password",
    "from": "69Shop <your-email@gmail.com>"
  },
  "razorpay": {
    "key_id": "rzp_test_XXXXXXXXXX",
    "key_secret": "XXXXXXXXXXXXXXXX"
  },
  "app": {
    "url": "http://localhost:4173"
  }
}
```

### 10.11 Environment Variables

| Variable | Where Used | Purpose |
|----------|-----------|---------|
| `E2E_BASE_URL` | playwright.config.js | Override test server URL |
| `mail.host` | Cloud Functions | SMTP server host |
| `mail.port` | Cloud Functions | SMTP port |
| `mail.user` | Cloud Functions | SMTP username |
| `mail.pass` | Cloud Functions | SMTP password |
| `mail.from` | Cloud Functions | Sender email address |
| `razorpay.key_id` | Cloud Functions | Razorpay API key |
| `razorpay.key_secret` | Cloud Functions | Razorpay secret |
| `app.url` | Cloud Functions | Application base URL |

### 10.12 Admin Account Setup

To create the first admin account in Firestore:

1. Go to Firebase Console → Firestore Database
2. Create collection: `admins`
3. Add document with ID = admin email (lowercase):

```json
{
  "email": "rajkumarbalu81@gmail.com",
  "role": "lead_admin",
  "name": "Admin Name",
  "createdAt": "<timestamp>",
  "isActive": true
}
```

4. The user must also exist in Firebase Authentication

---

## 11. Third-Party Integrations

### Currently Integrated

| Service | Status | Config Location |
|---------|--------|-----------------|
| Firebase (all services) | ACTIVE | firebase.json, .firebaserc |
| Razorpay SDK | SDK LOADED | dist/shop.html (script tag) |
| EmailJS | CONFIGURED | dist/js/ files |
| Gmail SMTP (Nodemailer) | DEPLOYED | functions/index.js |
| Font Awesome 6.4.0 | ACTIVE | CDN links in HTML |
| Google Fonts | ACTIVE | CDN links in HTML |
| jsPDF | ACTIVE | dist/js/invoice-generator.js |

### Awaiting Configuration

| Service | Purpose | Required Action |
|---------|---------|-----------------|
| Razorpay Live Mode | Accept real payments | Complete KYC verification |
| Google Analytics | Track user behavior | Add GA4 tracking code |
| Facebook Pixel | Ad conversion tracking | Add pixel code |

### Future Integrations (Not Yet Started)

| Service | Purpose | Priority |
|---------|---------|----------|
| Delhivery API | Shipping label generation & tracking | High |
| Shiprocket API | Multi-carrier shipping aggregation | High |
| WhatsApp Business API | Customer communication | High |
| MSG91 / Twilio | SMS OTP authentication | Medium |
| Algolia | Advanced search (alternative to current) | Medium |
| Tally / Zoho Books | Accounting integration | Medium |
| Sentry | Error monitoring | Medium |

---

## 12. Testing Summary

### Test Infrastructure

| Component | Detail |
|-----------|--------|
| Framework | Playwright |
| Browser | Chromium |
| Base URL | http://127.0.0.1:4173 |
| Timeout | 45 seconds |
| Retries | 0 |
| Screenshots | On failure |
| Video | Retained on failure |

### Test Results (February 14, 2026)

| Category | Tests | Result |
|----------|-------|--------|
| Navigation & Routing | 15 | PASS |
| Category Pages | 16 | PASS |
| Authentication | 15 | PASS |
| Search & Discovery | 8 | PASS |
| Product Browsing | 16 | PASS |
| Shopping Cart | 12 | PASS |
| Checkout Flow | 15 | PASS |
| Wishlist | 6 | PASS |
| User Profile | 20 | PASS |
| Services & Booking | 8 | PASS |
| Responsive Design | 10 | PASS |
| Accessibility | 7 | PASS |
| Performance | 5 | PASS |
| **TOTAL** | **193** | **100% PASS** |

### Internal Acceptance Testing (February 1, 2026)

- **Issues Found:** 21
- **Issues Fixed:** 21/21 (100% resolution)
- Critical: 2 fixed
- High: 7 fixed
- Medium: 8 fixed
- Low: 4 fixed

### Live Environment Testing (February 3, 2026)

- **Environment:** https://shop69-1.web.app
- **Result:** All sections passing
- Home, Shop, Profile, Services pages verified
- Mobile responsiveness confirmed for tested pages

---

## 13. Go-Live Checklist

### Must-Have (Before Launch)

- [ ] Complete Razorpay KYC verification
- [ ] Set up admin account in Firestore (`admins` collection)
- [ ] Configure DNS for 69shop.in domain
- [ ] Verify SSL certificate is active
- [ ] Create legal pages: Terms of Service, Privacy Policy, Shipping Policy, Refund Policy
- [ ] Test end-to-end order flow (browse → cart → checkout → payment → confirmation)
- [ ] Test seller registration → KYC submission → admin approval flow
- [ ] Verify email notifications are sending (order confirmation, shipped, delivered)
- [ ] Update CORS configuration with production domain
- [ ] Set Firebase functions runtime config for production email/Razorpay keys
- [ ] Deploy latest code: `firebase deploy`
- [ ] Verify all 50+ pages load without errors on production URL
- [ ] Test on at least 2 mobile devices (Android Chrome, iOS Safari)

### Should-Have (Within First Week)

- [ ] Set up Google Analytics GA4 tracking
- [ ] Set up error monitoring (Sentry or Firebase Crashlytics)
- [ ] Complete mobile bottom navigation on all remaining pages
- [ ] Test complete mobile responsiveness
- [ ] Add XSS input sanitization on all user input fields
- [ ] Review and test all Firestore security rules with actual user scenarios
- [ ] Set up automated database backups
- [ ] Verify scheduled Cloud Functions are running (check logs at 2 AM, 3 AM, 6 AM IST)

### Nice-to-Have (Within First Month)

- [ ] Implement customer review submission UI
- [ ] Complete order tracking timeline UI for sellers
- [ ] Modularize shop.html (9000+ lines → smaller modules)
- [ ] Implement image lazy loading across all pages
- [ ] Add meta tags and Open Graph data for SEO
- [ ] Set up Facebook Pixel for ad tracking
- [ ] Performance audit with Lighthouse

---

## 14. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Razorpay KYC not approved | Cannot accept live payments | Use COD (Cash on Delivery) initially |
| shop.html is 9000+ lines | Hard to maintain, slow load | Plan modularization post-launch |
| No build process / bundler | No minification, no tree-shaking | Files are loaded individually via CDN/static |
| Social media links (except Instagram) | Non-functional links in footer | Update with real social profiles |
| App download buttons | Show "Coming Soon" toast | No native app exists yet |
| localStorage + Firebase auth sync | Can desync between tabs | Refresh resolves; proper sync needed |
| No image CDN / optimization | Larger image file sizes | Consider Cloudinary or Firebase Extensions |
| Single region database | Higher latency outside India | Acceptable for India-only launch |
| No rate limiting on Cloud Functions | Potential abuse vector | Add rate limiting post-launch |
| Review frontend UI missing | No customer reviews visible | Backend ready; frontend needs building |

---

## 15. Cost Estimates

### Firebase (Monthly)

| Service | Free Tier | Estimated Cost (Post Free Tier) |
|---------|-----------|--------------------------------|
| Authentication | 10K users/month free | Free for typical usage |
| Firestore | 50K reads, 20K writes/day | Rs.2,000 - Rs.8,000/month at scale |
| Cloud Storage | 5GB free | Rs.500 - Rs.2,000/month |
| Cloud Functions | 2M invocations free | Rs.1,000 - Rs.5,000/month |
| Firebase Hosting | 10GB transfer/month free | Rs.500 - Rs.2,000/month |
| **Total Firebase** | | **Rs.0 - Rs.17,000/month** |

### Third-Party Services (Monthly)

| Service | Cost |
|---------|------|
| Razorpay | 2% per transaction (no monthly fee) |
| EmailJS | Free (200 emails/month) or Rs.800/month |
| Domain (69shop.in) | Rs.700 - Rs.1,500/year |
| **Total Third-Party** | **Rs.0 - Rs.2,000/month + transaction fees** |

### Projected Total: Rs.0 (launch) scaling to Rs.5,000-Rs.20,000/month with growth

---

## 16. Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | Razorpay KYC delays beyond launch | Medium | High | Launch with COD only, add payments when approved |
| 2 | Security vulnerability (XSS/injection) | Medium | Critical | Add input sanitization before launch |
| 3 | Firebase free tier exceeded | Low (initially) | Medium | Monitor usage, set budget alerts |
| 4 | shop.html performance degradation | Medium | Medium | Plan modularization sprint |
| 5 | Mobile UX issues on launch | High | High | Prioritize mobile testing on real devices |
| 6 | Email delivery failures | Low | Medium | Monitor email logs, add fallback provider |
| 7 | Data loss (no backups) | Low | Critical | Set up automated Firestore backups |

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-17 | 1.0 | Claude Code | Initial final document - comprehensive project summary |
| 2026-02-18 | 1.1 | Claude Code | Phase 3 enhancements - Referral program, Infinite scroll, Negotiation fix, UI consistency |

---

## Appendix A: Phase 3 Changes (2026-02-18)

### A.1 Referral Program — Login Integration

**Files Modified:** `dist/shop-login.html`

**What Changed:**
- Added `<script src="js/referral-program.js"></script>` after `xss-sanitizer.js`
- Added initialization IIFE that calls `ReferralProgram.init()` with Firebase `db` and `auth` instances, and `ReferralProgram.captureReferralFromUrl()` to store any `?ref=CODE` from invite links
- Modified the signup form handler to call `ReferralProgram.applyPendingReferral(result.user.uid)` after successful registration, so referred users are automatically linked to the referrer

**How It Works:**
1. User clicks an invite link like `69shop.in/shop-login.html?ref=ABC123`
2. `captureReferralFromUrl()` saves `ABC123` to `localStorage`
3. User completes signup
4. `applyPendingReferral()` creates a referral record in Firestore linking new user to referrer

---

### A.2 Infinite Scroll for Product Catalog

**Files Modified:** `dist/js/modules/product-manager.js`

**What Changed:**
- Added pagination state properties to `ProductManager` constructor: `pageSize=20`, `currentPage`, `isLoadingMore`, `hasMoreProducts`, `_scrollObserver`
- Rewrote `renderProducts()` to render only the first 20 products initially (instead of all at once)
- Added `loadMoreProducts()` method: slices next batch of 20 products, appends via `DocumentFragment` for efficient DOM insertion
- Added `appendScrollSentinel()` method: creates a spinner element at the bottom, uses `IntersectionObserver` with 200px `rootMargin` to trigger loading before user reaches the bottom

**How It Works:**
1. Shop page loads → first 20 products rendered
2. User scrolls down → sentinel div enters viewport (200px early)
3. `IntersectionObserver` triggers → next 20 products appended
4. Repeats until all filtered products are rendered
5. On filter/sort change, `renderProducts()` resets to page 1

---

### A.3 Negotiation Counter-Offer Fix (Buyer Chat)

**Files Modified:** `dist/messages.html`

**Bug:** When a seller sent a counter-offer, the buyer's chat (`messages.html`) failed to display the Accept/Counter/Reject action buttons because `renderProposalActions()` was called with an incomplete negotiation object missing `customerId`, `sellerId`, `roundCount`, `maxRounds`, and `currentOffer`. Additionally, action buttons appeared on EVERY seller proposal instead of only the most recent one.

**What Changed:**
1. Added `negotiationUnsubscribe` and `cachedNegotiationData` state variables
2. In `selectConversation()`: added real-time listener on the conversation's negotiation document (`negotiations/{id}`) to cache full negotiation data including all required fields
3. In `renderMessages()`: added pre-scan loop to find the index of the LAST pending seller proposal
4. Replaced the incomplete `renderProposalActions()` call with one that:
   - Only triggers on the LAST pending seller proposal (not all of them)
   - Passes the full cached negotiation object with all required fields
5. Added `negotiationUnsubscribe()` cleanup to the `beforeunload` handler

**Result:** Buyer now sees structured counter-offer cards with working Accept, Counter-Offer, and Reject buttons on the latest seller proposal only.

---

### A.4 Seller Verification Menu — Disabled State Fix

**Files Modified:** `dist/assets/css/seller-header.css`, `dist/seller-promotions.html`, `dist/seller-messages.html`

**Bug:** The "Verification" sidebar link remained visually clickable for verified sellers, even though `seller-shell.js` correctly added the `.disabled` class and removed the `href`. The CSS rule for `.nav-link.disabled` existed in `seller-dashboard.html` and `seller-analytics.html` but was missing from other seller pages.

**What Changed:**
1. Added `.nav-link.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }` to the shared `seller-header.css` stylesheet (included by all seller pages)
2. Added `data-verification-link` attribute to the verification nav links in `seller-promotions.html` and `seller-messages.html` (was missing, preventing `seller-shell.js` from finding and disabling them)

**Result:** Verified sellers now see a greyed-out, non-clickable Verification link across all seller pages.

---

### A.5 Logo Consistency Fix

**Files Modified:** `dist/assets/css/shop.css`, `dist/assets/css/profile.css`

**Bug:** Logo icon size, site-name font size/color, and tagline styling varied across pages:
- `shop.css`: Icon 50x70px, site-name 1.50rem in blue, tagline 0.75rem
- `profile.css`: Icon 48x60px, site-name 1.25rem, tagline 0.85rem
- `index.html`/`shop-login.html`: Icon 40x48px, site-name 1.2rem white, tagline 0.65rem uppercase

**What Changed:**
1. `shop.css`: Changed `.logo-icon` from 50x70 to 40x48px, `.site-name` from 1.50rem blue to 1.2rem white, `.tagline` from 0.75rem to 0.65rem with `text-transform: uppercase` and `letter-spacing: 0.1em`. Mobile tagline adjusted to 0.6rem.
2. `profile.css`: Changed `.logo-icon` from 48x60 to 40x48px, `.site-name` from 1.25rem to 1.2rem, `.tagline` from 0.85rem to 0.65rem with uppercase and letter-spacing.

**Standard:** All pages now use 40x48px icon, 1.2rem white Poppins site-name, 0.65rem uppercase tagline.

---

### A.6 Profile Icon/Button Audit

**Pages Checked:** `shop.html`, `product.html`, `services.html`, `messages.html`, `profile.html`

**Finding:** Each page has a context-appropriate header design:
- `shop.html`: Full profile sidebar with avatar, name, chevron dropdown
- `product.html`: Minimal header with Shop + Cart buttons
- `services.html`: Dynamic auth buttons (avatar when logged in, login button when not)
- `messages.html`: Simple avatar circle
- All pages: Mobile bottom nav consistently uses `fa-user` icon for Profile

**Result:** No changes needed — profile access is consistent and appropriate per page context.

---

*This document consolidates all project documentation into a single reference for the 69Shop.in pre-launch review.*
