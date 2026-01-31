/**
 * Razorpay Configuration Sample
 * 
 * Copy this file to razorpay-config.js and replace with your actual Razorpay credentials.
 * 
 * To get your Razorpay API keys:
 * 1. Sign up at https://razorpay.com/
 * 2. Go to Dashboard → Settings → API Keys
 * 3. Generate your Test/Live keys
 * 
 * IMPORTANT: Never commit razorpay-config.js with real keys to version control!
 */

window.razorpayConfig = {
    // Test mode key (starts with rzp_test_)
    key_id: 'rzp_test_YOUR_KEY_ID',
    
    // For server-side order creation (keep secret on server only!)
    // key_secret: 'YOUR_KEY_SECRET',  // Never expose in frontend!
    
    // Webhook secret for payment verification (server-side only)
    // webhook_secret: 'YOUR_WEBHOOK_SECRET'
};
