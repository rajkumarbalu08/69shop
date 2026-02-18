# 69Shop.in Configuration Setup Guide

> **Last Updated:** February 1, 2026  
> **Purpose:** Complete setup guide for all required configuration files

---

## Quick Setup Checklist

| Config File | Location | Required For |
|-------------|----------|--------------|
| `firebase-config.js` | `dist/` | Authentication, Database, Storage |
| `razorpay-config.js` | `dist/` | Payment processing |
| `emailjs-config.js` | `dist/js/` | Transactional emails (client-side) |
| `mail.config.enc.json` | `functions/secrets/` | Server-side emails |
| `.runtimeconfig.json` | `functions/` | Local function testing |

---

## 1. Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `69shop-production`
4. Enable Google Analytics (optional)
5. Select region: `asia-south1` (Mumbai)

### Step 2: Register Web App

1. In Project Overview, click the **Web** icon (`</>`)
2. Register app with nickname: `69Shop Web`
3. Copy the configuration object

### Step 3: Create Config File

```bash
# Copy sample to actual config
cp dist/firebase-config.sample.js dist/firebase-config.js
```

Edit `dist/firebase-config.js`:

```javascript
window.firebaseConfig = {
    apiKey: "AIzaSyB.....................",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
    measurementId: "G-XXXXXXXXXX"
};
```

### Step 4: Enable Services

**Authentication:**
```
Firebase Console → Authentication → Sign-in method
✅ Email/Password
✅ Google (optional)
```

**Firestore:**
```
Firebase Console → Firestore → Create database
- Production mode
- Region: asia-south1
```

**Storage:**
```
Firebase Console → Storage → Get started
- Production mode
- Region: asia-south1
```

### Step 5: Deploy Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 2. Razorpay Configuration

### Step 1: Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up with business details
3. Complete KYC verification

### Step 2: Get API Keys

1. Go to **Settings → API Keys**
2. Generate **Test Mode** keys first
3. After testing, generate **Live Mode** keys

### Step 3: Create Config File

```bash
cp dist/razorpay-config.sample.js dist/razorpay-config.js
```

Edit `dist/razorpay-config.js`:

```javascript
window.razorpayConfig = {
    // Use test key during development
    key_id: 'rzp_test_xxxxxxxxxxxx',
    
    // Live key for production
    // key_id: 'rzp_live_xxxxxxxxxxxx',
};
```

### Step 4: Server-Side Setup (for order creation)

Create Cloud Function environment variable:

```bash
firebase functions:config:set razorpay.key_id="rzp_live_xxx" razorpay.key_secret="xxxxx"
```

### Step 5: Webhook Setup (for payment verification)

1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://us-central1-your-project.cloudfunctions.net/razorpayWebhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret for server verification

---

## 3. EmailJS Configuration (Client-Side Emails)

### Step 1: Create EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up (free tier: 200 emails/month)

### Step 2: Connect Email Service

1. Go to **Email Services → Add New Service**
2. Select Gmail or other provider
3. Authorize access
4. Note the **Service ID**

### Step 3: Create Email Templates

Create these templates in EmailJS Dashboard:

| Template Name | Template ID | Purpose |
|---------------|-------------|---------|
| Order Confirmation | `template_order_confirm` | Sent after successful order |
| Shipping Update | `template_shipped` | Sent when order ships |
| Welcome Email | `template_welcome` | Sent after registration |

### Step 4: Create Config File

```bash
cp dist/js/emailjs-config.sample.js dist/js/emailjs-config.js
```

Edit with your credentials.

---

## 4. Server-Side Email (Cloud Functions)

### Option A: Firebase Runtime Config

```bash
firebase functions:config:set \
  mail.host="smtp.gmail.com" \
  mail.port="465" \
  mail.secure="true" \
  mail.user="noreply@69shop.in" \
  mail.pass="YOUR_APP_PASSWORD" \
  mail.from="69Shop.in <noreply@69shop.in>" \
  mail.to="support@69shop.in"
```

### Option B: Encrypted Config File

1. Create plaintext config:

```json
{
  "host": "smtp.gmail.com",
  "port": 465,
  "secure": true,
  "user": "noreply@69shop.in",
  "pass": "YOUR_APP_PASSWORD",
  "from": "69Shop.in <noreply@69shop.in>",
  "to": "support@69shop.in"
}
```

2. Encrypt using the provided script:

```bash
cd functions
node scripts/encrypt-mail-config.js
```

3. Set the encryption key:

```bash
firebase functions:config:set secrets.mail_key="YOUR_ENCRYPTION_KEY"
```

### Gmail App Password Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to **App passwords**
4. Generate password for "Mail"
5. Use this 16-character password in config

---

## 5. Local Development Setup

### Create Local Runtime Config

For local function testing, create `functions/.runtimeconfig.json`:

```json
{
  "mail": {
    "host": "smtp.gmail.com",
    "port": "465",
    "secure": "true",
    "user": "your-email@gmail.com",
    "pass": "xxxx-xxxx-xxxx-xxxx",
    "from": "69Shop.in <your-email@gmail.com>",
    "to": "test@example.com"
  },
  "razorpay": {
    "key_id": "rzp_test_xxxxxxxxxxxx",
    "key_secret": "xxxxxxxxxxxxxxxxxxxx"
  },
  "secrets": {
    "mail_key": "your-encryption-key"
  }
}
```

**Note:** This file is in `.gitignore` and should never be committed.

### Run Functions Locally

```bash
cd functions
npm install
firebase emulators:start --only functions
```

---

## 6. Environment Variables Summary

### Firebase Functions Config

```bash
# View current config
firebase functions:config:get

# Set all required configs
firebase functions:config:set \
  mail.host="smtp.gmail.com" \
  mail.port="465" \
  mail.secure="true" \
  mail.user="noreply@69shop.in" \
  mail.pass="APP_PASSWORD" \
  mail.from="69Shop.in <noreply@69shop.in>" \
  mail.to="support@69shop.in" \
  razorpay.key_id="rzp_live_xxx" \
  razorpay.key_secret="xxx" \
  secrets.mail_key="encryption-key"

# Deploy functions with new config
firebase deploy --only functions
```

---

## 7. Security Best Practices

### ✅ DO:
- Keep all `*-config.js` files in `.gitignore`
- Use test keys during development
- Rotate API keys periodically
- Use App Check for additional security
- Set up budget alerts in Google Cloud

### ❌ DON'T:
- Commit real API keys to git
- Expose `key_secret` in frontend code
- Use production keys for testing
- Share config files via email/chat

---

## 8. Verification Checklist

After setup, verify each service works:

```bash
# 1. Test Firebase connection
# Open browser console on shop.html, check for errors

# 2. Test Firestore rules
firebase emulators:start
# Run: npm test

# 3. Test payments (use Razorpay test cards)
# Card: 4111 1111 1111 1111
# Expiry: Any future date
# CVV: Any 3 digits

# 4. Test emails
# Trigger a test order or use EmailJS testing
```

---

## Troubleshooting

### Firebase Auth Errors
- **auth/invalid-api-key:** Check `apiKey` in config
- **auth/unauthorized-domain:** Add domain to Firebase Console → Authentication → Settings → Authorized domains

### Razorpay Errors
- **BAD_REQUEST_ERROR:** Invalid key_id format
- **checkout.js not loaded:** Check script src in HTML

### Email Errors
- **Invalid login:** Use App Password, not regular password
- **Connection refused:** Check host/port settings
- **Rate limit:** Upgrade EmailJS plan or use server-side

---

*Setup guide maintained by 69Shop.in Development Team*
