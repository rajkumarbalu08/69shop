/**
 * 69SHOP.IN - Lead Generation System
 * Newsletter popups, signup prompts, exit intent
 * Replaces guest checkout to capture user data
 */

(function() {
    'use strict';

    const LeadGeneration = {
        config: {
            // Timing configurations
            welcomePopupDelay: 5000,         // 5 seconds after page load
            browsePromptAfterProducts: 5,    // After viewing X products
            scrollDepthTrigger: 50,          // Scroll 50% of page
            idleTimePrompt: 60000,           // 1 minute idle
            exitIntentEnabled: true,
            returnVisitorDelay: 3000,        // 3 seconds for return visitors
            
            // Storage keys
            storageKeys: {
                newsletterShown: '69shop_newsletter_shown',
                newsletterSubscribed: '69shop_newsletter_subscribed',
                signupPromptShown: '69shop_signup_prompt_shown',
                productsViewed: '69shop_products_viewed',
                visitCount: '69shop_visit_count',
                lastVisit: '69shop_last_visit'
            }
        },

        state: {
            newsletterShown: false,
            signupPromptShown: false,
            exitIntentShown: false,
            productsViewed: 0,
            scrollDepthReached: false,
            idleTimer: null
        },

        /**
         * Initialize lead generation
         */
        init() {
            this.loadState();
            this.trackVisit();
            this.createModals();
            this.bindEvents();
            this.listenForAuthChanges();
            
            // Delay starting timers to allow auth to initialize
            setTimeout(() => {
                this.startTimers();
            }, 1000);
            
            console.log('📧 Lead Generation initialized');
        },

        /**
         * Listen for Firebase auth state changes
         */
        listenForAuthChanges() {
            // If user logs in, close all popups and disable future prompts
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        // User logged in - close any open popups
                        this.closePopup('newsletterPopup');
                        this.closePopup('signupPrompt');
                        this.closePopup('exitIntentPopup');
                        
                        // Mark as shown so they don't appear again
                        this.state.newsletterShown = true;
                        this.state.signupPromptShown = true;
                        this.state.exitIntentShown = true;
                        
                        console.log('📧 User logged in - lead gen popups disabled');
                    }
                });
            }
        },

        /**
         * Load state from storage
         */
        loadState() {
            const subscribed = localStorage.getItem(this.config.storageKeys.newsletterSubscribed);
            if (subscribed === 'true') {
                this.state.newsletterShown = true; // Don't show if already subscribed
            }
            
            const viewed = parseInt(localStorage.getItem(this.config.storageKeys.productsViewed)) || 0;
            this.state.productsViewed = viewed;
        },

        /**
         * Track visit count
         */
        trackVisit() {
            let visitCount = parseInt(localStorage.getItem(this.config.storageKeys.visitCount)) || 0;
            visitCount++;
            localStorage.setItem(this.config.storageKeys.visitCount, visitCount);
            localStorage.setItem(this.config.storageKeys.lastVisit, Date.now());
        },

        /**
         * Create all modal HTML
         */
        createModals() {
            // Newsletter Popup
            this.createNewsletterPopup();
            
            // Signup Prompt
            this.createSignupPrompt();
            
            // Exit Intent
            this.createExitIntent();
            
            // Inject styles
            this.injectStyles();
        },

        /**
         * Newsletter popup
         */
        createNewsletterPopup() {
            const popup = document.createElement('div');
            popup.className = 'lead-popup-overlay';
            popup.id = 'newsletterPopup';
            popup.innerHTML = `
                <div class="lead-popup newsletter-popup">
                    <button class="lead-popup-close" data-close="newsletterPopup">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="popup-visual">
                        <div class="popup-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="popup-confetti"></div>
                    </div>
                    
                    <div class="popup-content">
                        <span class="popup-badge">Exclusive Offer</span>
                        <h2>Get 10% OFF Your First Order!</h2>
                        <p>Subscribe to our newsletter and unlock exclusive deals, early access to sales, and personalized recommendations.</p>
                        
                        <form class="newsletter-form" id="newsletterForm">
                            <div class="form-group">
                                <input type="email" id="newsletterEmail" placeholder="Enter your email" required>
                            </div>
                            <button type="submit" class="btn-subscribe">
                                <i class="fas fa-paper-plane"></i>
                                Subscribe & Get 10% OFF
                            </button>
                        </form>
                        
                        <p class="popup-note">
                            <i class="fas fa-lock"></i>
                            We respect your privacy. Unsubscribe anytime.
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
        },

        /**
         * Signup prompt (for cart/checkout)
         */
        createSignupPrompt() {
            const popup = document.createElement('div');
            popup.className = 'lead-popup-overlay';
            popup.id = 'signupPrompt';
            popup.innerHTML = `
                <div class="lead-popup signup-popup">
                    <button class="lead-popup-close" data-close="signupPrompt">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="popup-header-visual">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    
                    <div class="popup-content">
                        <h2>Create Your Account</h2>
                        <p>Sign up to complete your purchase and enjoy exclusive benefits!</p>
                        
                        <ul class="signup-benefits">
                            <li><i class="fas fa-check-circle"></i> Track your orders in real-time</li>
                            <li><i class="fas fa-check-circle"></i> Save items to your wishlist</li>
                            <li><i class="fas fa-check-circle"></i> Faster checkout with saved addresses</li>
                            <li><i class="fas fa-check-circle"></i> Exclusive member-only deals</li>
                            <li><i class="fas fa-check-circle"></i> Early access to sales</li>
                        </ul>
                        
                        <div class="signup-actions">
                            <a href="/shop-login.html" class="btn-signup-primary">
                                <i class="fas fa-user-plus"></i>
                                Sign Up Now
                            </a>
                            <a href="/shop-login.html" class="btn-login-secondary">
                                Already have an account? Log in
                            </a>
                        </div>
                        
                        <div class="social-signup">
                            <span>Or continue with</span>
                            <button class="btn-social google" onclick="window.location.href='/shop-login.html?provider=google'">
                                <i class="fab fa-google"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
        },

        /**
         * Exit intent popup
         */
        createExitIntent() {
            const popup = document.createElement('div');
            popup.className = 'lead-popup-overlay';
            popup.id = 'exitIntentPopup';
            popup.innerHTML = `
                <div class="lead-popup exit-popup">
                    <button class="lead-popup-close" data-close="exitIntentPopup">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="exit-visual">
                        <i class="fas fa-hand-paper"></i>
                    </div>
                    
                    <div class="popup-content">
                        <h2>Wait! Don't Leave Empty Handed</h2>
                        <p>We noticed you're about to leave. Here's a special offer just for you!</p>
                        
                        <div class="exit-offer">
                            <div class="offer-badge">LIMITED TIME</div>
                            <div class="offer-value">15% OFF</div>
                            <div class="offer-code">
                                Use code: <span id="exitOfferCode">STAY15</span>
                                <button class="copy-code" data-copy="STAY15">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="exit-actions">
                            <button class="btn-stay" id="btnStayShopping">
                                <i class="fas fa-shopping-bag"></i>
                                Continue Shopping
                            </button>
                            <button class="btn-email-offer" id="btnEmailOffer">
                                <i class="fas fa-envelope"></i>
                                Email Me This Offer
                            </button>
                        </div>
                        
                        <div class="email-capture" id="exitEmailCapture" style="display: none;">
                            <input type="email" id="exitEmail" placeholder="Enter your email">
                            <button type="button" id="sendExitOffer">Send Offer</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
        },

        /**
         * Inject styles
         */
        injectStyles() {
            if (document.getElementById('lead-gen-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'lead-gen-styles';
            styles.textContent = `
                /* Lead Popup Overlay */
                .lead-popup-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .lead-popup-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                /* Base Popup */
                .lead-popup {
                    background: var(--white);
                    border-radius: 20px;
                    max-width: 480px;
                    width: 100%;
                    position: relative;
                    transform: scale(0.9) translateY(30px);
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
                }
                
                .lead-popup-overlay.active .lead-popup {
                    transform: scale(1) translateY(0);
                }
                
                .lead-popup-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                }
                
                .lead-popup-close:hover {
                    background: #EF4444;
                    color: white;
                }
                
                /* Newsletter Popup */
                .newsletter-popup .popup-visual {
                    background: linear-gradient(135deg, var(--blue-primary) 0%, #009cf7 100%);
                    padding: 40px 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .newsletter-popup .popup-icon {
                    width: 80px;
                    height: 80px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    font-size: 2rem;
                    color: var(--blue-primary);
                    animation: bounce 1s ease infinite;
                }
                
                .popup-content {
                    padding: 30px;
                    text-align: center;
                }
                
                .popup-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
                    color: white;
                    padding: 6px 16px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 16px;
                }
                
                .popup-content h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: var(--primary-black);
                }
                
                .popup-content p {
                    color: var(--medium-grey);
                    margin-bottom: 24px;
                    line-height: 1.6;
                }
                
                /* Newsletter Form */
                .newsletter-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .newsletter-form input {
                    padding: 14px 20px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                }
                
                .newsletter-form input:focus {
                    outline: none;
                    border-color: var(--blue-primary);
                    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
                }
                
                .btn-subscribe {
                    padding: 16px 24px;
                    background: linear-gradient(135deg, var(--blue-primary) 0%, #009cf7 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s ease;
                }
                
                .btn-subscribe:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 102, 255, 0.3);
                }
                
                .popup-note {
                    font-size: 0.8rem;
                    color: #999;
                    margin-top: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                
                /* Signup Popup */
                .signup-popup .popup-header-visual {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    padding: 30px;
                    text-align: center;
                    color: white;
                    font-size: 2.5rem;
                }
                
                .signup-benefits {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 24px;
                    text-align: left;
                }
                
                .signup-benefits li {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 0;
                    color: var(--text-dark);
                    font-size: 0.95rem;
                }
                
                .signup-benefits li i {
                    color: #10B981;
                }
                
                .signup-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .btn-signup-primary {
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s ease;
                }
                
                .btn-signup-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
                }
                
                .btn-login-secondary {
                    color: var(--blue-primary);
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: color 0.2s ease;
                }
                
                .btn-login-secondary:hover {
                    text-decoration: underline;
                }
                
                .social-signup {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding-top: 16px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .social-signup span {
                    color: #999;
                    font-size: 0.85rem;
                }
                
                .btn-social {
                    width: 44px;
                    height: 44px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                }
                
                .btn-social.google:hover {
                    border-color: #DB4437;
                    color: #DB4437;
                }
                
                /* Exit Intent Popup */
                .exit-popup .exit-visual {
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    padding: 30px;
                    text-align: center;
                    color: white;
                    font-size: 3rem;
                }
                
                .exit-offer {
                    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    text-align: center;
                }
                
                .offer-badge {
                    display: inline-block;
                    background: #EF4444;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 999px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                }
                
                .offer-value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--primary-black);
                    margin-bottom: 12px;
                }
                
                .offer-code {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 1rem;
                    color: #666;
                }
                
                .offer-code span {
                    background: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-family: monospace;
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: var(--primary-black);
                    border: 2px dashed #ccc;
                }
                
                .copy-code {
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .copy-code:hover {
                    background: var(--blue-primary);
                    color: white;
                }
                
                .exit-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .btn-stay {
                    flex: 1;
                    padding: 14px 20px;
                    background: var(--blue-primary);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .btn-stay:hover {
                    background: var(--blue-dark);
                }
                
                .btn-email-offer {
                    flex: 1;
                    padding: 14px 20px;
                    background: white;
                    color: var(--text-dark);
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .btn-email-offer:hover {
                    border-color: var(--blue-primary);
                    color: var(--blue-primary);
                }
                
                .email-capture {
                    margin-top: 16px;
                    display: flex;
                    gap: 8px;
                }
                
                .email-capture input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.95rem;
                }
                
                .email-capture button {
                    padding: 12px 20px;
                    background: var(--blue-primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                /* Success State */
                .popup-success {
                    text-align: center;
                    padding: 40px;
                }
                
                .popup-success i {
                    font-size: 4rem;
                    color: #10B981;
                    margin-bottom: 20px;
                }
                
                .popup-success h3 {
                    font-size: 1.5rem;
                    margin-bottom: 12px;
                }
                
                /* Animations */
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                /* Mobile */
                @media (max-width: 480px) {
                    .lead-popup {
                        max-width: 100%;
                        margin: 10px;
                        border-radius: 16px;
                    }
                    
                    .popup-content {
                        padding: 20px;
                    }
                    
                    .popup-content h2 {
                        font-size: 1.4rem;
                    }
                    
                    .exit-actions {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Bind events
         */
        bindEvents() {
            // Close buttons
            document.querySelectorAll('[data-close]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const popupId = btn.dataset.close;
                    this.closePopup(popupId);
                });
            });
            
            // Overlay click to close
            document.querySelectorAll('.lead-popup-overlay').forEach(overlay => {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.closePopup(overlay.id);
                    }
                });
            });
            
            // Newsletter form
            document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubmit();
            });
            
            // Exit intent buttons
            document.getElementById('btnStayShopping')?.addEventListener('click', () => {
                this.closePopup('exitIntentPopup');
            });
            
            document.getElementById('btnEmailOffer')?.addEventListener('click', () => {
                document.getElementById('exitEmailCapture').style.display = 'flex';
            });
            
            document.getElementById('sendExitOffer')?.addEventListener('click', () => {
                this.handleExitOfferEmail();
            });
            
            // Copy code
            document.querySelectorAll('.copy-code').forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.dataset.copy;
                    navigator.clipboard.writeText(code);
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                });
            });
            
            // Track product views
            document.addEventListener('click', (e) => {
                if (e.target.closest('.product-card') || e.target.closest('[data-quick-view]')) {
                    this.trackProductView();
                }
            });
            
            // Scroll depth tracking
            window.addEventListener('scroll', () => this.checkScrollDepth());
            
            // Exit intent (mouse leaves viewport)
            if (this.config.exitIntentEnabled) {
                document.addEventListener('mouseout', (e) => {
                    if (e.clientY < 10 && !this.state.exitIntentShown) {
                        this.showExitIntent();
                    }
                });
            }
            
            // Idle timer reset on activity
            ['mousemove', 'keypress', 'scroll', 'click'].forEach(event => {
                document.addEventListener(event, () => this.resetIdleTimer());
            });
            
            // Intercept checkout for non-logged-in users
            this.interceptCheckout();
        },

        /**
         * Start timers
         */
        startTimers() {
            // Welcome popup after delay
            if (!this.state.newsletterShown && !this.isLoggedIn()) {
                const delay = this.isReturnVisitor() 
                    ? this.config.returnVisitorDelay 
                    : this.config.welcomePopupDelay;
                    
                setTimeout(() => {
                    if (!this.state.newsletterShown) {
                        this.showPopup('newsletterPopup');
                        this.state.newsletterShown = true;
                    }
                }, delay);
            }
            
            // Idle timer
            this.resetIdleTimer();
        },

        /**
         * Reset idle timer
         */
        resetIdleTimer() {
            if (this.state.idleTimer) {
                clearTimeout(this.state.idleTimer);
            }
            
            this.state.idleTimer = setTimeout(() => {
                if (!this.state.signupPromptShown && !this.isLoggedIn()) {
                    this.showPopup('signupPrompt');
                    this.state.signupPromptShown = true;
                }
            }, this.config.idleTimePrompt);
        },

        /**
         * Check scroll depth
         */
        checkScrollDepth() {
            if (this.state.scrollDepthReached) return;
            
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (scrolled >= this.config.scrollDepthTrigger) {
                this.state.scrollDepthReached = true;
                // Could trigger a subtle prompt here
            }
        },

        /**
         * Track product view
         */
        trackProductView() {
            this.state.productsViewed++;
            localStorage.setItem(this.config.storageKeys.productsViewed, this.state.productsViewed);
            
            // After viewing X products, show signup prompt
            if (this.state.productsViewed >= this.config.browsePromptAfterProducts 
                && !this.state.signupPromptShown 
                && !this.isLoggedIn()) {
                setTimeout(() => {
                    this.showPopup('signupPrompt');
                    this.state.signupPromptShown = true;
                }, 2000);
            }
        },

        /**
         * Show exit intent
         */
        showExitIntent() {
            if (this.isLoggedIn()) return;
            
            this.state.exitIntentShown = true;
            this.showPopup('exitIntentPopup');
        },

        /**
         * Intercept checkout for non-logged-in users
         */
        interceptCheckout() {
            // Override the checkout button behavior
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', (e) => {
                    if (!this.isLoggedIn()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showPopup('signupPrompt');
                    }
                }, true); // Capture phase
            }
            
            // Also intercept the cart sidebar checkout
            document.addEventListener('click', (e) => {
                if (e.target.closest('.checkout-btn') && !this.isLoggedIn()) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPopup('signupPrompt');
                }
            }, true);
        },

        /**
         * Handle newsletter submit
         */
        handleNewsletterSubmit() {
            const email = document.getElementById('newsletterEmail')?.value;
            if (!email) return;
            
            // Save subscription
            localStorage.setItem(this.config.storageKeys.newsletterSubscribed, 'true');
            
            // Show success
            const popup = document.querySelector('#newsletterPopup .lead-popup');
            popup.innerHTML = `
                <div class="popup-success">
                    <i class="fas fa-check-circle"></i>
                    <h3>You're In! 🎉</h3>
                    <p>Check your email for your 10% discount code.</p>
                    <button class="btn-subscribe" onclick="LeadGeneration.closePopup('newsletterPopup')">
                        Start Shopping
                    </button>
                </div>
            `;
            
            // Send to backend (if available)
            this.sendLeadToBackend({ email, type: 'newsletter' });
            
            // Close after delay
            setTimeout(() => this.closePopup('newsletterPopup'), 5000);
        },

        /**
         * Handle exit offer email
         */
        handleExitOfferEmail() {
            const email = document.getElementById('exitEmail')?.value;
            if (!email) return;
            
            // Show success
            const popup = document.querySelector('#exitIntentPopup .lead-popup');
            popup.innerHTML = `
                <div class="popup-success">
                    <i class="fas fa-envelope-open-text"></i>
                    <h3>Offer Sent! ✨</h3>
                    <p>Check your inbox for your exclusive 15% discount code.</p>
                    <button class="btn-subscribe" onclick="LeadGeneration.closePopup('exitIntentPopup')">
                        Continue Shopping
                    </button>
                </div>
            `;
            
            // Send to backend
            this.sendLeadToBackend({ email, type: 'exit_intent', offer: 'STAY15' });
        },

        /**
         * Send lead to backend
         */
        async sendLeadToBackend(data) {
            try {
                // Save to Firestore if available
                if (window.firebaseReady && window.db) {
                    await window.db.collection('leads').add({
                        ...data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        source: window.location.pathname,
                        userAgent: navigator.userAgent
                    });
                }
                console.log('📧 Lead captured:', data);
            } catch (error) {
                console.warn('Could not save lead:', error);
            }
        },

        /**
         * Show popup
         */
        showPopup(popupId) {
            const popup = document.getElementById(popupId);
            if (popup) {
                popup.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },

        /**
         * Close popup
         */
        closePopup(popupId) {
            const popup = document.getElementById(popupId);
            if (popup) {
                popup.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        /**
         * Check if user is logged in
         */
        isLoggedIn() {
            // Check Firebase auth directly
            if (window.auth && window.auth.currentUser) {
                return true;
            }
            
            // Check Firebase global (from firebase.auth())
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                return true;
            }
            
            // Check authManager (shop.html pattern)
            if (window.authManager) {
                // Try getUserData method
                if (typeof window.authManager.getUserData === 'function' && window.authManager.getUserData()) {
                    return true;
                }
                // Try getCurrentUser method
                if (typeof window.authManager.getCurrentUser === 'function' && window.authManager.getCurrentUser()) {
                    return true;
                }
                // Try currentUserData property
                if (window.authManager.currentUserData) {
                    return true;
                }
            }
            
            // Check localStorage for cached user type (logged in users have this)
            if (localStorage.getItem('69shop_user_type')) {
                return true;
            }
            
            // Check localStorage fallback for user data
            if (localStorage.getItem('69shop_user')) {
                return true;
            }
            
            return false;
        },

        /**
         * Check if return visitor
         */
        isReturnVisitor() {
            const visitCount = parseInt(localStorage.getItem(this.config.storageKeys.visitCount)) || 0;
            return visitCount > 1;
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        LeadGeneration.init();
    });

    // Expose globally
    window.LeadGeneration = LeadGeneration;

})();
