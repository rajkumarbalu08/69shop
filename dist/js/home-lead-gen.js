/**
 * 69SHOP.IN - Homepage Lead Generation
 * Separate flows for buyers and sellers
 */

(function() {
    'use strict';

    const HomeLeadGen = {
        config: {
            buyerPopupDelay: 8000,      // 8 seconds for buyer popup
            sellerPopupDelay: 120000,    // 2 minutes for seller popup
            storageKeys: {
                buyerPopupShown: '69shop_home_buyer_popup',
                sellerPopupShown: '69shop_home_seller_popup',
                buyerSubscribed: '69shop_buyer_subscribed',
                sellerInterested: '69shop_seller_interested'
            }
        },

        state: {
            buyerPopupShown: false,
            sellerPopupShown: false
        },

        /**
         * Initialize
         */
        init() {
            // Only run on homepage
            if (!this.isHomePage()) return;
            
            // Check if user is logged in
            if (this.isLoggedIn()) {
                console.log('📧 Home Lead Gen: User logged in, skipping popups');
                return;
            }

            this.loadState();
            this.createModals();
            this.injectStyles();
            this.bindEvents();
            this.startTimers();
            
            console.log('📧 Home Lead Generation initialized');
        },

        /**
         * Check if on homepage
         */
        isHomePage() {
            const path = window.location.pathname;
            return path === '/' || path === '/index.html' || path.endsWith('/');
        },

        /**
         * Check if user is logged in
         */
        isLoggedIn() {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                return true;
            }
            if (localStorage.getItem('69shop_user_type')) {
                return true;
            }
            return false;
        },

        /**
         * Load state from storage
         */
        loadState() {
            const buyerSubscribed = localStorage.getItem(this.config.storageKeys.buyerSubscribed);
            const sellerInterested = localStorage.getItem(this.config.storageKeys.sellerInterested);
            
            if (buyerSubscribed === 'true') {
                this.state.buyerPopupShown = true;
            }
            if (sellerInterested === 'true') {
                this.state.sellerPopupShown = true;
            }
        },

        /**
         * Create modals
         */
        createModals() {
            this.createBuyerPopup();
            this.createSellerPopup();
        },

        /**
         * Buyer popup - discount offer
         */
        createBuyerPopup() {
            const popup = document.createElement('div');
            popup.className = 'home-lead-overlay';
            popup.id = 'buyerLeadPopup';
            popup.innerHTML = `
                <div class="home-lead-popup buyer-popup">
                    <button class="lead-close-btn" data-close="buyerLeadPopup">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="popup-visual buyer">
                        <div class="visual-icon">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <div class="floating-badges">
                            <span class="badge b1"><i class="fas fa-percent"></i></span>
                            <span class="badge b2"><i class="fas fa-star"></i></span>
                            <span class="badge b3"><i class="fas fa-gift"></i></span>
                        </div>
                    </div>
                    
                    <div class="popup-body">
                        <span class="offer-tag">🎉 Welcome Offer</span>
                        <h2>Get <span class="highlight">₹200 OFF</span><br>Your First Order!</h2>
                        <p>Join thousands of happy shoppers and get exclusive deals, early access to sales, and personalized recommendations.</p>
                        
                        <form class="lead-form" id="buyerLeadForm">
                            <div class="input-group">
                                <i class="fas fa-envelope"></i>
                                <input type="email" id="buyerEmail" placeholder="Enter your email" required>
                            </div>
                            <button type="submit" class="btn-submit buyer">
                                <span>Claim My ₹200 OFF</span>
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </form>
                        
                        <div class="trust-badges">
                            <span><i class="fas fa-shield-alt"></i> Secure</span>
                            <span><i class="fas fa-lock"></i> No Spam</span>
                            <span><i class="fas fa-undo"></i> Unsubscribe Anytime</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
        },

        /**
         * Seller popup - business opportunity
         */
        createSellerPopup() {
            const popup = document.createElement('div');
            popup.className = 'home-lead-overlay';
            popup.id = 'sellerLeadPopup';
            popup.innerHTML = `
                <div class="home-lead-popup seller-popup">
                    <button class="lead-close-btn" data-close="sellerLeadPopup">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="popup-visual seller">
                        <div class="visual-icon">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="growth-chart">
                            <div class="bar" style="height: 30%"></div>
                            <div class="bar" style="height: 50%"></div>
                            <div class="bar" style="height: 70%"></div>
                            <div class="bar" style="height: 100%"></div>
                        </div>
                    </div>
                    
                    <div class="popup-body">
                        <span class="offer-tag seller">💼 Business Opportunity</span>
                        <h2>Start Selling on<br><span class="highlight">69Shop.in</span></h2>
                        <p>Join India's fastest-growing marketplace. Reach millions of customers and grow your business with zero upfront fees.</p>
                        
                        <ul class="seller-benefits">
                            <li><i class="fas fa-check-circle"></i> 0% commission for first 3 months</li>
                            <li><i class="fas fa-check-circle"></i> Free product listing & promotions</li>
                            <li><i class="fas fa-check-circle"></i> Fast & secure payments</li>
                            <li><i class="fas fa-check-circle"></i> Dedicated seller support</li>
                        </ul>
                        
                        <form class="lead-form" id="sellerLeadForm">
                            <div class="input-row">
                                <div class="input-group">
                                    <i class="fas fa-user"></i>
                                    <input type="text" id="sellerName" placeholder="Your name" required>
                                </div>
                                <div class="input-group">
                                    <i class="fas fa-phone"></i>
                                    <input type="tel" id="sellerPhone" placeholder="Phone number" required>
                                </div>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-store"></i>
                                <input type="text" id="sellerBusiness" placeholder="Business/Product type">
                            </div>
                            <button type="submit" class="btn-submit seller">
                                <span>Start Selling Today</span>
                                <i class="fas fa-rocket"></i>
                            </button>
                        </form>
                        
                        <p class="cta-note">
                            <i class="fas fa-bolt"></i> Quick setup - Start selling in minutes
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
        },

        /**
         * Inject styles
         */
        injectStyles() {
            if (document.getElementById('home-lead-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'home-lead-styles';
            styles.textContent = `
                /* Overlay */
                .home-lead-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.4s ease;
                }
                
                .home-lead-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                /* Popup */
                .home-lead-popup {
                    background: #fff;
                    border-radius: 24px;
                    max-width: 480px;
                    width: 100%;
                    overflow: hidden;
                    transform: scale(0.85) translateY(40px);
                    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
                }
                
                .home-lead-overlay.active .home-lead-popup {
                    transform: scale(1) translateY(0);
                }
                
                .lead-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 10;
                    font-size: 1rem;
                    color: #666;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .lead-close-btn:hover {
                    background: #EF4444;
                    color: white;
                    transform: rotate(90deg);
                }
                
                /* Visual Section */
                .popup-visual {
                    position: relative;
                    padding: 50px 20px;
                    text-align: center;
                    overflow: hidden;
                }
                
                .popup-visual.buyer {
                    background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%);
                }
                
                .popup-visual.seller {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                }
                
                .visual-icon {
                    width: 100px;
                    height: 100px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    font-size: 2.5rem;
                    color: white;
                    animation: pulse-icon 2s ease-in-out infinite;
                }
                
                @keyframes pulse-icon {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255,255,255,0); }
                }
                
                /* Floating badges */
                .floating-badges {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                
                .floating-badges .badge {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.9rem;
                    animation: float 3s ease-in-out infinite;
                }
                
                .badge.b1 { top: 20%; left: 15%; animation-delay: 0s; }
                .badge.b2 { top: 30%; right: 10%; animation-delay: 1s; }
                .badge.b3 { bottom: 20%; left: 20%; animation-delay: 2s; }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(10deg); }
                }
                
                /* Growth chart */
                .growth-chart {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    height: 80px;
                    opacity: 0.3;
                }
                
                .growth-chart .bar {
                    width: 20px;
                    background: white;
                    border-radius: 4px 4px 0 0;
                    animation: grow 1s ease-out forwards;
                }
                
                @keyframes grow {
                    from { height: 0; }
                }
                
                /* Body */
                .popup-body {
                    padding: 32px;
                    text-align: center;
                }
                
                .offer-tag {
                    display: inline-block;
                    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
                    color: #92400E;
                    padding: 6px 16px;
                    border-radius: 999px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                
                .offer-tag.seller {
                    background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
                    color: #065F46;
                }
                
                .popup-body h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1A1A1A;
                    margin-bottom: 12px;
                    line-height: 1.3;
                }
                
                .popup-body h2 .highlight {
                    color: #0066ff;
                }
                
                .seller-popup .popup-body h2 .highlight {
                    color: #10B981;
                }
                
                .popup-body > p {
                    color: #666;
                    margin-bottom: 24px;
                    line-height: 1.6;
                }
                
                /* Seller benefits */
                .seller-benefits {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 24px;
                    text-align: left;
                }
                
                .seller-benefits li {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    color: #404040;
                    font-size: 0.95rem;
                }
                
                .seller-benefits li i {
                    color: #10B981;
                    font-size: 1rem;
                }
                
                /* Form */
                .lead-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .input-row {
                    display: flex;
                    gap: 12px;
                }
                
                .input-group {
                    flex: 1;
                    position: relative;
                }
                
                .input-group i {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #999;
                    font-size: 0.9rem;
                }
                
                .input-group input {
                    width: 100%;
                    padding: 16px 16px 16px 46px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                
                .input-group input:focus {
                    outline: none;
                    border-color: #0066ff;
                    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
                }
                
                .seller-popup .input-group input:focus {
                    border-color: #10B981;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
                }
                
                .btn-submit {
                    padding: 18px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.05rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s;
                }
                
                .btn-submit.buyer {
                    background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%);
                    color: white;
                }
                
                .btn-submit.buyer:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 102, 255, 0.4);
                }
                
                .btn-submit.seller {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                }
                
                .btn-submit.seller:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
                }
                
                /* Trust badges */
                .trust-badges {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #f3f4f6;
                }
                
                .trust-badges span {
                    font-size: 0.75rem;
                    color: #999;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .cta-note {
                    margin-top: 16px;
                    font-size: 0.85rem;
                    color: #10B981;
                    font-weight: 500;
                }
                
                .cta-note i {
                    margin-right: 4px;
                }
                
                /* Success state */
                .popup-success {
                    padding: 60px 32px;
                    text-align: center;
                }
                
                .popup-success .success-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    font-size: 2rem;
                    color: white;
                    animation: success-pop 0.5s ease;
                }
                
                @keyframes success-pop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                
                .popup-success h3 {
                    font-size: 1.5rem;
                    color: #1A1A1A;
                    margin-bottom: 12px;
                }
                
                .popup-success p {
                    color: #666;
                    margin-bottom: 24px;
                }
                
                .popup-success .btn-continue {
                    padding: 14px 32px;
                    background: #1A1A1A;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .popup-success .btn-continue:hover {
                    background: #333;
                }
                
                /* Mobile */
                @media (max-width: 540px) {
                    .home-lead-popup {
                        max-width: 100%;
                        margin: 10px;
                        border-radius: 20px;
                    }
                    
                    .popup-body {
                        padding: 24px;
                    }
                    
                    .popup-body h2 {
                        font-size: 1.4rem;
                    }
                    
                    .input-row {
                        flex-direction: column;
                    }
                    
                    .trust-badges {
                        flex-wrap: wrap;
                        gap: 12px;
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
            document.querySelectorAll('.home-lead-overlay').forEach(overlay => {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.closePopup(overlay.id);
                    }
                });
            });
            
            // Buyer form
            document.getElementById('buyerLeadForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBuyerSubmit();
            });
            
            // Seller form
            document.getElementById('sellerLeadForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSellerSubmit();
            });
            
            // Listen for auth changes
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        this.closePopup('buyerLeadPopup');
                        this.closePopup('sellerLeadPopup');
                    }
                });
            }
        },

        /**
         * Start timers
         */
        startTimers() {
            // Buyer popup
            if (!this.state.buyerPopupShown) {
                setTimeout(() => {
                    if (!this.isLoggedIn() && !this.state.buyerPopupShown) {
                        this.showPopup('buyerLeadPopup');
                        this.state.buyerPopupShown = true;
                    }
                }, this.config.buyerPopupDelay);
            }
            
            // Seller popup
            if (!this.state.sellerPopupShown) {
                setTimeout(() => {
                    if (!this.isLoggedIn() && !this.state.sellerPopupShown) {
                        this.showPopup('sellerLeadPopup');
                        this.state.sellerPopupShown = true;
                    }
                }, this.config.sellerPopupDelay);
            }
        },

        /**
         * Handle buyer submit
         */
        handleBuyerSubmit() {
            const email = document.getElementById('buyerEmail')?.value;
            if (!email) return;
            
            localStorage.setItem(this.config.storageKeys.buyerSubscribed, 'true');
            
            // Save lead
            this.saveLead({ email, type: 'buyer', source: 'homepage' });
            
            // Show success
            this.showSuccess('buyerLeadPopup', {
                title: 'Welcome to 69Shop! 🎉',
                message: 'Check your email for your ₹200 discount code.',
                buttonText: 'Start Shopping',
                buttonHref: '/shop.html'
            });
        },

        /**
         * Handle seller submit
         */
        handleSellerSubmit() {
            const name = document.getElementById('sellerName')?.value;
            const phone = document.getElementById('sellerPhone')?.value;
            const business = document.getElementById('sellerBusiness')?.value;
            
            if (!name || !phone) return;
            
            localStorage.setItem(this.config.storageKeys.sellerInterested, 'true');
            
            // Save lead
            this.saveLead({ 
                name, 
                phone, 
                business, 
                type: 'seller', 
                source: 'homepage' 
            });
            
            // Show success
            this.showSuccess('sellerLeadPopup', {
                title: 'Application Received! 🚀',
                message: 'Our team will contact you within 24 hours to help you get started.',
                buttonText: 'Learn More About Selling',
                buttonHref: '/seller-login.html'
            });
        },

        /**
         * Save lead to Firestore
         */
        async saveLead(data) {
            try {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    await firebase.firestore().collection('leads').add({
                        ...data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        userAgent: navigator.userAgent,
                        referrer: document.referrer
                    });
                }
                console.log('📧 Lead saved:', data);
            } catch (error) {
                console.warn('Could not save lead:', error);
            }
        },

        /**
         * Show success state
         */
        showSuccess(popupId, config) {
            const popup = document.querySelector(`#${popupId} .home-lead-popup`);
            if (!popup) return;
            
            popup.innerHTML = `
                <div class="popup-success">
                    <div class="success-icon">
                        <i class="fas fa-check"></i>
                    </div>
                    <h3>${config.title}</h3>
                    <p>${config.message}</p>
                    <button class="btn-continue" onclick="window.location.href='${config.buttonHref}'">
                        ${config.buttonText}
                    </button>
                </div>
            `;
            
            // Auto close after 5 seconds
            setTimeout(() => this.closePopup(popupId), 5000);
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
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Delay to allow auth to initialize
        setTimeout(() => {
            HomeLeadGen.init();
        }, 1000);
    });

    // Expose globally
    window.HomeLeadGen = HomeLeadGen;

})();
