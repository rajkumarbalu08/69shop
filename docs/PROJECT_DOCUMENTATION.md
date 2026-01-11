# 69Shop.in - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [File Structure](#file-structure)
5. [User Flows](#user-flows)
6. [Firebase Configuration](#firebase-configuration)
7. [Feature Documentation](#feature-documentation)
8. [API & Data Models](#api--data-models)
9. [Deployment](#deployment)
10. [Future Roadmap](#future-roadmap)

---

## Project Overview

**69Shop.in** is a premium e-commerce marketplace platform connecting buyers with sellers and service providers. The platform supports:

- **Buyers**: Browse products, add to cart, wishlist, checkout
- **Sellers (Product)**: List products, manage inventory, process orders
- **Sellers (Service)**: List services, manage bookings
- **Admin**: Verify sellers, manage platform (planned)

### Key Features
- 🛒 Full shopping experience with cart, wishlist, checkout
- 👤 User authentication (Firebase Auth)
- 🏪 Seller dashboard with analytics
- 📦 Product management with image upload
- 📋 Order management with status tracking
- 🔒 Seller verification (GST, MSME, PAN)
- 📊 Sales analytics with Chart.js
- 🎨 Purple-themed seller branding
- 📱 Responsive design

---

## Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Static HTML)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Public     │  │   Buyer     │  │      Seller         │  │
│  │  Pages      │  │   Pages     │  │      Dashboard      │  │
│  │             │  │             │  │                     │  │
│  │ - index     │  │ - shop      │  │ - seller-dashboard  │  │
│  │ - services  │  │ - profile   │  │ - seller-products   │  │
│  │ - login     │  │ - checkout  │  │ - seller-orders     │  │
│  │             │  │             │  │ - seller-services   │  │
│  │             │  │             │  │ - seller-verify     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Firebase   │  │   Firestore  │  │    Firebase      │   │
│  │   Auth       │  │   Database   │  │    Storage       │   │
│  │              │  │              │  │                  │   │
│  │ - Email/Pass │  │ - users      │  │ - products/      │   │
│  │ - Google     │  │ - sellers    │  │ - profiles/      │   │
│  │              │  │ - products   │  │ - documents/     │   │
│  │              │  │ - orders     │  │                  │   │
│  │              │  │ - verify     │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Hosting                           │
│                 https://shop69-1.web.app                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Authentication**: Firebase Auth handles login/signup
2. **User Detection**: On login, system checks `sellers` collection first, then `users`
3. **State Persistence**: localStorage caches user type for cross-page consistency
4. **Product Data**: Loaded from Firestore with fallback to local sample data

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Styling | CSS Custom Properties, Flexbox, Grid |
| Icons | Font Awesome 6.4.0 |
| Fonts | Inter (body), Poppins (headings) |
| Charts | Chart.js 4.4.1 |
| Backend | Firebase (BaaS) |
| Authentication | Firebase Auth |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Version Control | Git |

---

## File Structure

```
69shop/
├── dist/                          # Production files (deployed)
│   ├── index.html                 # Landing page
│   ├── shop.html                  # Main shopping page
│   ├── shop-login.html            # Buyer login
│   ├── seller-login.html          # Seller login
│   ├── seller-dashboard.html      # Seller main dashboard
│   ├── seller-products.html       # Product management
│   ├── seller-orders.html         # Order management
│   ├── seller-services.html       # Service management
│   ├── seller-verification.html   # GST/MSME verification
│   ├── services.html              # Public services page
│   ├── profile.html               # Buyer profile
│   ├── firebase-config.js         # Firebase credentials (gitignored)
│   ├── firebase-config.sample.js  # Template for config
│   ├── products-data.js           # Sample product data
│   ├── assets/
│   │   └── css/
│   │       ├── home.css           # Landing page styles
│   │       └── shop.css           # Shop page styles
│   └── Logo/                      # Brand assets
│
├── tests/
│   └── navigation-test.js         # Browser console test script
│
├── firebase.json                  # Firebase hosting config
├── firestore.rules                # Firestore security rules
├── storage.rules                  # Storage security rules
├── cors.json                      # CORS configuration
└── .github/
    └── copilot-instructions.md    # Development guidelines
```

---

## User Flows

### 1. Guest Shopping Flow
```
Landing Page → Shop → Browse Products → Add to Cart → Checkout Prompt
                                                           ↓
                                                    Login Modal
                                                           ↓
                                                    Login/Signup
                                                           ↓
                                                    Complete Checkout
```

### 2. Buyer Flow
```
Login → Shop (Buyer Badge) → Browse → Cart → Checkout → Order Confirmation
              ↓
         Profile Sidebar:
         - Dashboard
         - My Orders
         - Wishlist
         - Addresses
         - Settings
```

### 3. Seller Onboarding Flow
```
Landing Page → "Start Selling" → Seller Login/Signup
                                        ↓
                              Seller Dashboard (Limited)
                                        ↓
                              Verification Alert
                                        ↓
                              Seller Verification Page:
                              - Step 1: Business Info
                              - Step 2: Documents (PAN, GST, MSME)
                              - Step 3: Bank Details
                              - Step 4: Review & Submit
                                        ↓
                              Pending Review → Approved → Full Access
```

### 4. Seller Daily Flow
```
Login → Seller Dashboard
            │
            ├── View Stats (Revenue, Orders, Products)
            ├── Check Low Stock Alerts
            ├── View Sales Chart
            │
            ├── Manage Products
            │      ├── Add New Product
            │      ├── Edit Product
            │      ├── Update Stock
            │      └── Delete Product
            │
            ├── Manage Orders
            │      ├── Process Order
            │      ├── Ship Order
            │      ├── Generate Invoice
            │      └── Export CSV
            │
            └── View Shop (as buyer)
```

---

## Firebase Configuration

### Collections Structure

#### `users` Collection
```javascript
{
  uid: "firebase_user_id",
  name: "John Doe",
  email: "john@example.com",
  accountType: "buyer",
  createdAt: Timestamp,
  photoURL: "https://...",
  hasSeenWelcomeOffer: false
}
```

#### `sellers` Collection
```javascript
{
  uid: "firebase_user_id",
  businessName: "My Store",
  email: "seller@example.com",
  sellerType: "product" | "service",
  status: "active" | "pending",
  verificationStatus: "pending" | "approved" | "rejected",
  createdAt: Timestamp
}
```

#### `products` Collection
```javascript
{
  id: "product_id",
  name: "Product Name",
  category: "Electronics",
  brand: "Brand",
  price: 999,
  mrp: 1299,
  stock: 50,
  status: "active" | "inactive",
  images: ["url1", "url2"],
  sellerId: "seller_uid",
  createdAt: Timestamp,
  views: 0,
  orders: 0
}
```

#### `orders` Collection
```javascript
{
  id: "order_id",
  sellerId: "seller_uid",
  buyerId: "buyer_uid",
  productId: "product_id",
  productName: "Product Name",
  quantity: 1,
  amount: 999,
  status: "pending" | "processing" | "shipped" | "delivered",
  customerName: "Customer Name",
  customerEmail: "customer@email.com",
  shippingAddress: "Full Address",
  createdAt: Timestamp
}
```

#### `sellerVerification` Collection
```javascript
{
  userId: "seller_uid",
  userEmail: "seller@email.com",
  businessName: "Store Name",
  businessType: "individual" | "llp" | "pvt_ltd",
  primaryCategory: "electronics",
  phoneNumber: "+91...",
  businessAddress: "...",
  city: "Mumbai",
  state: "MH",
  pinCode: "400001",
  panNumber: "ABCDE1234F",
  panFileUrl: "https://storage...",
  gstNumber: "22AAAAA0000A1Z5",
  gstFileUrl: "https://storage...",
  msmeNumber: "UDYAM-XX-00-0000000",
  accountName: "Account Holder",
  accountNumber: "1234567890",
  ifscCode: "SBIN0001234",
  bankName: "State Bank",
  status: "pending" | "approved" | "rejected",
  submittedAt: Timestamp,
  reviewedAt: Timestamp,
  rejectionReason: "..."
}
```

### Security Rules Summary

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| users | Owner only | Owner only | |
| sellers | Owner only | Owner only | |
| products | Public | Owner only | Anyone can view products |
| orders | Buyer/Seller | Seller (update) | Participants only |
| sellerVerification | Owner only | Owner only | Sensitive documents |

---

## Feature Documentation

### 1. Guest Experience
- Guests can browse all products
- Cart persists in localStorage
- Checkout requires login (modal prompt)
- Wishlist works but shows sync reminder
- Profile shows "Guest" badge with Login button

### 2. Seller Dashboard
- **Stats Cards**: Revenue, Orders, Products, Pending
- **Sales Chart**: Line chart with 7/30/90 day views
- **Low Stock Alerts**: Products with stock < 10
- **Recent Orders**: Quick view of latest orders
- **Quick Actions**: Add product, view orders

### 3. Product Management
- Image upload (up to 5 images)
- Category selection
- Price and MRP (discount calculation)
- Stock management
- Active/Inactive status
- Search and filter

### 4. Order Management
- Status workflow: Pending → Processing → Shipped → Delivered
- Quick action buttons
- Invoice generation with print/download
- CSV export
- Order search and filter

### 5. Seller Verification
- **Required**: PAN card
- **Optional**: GST certificate (unlocks B2B, lower fees)
- **Optional**: MSME certificate (unlocks priority support)
- **Required for food**: FSSAI license
- **Bank details**: For payouts

### 6. Benefit Tiers

| Tier | Requirements | Benefits |
|------|--------------|----------|
| Basic | PAN only | 50 products, standard commission, weekly payout |
| GST Verified | GST certificate | Unlimited products, GST invoicing, -2% commission |
| MSME Partner | MSME certificate | Priority support, featured listings, -5% commission, daily payout |

---

## Deployment

### Prerequisites
1. Node.js installed
2. Firebase CLI: `npm install -g firebase-tools`
3. Firebase project created
4. Google Cloud SDK (for storage CORS)

### Setup Steps
```bash
# 1. Clone repository
git clone <repo-url>
cd 69shop

# 2. Configure Firebase
cp dist/firebase-config.sample.js dist/firebase-config.js
# Edit firebase-config.js with your credentials

# 3. Login to Firebase
firebase login

# 4. Initialize project
firebase init
# Select: Hosting, Firestore, Storage

# 5. Deploy
firebase deploy
```

### Enable Firebase Storage
1. Go to Firebase Console → Storage
2. Click "Get Started"
3. Choose security rules mode
4. Select location
5. Deploy storage rules: `firebase deploy --only storage`

### Configure CORS (for image uploads)
```bash
# Using Google Cloud SDK
gsutil cors set cors.json gs://your-bucket.appspot.com
```

---

## Future Roadmap

### Phase 1: Core Improvements (Current)
- [x] Seller verification flow
- [x] Navigation fixes
- [x] Guest experience
- [ ] Firebase Storage setup
- [ ] Admin dashboard

### Phase 2: Enhanced Features
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Real-time order tracking
- [ ] Push notifications
- [ ] Email notifications
- [ ] SMS OTP verification

### Phase 3: Growth Features
- [ ] Seller ratings & reviews
- [ ] Product reviews
- [ ] Referral program
- [ ] Loyalty points
- [ ] Flash sales

### Phase 4: Scale
- [ ] Multi-language support
- [ ] PWA (Progressive Web App)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] AI product recommendations

---

## Testing

### Navigation Test Script
Run in browser console on any page:
```javascript
// Copy contents of tests/navigation-test.js
// Paste in browser console
// View results in console
```

### Manual Test Checklist
- [ ] Guest can browse products
- [ ] Guest cannot checkout (shows login prompt)
- [ ] Buyer can login and checkout
- [ ] Seller can login and access dashboard
- [ ] Seller dashboard shows correct data
- [ ] Product upload works
- [ ] Order status updates persist
- [ ] Footer links point to correct pages
- [ ] Verification flow works

---

## Support & Contact

- **Project**: 69Shop.in
- **Hosting**: https://shop69-1.web.app
- **Firebase Console**: https://console.firebase.google.com/project/shop69-1

---

*Documentation last updated: January 11, 2026*
