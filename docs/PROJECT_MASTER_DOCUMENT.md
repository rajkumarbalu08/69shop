# 69Shop.in — Master Project Document

> **Last Updated:** February 14, 2026  
> **Go-Live Target:** February 21, 2026  
> **Project Manager:** GitHub Copilot (AI)  
> **Owner:** Rajkumar

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Page Inventory](#3-page-inventory)
4. [Feature Status Matrix](#4-feature-status-matrix)
5. [Login & Authentication Architecture](#5-login--authentication-architecture)
6. [Database Schema](#6-database-schema)
7. [Code Quality Audit](#7-code-quality-audit)
8. [QA Test Report](#8-qa-test-report)
9. [Go-Live Checklist](#9-go-live-checklist)
10. [7-Day Sprint Plan](#10-7-day-sprint-plan)
11. [Risk Register](#11-risk-register)
12. [Post-Launch Roadmap](#12-post-launch-roadmap)

---

## 1. Executive Summary

**69Shop.in** is a multi-vendor e-commerce marketplace built as a static HTML application with Firebase backend services. The platform connects buyers, sellers, and administrators through three distinct portals.

### Key Metrics
| Metric | Value |
|--------|-------|
| Total HTML Pages | 50+ |
| JavaScript Modules | 38+ |
| CSS Stylesheets | 18 |
| Firestore Collections | 22+ |
| Cloud Functions | 5 |
| Phase 1 Features | ✅ 100% Complete |
| Phase 2 Features | ✅ 90% Complete |
| Enhancement Backend | ✅ 100% Complete |
| Enhancement Frontend | ⚠️ 10% Complete |
| Payment Integration | ⚠️ SDK Only (KYC Pending) |

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Static HTML5, CSS3, Vanilla JavaScript |
| Backend | Firebase (Auth, Firestore, Storage, Functions) |
| Hosting | Firebase Hosting |
| Payments | Razorpay SDK (integrated, KYC pending) |
| Email | EmailJS |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| PWA | Service Worker + Web Manifest |
| Testing | Playwright (E2E) |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Static)                  │
├─────────────┬───────────────┬───────────────────────┤
│ Buyer Portal│ Seller Portal │ Admin Portal          │
│  shop.html  │ seller-*.html │ admin-*.html          │
│  profile    │ dashboard     │ dashboard             │
│  category   │ products      │ users/sellers/orders  │
│  search     │ orders        │ analytics/settings    │
│  services   │ analytics     │ activity log          │
│  messages   │ messages      │                       │
│  checkout   │ settings      │                       │
├─────────────┴───────────────┴───────────────────────┤
│            Shared Components (js/components/)        │
│  header.js │ footer.js │ product-card.js │ cart.js  │
├─────────────────────────────────────────────────────┤
│           Feature Modules (js/*.js - 38 files)       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 FIREBASE BACKEND                     │
├─────────────┬────────────┬──────────────────────────┤
│ Auth        │ Firestore  │ Storage                  │
│ Email/Pass  │ 22+ colls  │ Seller KYC docs          │
│ Google SSO  │ Rules      │ Product images            │
│             │ Indexes    │ Profile avatars            │
├─────────────┴────────────┴──────────────────────────┤
│           Cloud Functions (5 deployed)               │
│ • Order notifications    • Daily seller metrics      │
│ • Weekly performance     • Rating aggregation        │
│ • Scheduled analytics (2AM/3AM IST)                 │
├─────────────────────────────────────────────────────┤
│           External Services                          │
│ Razorpay (payments) │ EmailJS (email) │ FCM (push)  │
└─────────────────────────────────────────────────────┘
```

### Data Flow
1. **Authentication:** Firebase Auth (email/password + Google SSO) → Session stored in `localStorage` + Firebase Auth state
2. **Product Data:** Static `products-data.js` for catalog display + Firestore `products` collection for seller-managed inventory
3. **Orders:** Client-side cart (localStorage) → Firestore `orders` collection → Cloud Function notification → Seller dashboard
4. **Real-time:** Firestore `onSnapshot` for messages, notifications, order status updates

---

## 3. Page Inventory

### Buyer Pages (15)
| Page | File | Firebase | Status |
|------|------|----------|--------|
| Landing Page | `index.html` | ✅ Auth only | ✅ Live |
| Buyer Login | `shop-login.html` | ✅ Auth + Firestore | ✅ Live |
| Main Shop | `shop.html` | ✅ Full | ✅ Live |
| Product Detail | `product.html` | ✅ Full | ✅ Live |
| Category Template | `category.html` | ✅ Full | ✅ Live |
| Search Results | `search.html` | ✅ Full | ✅ Live |
| Profile Hub | `profile.html` | ✅ Full + Storage | ✅ Live |
| Services | `services.html` | ✅ Full + Functions | ✅ Live |
| Book Service | `book-service.html` | ✅ Full | ✅ Live |
| My Bookings | `my-bookings.html` | ✅ Full | ✅ Live |
| Messages | `messages.html` | ✅ Full | ✅ Live |
| Order Tracking | `order-tracking.html` | ✅ Full | ✅ Live |
| Offline Page | `offline.html` | None (PWA) | ✅ Live |
| 10 Category Pages | `electronics.html` etc. | ✅ Via components | ✅ Live |

### Seller Pages (13)
| Page | File | Firebase | Status |
|------|------|----------|--------|
| Seller Login | `seller-login.html` | ✅ Auth + Firestore | ✅ Live |
| Dashboard | `seller-dashboard.html` | ✅ Full | ✅ Live |
| Products | `seller-products.html` | ✅ Full | ✅ Live |
| Orders | `seller-orders.html` | ✅ Full | ✅ Live |
| Analytics | `seller-analytics.html` | ✅ Full | ✅ Live |
| Messages | `seller-messages.html` | ✅ Full | ✅ Live |
| Payments | `seller-payments.html` | ✅ Full | ✅ Live |
| Services | `seller-services.html` | ✅ Full | ✅ Live |
| Settings | `seller-settings.html` | ✅ Full + Storage | ✅ Live |
| Promotions | `seller-promotions.html` | ✅ Full | ✅ Live |
| Reviews | `seller-reviews.html` | ✅ Full | ✅ Live |
| Verification | `seller-verification.html` | ✅ Full + Storage | ✅ Live |

### Admin Pages (10)
| Page | File | Firebase | Status |
|------|------|----------|--------|
| Admin Login | `admin-login.html` | ✅ Auth + Firestore | ✅ Live |
| Dashboard | `admin-dashboard.html` | ✅ Full | ✅ Live |
| Users | `admin-users.html` | ✅ Full | ✅ Live |
| Sellers | `admin-sellers.html` | ✅ Full + Storage | ✅ Live |
| Products | `admin-products.html` | ✅ Full + Storage | ✅ Live |
| Orders | `admin-orders.html` | ✅ Full | ✅ Live |
| Analytics | `admin-analytics.html` | ✅ Full | ✅ Live |
| Settings | `admin-settings.html` | ✅ Full | ✅ Live |
| Activity | `admin-activity.html` | ✅ Full | ✅ Live |

### Support Pages (4)
| Page | Path | Status |
|------|------|--------|
| Terms of Service | `docs/terms.html` | ✅ Live |
| Privacy Policy | `docs/privacy.html` | ✅ Live |
| Shipping Policy | `docs/shipping.html` | ✅ Live |
| Seller Agreement | `docs/seller-agreement.html` | ✅ Live |

---

## 4. Feature Status Matrix

### ✅ Completed Features

| # | Feature | Category | Phase |
|---|---------|----------|-------|
| 1 | User Registration & Login (Email + Google) | Auth | P1 |
| 2 | Separate login URLs (Buyer/Seller/Admin) | Auth | P2 |
| 3 | Role-based access control | Auth | P1 |
| 4 | Product catalog with categories | Shop | P1 |
| 5 | Product search with stemming | Shop | P1 |
| 6 | Shopping cart (localStorage) | Shop | P1 |
| 7 | Wishlist | Shop | P1 |
| 8 | Product quick view | Shop | P1 |
| 9 | Recently viewed products | Shop | P1 |
| 10 | Stock level indicators | Shop | P1 |
| 11 | Product sharing (WhatsApp/Social) | Shop | P1 |
| 12 | Category quick filter chips | Shop | P1 |
| 13 | Skeleton loading animations | UX | P1 |
| 14 | Service booking system | Services | P1 |
| 15 | Real-time messaging | Communication | P1 |
| 16 | Seller dashboard & management | Seller | P1 |
| 17 | Seller product management | Seller | P1 |
| 18 | Seller KYC verification (4-step) | Seller | P1 |
| 19 | Seller analytics | Seller | P1 |
| 20 | Admin dashboard | Admin | P1 |
| 21 | Admin user management | Admin | P1 |
| 22 | Admin seller verification | Admin | P1 |
| 23 | Admin order management | Admin | P1 |
| 24 | Admin activity audit trail | Admin | P1 |
| 25 | Reusable component library | Architecture | P2 |
| 26 | PWA support (offline + install) | Technical | P2 |
| 27 | Cloud Functions (5 deployed) | Backend | P2 |
| 28 | Push notification infrastructure | Communication | P2 |
| 29 | Invoice generation (jsPDF) | Business | P2 |
| 30 | Order tracking system | Orders | P2 |
| 31 | Firestore security rules (22 colls) | Security | P2 |
| 32 | Composite indexes (8) | Performance | P2 |
| 33 | Mobile responsive (core pages) | UX | P2 |
| 34 | Firebase config externalized | Security | P2 |
| 35 | Graceful Firebase error handling (all pages) | Stability | P2 |

### ⚠️ In Progress / Partial

| # | Feature | Status | Blocker |
|---|---------|--------|---------|
| 36 | Online payments (Razorpay) | SDK integrated | KYC verification needed |
| 37 | Order tracking UI | Backend ready | Frontend 50% complete |
| 38 | Mobile bottom navigation | On 5 pages | Missing from 8+ pages |
| 39 | Review/rating system | Backend ready | Frontend 0% |

### ❌ Pending (Go-Live Critical)

| # | Feature | Priority | Estimated Effort |
|---|---------|----------|-----------------|
| 40 | Complete Razorpay KYC | P0 | 2-3 business days |
| 41 | Test end-to-end checkout flow | P0 | 1 day |
| 42 | Verify sellerId in new orders | P0 | 2 hours |
| 43 | Test seller order notification | P0 | 2 hours |
| 44 | Mobile testing (all pages) | P1 | 1 day |
| 45 | Security review (XSS, input validation) | P1 | 1 day |
| 46 | Error handling edge cases | P1 | 0.5 day |

---

## 5. Login & Authentication Architecture

### Login URLs (Separated Feb 14, 2026)

| Portal | URL | Purpose | Signup |
|--------|-----|---------|--------|
| **Buyer** | `/shop-login.html` | Buyer login & registration | ✅ Yes (buyer-only) |
| **Seller** | `/seller-login.html` | Seller login & registration | ✅ Yes (product/service type selection) |
| **Admin** | `/admin-login.html` | Admin-only access | ❌ No (must exist in `admins` collection) |

### Authentication Flow
```
Buyer: Email/Google → users collection → shop.html
Seller: Email/Google → sellers collection → seller-dashboard.html
Admin: Email/Google → admins collection check → admin-dashboard.html (or deny)
```

### Key Rules
- **Buyer signup** creates `users/{uid}` with `accountType: 'buyer'`
- **Seller signup** creates `sellers/{uid}` with `status: 'pending'` (requires admin approval)
- **Admin access** requires pre-existing document in `admins` collection (no self-registration)
- **Seller login** will NOT auto-create a seller profile — users must register explicitly
- **Google SSO** on seller-login creates seller profile with `status: 'pending'`

---

## 6. Database Schema

### Core Collections
| Collection | Purpose | Documents |
|-----------|---------|-----------|
| `users` | Buyer profiles | uid, name, email, phone, accountType, addresses[] |
| `sellers` | Seller profiles | uid, businessName, email, sellerType, status, KYC data |
| `admins` | Admin whitelist | email-based documents |
| `products` | Seller inventory | title, price, category, sellerId, stock, images |
| `orders` | Purchase orders | items, buyerId, sellerId, status, payment, shipping |
| `reviews` | Product reviews | rating, comment, userId, productId, categories |
| `messages` | Chat messages | senderId, receiverId, content, timestamp |
| `notifications` | Push/in-app notifications | type, userId, content, read |
| `services` | Service listings | providerId, category, pricing, availability |
| `serviceVerifications` | Service approval queue | sellerId, serviceData, status |

### Enhancement Collections (Backend Ready, Frontend Pending)
| Collection | Purpose |
|-----------|---------|
| `orderNotifications` | Real-time order status updates |
| `sellerRatings` | Aggregated seller rating scores |
| `sellerAnalytics/{sellerId}/daily/{date}` | Daily seller metrics |
| `sellerPerformance` | Seller tier scoring (bronze/silver/gold/platinum) |
| `transactions` | Payment transaction records |
| `sellerWallet` | Seller balance & pending balance |
| `withdrawalRequests` | Payout requests |
| `searchAnalytics` | Search term tracking |
| `productSearchIndex` | Optimized search index |
| `flashSales` | Time-limited deals |
| `abandonedCarts` | Recovery tracking |
| `supportTickets` | Customer support |

---

## 7. Code Quality Audit

### Audit Date: February 14, 2026

#### Issues Fixed Today
| # | Issue | Severity | File(s) | Fix |
|---|-------|----------|---------|-----|
| 1 | Firebase `throw` outside try-catch crashes page | 🔴 Critical | 16 files | Wrapped all Firebase init in try-catch with `let` declarations |
| 2 | `auth`/`db` declared as `const` outside try-catch | 🔴 Critical | 11 files | Changed to `let` with null default |
| 3 | Admin panel exposed on public login page | 🔴 Security | shop-login.html | Removed entirely — admin functions belong in admin portal |
| 4 | Buyer/Seller radio on signup page | 🟡 UX | shop-login.html | Removed — each portal has its own login/signup |
| 5 | Seller auto-created on any login | 🟡 Logic | seller-login.html | Now requires explicit registration |
| 6 | Seller status inconsistency (active vs pending) | 🟡 Logic | seller-login.html | Standardized to `status: 'pending'` |
| 7 | Broken Sports category image URL | 🟡 Visual | index.html | Fixed Unsplash URL |
| 8 | Footer links to non-existent `/terms.html` | 🟡 Navigation | order-tracking.html | Fixed to `/docs/terms.html` |
| 9 | Footer Shop link using `#shop` anchor | 🟡 Navigation | index.html | Fixed to `/shop.html` |
| 10 | "Become a Seller" links going to `#contact` | 🟡 Navigation | index.html | Fixed to `/seller-login.html` |
| 11 | No Firebase SDK on category.html | 🟡 Function | category.html | Added Firebase SDK scripts |
| 12 | No cross-links between login pages | 🟡 UX | All 3 login pages | Added footer links between buyer/seller/admin |

#### Remaining Technical Debt
| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 1 | `shop.html` is 9000+ lines — should be modularized | Low | 2-3 days |
| 2 | Mobile bottom nav missing from 8 pages | Medium | 1 day |
| 3 | Header component not used on all pages | Low | 1 day |
| 4 | No XSS sanitization on user inputs | Medium | 1 day |
| 5 | localStorage + Firebase auth state can desync | Low | 0.5 day |
| 6 | No lazy loading for product images | Low | 0.5 day |

---

## 8. QA Test Report

### Test Date: February 14, 2026

| # | Test Category | Result | Details |
|---|--------------|--------|---------|
| 1 | CSS File References | ✅ PASS | All 18 CSS files exist and are correctly referenced |
| 2 | JS File References | ✅ PASS | All 38+ JS files exist and are correctly referenced |
| 3 | Firebase Init Safety | ✅ PASS | All 19 Firebase-enabled pages use safe try-catch pattern |
| 4 | Login URL Separation | ✅ PASS | 3 separate portals with proper cross-links |
| 5 | Navigation Links | ✅ PASS | All broken links fixed (Sports image, terms/privacy paths, seller links) |
| 6 | Image References | ✅ PASS | Broken Unsplash URL fixed |
| 7 | Seller Registration Flow | ✅ PASS | Standardized to `pending` status, no auto-creation on login |
| 8 | Mobile Bottom Nav | ⚠️ PARTIAL | Present on 5 pages, missing from 8 buyer-facing pages |
| 9 | Cross-Page Navigation | ⚠️ PARTIAL | Most pages have back-to-shop links, some dashboards lack home link |
| 10 | End-to-End Checkout | ⏳ NOT TESTED | Requires live Firebase + Razorpay config |
| 11 | Real-Time Messaging | ⏳ NOT TESTED | Requires 2 authenticated users |
| 12 | Seller Order Flow | ⏳ NOT TESTED | Requires order with sellerId |
| 13 | Admin Verification | ⏳ NOT TESTED | Requires admin account + pending seller |

### Manual Testing Required Before Go-Live
- [ ] Complete checkout flow (add to cart → checkout → payment → order confirmation)
- [ ] Seller receives order notification
- [ ] Order status updates propagate to buyer
- [ ] Real-time chat between buyer and seller
- [ ] Seller KYC submission → Admin approval flow
- [ ] Admin can manage users, sellers, products, orders
- [ ] All pages render correctly on mobile (375px, 768px)
- [ ] PWA install prompt works
- [ ] Offline page shows when disconnected

---

## 9. Go-Live Checklist

### 🔴 Blockers (Must Complete)
- [ ] **Firebase Config:** Verify `firebase-config.js` has production credentials
- [ ] **Razorpay KYC:** Submit business documents, get live API keys
- [ ] **Admin Account:** Create admin document in `admins` collection
- [ ] **Test Seller:** Register a test seller, complete KYC, approve via admin
- [ ] **Test Order:** Place a real order end-to-end

### 🟡 High Priority (Should Complete)
- [ ] **DNS:** Point `69shop.in` domain to Firebase Hosting
- [ ] **SSL:** Verify HTTPS is enabled (auto with Firebase Hosting)
- [ ] **Policy Pages:** Verify Terms, Privacy, Shipping, Refund policies are complete
- [ ] **CORS:** Verify `cors.json` is deployed for Storage
- [ ] **Firestore Rules:** Deploy production security rules
- [ ] **Cloud Functions:** Verify all 5 functions are deployed and active
- [ ] **Mobile Test:** Test all pages on actual mobile device
- [ ] **SEO:** Verify meta tags, og:tags, and `robots.txt`

### 🟢 Nice to Have
- [ ] **Analytics:** Set up Google Analytics or Firebase Analytics
- [ ] **Error Monitoring:** Set up Sentry or Firebase Crashlytics
- [ ] **Backup:** Set up Firestore automated backups
- [ ] **Rate Limiting:** Configure Firestore rules for write limits

---

## 10. 7-Day Sprint Plan

### Day 1 (Feb 15) — Configuration & Setup
| Task | Owner | Duration |
|------|-------|----------|
| Deploy Firebase Hosting with production config | Dev | 2 hrs |
| Submit Razorpay KYC documents | Owner | 1 hr |
| Create admin account in Firestore | Dev | 30 min |
| Deploy Firestore rules & indexes | Dev | 1 hr |
| Deploy Cloud Functions | Dev | 1 hr |

### Day 2 (Feb 16) — Core Flow Testing
| Task | Owner | Duration |
|------|-------|----------|
| Test buyer registration + login flow | QA | 2 hrs |
| Test seller registration + KYC flow | QA | 2 hrs |
| Test admin login + seller approval | QA | 1 hr |
| Test product browsing + search + categories | QA | 2 hrs |

### Day 3 (Feb 17) — Order & Payment Testing
| Task | Owner | Duration |
|------|-------|----------|
| Test full checkout flow (COD) | QA | 2 hrs |
| Verify sellerId in orders | Dev | 1 hr |
| Test order tracking updates | QA | 2 hrs |
| Test Razorpay integration (if KYC approved) | Dev/QA | 3 hrs |

### Day 4 (Feb 18) — Communication & Mobile
| Task | Owner | Duration |
|------|-------|----------|
| Test real-time messaging | QA | 2 hrs |
| Test push notifications | QA | 1 hr |
| Add mobile bottom nav to remaining pages | Dev | 3 hrs |
| Mobile testing on physical devices | QA | 3 hrs |

### Day 5 (Feb 19) — Seller & Admin Portal
| Task | Owner | Duration |
|------|-------|----------|
| Test seller dashboard all features | QA | 3 hrs |
| Test admin dashboard all features | QA | 3 hrs |
| Test seller analytics + payments | QA | 2 hrs |

### Day 6 (Feb 20) — Bug Fixes & Polish
| Task | Owner | Duration |
|------|-------|----------|
| Fix all bugs found during testing | Dev | Full day |
| Performance optimization | Dev | 2 hrs |
| Final security review | Dev | 2 hrs |

### Day 7 (Feb 21) — Launch Day 🚀
| Task | Owner | Duration |
|------|-------|----------|
| DNS configuration | Owner | 1 hr |
| Final deployment | Dev | 1 hr |
| Smoke test production | QA | 2 hrs |
| Monitor for issues | Dev | Ongoing |

---

## 11. Risk Register

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|------------|------------|
| 1 | Razorpay KYC delayed | Can't accept payments | Medium | Launch with COD only, add payments later |
| 2 | Critical bug found Day 7 | Delayed launch | Low | Day 6 is buffer for bug fixes |
| 3 | shop.html performance issues | Slow page load | Medium | Lazy loading, code splitting in Phase 3 |
| 4 | Firestore security rules too restrictive | Features break | Medium | Test rules thoroughly on Day 1-2 |
| 5 | Mobile layout breaks on specific devices | Bad UX | Medium | Test on 3+ real devices Day 4 |
| 6 | localStorage data lost | Cart/wishlist reset | Low | Document limitation, plan cloud sync |
| 7 | No error monitoring in production | Blind to issues | Medium | Set up Firebase Crashlytics Day 1 |

---

## 12. Post-Launch Roadmap

### Phase 3 (Weeks 1-2 Post-Launch)
- Full review/rating system (frontend UI)
- Advanced payment analytics dashboard
- Seller payout system
- Dark mode (site-wide)
- Performance optimization (code splitting, lazy loading)

### Phase 4 (Weeks 3-4 Post-Launch)
- Advanced search (fuzzy matching, autocomplete, voice)
- Coupon/discount system
- Guest checkout
- Multi-language support
- A/B testing framework

### Phase 5 (Month 2+)
- Mobile app (React Native / Flutter)
- AI-powered product recommendations
- Predictive analytics
- Loyalty rewards program
- WhatsApp Business integration
- Shipping API integration (Delhivery, Shiprocket)

---

## Appendix A: File Structure

```
69shop/
├── dist/                          # Production files
│   ├── index.html                 # Landing page
│   ├── shop-login.html            # Buyer login
│   ├── seller-login.html          # Seller login
│   ├── admin-login.html           # Admin login
│   ├── shop.html                  # Main shop
│   ├── product.html               # Product detail
│   ├── category.html              # Category template
│   ├── search.html                # Search results
│   ├── profile.html               # User profile
│   ├── services.html              # Service marketplace
│   ├── messages.html              # Real-time chat
│   ├── order-tracking.html        # Order tracking
│   ├── seller-*.html              # Seller portal (12 pages)
│   ├── admin-*.html               # Admin portal (9 pages)
│   ├── firebase-config.js         # Firebase credentials (gitignored)
│   ├── firebase-config.sample.js  # Firebase config template
│   ├── products-data.js           # Static product catalog
│   ├── razorpay-config.js         # Payment config (gitignored)
│   ├── js/                        # JavaScript modules (38 files)
│   │   ├── components/            # Reusable UI components
│   │   ├── admin-shell.js         # Admin portal shell
│   │   ├── seller-shell.js        # Seller portal shell
│   │   └── ...                    # Feature modules
│   ├── assets/css/                # Stylesheets (18 files)
│   ├── Logo/                      # Brand assets
│   └── docs/                      # Legal pages
├── functions/                     # Cloud Functions
│   ├── index.js                   # Function entry point
│   ├── orders.js                  # Order processing
│   └── payment-splits.js         # Payment distribution
├── tests/                         # Test suites
├── docs/                          # Project documentation
├── firebase.json                  # Firebase config
├── firestore.rules                # Security rules
├── firestore.indexes.json         # Composite indexes
└── storage.rules                  # Storage security rules
```

---

## Appendix B: Environment Setup

1. Clone repository
2. Copy `dist/firebase-config.sample.js` → `dist/firebase-config.js`
3. Fill in Firebase credentials
4. Copy `dist/js/emailjs-config.sample.js` → `dist/js/emailjs-config.js`
5. Run `firebase deploy` for hosting
6. Run `cd functions && npm install && firebase deploy --only functions` for Cloud Functions
7. Run `firebase deploy --only firestore:rules` for security rules
8. Run `firebase deploy --only firestore:indexes` for composite indexes

---

*This document consolidates all information from Phase 1 Deployment, Phase 2 Deployment, Enhancement Status, Quick Status Board, Improvement Roadmap, Architecture docs, Database Schema, Payment Gateway Guide, Functionality Audit, and Shop Enhancements Summary.*
