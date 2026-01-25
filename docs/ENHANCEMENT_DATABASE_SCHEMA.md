# 69Shop Enhancement Features - Database Schema

## 1. ORDER TRACKING & STATUS UPDATES

### Collections Structure

**`orders`** - Main order collection
```
orders/{orderId}
  - orderId: string (auto-generated)
  - customerId: string (FK to users/{uid})
  - sellerId: string (FK to sellers/{uid})
  - productIds: string[] (array of product IDs)
  - status: string (pending|confirmed|shipped|delivered|cancelled)
  - statusHistory: array of {status, timestamp, note}
  - totalAmount: number
  - shippingAddress: {name, phone, address, city, pincode}
  - paymentMethod: string (razorpay|stripe|cod)
  - paymentStatus: string (pending|completed|failed|refunded)
  - createdAt: timestamp
  - updatedAt: timestamp
  - estimatedDelivery: timestamp
  - trackingNumber: string (optional)
```

**`orderNotifications`** - Track which notifications were sent
```
orderNotifications/{notificationId}
  - orderId: string (FK)
  - customerId: string (FK)
  - status: string (the status that triggered notification)
  - notificationType: string (email|sms|both)
  - sentAt: timestamp
  - deliveryStatus: string (sent|failed|bounced)
```

---

## 2. REVIEW & RATING SYSTEM

### Collections Structure

**`reviews`** - Customer reviews for sellers
```
reviews/{reviewId}
  - reviewId: string (auto-generated)
  - orderId: string (FK to orders/{orderId})
  - customerId: string (FK to users/{uid})
  - sellerId: string (FK to sellers/{uid})
  - rating: number (1-5)
  - title: string
  - comment: string
  - photos: string[] (URLs of uploaded photos)
  - categories: {
      communication: number,
      quality: number,
      delivery: number,
      pricing: number
    }
  - helpful: number (count of helpful votes)
  - flagged: boolean (admin flagged as suspicious)
  - flagReason: string (optional)
  - flaggedBy: string (admin UID, optional)
  - flaggedAt: timestamp (optional)
  - createdAt: timestamp
  - response: { // Seller response to review
      text: string,
      respondedAt: timestamp
    }
```

**`sellerRatings`** - Aggregated ratings per seller (auto-updated)
```
sellerRatings/{sellerId}
  - sellerId: string (FK)
  - averageRating: number
  - totalReviews: number
  - ratingBreakdown: {
      5: number,
      4: number,
      3: number,
      2: number,
      1: number
    }
  - categoryAverages: {
      communication: number,
      quality: number,
      delivery: number,
      pricing: number
    }
  - flaggedReviewCount: number
  - lastUpdated: timestamp
```

---

## 3. ADVANCED SELLER ANALYTICS

### Collections Structure

**`sellerAnalytics`** - Daily aggregated metrics per seller
```
sellerAnalytics/{sellerId}/daily/{dateKey}
  - date: string (YYYY-MM-DD)
  - revenue: number
  - ordersCount: number
  - newCustomers: number
  - avgOrderValue: number
  - conversionRate: number
  - topProducts: [{productId, count, revenue}]
  - categoryBreakdown: {
      [categoryId]: {count, revenue, avgPrice}
    }
  - hourlyOrders: {
      0: number, 1: number, ... 23: number
    }
  - peakHour: number
  - lastUpdated: timestamp
```

**`sellerPerformance`** - Overall seller scoring
```
sellerPerformance/{sellerId}
  - sellerId: string
  - performanceScore: number (0-100)
  - scoreBreakdown: {
      orderFulfillment: number,
      customerRating: number,
      responseTime: number,
      returnRate: number,
      reportCount: number
    }
  - percentileRank: number (vs platform average)
  - tier: string (bronze|silver|gold|platinum)
  - qualifiesForPromotions: boolean
  - lastCalculated: timestamp
```

---

## 4. PAYMENT & WITHDRAWAL SYSTEM

### Collections Structure

**`transactions`** - Complete transaction ledger
```
transactions/{transactionId}
  - transactionId: string (auto-generated)
  - type: string (order_payment|platform_fee|refund|withdrawal|bonus)
  - relatedOrderId: string (optional, FK)
  - sellerId: string (FK to sellers/{uid})
  - amount: number
  - currency: string (INR)
  - status: string (pending|completed|failed|refunded)
  - paymentGateway: string (razorpay|stripe)
  - gatewayTransactionId: string
  - gatewayResponse: object (full API response)
  - createdAt: timestamp
  - completedAt: timestamp (optional)
  - failureReason: string (optional)
  - metadata: {
      orderId: string,
      customerEmail: string,
      description: string
    }
```

