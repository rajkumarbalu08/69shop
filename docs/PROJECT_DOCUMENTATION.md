# 69Shop.in - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [File Structure](#file-structure)
5. [User Flows](#user-flows)
6. [Firebase Configuration](#firebase-configuration)
7. [Feature Documentation](#feature-documentation)
8. [Admin Panel](#admin-panel)
9. [Seller Center](#seller-center)
10. [Email Service](#email-service)
11. [API & Data Models](#api--data-models)
12. [Deployment](#deployment)
13. [Future Roadmap](#future-roadmap)

---

## Project Overview

**69Shop.in** is a premium e-commerce marketplace platform connecting buyers with sellers and service providers. The platform supports:

- **Buyers**: Browse products, add to cart, wishlist, checkout
- **Sellers (Product)**: List products, manage inventory, process orders
- **Sellers (Service)**: List services, manage bookings
- **Admin**: Verify sellers, manage users, moderate products

### Key Features
- 🛒 Full shopping experience with cart, wishlist, checkout
- 👤 User authentication (Firebase Auth)
- 🏪 Professional seller dashboard with analytics
- 📦 Product management with image upload
- 📋 Order management with status tracking
- 🔒 Seller verification (GST, MSME, PAN)
- 📊 Sales analytics with Chart.js
- 🎨 Themed dashboards (Admin: Red, Seller: Purple)
- 📧 Email notifications for orders and invoices
- 📱 Responsive design

---

## Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Frontend (Static HTML)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │  Public     │  │   Buyer     │  │   Seller      │  │    Admin     │  │
│  │  Pages      │  │   Pages     │  │   Center      │  │    Panel     │  │
│  │             │  │             │  │               │  │              │  │
│  │ - index     │  │ - shop      │  │ - dashboard   │  │ - dashboard  │  │
│  │ - services  │  │ - profile   │  │ - products    │  │ - users      │  │
│  │ - login     │  │ - checkout  │  │ - orders      │  │ - products   │  │
│  │             │  │             │  │ - services    │  │ - orders     │  │
│  │             │  │             │  │ - verify      │  │ - settings   │  │
│  └─────────────┘  └─────────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Services Layer                                    │
│  ┌────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │      EmailJS           │  │            Firebase Backend            │ │
│  │                        │  │                                        │ │
│  │ - Order Confirmations  │  │  ┌────────┐ ┌────────┐ ┌────────────┐ │ │
│  │ - Invoice Emails       │  │  │ Auth   │ │Firestore│ │  Storage   │ │ │
│  │ - Shipping Updates     │  │  │        │ │        │ │            │ │ │
│  │ - Welcome Emails       │  │  │Email/  │ │users   │ │products/   │ │ │
│  │ - Seller Notifications │  │  │Google  │ │sellers │ │profiles/   │ │ │
│  └────────────────────────┘  │  │        │ │products│ │documents/  │ │ │
│                              │  │        │ │orders  │ │            │ │ │
│                              │  └────────┘ └────────┘ └────────────┘ │ │
│                              └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Firebase Hosting                                   │
│                     https://shop69-1.web.app                             │
│                        https://69shop.in                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Authentication**: Firebase Auth handles login/signup
2. **User Detection**: On login, system checks `sellers` collection first, then `users`
3. **State Persistence**: localStorage caches user type for cross-page consistency
4. **Product Data**: Loaded from Firestore with fallback to local sample data
5. **Email Notifications**: EmailJS sends order confirmations and invoices

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Styling | CSS Custom Properties, Flexbox, Grid |
| Icons | Font Awesome 6.4.0 |
| Fonts | Inter (body), Poppins (headings) |
| Charts | Chart.js 4.4.1 |
| Email | EmailJS (client-side) |
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
│   ├── shop.html                  # Main shopping page with checkout
│   ├── shop-login.html            # Buyer login
│   ├── profile.html               # Buyer profile
│   │
│   ├── seller-login.html          # Seller login
│   ├── seller-dashboard.html      # ✨ NEW: Professional seller center
│   ├── seller-products.html       # Product management
│   ├── seller-orders.html         # Order management
│   ├── seller-services.html       # Service management
│   ├── seller-verification.html   # GST/MSME verification
│   │
│   ├── admin-dashboard.html       # ✨ NEW: Admin control center
│   ├── admin-users.html           # User management
│   ├── admin-products.html        # Product moderation
│   │
│   ├── services.html              # Public services page
│   ├── firebase-config.js         # Firebase credentials (gitignored)
│   ├── firebase-config.sample.js  # Template for config
│   ├── products-data.js           # Sample product data
│   │
│   ├── js/                        # ✨ NEW: JavaScript modules
│   │   ├── email-service.js       # Email notification service
│   │   └── emailjs-config.sample.js # EmailJS setup template
│   │
│   ├── assets/
│   │   └── css/
│   │       ├── home.css           # Landing page styles
│   │       └── shop.css           # Shop page styles
│   │
│   └── Logo/                      # Brand assets
│
├── docs/
│   └── PROJECT_DOCUMENTATION.md   # This file
│
├── tests/
│   └── navigation-test.js         # Browser console test script
│
├── firebase.json                  # Firebase hosting config
├── firestore.rules                # Firestore security rules
├── storage.rules                  # Storage security rules
├── cors.json                      # CORS configuration
└── .github/
    ├── copilot-instructions.md    # Development guidelines
    └── workflows/                 # GitHub Actions
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

## Admin Panel

### Overview
The Admin Panel provides a comprehensive control center for platform management with a professional dark sidebar layout.

### Design System
- **Primary Color**: Red (#DC2626) for admin actions
- **Sidebar**: Dark slate (Slate-900) with 280px width
- **Layout**: Fixed sidebar + scrollable main content
- **Header**: Sticky 70px header with search and user info

### Admin Dashboard (`admin-dashboard.html`)
**Features:**
- **Stats Grid**: 4 cards showing Revenue, Orders, Users, Products
- **Revenue Chart**: Line chart with 7/30/90 day period selector
- **Recent Activity Feed**: Live updates of platform actions
- **Quick Actions**: Links to common admin tasks
- **Pending Verifications**: Table of sellers awaiting approval

**Navigation Sidebar:**
- Dashboard (home)
- Users Management
- Products Moderation
- Orders Overview
- Sellers Management
- Verification Queue
- Platform Settings
- Analytics

### Admin Users (`admin-users.html`)
- User listing with search and filters
- Enable/disable user accounts
- View user details and activity
- Role management (buyer/seller/admin)

### Admin Products (`admin-products.html`)
- Product moderation queue
- Approve/reject product listings
- Lead Admin approval for sensitive actions
- Product search and categorization
- Bulk actions support

### Lead Admin
- **Email**: rajkumarbalu81@gmail.com
- Special permissions for product approval
- Platform-wide settings access

---

## Seller Center

### Overview
The Seller Center is a professional dashboard for sellers to manage their business with a distinctive purple theme.

### Design System
- **Primary Color**: Purple (#7C3AED) gradient theme
- **Sidebar**: Dark purple with brand identity
- **Layout**: Fixed sidebar + scrollable main content
- **Responsive**: Hamburger menu for mobile (<1024px)

### Seller Dashboard (`seller-dashboard.html`)
**Features:**
- **Verification Banner**: Shows verification status (hidden when approved)
- **Stats Grid**: 4 cards - Revenue, Orders, Products, Views
- **Sales Chart**: Line chart with period selection
- **Recent Orders**: Quick view of latest orders
- **Low Stock Alerts**: Products needing restock
- **Quick Actions**: Add product, view orders, settings

**Verification Progress Indicator:**
- Step badges showing completion status
- Direct link to verification page
- Benefits preview for each verification level

**Navigation Sidebar:**
- Dashboard (home)
- My Products
- Orders
- Services
- Analytics
- Payouts
- Settings
- Support

### Seller Products (`seller-products.html`)
- Product listing with CRUD operations
- Image upload (up to 5 images)
- Stock management
- Category selection
- Pricing with MRP and discount

### Seller Orders (`seller-orders.html`)
- Order status workflow
- Invoice generation
- CSV export
- Customer communication

### Seller Verification (`seller-verification.html`)
- 4-step verification process
- Document upload (PAN, GST, MSME)
- Bank account linking
- Status tracking

---

## Email Service

### Overview
The Email Service provides automated email notifications for orders, invoices, and customer communications using EmailJS.

### Technology
- **Provider**: EmailJS (client-side email service)
- **SDK**: @emailjs/browser v4
- **Location**: `dist/js/email-service.js`

### Email Types

#### 1. Order Confirmation
- Triggered: When customer places an order
- Contains: Order ID, items, total, shipping address, estimated delivery
- Template ID: `order_confirmation`

#### 2. Invoice Email
- Triggered: After order confirmation
- Contains: Invoice number, itemized bill, tax, payment status
- Template ID: `invoice`

#### 3. Shipping Notification
- Triggered: When order is shipped
- Contains: Tracking number, carrier, tracking URL, estimated delivery
- Template ID: `order_shipped`

#### 4. Seller Notification
- Triggered: New order received
- Contains: Order details, customer name, action link
- Template ID: `seller_notification`

#### 5. Welcome Email
- Triggered: New user registration
- Contains: Welcome message, user type, dashboard link
- Template ID: `welcome_email`

### Setup Instructions

1. **Create EmailJS Account**
   - Go to https://www.emailjs.com/
   - Sign up for free (200 emails/month)

2. **Connect Email Service**
   - Add Gmail or other email provider
   - Get Service ID

3. **Create Templates**
   - Create templates for each email type
   - Use variables as documented in `emailjs-config.sample.js`

4. **Configure Credentials**
   - Copy `emailjs-config.sample.js` to `emailjs-config.js`
   - Update `email-service.js` config section with:
     - `publicKey`: Your EmailJS public key
     - `serviceId`: Your email service ID
     - Template IDs for each email type

### Integration Points
- **Checkout**: `shop.html` calls `handleOrderCompletion()` after order placement
- **Orders are saved to Firestore** with email status
- **Error handling**: Orders complete even if email fails

### Code Example
```javascript
// Sending order confirmation
const order = {
    id: 'ORD-123456',
    items: [...],
    total: 1999,
    shippingAddress: {...}
};
const customer = {
    name: 'John Doe',
    email: 'john@example.com'
};

await EmailService.sendOrderConfirmation(order, customer);
await EmailService.sendInvoice(order, customer);
```

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

### Phase 1: Core Improvements ✅ COMPLETED
- [x] Seller verification flow
- [x] Navigation fixes
- [x] Guest experience
- [x] Firebase Storage setup
- [x] Admin dashboard (professional redesign)
- [x] Seller center (professional redesign)
- [x] Email notifications for orders
- [x] Invoice email system

### Phase 2: Enhanced Features (Current)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Real-time order tracking
- [ ] Push notifications
- [ ] SMS OTP verification
- [ ] Admin seller management
- [ ] Admin analytics dashboard

### Phase 3: Growth Features
- [ ] Seller ratings & reviews
- [ ] Product reviews
- [ ] Referral program
- [ ] Loyalty points
- [ ] Flash sales
- [ ] Coupon system

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
- [x] Guest can browse products
- [x] Guest cannot checkout (shows login prompt)
- [x] Buyer can login and checkout
- [x] Seller can login and access dashboard
- [x] Seller dashboard shows correct data
- [x] Product upload works
- [x] Order status updates persist
- [x] Footer links point to correct pages
- [x] Verification flow works
- [ ] Admin can approve seller verification
- [ ] Email notifications send on order
- [ ] Invoice emails contain correct data

---

## Recent Updates

### January 2025 - Admin & Seller Redesign

#### Admin Dashboard Overhaul
- Completely rebuilt admin interface with professional dark sidebar
- Added 4-card stats grid with real-time data
- Integrated Chart.js for revenue analytics
- Added pending verifications table
- Quick actions panel for common tasks
- Responsive mobile menu

#### Seller Center Redesign
- Professional purple-themed seller dashboard
- Verification status banner with progress indicator
- Sales analytics with period selection
- Low stock alerts system
- Recent orders quick view
- Improved navigation with clear sections

#### Email Service Implementation
- Added EmailJS integration for client-side emails
- Order confirmation emails on purchase
- Automated invoice generation and delivery
- Seller notification on new orders
- Welcome emails for new users
- Error-tolerant design (orders complete even if email fails)

#### Technical Improvements
- Modular email service (`js/email-service.js`)
- Configuration templates for easy setup
- Orders saved to Firestore with full details
- Enhanced checkout flow with email integration

---

### January 2025 - Phase 4: Scale Features

#### Multi-Vendor Shipping System (`dist/js/shipping-manager.js`)
- **Zone-based pricing**: Local, Regional, National, Remote zones
- **Multiple providers**: Shiprocket, Delhivery, Manual shipping
- **AWB Generation**: Automatic tracking number creation (69SXXXX format)
- **Label printing**: HTML-based shipping labels with barcode support
- **Shipment tracking**: Real-time status updates
- **Multi-seller splitting**: Split orders by seller for separate shipments

Key Features:
```javascript
// Calculate shipping rates
const rates = await ShippingManager.getShippingRates(buyerPincode, items);

// Create shipment with AWB
const shipment = await ShippingManager.createShipment(orderId, sellerId, items, address);

// Print shipping label
await ShippingManager.printLabel(awbNumber);
```

#### Payment Splits Cloud Functions (`functions/payment-splits.js`)
- **Automatic commission**: Category-based commission rates (5-15%)
- **Seller wallets**: Track available and pending balances
- **Withdrawal requests**: Min ₹500, ₹5 processing fee
- **Refund handling**: Admin-managed refunds with seller deductions
- **Daily reports**: Automated settlement summaries

Functions Deployed:
- `processOrderPayment` - Trigger on order delivery
- `requestWithdrawal` - Seller callable function
- `processWithdrawal` - Admin approve/reject
- `getSellerWallet` - Get wallet details and history
- `processRefund` - Admin refund processing
- `dailySettlementReport` - Scheduled at 6 AM IST

Commission Rates:
| Category | Rate |
|----------|------|
| Electronics | 8% |
| Fashion | 12% |
| Groceries | 5% |
| Services | 15% |
| Beauty | 12% |
| Books | 6% |
| Default | 10% |

#### Advanced Search & Recommendations (`dist/js/search-recommendations.js`)
- **Full-text search**: Multi-field matching with relevance scoring
- **Filters**: Price, rating, brand, category, discount
- **Autocomplete**: Popular searches and product suggestions
- **Personalized recommendations**: Based on browsing/purchase history
- **Similar products**: Category and attribute matching
- **Trending products**: Most viewed in last 7 days

SearchEngine API:
```javascript
const search = new SearchEngine();

// Search with filters
const results = await search.search('phone', {
    category: 'electronics',
    priceMax: 20000,
    minRating: 4
});

// Get recommendations
const recommendations = await search.getRecommendations(userId);

// Get similar products
const similar = await search.getSimilarProducts(productId);

// Get trending
const trending = await search.getTrendingProducts(12);
```

#### New Firestore Collections
- `sellerWallet/{sellerId}` - Seller balance tracking
- `transactions/{transactionId}` - All financial transactions
- `withdrawalRequests/{withdrawalId}` - Payout requests
- `refunds/{refundId}` - Refund records
- `platformEarnings/{earningId}` - Commission tracking
- `dailyReports/{reportId}` - Settlement reports
- `productViews/{viewId}` - View analytics
- `shipments/{shipmentId}` - Shipping records
- `awbTracking/{awbNumber}` - Tracking updates

---

## Support & Contact

- **Project**: 69Shop.in
- **Hosting**: https://shop69-1.web.app
- **Lead Admin**: rajkumarbalu81@gmail.com
- **Firebase Console**: https://console.firebase.google.com/project/shop69-1

---

*Documentation last updated: January 2025*
