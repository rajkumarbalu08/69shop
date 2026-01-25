# 69Shop.in - Seller Pages Test Plan

## Test Execution Date: January 24, 2026
## Tester: Automated Test Suite + Manual Review

---

## 1. Test Scope

### Pages Under Test
| # | Page | URL | Priority |
|---|------|-----|----------|
| 1 | Seller Login | /seller-login.html | Critical |
| 2 | Seller Dashboard | /seller-dashboard.html | Critical |
| 3 | Seller Products | /seller-products.html | Critical |
| 4 | Seller Orders | /seller-orders.html | High |
| 5 | Seller Services | /seller-services.html | Medium |
| 6 | Seller Analytics | /seller-analytics.html | Medium |
| 7 | Seller Payments | /seller-payments.html | High |
| 8 | Seller Reviews | /seller-reviews.html | Medium |
| 9 | Seller Settings | /seller-settings.html | Medium |
| 10 | Seller Verification | /seller-verification.html | Critical |

---

## 2. Test Cases

### 2.1 Authentication Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| AUTH-01 | Email Login | 1. Navigate to seller-login.html<br>2. Enter valid email/password<br>3. Click Login | Redirect to seller-dashboard.html | ⏳ |
| AUTH-02 | Google Sign-in | 1. Navigate to seller-login.html<br>2. Click "Google Account" button<br>3. Complete Google auth | Redirect to seller-dashboard.html | ⏳ |
| AUTH-03 | Invalid Login | 1. Enter invalid credentials<br>2. Click Login | Show error message | ⏳ |
| AUTH-04 | Session Persistence | 1. Login<br>2. Close browser<br>3. Reopen | User remains logged in | ⏳ |
| AUTH-05 | Logout | 1. Click Sign Out | Redirect to seller-login.html | ⏳ |
| AUTH-06 | Protected Pages | 1. Access seller page without login | Redirect to seller-login.html | ⏳ |

### 2.2 Navigation Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| NAV-01 | Sidebar Navigation | Click each sidebar link | Navigate to correct page | ✅ PASS |
| NAV-02 | Active State | View current page | Current page highlighted in sidebar | ⏳ |
| NAV-03 | Mobile Menu Toggle | 1. Resize to mobile<br>2. Click hamburger menu | Sidebar opens/closes | ⏳ |
| NAV-04 | Brand Link | Click brand logo in sidebar | Navigate to dashboard | ⏳ |
| NAV-05 | External Links | Click "View Shop" link | Opens shop.html | ⏳ |

### 2.3 Verification Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| VER-01 | Unverified Seller - Products | 1. Login as unverified seller<br>2. Go to Products | Show verification alert, Add Product disabled | ⏳ |
| VER-02 | Verified Seller - Products | 1. Login as verified seller<br>2. Go to Products | No alert, Add Product enabled | ⏳ |
| VER-03 | Verification Badge | 1. Login as verified seller<br>2. Check sidebar profile | Show "Verified Seller" badge | ⏳ |
| VER-04 | Pending Badge | 1. Login as pending seller<br>2. Check sidebar profile | Show "Verification Pending" badge | ⏳ |
| VER-05 | Verification Form Submit | 1. Fill verification form<br>2. Submit | Success message, status changes to pending | ⏳ |

### 2.4 Product Management Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PROD-01 | Add Product | 1. Click Add Product<br>2. Fill form with 5+ images<br>3. Save | Product appears in list | ⏳ |
| PROD-02 | Add Product - Min Images | 1. Click Add Product<br>2. Add less than 5 images<br>3. Try to save | Error: minimum 5 images required | ⏳ |
| PROD-03 | Edit Product | 1. Click Edit on product<br>2. Modify fields<br>3. Save | Changes reflected | ⏳ |
| PROD-04 | Delete Product | 1. Click Delete<br>2. Confirm | Product removed from list | ⏳ |
| PROD-05 | Image Compression | 1. Add large image (>1MB)<br>2. Save product | Image compressed, save succeeds | ⏳ |
| PROD-06 | Image Gallery | 1. Add multiple images<br>2. View product card | Image gallery with navigation arrows | ⏳ |

