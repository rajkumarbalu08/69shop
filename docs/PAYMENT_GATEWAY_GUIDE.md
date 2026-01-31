# Payment Gateway Integration Guide for 69Shop.in

## Overview

This document covers payment gateway requirements, approvals, and legal compliance for e-commerce operations in India.

---

## Payment Gateway Options

### 1. Razorpay (Currently Integrated)
- **Status**: Already integrated in `razorpay-config.js`
- **Approval Required**: Yes
- **Business Verification**: KYC documents, business registration
- **Settlement**: T+2 days (can be faster with enterprise plans)
- **Fees**: 2% per transaction (negotiable for high volume)

### 2. Paytm for Business
- **Status**: Can be integrated
- **Use Existing Merchant ID**: ✅ **Yes**, you can use your existing Paytm merchant ID if:
  - Business is registered under the same entity
  - E-commerce is an approved business category on your account
  - You update the integration type to "Online Payments" if currently set for POS
  
### 3. Other Options
- PhonePe for Business
- CCAvenue
- PayU
- Cashfree

---

## Do You Need Gateway Approval?

### **Short Answer: YES**

Every payment gateway requires business verification before you can accept real transactions.

### Verification Process

1. **Business Documents Required**:
   - GST Registration Certificate
   - PAN Card of business/owner
   - Business Registration (GSTIN, Shop Act, or Company Incorporation)
   - Bank Account Details (current account preferred)
   - Website/App URL
   - Business Address Proof

2. **Website Requirements**:
   - Clear product/service descriptions
   - Terms & Conditions page
   - Privacy Policy page
   - Refund/Cancellation Policy page
   - Contact information
   - Secure checkout (HTTPS)

3. **Timeline**:
   - Razorpay: 2-3 business days
   - Paytm: 3-5 business days
   - Others: 3-7 business days

---

## Using Your Existing Paytm Merchant ID

### Can You Use It?

**Yes, with conditions:**

1. **Same Business Entity**: The merchant ID must be registered under the same business entity as your e-commerce site.

2. **Category Update**: If your current merchant ID is for a different business type (e.g., retail store POS), you may need to:
   - Contact Paytm support to add "Online E-commerce" as a category
   - Submit website URL for review

3. **Integration Type**: Ensure your merchant account supports:
   - Payment Gateway integration (not just QR/POS)
   - S2S (Server-to-Server) callbacks
   - API access

### Steps to Use Existing Paytm ID:

```
1. Log in to Paytm Dashboard (dashboard.paytm.com)
2. Go to "Developer Settings"
3. Check if "Payment Gateway" is enabled
4. If not, request activation
5. Get your Merchant ID and Merchant Key
6. Generate API keys for integration
7. Update integration in your codebase
```

---

## RBI Regulations

### Payment Aggregator (PA) License

As of March 2020, RBI requires payment aggregators to obtain a license. This affects:

- **Your E-commerce Site**: You are NOT a payment aggregator
- **Razorpay/Paytm**: They ARE payment aggregators (already licensed)
- **Your Responsibility**: Just verify your gateway partner is RBI-compliant

### What This Means for 69Shop.in:

✅ You don't need an RBI license
✅ Use RBI-licensed payment aggregators (Razorpay, Paytm have licenses)
✅ You need proper business registration for gateway approval
✅ Follow PCI-DSS guidelines (handled by the gateway)

---

## Recommended Setup for 69Shop.in

### Primary Gateway: Razorpay
```javascript
// razorpay-config.js
window.razorpayConfig = {
    key_id: 'rzp_live_XXXXXXXXXX',  // Get from Razorpay Dashboard
    company_name: '69Shop.in',
    currency: 'INR',
    theme: {
        color: '#0066ff'
    }
};
```

### Backup Gateway: Paytm
```javascript
// paytm-config.js
window.paytmConfig = {
    mid: 'YOUR_MERCHANT_ID',
    env: 'production',  // or 'staging'
    website: 'DEFAULT',
    industryType: 'Retail',
    channelId: 'WEB'
};
```

---

## Integration Checklist

### Before Going Live:

- [ ] Register business (GST, PAN)
- [ ] Set up business bank account
- [ ] Apply for Razorpay merchant account
- [ ] Submit website for review
- [ ] Complete KYC verification
- [ ] Add required policy pages to website
- [ ] Test with sandbox/test credentials
- [ ] Switch to live credentials
- [ ] Set up webhook endpoints for order updates

### Policy Pages Needed:

1. **Terms & Conditions** (`/terms.html`)
2. **Privacy Policy** (`/privacy.html`)
3. **Refund Policy** (`/refund-policy.html`)
4. **Shipping Policy** (`/shipping-policy.html`)
5. **Contact Us** (`/contact.html`)

---

## Transaction Fees Comparison

| Gateway | Standard Rate | Enterprise Rate | Settlement |
|---------|--------------|-----------------|------------|
| Razorpay | 2.0% | 1.5-1.8% | T+2 |
| Paytm | 1.99% | 1.5-1.75% | T+1 to T+3 |
| PhonePe | 1.99% | Negotiable | T+2 |
| CCAvenue | 2.0-2.5% | 1.8-2.0% | T+3 |

---

## Multi-Gateway Strategy

For reliability, consider implementing multiple gateways:

```javascript
// payment-router.js
const PaymentRouter = {
    primary: 'razorpay',
    fallback: 'paytm',
    
    async processPayment(order) {
        try {
            return await this.processWithGateway(this.primary, order);
        } catch (error) {
            console.warn('Primary gateway failed, trying fallback');
            return await this.processWithGateway(this.fallback, order);
        }
    }
};
```

---

## Summary

1. **Gateway Approval**: Required for all gateways - submit business documents
2. **Existing Paytm ID**: Can be used if business entity matches and online category is enabled
3. **RBI License**: Not needed for you; gateway partners handle this
4. **Timeline**: 2-7 business days for approval
5. **Fees**: 1.5-2% per transaction (negotiable)

---

## Next Steps

1. Gather business documents (GST, PAN, Bank details)
2. Apply on Razorpay Dashboard
3. If using Paytm, log in and check/request online category
4. Add policy pages to website
5. Complete verification
6. Test with sandbox
7. Go live!

---

*Last Updated: January 2025*
*Document: docs/PAYMENT_GATEWAY_GUIDE.md*
