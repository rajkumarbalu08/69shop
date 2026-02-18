/**
 * 69Shop Elite Shopping Experience
 * Premium interactions, animations, and personalization
 */

(function(global) {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        STORAGE_KEYS: {
            INTERESTS: '69shop_user_interests',
            RECENTLY_VIEWED: '69shop_recently_viewed',
            WISHLIST: '69shop_wishlist',
            CART: '69shop_cart'
        },
        MAX_RECENTLY_VIEWED: 10,
        ANIMATION_DURATION: 600,
        DEBOUNCE_DELAY: 300
    };

    // ===== STATE MANAGEMENT =====
    const state = {
        userInterests: [],
        recentlyViewed: [],
        wishlist: [],
        cart: [],
        isQuickViewOpen: false,
        activeFilters: {
            category: 'all',
            priceRange: [0, 100000],
            sortBy: 'featured'
        }
    };

    // ===== UTILITY FUNCTIONS =====
    const utils = {
        // Debounce function for performance
        debounce(fn, delay) {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        // Throttle function for scroll events
        throttle(fn, limit) {
            let inThrottle;
            return (...args) => {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Format price in Indian currency
        formatPrice(price) {
            return '₹' + price.toLocaleString('en-IN');
        },

        // Generate unique ID
        generateId() {
            return 'elite_' + Math.random().toString(36).substr(2, 9);
        },

        // Local storage helpers
        storage: {
            get(key) {
                try {
                    const data = localStorage.getItem(key);
                    return data ? JSON.parse(data) : null;
                } catch (e) {
                    console.warn('Storage read error:', e);
                    return null;
                }
            },
            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.warn('Storage write error:', e);
                    return false;
                }
            }
        }
    };

    // ===== ANIMATION ENGINE =====
    const animations = {
        // Fade in elements with stagger
        staggerFadeIn(elements, baseDelay = 0, staggerDelay = 50) {
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, baseDelay + (index * staggerDelay));
            });
        },

        // Product card entrance animation
        animateProductCards() {
            const cards = document.querySelectorAll('.product-card-elite');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '50px' });

            cards.forEach(card => observer.observe(card));
        },

        // Cart fly animation
        flyToCart(element, targetElement) {
            const productImg = element.querySelector('img');
            if (!productImg || !targetElement) return;

            const imgRect = productImg.getBoundingClientRect();
            const cartRect = targetElement.getBoundingClientRect();

            // Create flying element
            const flyEl = document.createElement('div');
            flyEl.className = 'cart-fly-animation';
            flyEl.innerHTML = `<img src="${productImg.src}" alt="">`;
            
            // Set initial position
            flyEl.style.left = imgRect.left + 'px';
            flyEl.style.top = imgRect.top + 'px';
            flyEl.style.width = imgRect.width + 'px';
            flyEl.style.height = imgRect.height + 'px';
            
            document.body.appendChild(flyEl);

            // Animate to cart
            requestAnimationFrame(() => {
                flyEl.style.transform = `translate(${cartRect.left - imgRect.left}px, ${cartRect.top - imgRect.top}px) scale(0.1)`;
                flyEl.style.opacity = '0';
            });

            // Clean up
            setTimeout(() => flyEl.remove(), 800);
        },

        // Ripple effect on buttons
        createRipple(event, element) {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${event.clientX - rect.left - size/2}px;
                top: ${event.clientY - rect.top - size/2}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleEffect 0.6s ease-out;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        },

        // Heartbeat animation for wishlist
        heartbeat(element) {
            element.style.animation = 'heartBeat 0.8s ease-in-out';
            setTimeout(() => element.style.animation = '', 800);
        },

        // Shake animation for errors
        shake(element) {
            element.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => element.style.animation = '', 500);
        }
    };

    // ===== PRODUCT CARD RENDERER =====
    const productRenderer = {
        // Create elite product card HTML
        createCard(product, index = 0) {
            const isWishlisted = state.wishlist.includes(product.id);
            const stockPercent = Math.min(100, (product.stock / 50) * 100);
            const isLowStock = product.stock <= 5;
            const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
            
            // Generate star ratings
            const fullStars = Math.floor(product.rating);
            const hasHalfStar = product.rating % 1 >= 0.5;
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < fullStars) {
                    starsHtml += '<i class="fas fa-star active"></i>';
                } else if (i === fullStars && hasHalfStar) {
                    starsHtml += '<i class="fas fa-star-half-alt active"></i>';
                } else {
                    starsHtml += '<i class="far fa-star"></i>';
                }
            }

            // Badge logic
            let badgeHtml = '';
            if (product.isNew) {
                badgeHtml += '<span class="product-badge badge-new">New</span>';
            }
            if (discount > 20) {
                badgeHtml += `<span class="product-badge badge-sale">${discount}% OFF</span>`;
            }
            if (product.isBestseller) {
                badgeHtml += '<span class="product-badge badge-bestseller">Bestseller</span>';
            }
            if (isLowStock && product.stock > 0) {
                badgeHtml += '<span class="product-badge badge-limited">Only ' + product.stock + ' left</span>';
            }

            return `
                <article class="product-card-elite" data-product-id="${product.id}" data-index="${index}">
                    <div class="product-image-elite">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        <div class="product-badges">
                            ${badgeHtml}
                        </div>
                        <div class="product-actions-overlay">
                            <div class="quick-actions">
                                <button class="quick-action-btn wishlist-btn ${isWishlisted ? 'active' : ''}" 
                                        data-tooltip="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                                        onclick="eliteShop.toggleWishlist('${product.id}')">
                                    <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                                </button>
                                <button class="quick-action-btn" data-tooltip="Quick View"
                                        onclick="eliteShop.openQuickView('${product.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="quick-action-btn" data-tooltip="Compare"
                                        onclick="eliteShop.addToCompare('${product.id}')">
                                    <i class="fas fa-exchange-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="product-content-elite">
                        ${product.brand ? `<div class="product-brand">${product.brand}</div>` : ''}
                        <h3 class="product-name-elite">${product.name}</h3>
                        <div class="product-rating-elite">
                            <div class="rating-stars">${starsHtml}</div>
                            <span class="rating-count">(${product.reviewCount || Math.floor(product.rating * 100)})</span>
                        </div>
                        ${isLowStock ? `
                        <div class="stock-indicator low-stock">
                            <i class="fas fa-fire"></i>
                            <span>Only ${product.stock} left!</span>
                            <div class="stock-bar">
                                <div class="stock-bar-fill low" style="width: ${stockPercent}%"></div>
                            </div>
                        </div>
                        ` : ''}
                        <div class="product-price-elite">
                            <span class="current-price">${utils.formatPrice(product.price)}</span>
                            ${product.originalPrice ? `
                                <span class="original-price">${utils.formatPrice(product.originalPrice)}</span>
                                <span class="discount-tag">${discount}% OFF</span>
                            ` : ''}
                        </div>
                        <button class="add-to-cart-elite" onclick="eliteShop.addToCart('${product.id}', this)">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Add to Bag</span>
                        </button>
                    </div>
                </article>
            `;
        },

        // Create skeleton loading cards
        createSkeletonCards(count = 8) {
            let html = '';
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="product-card-skeleton">
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton-content">
                            <div class="skeleton skeleton-text short"></div>
                            <div class="skeleton skeleton-text long"></div>
                            <div class="skeleton skeleton-text medium"></div>
                            <div class="skeleton skeleton-button"></div>
                        </div>
                    </div>
                `;
            }
            return html;
        },

        // Render products grid
        renderGrid(products, container) {
            if (!container) return;

            if (!products || products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                        <div class="empty-state-icon" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3 style="font-size: 1.5rem; margin-bottom: 12px;">No products found</h3>
                        <p style="color: var(--text-light);">Try adjusting your filters or explore other categories.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = products.map((product, index) => 
                this.createCard(product, index)
            ).join('');

            // Trigger animations
            animations.animateProductCards();
        }
    };

    // ===== CATEGORY NAVIGATION =====
    const categoryNav = {
        categories: [
            { id: 'all', name: 'All Products', icon: 'fa-th-large', count: 0 },
            { id: 'mobiles', name: 'Mobiles', icon: 'fa-mobile-alt', count: 0 },
            { id: 'headphones', name: 'Headphones', icon: 'fa-headphones-alt', count: 0 },
            { id: 'appliances', name: 'Appliances', icon: 'fa-blender', count: 0 },
            { id: 'home-needs', name: 'Home Needs', icon: 'fa-couch', count: 0 },
            { id: 'electronics', name: 'Electronics', icon: 'fa-laptop', count: 0 },
            { id: 'fashion', name: 'Fashion', icon: 'fa-tshirt', count: 0 },
            { id: 'beauty', name: 'Beauty', icon: 'fa-spa', count: 0 },
            { id: 'sports', name: 'Sports', icon: 'fa-running', count: 0 },
            { id: 'books', name: 'Books', icon: 'fa-book', count: 0 }
        ],

        render(container) {
            if (!container) return;

            // Update counts from products
            const products = window.productsData || [];
            this.categories.forEach(cat => {
                if (cat.id === 'all') {
                    cat.count = products.length;
                } else {
                    cat.count = products.filter(p => p.category === cat.id).length;
                }
            });

            container.innerHTML = this.categories
                .filter(cat => cat.count > 0 || cat.id === 'all')
                .map(cat => `
                    <button class="category-pill ${state.activeFilters.category === cat.id ? 'active' : ''}" 
                            data-category="${cat.id}"
                            onclick="eliteShop.filterByCategory('${cat.id}')">
                        <i class="fas ${cat.icon}"></i>
                        <span>${cat.name}</span>
                        <span class="category-count">${cat.count}</span>
                    </button>
                `).join('');
        },

        setActive(categoryId) {
            document.querySelectorAll('.category-pill').forEach(pill => {
                pill.classList.toggle('active', pill.dataset.category === categoryId);
            });
        }
    };

    // ===== QUICK VIEW MODAL =====
    const quickView = {
        modal: null,

        init() {
            // Create modal if doesn't exist
            if (!document.getElementById('quickViewModal')) {
                const modalHtml = `
                    <div class="quick-view-modal" id="quickViewModal">
                        <div class="quick-view-backdrop" onclick="eliteShop.closeQuickView()"></div>
                        <div class="quick-view-content">
                            <button class="quick-view-close" onclick="eliteShop.closeQuickView()">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="quick-view-gallery" id="quickViewGallery">
                                <img class="gallery-main-image" id="quickViewMainImage" src="" alt="">
                                <div class="gallery-thumbnails" id="quickViewThumbs"></div>
                            </div>
                            <div class="quick-view-details" id="quickViewDetails">
                                <!-- Details populated dynamically -->
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            }
            this.modal = document.getElementById('quickViewModal');
        },

        open(productId) {
            const products = window.productsData || [];
            const product = products.find(p => p.id === productId);
            if (!product) return;

            // Track view
            personalization.trackView(productId);

            // Populate modal
            const mainImage = document.getElementById('quickViewMainImage');
            const details = document.getElementById('quickViewDetails');

            mainImage.src = product.image;
            mainImage.alt = product.name;

            const isWishlisted = state.wishlist.includes(productId);
            const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

            details.innerHTML = `
                <div class="product-brand" style="margin-bottom: 12px;">${product.brand || 'Premium Quality'}</div>
                <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 16px; color: var(--text-dark);">${product.name}</h2>
                <div class="product-rating-elite" style="margin-bottom: 20px;">
                    <div class="rating-stars">
                        ${Array(5).fill().map((_, i) => 
                            `<i class="fa${i < Math.floor(product.rating) ? 's' : 'r'} fa-star" style="color: ${i < Math.floor(product.rating) ? '#FFD700' : '#ddd'};"></i>`
                        ).join('')}
                    </div>
                    <span class="rating-count" style="margin-left: 10px;">${product.rating} (${Math.floor(product.rating * 100)} reviews)</span>
                </div>
                <div class="product-price-elite" style="margin-bottom: 24px; font-size: 1.1rem;">
                    <span class="current-price" style="font-size: 2rem;">${utils.formatPrice(product.price)}</span>
                    ${product.originalPrice ? `
                        <span class="original-price" style="font-size: 1.2rem;">${utils.formatPrice(product.originalPrice)}</span>
                        <span class="discount-tag">${discount}% OFF</span>
                    ` : ''}
                </div>
                <p style="color: var(--text-medium); line-height: 1.7; margin-bottom: 24px;">${product.description}</p>
                
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <button class="add-to-cart-elite" style="flex: 1;" onclick="eliteShop.addToCart('${productId}', this); eliteShop.closeQuickView();">
                        <i class="fas fa-shopping-bag"></i>
                        <span>Add to Bag</span>
                    </button>
                    <button class="quick-action-btn wishlist-btn ${isWishlisted ? 'active' : ''}" 
                            style="width: 56px; height: 56px;"
                            onclick="eliteShop.toggleWishlist('${productId}')">
                        <i class="${isWishlisted ? 'fas' : 'far'} fa-heart" style="font-size: 1.3rem;"></i>
                    </button>
                </div>
                
                <div style="display: flex; gap: 24px; padding-top: 20px; border-top: 1px solid var(--light-grey);">
                    <div style="display: flex; align-items: center; gap: 10px; color: var(--text-medium);">
                        <i class="fas fa-truck" style="color: var(--blue-primary);"></i>
                        <span>Free Delivery</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; color: var(--text-medium);">
                        <i class="fas fa-undo" style="color: var(--blue-primary);"></i>
                        <span>Easy Returns</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; color: var(--text-medium);">
                        <i class="fas fa-shield-alt" style="color: var(--blue-primary);"></i>
                        <span>Secure Payment</span>
                    </div>
                </div>
            `;

            // Show modal
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            state.isQuickViewOpen = true;
        },

        close() {
            if (this.modal) {
                this.modal.classList.remove('active');
                document.body.style.overflow = '';
                state.isQuickViewOpen = false;
            }
        }
    };

    // ===== PERSONALIZATION ENGINE =====
    const personalization = {
        init() {
            this.loadUserData();
            this.renderRecentlyViewed();
        },

        loadUserData() {
            state.userInterests = utils.storage.get(CONFIG.STORAGE_KEYS.INTERESTS) || [];
            state.recentlyViewed = utils.storage.get(CONFIG.STORAGE_KEYS.RECENTLY_VIEWED) || [];
            state.wishlist = utils.storage.get(CONFIG.STORAGE_KEYS.WISHLIST) || [];
            state.cart = utils.storage.get(CONFIG.STORAGE_KEYS.CART) || [];
        },

        trackView(productId) {
            // Remove if already exists
            state.recentlyViewed = state.recentlyViewed.filter(id => id !== productId);
            // Add to front
            state.recentlyViewed.unshift(productId);
            // Limit size
            state.recentlyViewed = state.recentlyViewed.slice(0, CONFIG.MAX_RECENTLY_VIEWED);
            // Save
            utils.storage.set(CONFIG.STORAGE_KEYS.RECENTLY_VIEWED, state.recentlyViewed);
            // Re-render
            this.renderRecentlyViewed();
        },

        renderRecentlyViewed() {
            const container = document.getElementById('recentlyViewedCarousel');
            if (!container || state.recentlyViewed.length === 0) {
                const section = document.getElementById('recentlyViewedSection');
                if (section) section.style.display = 'none';
                return;
            }

            const section = document.getElementById('recentlyViewedSection');
            if (section) section.style.display = 'block';

            const products = window.productsData || [];
            const viewedProducts = state.recentlyViewed
                .map(id => products.find(p => p.id === id))
                .filter(Boolean)
                .slice(0, 6);

            container.innerHTML = viewedProducts.map(product => `
                <div class="recently-viewed-item">
                    <div class="product-card-elite" style="margin-bottom: 0;" onclick="eliteShop.openQuickView('${product.id}')">
                        <div class="product-image-elite" style="aspect-ratio: 1;">
                            <img src="${product.image}" alt="${product.name}" loading="lazy">
                        </div>
                        <div class="product-content-elite" style="padding: 12px;">
                            <h3 class="product-name-elite" style="font-size: 0.85rem; -webkit-line-clamp: 1;">${product.name}</h3>
                            <div class="product-price-elite" style="margin-bottom: 0;">
                                <span class="current-price" style="font-size: 1rem;">${utils.formatPrice(product.price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        },

        getRecommendations() {
            const products = window.productsData || [];
            if (state.userInterests.length === 0) return products.slice(0, 8);

            // Filter by user interests
            const recommended = products.filter(p => 
                state.userInterests.includes(p.category)
            );

            // Fill with popular products if not enough
            if (recommended.length < 8) {
                const popular = products
                    .filter(p => !state.userInterests.includes(p.category))
                    .sort((a, b) => b.rating - a.rating);
                return [...recommended, ...popular].slice(0, 8);
            }

            return recommended.slice(0, 8);
        },

        saveInterests(interests) {
            state.userInterests = interests;
            utils.storage.set(CONFIG.STORAGE_KEYS.INTERESTS, interests);
        }
    };

    // ===== FLOATING CART PREVIEW =====
    const floatingCart = {
        element: null,

        init() {
            if (!document.getElementById('floatingCartPreview')) {
                const html = `
                    <div class="floating-cart-preview" id="floatingCartPreview">
                        <div class="cart-preview-icon">
                            <i class="fas fa-shopping-bag"></i>
                            <span class="cart-preview-badge" id="floatingCartCount">0</span>
                        </div>
                        <button class="cart-preview-btn" onclick="eliteShop.openCart()">
                            View Bag
                        </button>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', html);
            }
            this.element = document.getElementById('floatingCartPreview');
            this.update();
        },

        show() {
            if (this.element && state.cart.length > 0) {
                this.element.classList.add('show');
            }
        },

        hide() {
            if (this.element) {
                this.element.classList.remove('show');
            }
        },

        update() {
            const countEl = document.getElementById('floatingCartCount');
            const itemsEl = document.getElementById('floatingCartItems');
            const totalEl = document.getElementById('floatingCartTotal');

            const itemCount = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const total = state.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

            if (countEl) countEl.textContent = itemCount;
            if (itemsEl) itemsEl.textContent = itemCount + ' item' + (itemCount !== 1 ? 's' : '');
            if (totalEl) totalEl.textContent = utils.formatPrice(total);

            // Show/hide based on cart state
            if (itemCount > 0) {
                this.show();
            } else {
                this.hide();
            }
        }
    };

    // ===== TOAST NOTIFICATIONS =====
    const toast = {
        show(message, type = 'success', duration = 2500) {
            const toastContainer = document.getElementById('toastContainer') || this.createContainer();
            
            const toastEl = document.createElement('div');
            toastEl.className = `elite-toast toast-${type}`;
            toastEl.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            toastContainer.appendChild(toastEl);
            
            // Animate in
            requestAnimationFrame(() => {
                toastEl.classList.add('show');
            });
            
            // Remove after duration
            setTimeout(() => {
                toastEl.classList.remove('show');
                setTimeout(() => toastEl.remove(), 300);
            }, duration);
        },

        createContainer() {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                z-index: 10002;
                pointer-events: none;
            `;
            document.body.appendChild(container);

            // Add toast styles if not present
            if (!document.getElementById('toastStyles')) {
                const style = document.createElement('style');
                style.id = 'toastStyles';
                style.textContent = `
                    .elite-toast {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 14px 20px;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                        transform: translateX(120%);
                        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                        pointer-events: auto;
                    }
                    .elite-toast.show { transform: translateX(0); }
                    .elite-toast i { font-size: 1.2rem; }
                    .toast-success i { color: #00c853; }
                    .toast-error i { color: #ff4757; }
                    .toast-info i { color: #0066ff; }
                `;
                document.head.appendChild(style);
            }

            return container;
        }
    };

    // ===== MAIN API =====
    const eliteShop = {
        // Initialize elite shopping experience
        init() {
            console.log('🛍️ Initializing Elite Shopping Experience...');
            
            // Initialize components
            quickView.init();
            personalization.init();
            floatingCart.init();

            // Render category navigation if container exists
            const categoryContainer = document.getElementById('categoryNavElite');
            if (categoryContainer) {
                categoryNav.render(categoryContainer);
            }

            // Initial product render
            this.renderProducts();

            // Setup event listeners
            this.setupEventListeners();

            console.log('✅ Elite Shopping Experience ready!');
        },

        // Render products with current filters
        renderProducts() {
            const container = document.getElementById('productsGridElite') || document.getElementById('productsGrid');
            if (!container) return;

            let products = window.productsData || [];

            // Apply category filter
            if (state.activeFilters.category !== 'all') {
                products = products.filter(p => p.category === state.activeFilters.category);
            }

            // Apply price filter
            products = products.filter(p => 
                p.price >= state.activeFilters.priceRange[0] && 
                p.price <= state.activeFilters.priceRange[1]
            );

            // Apply sorting
            switch (state.activeFilters.sortBy) {
                case 'price-low':
                    products.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    products.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    products.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                    break;
            }

            // Enrich products with calculated fields
            products = products.map(p => ({
                ...p,
                originalPrice: Math.random() > 0.6 ? Math.round(p.price * (1.1 + Math.random() * 0.3)) : null,
                isNew: Math.random() > 0.85,
                isBestseller: p.rating >= 4.6 && Math.random() > 0.7,
                stock: p.stock || Math.floor(Math.random() * 50) + 1
            }));

            // Update product count
            const countEl = document.getElementById('productCount');
            if (countEl) countEl.textContent = products.length;

            // Render grid
            productRenderer.renderGrid(products, container);
        },

        // Filter by category
        filterByCategory(categoryId) {
            state.activeFilters.category = categoryId;
            categoryNav.setActive(categoryId);
            this.renderProducts();

            // Smooth scroll to products
            const productsSection = document.querySelector('.shop-content');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        // Add to cart with animation
        addToCart(productId, buttonElement) {
            const products = window.productsData || [];
            const product = products.find(p => p.id === productId);
            if (!product) return;

            // Check if already in cart
            const existingItem = state.cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                state.cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }

            // Save to storage
            utils.storage.set(CONFIG.STORAGE_KEYS.CART, state.cart);

            // Button animation
            if (buttonElement) {
                const originalHTML = buttonElement.innerHTML;
                buttonElement.classList.add('added');
                buttonElement.innerHTML = '<i class="fas fa-check"></i> <span>Added!</span>';
                
                setTimeout(() => {
                    buttonElement.classList.remove('added');
                    buttonElement.innerHTML = originalHTML;
                }, 1500);

                // Fly to cart animation
                const cardEl = buttonElement.closest('.product-card-elite');
                const cartBtn = document.getElementById('cartBtn');
                if (cardEl && cartBtn) {
                    animations.flyToCart(cardEl, cartBtn);
                }
            }

            // Update cart count in header
            const cartCountEl = document.getElementById('cartCount');
            if (cartCountEl) {
                const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                cartCountEl.textContent = totalItems;
                cartCountEl.style.animation = 'iconPop 0.4s ease';
                setTimeout(() => cartCountEl.style.animation = '', 400);
            }

            // Update floating cart
            floatingCart.update();

            // Toast notification
            toast.show(`${product.name} added to bag!`, 'success');

            // Track for personalization
            personalization.trackView(productId);
        },

        // Toggle wishlist
        toggleWishlist(productId) {
            const index = state.wishlist.indexOf(productId);
            
            if (index > -1) {
                state.wishlist.splice(index, 1);
                toast.show('Removed from wishlist', 'info');
            } else {
                state.wishlist.push(productId);
                toast.show('Added to wishlist!', 'success');
            }

            // Save to storage
            utils.storage.set(CONFIG.STORAGE_KEYS.WISHLIST, state.wishlist);

            // Update UI
            document.querySelectorAll(`.wishlist-btn[onclick*="${productId}"]`).forEach(btn => {
                const isWishlisted = state.wishlist.includes(productId);
                btn.classList.toggle('active', isWishlisted);
                btn.innerHTML = `<i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>`;
                btn.setAttribute('data-tooltip', isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist');
                
                if (isWishlisted) {
                    animations.heartbeat(btn);
                }
            });
        },

        // Open quick view
        openQuickView(productId) {
            quickView.open(productId);
        },

        // Close quick view
        closeQuickView() {
            quickView.close();
        },

        // Open cart sidebar
        openCart() {
            const cartSidebar = document.getElementById('cartSidebar');
            const cartOverlay = document.getElementById('cartOverlay');
            if (cartSidebar) cartSidebar.classList.add('active');
            if (cartOverlay) cartOverlay.classList.add('active');
        },

        // Add to compare (placeholder)
        addToCompare(productId) {
            toast.show('Compare feature coming soon!', 'info');
        },

        // Setup event listeners
        setupEventListeners() {
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.isQuickViewOpen) {
                    this.closeQuickView();
                }
            });

            // Scroll-based animations
            const handleScroll = utils.throttle(() => {
                // Show/hide floating cart based on scroll
                const scrollY = window.scrollY;
                if (scrollY > 500 && state.cart.length > 0) {
                    floatingCart.show();
                } else if (scrollY < 200) {
                    floatingCart.hide();
                }
                
                // Update scroll progress
                pageEnhancements.updateScrollProgress();
                
                // Update glassmorphic filter bar state
                const filterBar = document.querySelector('.filter-bar-glass');
                if (filterBar) {
                    filterBar.classList.toggle('scrolled', scrollY > 150);
                }
            }, 50);

            window.addEventListener('scroll', handleScroll);
        }
    };

    // ===== PAGE ENHANCEMENTS =====
    const pageEnhancements = {
        // Initialize page enhancements
        init() {
            this.createScrollProgress();
            this.createPageTransition();
            this.setupPageTransitions();
            document.body.classList.add('page-loaded');
        },

        // Create scroll progress indicator
        createScrollProgress() {
            if (document.querySelector('.scroll-progress')) return;
            const progress = document.createElement('div');
            progress.className = 'scroll-progress';
            document.body.appendChild(progress);
        },

        // Update scroll progress
        updateScrollProgress() {
            const progress = document.querySelector('.scroll-progress');
            if (!progress) return;
            
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
            
            progress.style.transform = `scaleX(${scrollPercent})`;
        },

        // Create page transition overlay
        createPageTransition() {
            if (document.querySelector('.page-transition-overlay')) return;
            const overlay = document.createElement('div');
            overlay.className = 'page-transition-overlay';
            document.body.appendChild(overlay);
        },

        // Setup page transitions for internal links
        setupPageTransitions() {
            // Only apply to internal navigation links
            document.querySelectorAll('a[href^="/"], a[href^="./"]').forEach(link => {
                if (link.target === '_blank' || link.hasAttribute('data-no-transition')) return;
                
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (!href || href.startsWith('#')) return;
                    
                    e.preventDefault();
                    this.navigateTo(href);
                });
            });
        },

        // Navigate with transition
        navigateTo(url) {
            const overlay = document.querySelector('.page-transition-overlay');
            if (!overlay) {
                window.location.href = url;
                return;
            }
            
            overlay.classList.add('entering');
            
            setTimeout(() => {
                window.location.href = url;
            }, 400);
        },

        // Generate skeleton loading cards
        generateSkeletonHTML(count = 8) {
            let html = '<div class="skeleton-grid">';
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="skeleton-card">
                        <div class="skeleton-image-wrapper"></div>
                        <div class="skeleton-info">
                            <div class="skeleton-line title"></div>
                            <div class="skeleton-line subtitle"></div>
                            <div class="skeleton-line price"></div>
                            <div class="skeleton-btn"></div>
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            return html;
        },

        // Show skeleton loading
        showSkeletonLoading(container) {
            if (!container) return;
            container.innerHTML = this.generateSkeletonHTML();
        },

        // Add button micro-interactions
        addButtonInteractions() {
            document.querySelectorAll('.add-to-cart-elite').forEach(btn => {
                btn.addEventListener('mousedown', () => {
                    btn.classList.add('pulse');
                });
                btn.addEventListener('animationend', () => {
                    btn.classList.remove('pulse');
                });
            });

            document.querySelectorAll('.wishlist-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.classList.add('burst');
                    setTimeout(() => btn.classList.remove('burst'), 500);
                });
            });
        }
    };

    // Export to global
    global.eliteShop = eliteShop;
    global.pageEnhancements = pageEnhancements;
    
    // Expose cart functions globally for easier access
    global.openCart = () => eliteShop.openCart();
    global.closeCart = () => {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
    };
    global.addToCart = (productId) => eliteShop.addToCart(productId);
    global.updateCartCount = () => {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount && eliteShop.state) {
            cartCount.textContent = eliteShop.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                eliteShop.init();
                pageEnhancements.init();
            } catch (error) {
                console.error('Elite Shop initialization error:', error);
                document.body.classList.add('page-loaded');
            }
        });
    } else {
        try {
            eliteShop.init();
            pageEnhancements.init();
        } catch (error) {
            console.error('Elite Shop initialization error:', error);
            document.body.classList.add('page-loaded');
        }
    }

})(window);