### 2.5 Order Management Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| ORD-01 | View Orders | Navigate to Orders page | All seller orders displayed | ⏳ |
| ORD-02 | Order Status Filter | Select status filter | Only matching orders shown | ⏳ |
| ORD-03 | Order Timeline | Click on order | Show order status timeline | ⏳ |
| ORD-04 | Update Order Status | Change order status | Status updated, notification sent | ⏳ |

### 2.6 Analytics Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| ANA-01 | Dashboard Stats | View Analytics page | Revenue, orders, products stats displayed | ⏳ |
| ANA-02 | Charts Render | View Analytics page | Charts render correctly | ⏳ |
| ANA-03 | Date Range Filter | Change date range | Data updates accordingly | ⏳ |

### 2.7 Settings Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| SET-01 | Update Profile | 1. Change business name<br>2. Save | Profile updated | ⏳ |
| SET-02 | Update Password | 1. Enter current/new password<br>2. Save | Password changed | ⏳ |
| SET-03 | Notification Settings | Toggle notification settings | Settings saved | ⏳ |

### 2.8 UI/UX Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| UI-01 | Responsive Layout | View on mobile (375px) | Layout adapts correctly | ⏳ |
| UI-02 | Toast Notifications | Trigger success/error | Toast appears and auto-dismisses | ⏳ |
| UI-03 | Loading States | Trigger data load | Loading spinner shown | ⏳ |
| UI-04 | Empty States | View empty data | Appropriate empty state message | ⏳ |
| UI-05 | Form Validation | Submit invalid form | Validation errors shown | ⏳ |

---

## 3. Integration Tests

### 3.1 Firebase Integration

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| FB-01 | Firestore Read | Products/orders load correctly | ⏳ |
| FB-02 | Firestore Write | Data saves successfully | ⏳ |
| FB-03 | Auth State | User state persists correctly | ⏳ |
| FB-04 | Realtime Updates | Data updates in realtime | ⏳ |

### 3.2 SellerShell Integration

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| SS-01 | Name Display | Seller name shows in sidebar | ⏳ |
| SS-02 | Avatar Initial | Avatar shows correct initial | ⏳ |
| SS-03 | Status Badge | Correct status badge displayed | ⏳ |
| SS-04 | Orders Badge | Pending orders count shown | ⏳ |

---

## 4. Test Execution Commands

### Run Browser Console Tests
```javascript
// Paste in browser console on any seller page
fetch('/tests/functionality-test.js')
  .then(r => r.text())
  .then(eval);
```

### Run Link Validation
```javascript
// Checks all links on current page
document.querySelectorAll('a[href]').forEach(a => {
  const href = a.getAttribute('href');
  if (href.startsWith('/') && !href.includes('#')) {
    fetch(href, { method: 'HEAD' })
      .then(r => console.log(r.ok ? '✅' : '❌', href))
      .catch(() => console.log('❌', href));
  }
});
```

---

## 5. Known Issues Found

| # | Issue | Page | Severity | Status |
|---|-------|------|----------|--------|
| 1 | Verification not detected | seller-products.html | Critical | 🔧 FIXING |
| 2 | Verified badge CSS | seller-reviews.html | Medium | ✅ FIXED |
| 3 | Header responsive | seller-verification.html | Low | ✅ FIXED |

---

## 6. Test Results Summary

| Category | Total | Pass | Fail | Pending |
|----------|-------|------|------|---------|
| Authentication | 6 | 0 | 0 | 6 |
| Navigation | 5 | 1 | 0 | 4 |
| Verification | 5 | 0 | 0 | 5 |
| Products | 6 | 0 | 0 | 6 |
| Orders | 4 | 0 | 0 | 4 |
| Analytics | 3 | 0 | 0 | 3 |
| Settings | 3 | 0 | 0 | 3 |
| UI/UX | 5 | 0 | 0 | 5 |
| Firebase | 4 | 0 | 0 | 4 |
| SellerShell | 4 | 0 | 0 | 4 |
| **TOTAL** | **45** | **1** | **0** | **44** |

---

## 7. Sign-off

- [ ] Developer Review Complete
- [ ] QA Testing Complete  
- [ ] Ready for Production

**Notes:**
- Navigation links audit completed - ALL 120+ links verified OK
- CSS fixes applied for verification badge visibility
- Firestore rules enhanced for better verification detection