**`sellerWallet`** - Real-time wallet balance per seller
```
sellerWallet/{sellerId}
  - sellerId: string (FK)
  - balance: number
  - pendingBalance: number (waiting 7-14 days before withdrawal)
  - totalEarned: number (lifetime)
  - totalWithdrawn: number (lifetime)
  - totalRefunded: number
  - lastUpdated: timestamp
  - currency: string (INR)
```

**`withdrawalRequests`** - Seller withdrawal requests
```
withdrawalRequests/{withdrawalId}
  - withdrawalId: string (auto-generated)
  - sellerId: string (FK)
  - amount: number
  - status: string (requested|approved|processing|completed|rejected)
  - bankAccount: {
      accountHolderName: string,
      accountNumber: string,
      ifscCode: string,
      bankName: string
    }
  - requestedAt: timestamp
  - approvedAt: timestamp (optional, by admin)
  - processedAt: timestamp (optional)
  - rejectionReason: string (optional)
  - rejectedAt: timestamp (optional)
  - gatewayPayoutId: string (optional)
```

**`paymentSettings`** - Admin configuration for payments
```
paymentSettings/config
  - minimumWithdrawalAmount: number
  - maximumWithdrawalAmount: number
  - withdrawalProcessingDays: number
  - platformFeePercentage: number
  - autoPayoutSchedule: string (weekly|biweekly|monthly)
  - autoPayoutDayOfWeek: number (0-6, for weekly)
  - taxReportingThreshold: number
  - razorpayKeyId: string (encrypted)
  - razorpayKeySecret: string (encrypted)
  - stripeSecretKey: string (encrypted)
  - lastUpdated: timestamp
```

---

## 5. SEARCH & FILTERING IMPROVEMENTS

### Collections Structure

**`searchAnalytics`** - Track search queries
```
searchAnalytics/{analyticsId}
  - query: string
  - queryNormalized: string (lowercase, trimmed)
  - count: number (search frequency)
  - zeroResults: boolean
  - resultsCount: number (avg)
  - topResults: [{productId, clicks}]
  - timestamp: timestamp
  - date: string (YYYY-MM-DD for aggregation)
```

**`productSearchIndex`** - Denormalized index for fast searching
```
productSearchIndex/{productId}
  - productId: string
  - name: string
  - description: string
  - category: string
  - subcategory: string
  - minPrice: number
  - maxPrice: number
  - sellerId: string
  - sellerName: string
  - sellerRating: number
  - sellerVerified: boolean
  - tags: string[]
  - location: string
  - inStock: boolean
  - popularity: number (order count)
  - lastUpdated: timestamp
```

---

## Security Rules Summary

### New Collections Permissions

```javascript
// orders - customers read own orders, sellers read their own, admins read all
match /orders/{orderId} {
  allow read: if isOwner(resource.data.customerId) || 
                isOwner(resource.data.sellerId) || 
                isAdmin();
  allow create: if request.auth != null;
  allow update: if isAdmin() || isOwner(resource.data.sellerId);
}

// reviews - customers create, sellers/admins can update/delete flagged
match /reviews/{reviewId} {
  allow read: if true; // public
  allow create: if isOwner(request.resource.data.customerId);
  allow update: if isOwner(request.resource.data.customerId) || 
                  isAdmin();
  allow delete: if isAdmin();
}

// transactions - users read own, admins read all, no direct writes
match /transactions/{transactionId} {
  allow read: if isOwner(resource.data.sellerId) || isAdmin();
  allow write: if false; // Only Cloud Functions can write
}

// withdrawalRequests - sellers create own, admins manage
match /withdrawalRequests/{withdrawalId} {
  allow create: if isOwner(request.resource.data.sellerId);
  allow read: if isOwner(resource.data.sellerId) || isAdmin();
  allow update: if isAdmin() && resource.data.status != 'completed';
  allow delete: if isAdmin() && resource.data.status == 'rejected';
}
```

---

## Cloud Functions Required

1. **onOrderStatusChange** - Trigger notifications when order status updates
2. **processPayment** - Handle Razorpay/Stripe payment webhooks
3. **autoPayoutSellers** - Weekly/monthly automated payouts
4. **aggregateSellerAnalytics** - Nightly analytics aggregation
5. **calculateSellerPerformance** - Weekly performance scoring
6. **syncSearchIndex** - Keep search index in sync with products
7. **flagReviewAnalysis** - AI/ML analysis to flag suspicious reviews

---

## Implementation Priority

1. **Phase 1 (Week 1):** Orders + Order Tracking UI
2. **Phase 2 (Week 1-2):** Reviews & Ratings + Display
3. **Phase 3 (Week 2):** Payment Integration + Withdrawal System
4. **Phase 4 (Week 2-3):** Analytics Dashboard
5. **Phase 5 (Week 3):** Search Improvements + Elasticsearch

