class AuthManager {
    constructor(options = {}) {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.options = options;
        this.unsubscribe = null;
        this.currentUserData = null;
        
        // Initialize auth state listener
        this.initAuthStateListener();
    }

    initAuthStateListener() {
        this.unsubscribe = this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log("User authenticated:", user.email);
                await this.loadUserData(user);
                this.updateUserDisplay();
                this.notifyUserDataReady(user);
                // Sync wishlist from Firestore on login
                if (typeof productManager !== 'undefined' && productManager?.loadWishlistFromFirestore) {
                    productManager.loadWishlistFromFirestore();
                }
            } else {
                console.log("No user authenticated, staying as guest.");
                this.currentUserData = null;
                this.updateGuestDisplay();
                this.notifyUserDataReady(null);
                // Allow guests to browse - no redirect
            }
        });
    }
    
    updateGuestDisplay() {
        // Show guest-specific UI elements
        const profileFooterLoggedIn = document.getElementById('profileFooterLoggedIn');
        const profileFooterGuest = document.getElementById('profileFooterGuest');
        const profileBadge = document.getElementById('profileBadge');
        const profileMenu = document.querySelector('.profile-menu');
        const sellerDashboardLink = document.getElementById('sellerDashboardLink');
        const becomeSellerLink = document.getElementById('becomeSellerLink');
        
        // Hide logout, show login buttons
        if (profileFooterLoggedIn) profileFooterLoggedIn.style.display = 'none';
        if (profileFooterGuest) profileFooterGuest.style.display = 'block';
        
        // Update badge to show guest
        if (profileBadge) {
            profileBadge.textContent = 'Guest';
            profileBadge.style.background = 'var(--light-grey)';
            profileBadge.style.color = 'var(--medium-grey)';
        }
        
        // Hide seller-specific links
        if (sellerDashboardLink) sellerDashboardLink.style.display = 'none';
        if (becomeSellerLink) becomeSellerLink.style.display = 'block';
        
        // Mark profile menu items that require login
        if (profileMenu) {
            const loginRequiredItems = profileMenu.querySelectorAll('[data-profile-link]');
            loginRequiredItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!this.currentUserData) {
                        e.preventDefault();
                        this.showLoginPrompt('Please login to access your profile');
                    }
                });
            });
        }
    }
    
    showLoginPrompt(message = 'Please login to continue') {
        const modal = document.createElement('div');
        modal.id = 'loginPromptModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 32px; border-radius: 16px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #0066ff, #00a8ff); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-user-lock" style="font-size: 28px; color: white;"></i>
                </div>
                <h3 style="font-family: 'Poppins', sans-serif; font-size: 1.3rem; margin-bottom: 10px; color: var(--primary-black);">Login Required</h3>
                <p style="color: var(--medium-grey); margin-bottom: 24px; font-size: 0.95rem;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="document.getElementById('loginPromptModal').remove()" style="padding: 12px 24px; border: 1px solid var(--medium-grey); background: white; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        Continue Browsing
                    </button>
                    <a href="/shop-login.html" style="padding: 12px 24px; background: var(--blue-primary); color: white; border-radius: 8px; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sign-in-alt"></i>
                        Login / Sign Up
                    </a>
                </div>
                <p style="margin-top: 16px; font-size: 0.8rem; color: var(--medium-grey);">
                    <i class="fas fa-gift" style="color: #22C55E;"></i> New users get ₹500 welcome credit!
                </p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async loadUserData(firebaseUser) {
        try {
            // First check if user is a seller
            const sellerDoc = await this.db.collection('sellers').doc(firebaseUser.uid).get();
            
            if (sellerDoc.exists) {
                // User is a seller
                const sellerData = sellerDoc.data();
                this.currentUserData = {
                    uid: firebaseUser.uid,
                    name: sellerData.businessName || firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    email: firebaseUser.email,
                    accountType: 'seller',
                    sellerType: sellerData.sellerType || 'product',
                    photoURL: firebaseUser.photoURL || '',
                    ...sellerData
                };
                // Cache seller status for persistence
                localStorage.setItem('69shop_user_type', JSON.stringify({
                    uid: firebaseUser.uid,
                    accountType: 'seller',
                    email: firebaseUser.email,
                    name: this.currentUserData.name,
                    sellerType: this.currentUserData.sellerType,
                    timestamp: Date.now()
                }));
                console.log("Loaded seller data from Firestore:", this.currentUserData);
                return;
            }
            
            // Try to get user data from users collection
            const userDoc = await this.db.collection('users').doc(firebaseUser.uid).get();
            
            if (userDoc.exists) {
                this.currentUserData = {
                    uid: firebaseUser.uid,
                    ...userDoc.data()
                };
                console.log("Loaded user data from Firestore:", this.currentUserData);
            } else {
                // If no Firestore document, create one
                this.currentUserData = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    email: firebaseUser.email,
                    accountType: 'buyer',
                    createdAt: new Date().toISOString(),
                    photoURL: firebaseUser.photoURL || '',
                    hasSeenWelcomeOffer: false
                };
                
                // Create user document in Firestore
                await this.db.collection('users').doc(firebaseUser.uid).set({
                    ...this.currentUserData,
                    uid: firebaseUser.uid,
                    lastLogin: new Date().toISOString()
                });
            }
            this.currentUserData.photoURL = this.currentUserData.photoURL || firebaseUser.photoURL || '';
        } catch (error) {
            console.error("Error loading user data:", error);
            
            // Check localStorage cache for seller status (important when Firestore permissions fail)
            try {
                const cachedUser = localStorage.getItem('69shop_user_type');
                if (cachedUser) {
                    const cached = JSON.parse(cachedUser);
                    // Verify this cache is for the current user and not stale (max 24 hours)
                    if (cached.uid === firebaseUser.uid && 
                        cached.accountType === 'seller' && 
                        (Date.now() - cached.timestamp) < 24 * 60 * 60 * 1000) {
                        console.log("Using cached seller data from localStorage");
                        this.currentUserData = {
                            uid: firebaseUser.uid,
                            name: cached.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
                            email: firebaseUser.email,
                            accountType: 'seller',
                            sellerType: cached.sellerType || 'product',
                            photoURL: firebaseUser.photoURL || ''
                        };
                        return;
                    }
                }
            } catch (cacheError) {
                console.warn("Could not read cached user type:", cacheError);
            }
            
            // Fallback to basic user info
            this.currentUserData = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                accountType: 'buyer',
                photoURL: firebaseUser.photoURL || ''
            };
        }
    }

    notifyUserDataReady(user) {
        if (typeof this.options.onUserDataReady === 'function') {
            try {
                this.options.onUserDataReady(user, this.currentUserData);
            } catch (error) {
                console.warn('Auth callback failed:', error);
            }
        }
    }

    applyAvatarStyling(element, fallbackLetter, photoURL) {
        if (!element) return;
        if (photoURL) {
            element.classList.add('has-photo');
            element.style.backgroundImage = `url('${photoURL}')`;
            element.textContent = '';
        } else {
            element.classList.remove('has-photo');
            element.style.backgroundImage = '';
            element.textContent = fallbackLetter;
        }
    }

    updateUserDisplay() {
        if (!this.currentUserData) return;
        
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const profileNameLarge = document.getElementById('profileNameLarge');
        const profileEmail = document.getElementById('profileEmail');
        const profileAvatarLarge = document.getElementById('profileAvatarLarge');
        const profileBadge = document.getElementById('profileBadge');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const sellerDashboardLink = document.getElementById('sellerDashboardLink');
        const becomeSellerLink = document.getElementById('becomeSellerLink');
        
        // Extract first letter for avatar
        const firstLetter = this.currentUserData.name.charAt(0).toUpperCase();
        const photoURL = this.currentUserData.photoURL || this.auth.currentUser?.photoURL || '';
        
        // Update all user display elements
        if (userName) userName.textContent = this.currentUserData.name;
        this.applyAvatarStyling(userAvatar, firstLetter, photoURL);
        if (profileNameLarge) profileNameLarge.textContent = this.currentUserData.name;
        if (profileEmail) profileEmail.textContent = this.currentUserData.email;
        this.applyAvatarStyling(profileAvatarLarge, firstLetter, photoURL);
        if (profileBadge) profileBadge.textContent = 
            this.currentUserData.accountType === 'seller' ? 'Seller Account' : 'Buyer Account';
        if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${this.currentUserData.name}!`;
        
        // Show/hide seller dashboard link based on account type
        if (this.currentUserData.accountType === 'seller') {
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'block';
            if (becomeSellerLink) becomeSellerLink.style.display = 'none';
            // Hide buyer-only menu items for sellers
            document.querySelectorAll('.buyer-menu-item').forEach(item => {
                item.style.display = 'none';
            });
        } else {
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'none';
            if (becomeSellerLink) becomeSellerLink.style.display = 'block';
            // Show buyer menu items for buyers
            document.querySelectorAll('.buyer-menu-item').forEach(item => {
                item.style.display = '';
            });
        }
        
        // Show logged-in footer, hide guest footer
        const profileFooterLoggedIn = document.getElementById('profileFooterLoggedIn');
        const profileFooterGuest = document.getElementById('profileFooterGuest');
        if (profileFooterLoggedIn) profileFooterLoggedIn.style.display = 'block';
        if (profileFooterGuest) profileFooterGuest.style.display = 'none';
        
        // Reset badge styling for logged-in users
        if (profileBadge) {
            profileBadge.style.background = '';
            profileBadge.style.color = '';
        }
    }

    async logout() {
        try {
            // Clear cached user type
            localStorage.removeItem('69shop_user_type');
            await this.auth.signOut();
            // Stay on shop as guest instead of redirecting to login
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
            alert('Error logging out. Please try again.');
        }
    }

    getUserData() {
        return this.currentUserData;
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}
