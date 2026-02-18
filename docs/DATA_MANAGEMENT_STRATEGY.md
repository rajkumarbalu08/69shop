# 69Shop.in Data Management Strategy

> **Version:** 1.0  
> **Last Updated:** February 1, 2026  
> **Status:** Implementation Guide

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Firestore Database Schema](#firestore-database-schema)
3. [Phase 1: Foundation](#phase-1-foundation-current)
4. [Phase 2: Seller Ecosystem](#phase-2-seller-ecosystem)
5. [Phase 3: Advanced Features](#phase-3-advanced-features)
6. [Security Rules](#security-rules)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [API Endpoints](#api-endpoints)

---

## Architecture Overview

### Technology Stack
- **Frontend:** Static HTML/CSS/JS (no build process)
- **Backend:** Firebase (Firestore, Auth, Cloud Functions, Hosting)
- **Payments:** Razorpay Integration
- **Email:** EmailJS for transactional emails

### Key Principles
1. **Serverless First:** Leverage Firebase services to minimize infrastructure
2. **Real-time Updates:** Use Firestore listeners for live data
3. **Security by Default:** Strict Firestore rules, role-based access
4. **Scalable Design:** Schema supports multi-vendor marketplace growth

---

## Firestore Database Schema

### Collections Overview

```
firestore/
├── users/                 # All registered users (buyers, sellers, admins)
├── sellers/               # Seller-specific business data
├── products/              # Product catalog
├── orders/                # Order transactions
├── offers/                # Seller promotions and deals
├── reviews/               # Product and seller reviews
├── loyalty_transactions/  # Points earned/redeemed
├── notifications/         # User notifications
├── categories/            # Product category metadata
└── settings/              # Platform configuration
```

### Detailed Schema

#### 1. Users Collection (`/users/{userId}`)

```javascript
{
  // Basic Info
  uid: string,                    // Firebase Auth UID
  email: string,
  displayName: string,
  phone: string,
  avatar: string,                 // URL to profile image
  
  // Role & Status
  role: 'buyer' | 'seller' | 'admin',
  status: 'active' | 'suspended' | 'pending',
  emailVerified: boolean,
  phoneVerified: boolean,
  
  // Addresses (subcollection or embedded)
  addresses: [
    {
      id: string,
      label: 'home' | 'work' | 'other',
      name: string,
      phone: string,
      line1: string,
      line2: string,
      city: string,
      state: string,
      pincode: string,
      isDefault: boolean
    }
  ],
  
  // Loyalty
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum',
  loyaltyPoints: number,
  lifetimePoints: number,
  
  // Preferences
  wishlist: string[],             // Array of productIds
  recentlyViewed: string[],       // Last 20 productIds
  notifications: {
    email: boolean,
    push: boolean,
    sms: boolean
  },
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

#### 2. Sellers Collection (`/sellers/{sellerId}`)

```javascript
{
  // Linked User
  userId: string,                 // Reference to users collection
  
  // Business Info
  businessName: string,
  businessType: 'individual' | 'company' | 'partnership',
  gstin: string,
  pan: string,
  category: string[],             // Primary selling categories
  
  // Contact
  businessEmail: string,
  businessPhone: string,
  businessAddress: {
    line1: string,
    line2: string,
    city: string,
    state: string,
    pincode: string
  },
  
  // Verification & Status
  status: 'pending' | 'approved' | 'rejected' | 'suspended',
  verificationDocuments: [
    {
      type: 'gstin' | 'pan' | 'address_proof' | 'bank_statement',
      url: string,
      verified: boolean,
      verifiedAt: timestamp
    }
  ],
  
  // Performance Metrics
  rating: number,                 // Average rating (1-5)
  totalReviews: number,
  totalProducts: number,
  totalOrders: number,
  totalRevenue: number,
  
  // Financial
  commissionRate: number,         // Platform commission (e.g., 0.10 = 10%)
  payoutDetails: {
    accountName: string,
    accountNumber: string,
    ifscCode: string,
    bankName: string
  },
  pendingPayout: number,
  
  // Settings
  autoAcceptOrders: boolean,
  vacationMode: boolean,
  vacationMessage: string,
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  approvedAt: timestamp,
  approvedBy: string              // Admin userId
}
```

#### 3. Products Collection (`/products/{productId}`)

```javascript
{
  // Seller Info
  sellerId: string,
  sellerName: string,             // Denormalized for display
  
  // Product Details
  name: string,
  slug: string,                   // URL-friendly name
  description: string,
  shortDescription: string,
  
  // Pricing
  price: number,                  // Selling price
  mrp: number,                    // Maximum retail price
  discount: number,               // Percentage discount
  
  // Categorization
  category: string,               // Primary category
  subcategory: string,
  tags: string[],
  
  // Media
  images: string[],               // Array of image URLs
  thumbnail: string,              // Primary display image
  videos: string[],               // Product video URLs
  
  // Inventory
  stock: number,
  lowStockThreshold: number,
  sku: string,
  
  // Variants (if applicable)
  hasVariants: boolean,
  variants: [
    {
      id: string,
      name: string,               // e.g., "Size", "Color"
      options: [
        {
          value: string,          // e.g., "Large", "Red"
          price: number,
          stock: number,
          sku: string
        }
      ]
    }
  ],
  
  // Specifications
  specifications: {
    brand: string,
    weight: string,
    dimensions: string,
    material: string,
    // ... category-specific specs
  },
  
  // SEO
  metaTitle: string,
  metaDescription: string,
  
  // Status
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'out_of_stock',
  featured: boolean,
  trending: boolean,
  
  // Metrics
  views: number,
  sales: number,
  rating: number,
  reviewCount: number,
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp
}
```

#### 4. Orders Collection (`/orders/{orderId}`)

```javascript
{
  // Order ID
  orderId: string,                // Human-readable ID (e.g., "69S-20260201-XXXX")
  
  // Parties
  buyerId: string,
  buyerName: string,
  buyerEmail: string,
  buyerPhone: string,
  
  sellerId: string,
  sellerName: string,
  
  // Items
  items: [
    {
      productId: string,
      name: string,
      image: string,
      variant: string,
      quantity: number,
      price: number,
      total: number
    }
  ],
  
  // Pricing
  subtotal: number,
  discount: number,
  discountCode: string,
  shippingCost: number,
  tax: number,
  total: number,
  
  // Loyalty
  pointsEarned: number,
  pointsRedeemed: number,
  pointsValue: number,            // Rupee value of redeemed points
  
  // Shipping
  shippingAddress: {
    name: string,
    phone: string,
    line1: string,
    line2: string,
    city: string,
    state: string,
    pincode: string
  },
  shippingMethod: string,
  trackingNumber: string,
  trackingUrl: string,
  
  // Status
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned',
  statusHistory: [
    {
      status: string,
      timestamp: timestamp,
      note: string,
      updatedBy: string
    }
  ],
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  paymentMethod: 'cod' | 'razorpay' | 'upi',
  paymentId: string,              // Razorpay payment ID
  
  // Review
  reviewed: boolean,
  reviewId: string,
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  confirmedAt: timestamp,
  shippedAt: timestamp,
  deliveredAt: timestamp
}
```

#### 5. Offers Collection (`/offers/{offerId}`)

```javascript
{
  // Seller
  sellerId: string,
  sellerName: string,
  
  // Offer Details
  name: string,
  description: string,
  type: 'percentage' | 'flat' | 'bogo' | 'bundle' | 'flash',
  
  // Discount Configuration
  discountValue: number,          // Percentage or flat amount
  maxDiscount: number,            // Cap for percentage discounts
  minOrderValue: number,          // Minimum cart value
  
  // Targeting
  targetType: 'all' | 'products' | 'category',
  targetProducts: string[],       // Product IDs
  targetCategory: string,
  
  // Usage Limits
  usageLimit: number,             // Total uses allowed
  usageCount: number,             // Current usage
  perUserLimit: number,           // Max uses per user
  
  // Validity
  startDate: timestamp,
  endDate: timestamp,
  isActive: boolean,
  
  // Coupon Code (optional)
  couponCode: string,
  couponRequired: boolean,
  
  // Performance
  totalRedemptions: number,
  totalRevenue: number,
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 6. Reviews Collection (`/reviews/{reviewId}`)

```javascript
{
  // References
  productId: string,
  productName: string,
  sellerId: string,
  orderId: string,
  
  // Reviewer
  reviewerId: string,
  reviewerName: string,
  reviewerAvatar: string,
  verified: boolean,              // Verified purchase
  
  // Content
  rating: number,                 // 1-5 stars
  title: string,
  text: string,
  photos: string[],
  
  // Category Ratings (optional)
  categories: {
    quality: number,
    value: number,
    shipping: number,
    packaging: number
  },
  
  // Engagement
  helpful: number,                // Helpful votes
  helpfulBy: string[],            // User IDs who found helpful
  
  // Moderation
  flagged: boolean,
  flagReason: string,
  status: 'pending' | 'approved' | 'rejected',
  
  // Seller Response
  sellerResponse: {
    text: string,
    respondedAt: timestamp
  },
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 7. Loyalty Transactions (`/loyalty_transactions/{transactionId}`)

```javascript
{
  userId: string,
  
  // Transaction Type
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment',
  
  // Amount
  points: number,                 // Positive for earned, negative for redeemed
  balanceAfter: number,
  
  // Source
  source: 'purchase' | 'review' | 'referral' | 'birthday' | 'promo' | 'admin',
  orderId: string,                // If from purchase
  description: string,
  
  // Timestamps
  createdAt: timestamp,
  expiresAt: timestamp            // For earned points (typically 1 year)
}
```

#### 8. Notifications Collection (`/notifications/{userId}/items/{notificationId}`)

```javascript
{
  type: 'order' | 'promo' | 'review' | 'system' | 'loyalty',
  title: string,
  message: string,
  icon: string,
  
  // Action
  actionUrl: string,
  actionText: string,
  
  // Status
  read: boolean,
  readAt: timestamp,
  
  // Timestamps
  createdAt: timestamp
}
```

---

## Phase 1: Foundation (Current)

### ✅ Completed Features

| Feature | Status | Location |
|---------|--------|----------|
| Product display & browsing | ✅ Complete | `shop.html`, category pages |
| User authentication | ✅ Complete | `shop-login.html` |
| Basic cart & checkout | ✅ Complete | `shop.html` |
| Product reviews | ✅ Complete | `product.html` |
| Wishlist | ✅ Complete | Profile page |
| Order history | ✅ Complete | Profile page |

### 🔧 Configuration Required

1. **Firebase Config:** Create `dist/firebase-config.js` from sample
2. **Razorpay Config:** Create `dist/razorpay-config.js` for payments
3. **EmailJS Config:** Configure email service credentials

---

## Phase 2: Seller Ecosystem

### 2.1 Seller Registration Flow

```
User Signs Up → Selects "Seller" Role → 
  → Completes Business Details Form →
    → Uploads Verification Documents →
      → Status: "Pending" →
        → Admin Reviews Application →
          → Approved: Access Seller Dashboard
          → Rejected: Email with reason
```

**Implementation Files:**
- `dist/seller-register.html` - Registration form
- `dist/seller-pending.html` - Awaiting approval page
- `functions/index.js` - Cloud function for admin notifications

### 2.2 Seller Dashboard

**Dashboard Sections:**

1. **Overview**
   - Today's orders, revenue, views
   - Performance charts (7-day, 30-day)
   - Quick actions

2. **Products**
   - List all products with status
   - Add/edit/delete products
   - Bulk actions (activate, deactivate)
   - Import/export CSV

3. **Orders**
   - Pending orders requiring action
   - Order management (confirm, ship, cancel)
   - Print shipping labels
   - Update tracking info

4. **Offers & Promotions**
   - Create new offers
   - View active/scheduled/expired offers
   - Offer performance analytics

5. **Reviews**
   - View customer reviews
   - Respond to reviews
   - Flag inappropriate reviews

6. **Payouts**
   - Pending balance
   - Payout history
   - Update bank details

7. **Settings**
   - Business profile
   - Vacation mode
   - Notification preferences

**Implementation Files:**
- `dist/seller-dashboard.html`
- `dist/seller-products.html`
- `dist/seller-orders.html`
- `dist/seller-offers.html`
- `dist/js/seller-dashboard.js`

### 2.3 Offer Management System

**Offer Types:**

| Type | Description | Example |
|------|-------------|---------|
| Percentage | % off on products | 20% off on all shoes |
| Flat | Fixed amount off | ₹100 off on orders ≥₹500 |
| BOGO | Buy one get one | Buy 1 Get 1 Free |
| Bundle | Multi-product deal | 3 T-shirts for ₹999 |
| Flash | Time-limited sale | 50% off for 2 hours |

**Offer Creation Form Fields:**
- Offer name and description
- Discount type and value
- Target (all products, specific products, category)
- Validity period
- Usage limits
- Coupon code (optional)

---

## Phase 3: Advanced Features

### 3.1 Complete Loyalty Rewards System

**Tier Structure:**

| Tier | Points Required | Multiplier | Perks |
|------|-----------------|------------|-------|
| Bronze | 0 - 999 | 1x | Basic support |
| Silver | 1,000 - 4,999 | 1.5x | Priority support, early access |
| Gold | 5,000 - 19,999 | 2x | Free shipping, exclusive offers |
| Platinum | 20,000+ | 3x | VIP support, birthday bonus, invite-only sales |

**Points Earning:**
- ₹1 spent = 1 point (× tier multiplier)
- Write a review = 50 points
- First purchase = 100 bonus points
- Referral = 200 points (referrer) + 100 points (referee)
- Birthday = 100 bonus points

**Points Redemption:**
- 100 points = ₹1
- Minimum redemption: 500 points (₹5)
- Maximum per order: 20% of cart value
- Points expire after 12 months of inactivity

**Implementation:**
- Points calculation at checkout
- Tier upgrade notifications
- Points history in profile
- Redemption during checkout

### 3.2 Admin Dashboard

**Admin Capabilities:**

1. **User Management**
   - View all users
   - Suspend/activate accounts
   - View order history
   - Impersonate user (support)

2. **Seller Management**
   - Approval queue
   - Verify documents
   - Adjust commission rates
   - Suspend sellers

3. **Product Moderation**
   - Approve new listings
   - Remove policy violations
   - Feature products

4. **Order Management**
   - View all orders
   - Handle disputes
   - Process refunds

5. **Analytics**
   - GMV and revenue
   - User growth
   - Top sellers/products
   - Category performance

6. **Platform Settings**
   - Commission rates
   - Loyalty program config
   - Feature flags
   - Announcement banners

**Implementation Files:**
- `dist/admin/index.html`
- `dist/admin/users.html`
- `dist/admin/sellers.html`
- `dist/admin/products.html`
- `dist/admin/orders.html`
- `dist/admin/analytics.html`
- `dist/admin/settings.html`

### 3.3 Push Notifications

**Notification Types:**
- Order status updates
- New offers and promotions
- Review reminders
- Loyalty tier upgrades
- Flash sale alerts
- Back in stock alerts

**Implementation:**
- Firebase Cloud Messaging (FCM)
- Service worker for web push
- Notification preferences in profile

---

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isSeller() {
      return hasRole('seller') || hasRole('admin');
    }
    
    // Users
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Sellers
    match /sellers/{sellerId} {
      allow read: if true; // Public seller profiles
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        (get(/databases/$(database)/documents/sellers/$(sellerId)).data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Products
    match /products/{productId} {
      allow read: if true; // Public product catalog
      allow create: if isSeller();
      allow update: if isAuthenticated() && 
        (resource.data.sellerId == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && 
        (resource.data.sellerId == request.auth.uid || isAdmin());
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if isAuthenticated() && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid || 
         isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid || 
         isAdmin());
    }
    
    // Offers
    match /offers/{offerId} {
      allow read: if true; // Public offers
      allow write: if isAuthenticated() && 
        (resource.data.sellerId == request.auth.uid || isAdmin());
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        (resource.data.reviewerId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Loyalty Transactions
    match /loyalty_transactions/{transactionId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow write: if false; // Only via Cloud Functions
    }
    
    // Notifications
    match /notifications/{userId}/items/{notificationId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

---

## Data Flow Diagrams

### Order Flow

```
Customer browses → Adds to cart → Checkout →
  → Applies coupon/points → Payment (Razorpay/COD) →
    → Order Created (status: pending) →
      → Seller notified → Seller confirms →
        → Order shipped → Customer notified →
          → Delivered → Review prompt →
            → Points credited
```

### Seller Onboarding Flow

```
User registers as seller → Fills business form →
  → Uploads documents → Application submitted →
    → Admin receives notification → Reviews application →
      → Documents verified → Seller approved →
        → Seller notified → Dashboard access granted
```

### Loyalty Points Flow

```
Order placed → Points calculated (amount × tier multiplier) →
  → Points credited after delivery →
    → Tier evaluated → Upgrade if threshold met →
      → Notification sent → Points available for next order
```

---

## API Endpoints (Cloud Functions)

### Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/createOrder` | POST | Create new order |
| `/updateOrderStatus` | POST | Update order status |
| `/cancelOrder` | POST | Cancel order |
| `/getOrderDetails` | GET | Get order by ID |

### Sellers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/approveSeller` | POST | Admin approves seller |
| `/rejectSeller` | POST | Admin rejects seller |
| `/suspendSeller` | POST | Admin suspends seller |
| `/getSellerStats` | GET | Get seller analytics |

### Loyalty

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/creditPoints` | POST | Credit loyalty points |
| `/redeemPoints` | POST | Redeem points at checkout |
| `/checkTierUpgrade` | POST | Evaluate tier upgrade |

### Notifications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sendNotification` | POST | Send push notification |
| `/sendEmail` | POST | Send transactional email |

---

## Implementation Priority

### Immediate (Week 1-2)
1. ✅ Fix review submission (Firebase config)
2. Implement seller registration form
3. Create seller dashboard skeleton

### Short-term (Week 3-4)
4. Seller product management
5. Seller order management
6. Basic offer creation

### Medium-term (Month 2)
7. Admin dashboard
8. Loyalty points integration
9. Push notifications

### Long-term (Month 3+)
10. Advanced analytics
11. Multi-vendor shipping
12. Payment splits to sellers

---

## Appendix

### Environment Variables

```
# Firebase
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# EmailJS
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_PUBLIC_KEY=
```

### Useful Firebase CLI Commands

```bash
# Deploy hosting
firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# Deploy firestore rules
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Emulator for local development
firebase emulators:start
```

---

*Document maintained by 69Shop.in Development Team*
