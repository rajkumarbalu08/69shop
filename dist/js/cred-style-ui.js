/**
 * 69SHOP.IN - CRED Store Inspired UI
 * Premium dark-mode carousel with elegant animations
 */

(function() {
    'use strict';

    const CredStyleUI = {
        /**
         * Initialize CRED-style UI
         */
        init() {
            this.injectStyles();
            this.createPremiumCarousel();
            this.enhanceProductCards();
            this.addFloatingCart();
            console.log('💎 CRED-Style UI initialized');
        },

        /**
         * Inject CRED-style CSS
         */
        injectStyles() {
            if (document.getElementById('cred-style-css')) return;

            const styles = document.createElement('style');
            styles.id = 'cred-style-css';
            styles.textContent = `
                /* CRED Premium Section */
                .cred-section {
                    background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
                    padding: 80px 0;
                    position: relative;
                    overflow: hidden;
                }

                .cred-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                }

                .cred-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                /* Section Header */
                .cred-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 48px;
                }

                .cred-header-left {
                    max-width: 500px;
                }

                .cred-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 8px 16px;
                    border-radius: 30px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 16px;
                }

                .cred-label i {
                    color: #FFD700;
                }

                .cred-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: white;
                    line-height: 1.2;
                    margin-bottom: 12px;
                }

                .cred-title span {
                    background: linear-gradient(135deg, #FFD700 0%, #FF6B6B 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .cred-subtitle {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.5);
                    line-height: 1.6;
                }

                .cred-nav {
                    display: flex;
                    gap: 12px;
                }

                .cred-nav-btn {
                    width: 52px;
                    height: 52px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .cred-nav-btn:hover:not(:disabled) {
                    background: white;
                    color: #0a0a0a;
                    transform: scale(1.05);
                }

                .cred-nav-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                /* Products Carousel */
                .cred-carousel {
                    position: relative;
                    margin: 0 -24px;
                    padding: 0 24px;
                }

                .cred-track {
                    display: flex;
                    gap: 24px;
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    padding: 20px 0;
                }

                .cred-track::-webkit-scrollbar {
                    display: none;
                }

                /* Product Card - CRED Style */
                .cred-card {
                    flex: 0 0 320px;
                    background: linear-gradient(180deg, #1f1f1f 0%, #171717 100%);
                    border-radius: 24px;
                    overflow: hidden;
                    position: relative;
                    scroll-snap-align: start;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .cred-card:hover {
                    transform: translateY(-12px);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
                }

                .cred-card-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.1), transparent 50%);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    pointer-events: none;
                }

                .cred-card:hover .cred-card-glow {
                    opacity: 1;
                }

                .cred-card-image {
                    position: relative;
                    height: 240px;
                    overflow: hidden;
                    background: #2a2a2a;
                }

                .cred-card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s ease;
                }

                .cred-card:hover .cred-card-image img {
                    transform: scale(1.1);
                }

                .cred-card-badge {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
                    color: #0a0a0a;
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .cred-card-quick-actions {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    opacity: 0;
                    transform: translateX(20px);
                    transition: all 0.3s ease;
                }

                .cred-card:hover .cred-card-quick-actions {
                    opacity: 1;
                    transform: translateX(0);
                }

                .cred-quick-btn {
                    width: 42px;
                    height: 42px;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                }

                .cred-quick-btn:hover {
                    background: white;
                    color: #0a0a0a;
                    transform: scale(1.1);
                }

                .cred-quick-btn.active {
                    background: #EF4444;
                    border-color: #EF4444;
                }

                .cred-card-content {
                    padding: 24px;
                }

                .cred-card-category {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: rgba(255, 255, 255, 0.4);
                    margin-bottom: 8px;
                }

                .cred-card-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 16px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .cred-card-rating {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .cred-stars {
                    display: flex;
                    gap: 2px;
                    color: #FFD700;
                    font-size: 0.8rem;
                }

                .cred-rating-text {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .cred-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .cred-price {
                    display: flex;
                    flex-direction: column;
                }

                .cred-price-current {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: white;
                }

                .cred-price-original {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-decoration: line-through;
                }

                .cred-add-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
                    border: none;
                    border-radius: 12px;
                    color: #0a0a0a;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .cred-add-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                }

                .cred-add-btn.added {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                }

                /* Pagination Dots */
                .cred-pagination {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 32px;
                }

                .cred-dot {
                    width: 8px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .cred-dot.active {
                    width: 24px;
                    border-radius: 4px;
                    background: #FFD700;
                }

                /* Feature Badges */
                .cred-features {
                    display: flex;
                    gap: 40px;
                    justify-content: center;
                    margin-top: 60px;
                    padding-top: 40px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .cred-feature {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.9rem;
                }

                .cred-feature i {
                    font-size: 1.2rem;
                    color: #FFD700;
                }

                /* Floating Cart Button */
                .cred-floating-cart {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.4);
                    cursor: pointer;
                    z-index: 1000;
                    transition: all 0.3s ease;
                    border: none;
                }

                .cred-floating-cart:hover {
                    transform: scale(1.1);
                }

                .cred-floating-cart i {
                    font-size: 1.4rem;
                    color: #0a0a0a;
                }

                .cred-floating-cart .cart-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #EF4444;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Cart Preview Panel */
                .cred-cart-panel {
                    position: fixed;
                    bottom: 100px;
                    right: 30px;
                    width: 360px;
                    max-height: 500px;
                    background: linear-gradient(180deg, #1f1f1f 0%, #171717 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    z-index: 999;
                    overflow: hidden;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                }

                .cred-cart-panel.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .cred-cart-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cred-cart-header h3 {
                    color: white;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .cred-cart-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    font-size: 1.2rem;
                }

                .cred-cart-items {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 16px;
                }

                .cred-cart-item {
                    display: flex;
                    gap: 16px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                    margin-bottom: 12px;
                }

                .cred-cart-item-img {
                    width: 60px;
                    height: 60px;
                    border-radius: 10px;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .cred-cart-item-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .cred-cart-item-info {
                    flex: 1;
                }

                .cred-cart-item-name {
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .cred-cart-item-price {
                    color: #FFD700;
                    font-weight: 700;
                }

                .cred-cart-footer {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .cred-cart-total {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }

                .cred-cart-total span {
                    color: rgba(255, 255, 255, 0.6);
                }

                .cred-cart-total strong {
                    color: white;
                    font-size: 1.2rem;
                }

                .cred-checkout-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
                    border: none;
                    border-radius: 12px;
                    color: #0a0a0a;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .cred-checkout-btn:hover {
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .cred-section {
                        padding: 50px 0;
                    }

                    .cred-header {
                        flex-direction: column;
                        gap: 24px;
                        align-items: flex-start;
                    }

                    .cred-title {
                        font-size: 1.8rem;
                    }

                    .cred-card {
                        flex: 0 0 280px;
                    }

                    .cred-features {
                        flex-wrap: wrap;
                        gap: 20px;
                        justify-content: flex-start;
                    }

                    .cred-floating-cart {
                        bottom: 20px;
                        right: 20px;
                        width: 54px;
                        height: 54px;
                    }

                    .cred-cart-panel {
                        right: 10px;
                        left: 10px;
                        width: auto;
                        bottom: 90px;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Create premium carousel section
         */
        createPremiumCarousel() {
            // Find the products grid
            const productsGrid = document.querySelector('.products-grid');
            if (!productsGrid) return;

            // Get products
            const products = window.productsData || [];
            if (!products.length) {
                // Wait for products to load
                setTimeout(() => this.createPremiumCarousel(), 1000);
                return;
            }

            // Get premium products (top rated/featured)
            const premiumProducts = [...products]
                .sort(() => 0.5 - Math.random())
                .slice(0, 10);

            // Create section
            const section = document.createElement('section');
            section.className = 'cred-section';
            section.id = 'credPremiumSection';

            section.innerHTML = `
                <div class="cred-container">
                    <div class="cred-header">
                        <div class="cred-header-left">
                            <div class="cred-label">
                                <i class="fas fa-crown"></i>
                                Premium Collection
                            </div>
                            <h2 class="cred-title">Discover <span>Exclusive</span> Products</h2>
                            <p class="cred-subtitle">Hand-picked items with exceptional quality and value. Shop the best of 69Shop.</p>
                        </div>
                        <div class="cred-nav">
                            <button class="cred-nav-btn" id="credPrev" aria-label="Previous">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <button class="cred-nav-btn" id="credNext" aria-label="Next">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                    <div class="cred-carousel">
                        <div class="cred-track" id="credTrack">
                            ${premiumProducts.map(product => this.createCredCard(product)).join('')}
                        </div>
                    </div>

                    <div class="cred-pagination" id="credPagination"></div>

                    <div class="cred-features">
                        <div class="cred-feature">
                            <i class="fas fa-truck"></i>
                            <span>Free Delivery Above ₹2,000</span>
                        </div>
                        <div class="cred-feature">
                            <i class="fas fa-shield-alt"></i>
                            <span>Secure Payments</span>
                        </div>
                        <div class="cred-feature">
                            <i class="fas fa-undo"></i>
                            <span>Easy 7-Day Returns</span>
                        </div>
                        <div class="cred-feature">
                            <i class="fas fa-headset"></i>
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>
            `;

            // Insert before products grid
            productsGrid.parentElement?.insertBefore(section, productsGrid);

            // Initialize carousel
            this.initCredCarousel(premiumProducts.length);
        },

        /**
         * Create CRED-style product card
         */
        createCredCard(product) {
            const discount = product.originalPrice 
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : 0;

            const rating = product.rating || (4 + Math.random()).toFixed(1);
            const reviews = product.reviews || Math.floor(Math.random() * 500) + 50;
            const wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            const isWishlisted = wishlist.some(w => w.id === product.id);

            return `
                <div class="cred-card" data-product-id="${product.id}">
                    <div class="cred-card-glow"></div>
                    <div class="cred-card-image">
                        <img src="${product.image || '/Logo/69shopc.png'}" alt="${product.name}" loading="lazy" onerror="this.src='/Logo/69shopc.png'">
                        ${discount > 0 ? `<span class="cred-card-badge">${discount}% OFF</span>` : ''}
                        <div class="cred-card-quick-actions">
                            <button class="cred-quick-btn ${isWishlisted ? 'active' : ''}" data-action="wishlist" data-product-id="${product.id}">
                                <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                            </button>
                            <button class="cred-quick-btn" data-action="quickview" data-product-id="${product.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="cred-quick-btn" data-action="zoom" data-product-id="${product.id}">
                                <i class="fas fa-search-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="cred-card-content">
                        <div class="cred-card-category">${product.category || 'Premium'}</div>
                        <h3 class="cred-card-name">${product.name}</h3>
                        <div class="cred-card-rating">
                            <div class="cred-stars">
                                ${this.getStarsHTML(rating)}
                            </div>
                            <span class="cred-rating-text">${rating} (${reviews})</span>
                        </div>
                        <div class="cred-card-footer">
                            <div class="cred-price">
                                <span class="cred-price-current">₹${product.price?.toLocaleString('en-IN') || '0'}</span>
                                ${product.originalPrice ? `<span class="cred-price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                            </div>
                            <button class="cred-add-btn" data-action="add" data-product-id="${product.id}">
                                <i class="fas fa-plus"></i>
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Get stars HTML
         */
        getStarsHTML(rating) {
            const fullStars = Math.floor(rating);
            const hasHalf = rating % 1 >= 0.5;
            let html = '';

            for (let i = 0; i < fullStars; i++) {
                html += '<i class="fas fa-star"></i>';
            }
            if (hasHalf) {
                html += '<i class="fas fa-star-half-alt"></i>';
            }
            const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
            for (let i = 0; i < emptyStars; i++) {
                html += '<i class="far fa-star"></i>';
            }

            return html;
        },

        /**
         * Initialize carousel functionality
         */
        initCredCarousel(totalCards) {
            const track = document.getElementById('credTrack');
            const prevBtn = document.getElementById('credPrev');
            const nextBtn = document.getElementById('credNext');
            const pagination = document.getElementById('credPagination');

            if (!track || !prevBtn || !nextBtn) return;

            // Scroll navigation
            prevBtn.addEventListener('click', () => {
                track.scrollBy({ left: -344, behavior: 'smooth' });
            });

            nextBtn.addEventListener('click', () => {
                track.scrollBy({ left: 344, behavior: 'smooth' });
            });

            // Create pagination dots
            const pages = Math.ceil(totalCards / 3);
            for (let i = 0; i < pages; i++) {
                const dot = document.createElement('div');
                dot.className = `cred-dot ${i === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    track.scrollTo({ left: i * 344 * 3, behavior: 'smooth' });
                });
                pagination.appendChild(dot);
            }

            // Update pagination on scroll
            track.addEventListener('scroll', () => {
                const scrollPos = track.scrollLeft;
                const pageWidth = 344 * 3;
                const currentPage = Math.round(scrollPos / pageWidth);
                pagination.querySelectorAll('.cred-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentPage);
                });
            });

            // Handle card actions
            track.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;

                const action = btn.dataset.action;
                const productId = btn.dataset.productId;
                const product = window.productsData?.find(p => p.id === productId);

                if (action === 'add') {
                    this.handleAddToCart(btn, product);
                } else if (action === 'wishlist') {
                    this.handleWishlist(btn, product);
                } else if (action === 'quickview') {
                    this.handleQuickView(product);
                } else if (action === 'zoom') {
                    this.handleZoom(product);
                }
            });
        },

        /**
         * Handle add to cart
         */
        handleAddToCart(btn, product) {
            if (!product) return;

            let cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const existing = cart.find(item => item.id === product.id);

            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            this.updateCartUI(cart);

            // Visual feedback
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i> Added';
            
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = '<i class="fas fa-plus"></i> Add';
            }, 2000);

            // Show notification
            this.showNotification(`${product.name} added to cart!`);
        },

        /**
         * Handle wishlist toggle
         */
        handleWishlist(btn, product) {
            if (!product) return;

            let wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            const existingIndex = wishlist.findIndex(w => w.id === product.id);

            if (existingIndex > -1) {
                wishlist.splice(existingIndex, 1);
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-heart"></i>';
                this.showNotification('Removed from wishlist');
            } else {
                wishlist.push(product);
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                this.showNotification('Added to wishlist!');
            }

            localStorage.setItem('69shop_wishlist', JSON.stringify(wishlist));
            
            // Update header wishlist count
            const countEl = document.getElementById('wishlistCount');
            if (countEl) {
                countEl.textContent = wishlist.length;
                countEl.style.display = wishlist.length > 0 ? 'flex' : 'none';
            }
        },

        /**
         * Handle quick view
         */
        handleQuickView(product) {
            if (!product) return;

            if (window.QuickView?.open) {
                window.QuickView.open(product);
            } else if (window.ProductCarousel?.showInlineQuickView) {
                window.ProductCarousel.showInlineQuickView(product);
            } else {
                window.location.href = `/shop.html?product=${product.id}`;
            }
        },

        /**
         * Handle zoom
         */
        handleZoom(product) {
            if (!product) return;

            if (window.ProductZoom?.openLightbox) {
                window.ProductZoom.openLightbox(product.image || '/Logo/69shopc.png');
            }
        },

        /**
         * Add floating cart
         */
        addFloatingCart() {
            if (document.getElementById('credFloatingCart')) return;

            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

            // Create floating button
            const floatBtn = document.createElement('button');
            floatBtn.className = 'cred-floating-cart';
            floatBtn.id = 'credFloatingCart';
            floatBtn.innerHTML = `
                <i class="fas fa-shopping-bag"></i>
                <span class="cart-badge" id="credCartBadge" style="${totalItems > 0 ? '' : 'display: none;'}">${totalItems}</span>
            `;
            document.body.appendChild(floatBtn);

            // Create cart panel
            const panel = document.createElement('div');
            panel.className = 'cred-cart-panel';
            panel.id = 'credCartPanel';
            panel.innerHTML = `
                <div class="cred-cart-header">
                    <h3>Your Cart</h3>
                    <button class="cred-cart-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="cred-cart-items" id="credCartItems"></div>
                <div class="cred-cart-footer">
                    <div class="cred-cart-total">
                        <span>Total</span>
                        <strong id="credCartTotal">₹0</strong>
                    </div>
                    <button class="cred-checkout-btn" onclick="window.location.href='/shop.html#checkout'">
                        Proceed to Checkout
                    </button>
                </div>
            `;
            document.body.appendChild(panel);

            // Toggle panel
            floatBtn.addEventListener('click', () => {
                panel.classList.toggle('show');
                if (panel.classList.contains('show')) {
                    this.updateCartPanel();
                }
            });

            // Close button
            panel.querySelector('.cred-cart-close').addEventListener('click', () => {
                panel.classList.remove('show');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target) && !floatBtn.contains(e.target)) {
                    panel.classList.remove('show');
                }
            });
        },

        /**
         * Update cart UI
         */
        updateCartUI(cart) {
            const badge = document.getElementById('credCartBadge');
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            }

            // Also update header cart
            const headerBadge = document.getElementById('cartCount');
            if (headerBadge) {
                headerBadge.textContent = totalItems;
            }
        },

        /**
         * Update cart panel
         */
        updateCartPanel() {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const itemsContainer = document.getElementById('credCartItems');
            const totalEl = document.getElementById('credCartTotal');

            if (!itemsContainer) return;

            if (cart.length === 0) {
                itemsContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 30px;">Your cart is empty</p>';
                if (totalEl) totalEl.textContent = '₹0';
                return;
            }

            let total = 0;
            itemsContainer.innerHTML = cart.map(item => {
                const itemTotal = item.price * (item.quantity || 1);
                total += itemTotal;
                return `
                    <div class="cred-cart-item">
                        <div class="cred-cart-item-img">
                            <img src="${item.image || '/Logo/69shopc.png'}" alt="${item.name}">
                        </div>
                        <div class="cred-cart-item-info">
                            <div class="cred-cart-item-name">${item.name}</div>
                            <div class="cred-cart-item-price">₹${itemTotal.toLocaleString('en-IN')} × ${item.quantity || 1}</div>
                        </div>
                    </div>
                `;
            }).join('');

            if (totalEl) {
                totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
            }
        },

        /**
         * Enhance existing product cards
         */
        enhanceProductCards() {
            // Add hover effects to existing cards
            document.querySelectorAll('.product-card').forEach(card => {
                if (card.classList.contains('cred-enhanced')) return;
                card.classList.add('cred-enhanced');

                // Add subtle glow effect
                card.style.transition = 'all 0.3s ease';
                card.addEventListener('mouseenter', () => {
                    card.style.boxShadow = '0 15px 40px rgba(0, 102, 255, 0.15)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.boxShadow = '';
                });
            });
        },

        /**
         * Show notification
         */
        showNotification(message) {
            const existing = document.querySelector('.cred-notification');
            if (existing) existing.remove();

            const notification = document.createElement('div');
            notification.className = 'cred-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: linear-gradient(135deg, #1f1f1f 0%, #171717 100%);
                color: white;
                padding: 16px 28px;
                border-radius: 12px;
                border: 1px solid rgba(255, 215, 0, 0.3);
                font-size: 0.95rem;
                font-weight: 500;
                z-index: 10001;
                opacity: 0;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
            `;
            notification.innerHTML = `<i class="fas fa-check-circle" style="color: #FFD700;"></i> ${message}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(-50%) translateY(0)';
            }, 10);

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for products to load
        setTimeout(() => {
            CredStyleUI.init();
        }, 1500);
    });

    // Expose globally
    window.CredStyleUI = CredStyleUI;

})();
