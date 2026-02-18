class UIManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Profile sidebar toggle
        const profileBtn = document.getElementById('userProfileBtn');
        const closeProfile = document.getElementById('closeProfile');
        const profileOverlay = document.getElementById('profileOverlay');
        const profileSidebar = document.getElementById('profileSidebar');

        if (profileBtn) {
            profileBtn.addEventListener('click', (event) => {
                if (event) {
                    event.preventDefault();
                }
                this.openProfileSidebar();
            });
        }
        
        if (closeProfile) {
            closeProfile.addEventListener('click', () => this.closeProfileSidebar());
        }
        
        if (profileOverlay) {
            profileOverlay.addEventListener('click', () => this.closeProfileSidebar());
        }

        // Cart sidebar toggle
        const cartBtn = document.getElementById('cartBtn');
        const closeCart = document.getElementById('closeCart');
        const cartOverlay = document.getElementById('cartOverlay');
        const cartSidebar = document.getElementById('cartSidebar');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggleCartSidebar());
        }
        
        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCartSidebar());
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCartSidebar());
        }

        // Mobile search toggle
        const searchMobileToggle = document.getElementById('searchMobileToggle');
        const searchContainer = document.getElementById('searchContainer');
        
        if (searchMobileToggle && searchContainer) {
            searchMobileToggle.addEventListener('click', () => {
                searchContainer.classList.toggle('active');
                if (searchContainer.classList.contains('active')) {
                    document.getElementById('searchInput').focus();
                }
            });
        }

        // Mobile filters toggle
        const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
        const filtersSidebar = document.getElementById('filtersSidebar');
        const filtersOverlay = document.getElementById('filtersOverlay');
        
        if (mobileFiltersToggle && filtersSidebar) {
            mobileFiltersToggle.addEventListener('click', () => {
                this.toggleFiltersSidebar();
            });
        }

        if (filtersOverlay) {
            filtersOverlay.addEventListener('click', () => this.toggleFiltersSidebar(false));
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.toggleFiltersSidebar(false);
            }
        });

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && authManager) {
            logoutBtn.addEventListener('click', () => authManager.logout());
        }

        // Profile menu items
        this.setupProfileMenuItems();
    }

    openProfileSidebar() {
        const profileSidebar = document.getElementById('profileSidebar');
        const profileOverlay = document.getElementById('profileOverlay');
        
        if (profileSidebar && profileOverlay) {
            profileSidebar.classList.add('active');
            profileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.updateProfileTriggerState(true);
        }
    }

    toggleProfileSidebar() {
        const profileSidebar = document.getElementById('profileSidebar');
        if (profileSidebar?.classList.contains('active')) {
            this.closeProfileSidebar();
        } else {
            this.openProfileSidebar();
        }
    }

    closeProfileSidebar() {
        const profileSidebar = document.getElementById('profileSidebar');
        const profileOverlay = document.getElementById('profileOverlay');
        
        if (profileSidebar && profileOverlay) {
            profileSidebar.classList.remove('active');
            profileOverlay.classList.remove('active');
            document.body.style.overflow = '';
            this.updateProfileTriggerState(false);
        }
    }

    updateProfileTriggerState(isOpen) {
        const trigger = document.getElementById('userProfileBtn');
        if (trigger) {
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
    }

    toggleCartSidebar() {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.toggle('active');
            cartOverlay.classList.toggle('active');
            document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
        }
    }

    closeCartSidebar() {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    toggleFiltersSidebar(forceState) {
        const filtersSidebar = document.getElementById('filtersSidebar');
        const filtersOverlay = document.getElementById('filtersOverlay');
        if (!filtersSidebar) return;
        const shouldOpen = typeof forceState === 'boolean'
            ? forceState
            : !filtersSidebar.classList.contains('active');
        filtersSidebar.classList.toggle('active', shouldOpen);
        if (filtersOverlay) {
            filtersOverlay.classList.toggle('active', shouldOpen);
        }
        document.body.style.overflow = shouldOpen ? 'hidden' : '';
    }

    setupProfileMenuItems() {
        const profileLinks = document.querySelectorAll('[data-profile-link]');
        profileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeProfileSidebar();
            });
        });

        const homeBtn = document.getElementById('profileHome');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/shop.html';
            });
        }

        const sellBtn = document.getElementById('profileSell');
        if (sellBtn) {
            sellBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/#sell';
            });
        }
    }

    handleCheckout() {
        if (!productManager || productManager.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }
        
        // Require login for checkout - no guest checkout for lead generation
        const isLoggedIn = authManager && authManager.getUserData();
        
        if (!isLoggedIn) {
            // Show signup prompt via lead generation system
            if (window.LeadGeneration) {
                window.LeadGeneration.showPopup('signupPrompt');
            } else {
                // Fallback: redirect to login
                this.showNotification('Please sign in to checkout', 'info');
                setTimeout(() => {
                    window.location.href = '/shop-login.html?redirect=checkout';
                }, 1500);
            }
            return;
        }

        this.closeCartSidebar();

        if (window.checkoutManager) {
            window.checkoutManager.setGuestMode(false);
            window.checkoutManager.open();
        } else {
            this.showNotification('Checkout is still loading. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const bgColors = {
            'success': 'var(--blue-primary)',
            'error': '#FF6B6B',
            'info': '#7C3AED'
        };
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColors[type] || bgColors.success};
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
            max-width: 350px;
        `;
        notification.innerHTML = `
            <i class="fas ${icons[type] || icons.success}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}
