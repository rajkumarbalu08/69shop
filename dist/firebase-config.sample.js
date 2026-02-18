/**
 * Firebase Configuration Sample for 69Shop.in
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing one
 * 3. Go to Project Settings → General → Your apps
 * 4. Click "Add app" → Web (</>)
 * 5. Register app and copy the config object
 * 6. Copy this file to 'firebase-config.js' (same folder)
 * 7. Replace all placeholder values with your actual credentials
 * 
 * IMPORTANT: 
 * - Never commit firebase-config.js with real keys to version control!
 * - The file firebase-config.js is already in .gitignore
 * 
 * SERVICES USED:
 * - Firebase Authentication (Email/Password, Google Sign-in)
 * - Cloud Firestore (Database)
 * - Firebase Storage (Images)
 * - Firebase Hosting
 * - Cloud Functions
 */

window.firebaseConfig = {
    // Your Firebase API Key (found in Project Settings → General)
    apiKey: "YOUR_API_KEY_HERE",
    
    // Auth Domain — use your hosting URL (not .firebaseapp.com) so Google
    // OAuth shows your domain instead of the Firebase default.
    // For custom domains: "yourdomain.com"
    // For Firebase Hosting: "YOUR_PROJECT_ID.web.app"
    authDomain: "shop69-1.firebaseapp.com",
    
    // Your Firebase Project ID
    projectId: "YOUR_PROJECT_ID",
    
    // Your Storage Bucket (usually projectId.appspot.com)
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    
    // Your Messaging Sender ID (for push notifications)
    messagingSenderId: "YOUR_SENDER_ID",
    
    // Your App ID
    appId: "YOUR_APP_ID",
    
    // (Optional) Your Measurement ID for Google Analytics
    measurementId: "G-XXXXXXXXXX"
};

/**
 * ===== FIREBASE SERVICES SETUP =====
 * 
 * After creating your Firebase project, enable these services:
 * 
 * 1. AUTHENTICATION
 *    - Go to Authentication → Sign-in method
 *    - Enable: Email/Password
 *    - Enable: Google (optional, for social login)
 *    - Add authorized domains: localhost, your-domain.web.app
 * 
 * 2. FIRESTORE DATABASE
 *    - Go to Firestore Database → Create database
 *    - Start in production mode
 *    - Select region: asia-south1 (Mumbai) for India
 *    - Deploy security rules from firestore.rules
 * 
 * 3. STORAGE
 *    - Go to Storage → Get started
 *    - Deploy security rules from storage.rules
 * 
 * 4. HOSTING
 *    - Already configured in firebase.json
 *    - Deploy with: firebase deploy --only hosting
 * 
 * 5. CLOUD FUNCTIONS
 *    - Requires Blaze (pay-as-you-go) plan
 *    - Deploy with: firebase deploy --only functions
 * 
 * ===== SECURITY CHECKLIST =====
 * 
 * Before going live:
 * [ ] Review Firestore rules (firestore.rules)
 * [ ] Review Storage rules (storage.rules)
 * [ ] Set up App Check (optional but recommended)
 * [ ] Enable only necessary authentication methods
 * [ ] Set up budget alerts in Google Cloud Console
 */
