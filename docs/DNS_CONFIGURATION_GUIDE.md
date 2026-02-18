# DNS Configuration Guide - 69shop.in

> **Date:** February 17, 2026
> **Domain:** 69shop.in
> **Firebase Project:** shop69-1
> **Current Hosting:** https://shop69-1.web.app

---

## Step-by-Step DNS Setup

### Step 1: Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/shop69-1/hosting/sites)
2. Click **Hosting** in the left sidebar
3. Click **Add custom domain**
4. Enter `69shop.in` and click **Continue**
5. Firebase will show you the DNS records to add
6. Repeat for `www.69shop.in`

### Step 2: Add DNS Records at Your Domain Registrar

Log in to your domain registrar (GoDaddy, Namecheap, Google Domains, Hostinger, etc.) and add these records:

#### For Root Domain (69shop.in)

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| A | @ | `151.101.1.195` | 3600 |
| A | @ | `151.101.65.195` | 3600 |

> **Note:** Firebase will provide the exact IP addresses during Step 1. The IPs above are examples. Use the ones Firebase shows you.

#### For www Subdomain (www.69shop.in)

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| CNAME | www | `shop69-1.web.app` | 3600 |

#### TXT Record for Verification (if requested)

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | @ | `firebase=shop69-1` (or the value Firebase provides) | 3600 |

### Step 3: Wait for DNS Propagation

- DNS changes take **15 minutes to 48 hours** to propagate globally
- You can check propagation status at: https://dnschecker.org
- Search for `69shop.in` and check A records

### Step 4: SSL Certificate Provisioning

- Firebase automatically provisions a free SSL certificate via Let's Encrypt
- This happens after DNS verification succeeds
- The certificate covers both `69shop.in` and `www.69shop.in`
- Status will show as "Needs setup" → "Pending" → "Connected" in Firebase Console

### Step 5: Verify Setup

Once DNS propagation is complete:
1. Visit `https://69shop.in` - should load your site
2. Visit `https://www.69shop.in` - should redirect to `69shop.in`
3. Visit `http://69shop.in` - should auto-redirect to HTTPS
4. Check SSL padlock icon in the browser

---

## Post-DNS Configuration

### Update CORS Configuration

After DNS is active, update `cors.json` to include the new domain:

```json
[
  {
    "origin": [
      "https://shop69-1.web.app",
      "https://69shop.in",
      "https://www.69shop.in",
      "http://localhost:5000"
    ],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Apply the updated CORS:
```bash
gsutil cors set cors.json gs://shop69-1.appspot.com
```

### Update Firebase Auth Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add:
   - `69shop.in`
   - `www.69shop.in`
3. This allows Google Sign-In and other OAuth providers to work on the custom domain

### Update Razorpay Webhook URLs (When KYC is Approved)

Update your Razorpay Dashboard webhook URL to use the custom domain if preferred.

---

## Registrar-Specific Instructions

### GoDaddy
1. My Products → DNS → Manage
2. Add A Record: Host `@`, Points to `<Firebase IP>`
3. Add CNAME: Host `www`, Points to `shop69-1.web.app`

### Namecheap
1. Domain List → Manage → Advanced DNS
2. Add A Record: Host `@`, Value `<Firebase IP>`
3. Add CNAME: Host `www`, Value `shop69-1.web.app.`

### Hostinger
1. Domains → Manage → DNS Zone
2. Add A Record: Name `@`, Points to `<Firebase IP>`
3. Add CNAME: Name `www`, Points to `shop69-1.web.app`

### Google Domains
1. DNS → Custom records → Manage custom records
2. Add A Record: Host `@`, Data `<Firebase IP>`
3. Add CNAME: Host `www`, Data `shop69-1.web.app`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Needs setup" stuck for 24+ hours | Double-check DNS records, ensure no conflicting records |
| SSL certificate not provisioning | Remove any existing CAA records or add `letsencrypt.org` |
| www not working | Ensure CNAME record points to `shop69-1.web.app` (with trailing dot for some registrars) |
| Domain shows wrong site | Clear browser cache, check for conflicting A records |
| ERR_NAME_NOT_RESOLVED | DNS propagation still in progress, wait 24-48 hours |

---

## Verification Checklist

- [ ] Firebase custom domain added for `69shop.in`
- [ ] Firebase custom domain added for `www.69shop.in`
- [ ] A records added at domain registrar
- [ ] CNAME record added for `www`
- [ ] TXT verification record added (if requested)
- [ ] DNS propagation confirmed (dnschecker.org)
- [ ] SSL certificate status shows "Connected"
- [ ] CORS configuration updated with new domain
- [ ] Firebase Auth authorized domains updated
- [ ] Site loads correctly on `https://69shop.in`
- [ ] HTTPS redirect working
- [ ] www redirect working
