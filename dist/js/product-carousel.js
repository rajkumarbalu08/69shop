/**
 * 69SHOP.IN - Product Carousel Showcase
 * Horizontal scrolling product carousels for featured/similar products
 */

(function() {
    'use strict';

    const ProductCarousel = {
        carousels: [],
        
        /**
         * Initialize all carousels
         */
        init() {
            this.injectStyles();
            this.createShowcaseSection();
            this.initCounts();
            console.log('🎠 Product Carousel initialized');
        },

        /**
         * Initialize cart and wishlist counts
         */
        initCounts() {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            this.updateCartCount(cart);
            this.updateWishlistCount(wishlist);
        },

        /**
         * Update cart count in header
         */
        updateCartCount(cart) {
            const countEl = document.getElementById('cartCount');
            if (countEl) {
                const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                countEl.textContent = total;
                countEl.style.display = total > 0 ? 'flex' : 'none';
            }
        },

        /**
         * Update wishlist count in header
         */
        updateWishlistCount(wishlist) {
            const countEl = document.getElementById('wishlistCount');
            if (countEl) {
                countEl.textContent = wishlist.length;
                countEl.style.display = wishlist.length > 0 ? 'flex' : 'none';
            }
        },

        /**
         * Show notification toast
         */
        showNotification(message, type = 'info') {
            // Remove existing notification
            const existing = document.querySelector('.carousel-notification');
            if (existing) existing.remove();

            const notification = document.createElement('div');
            notification.className = `carousel-notification ${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            document.body.appendChild(notification);

            // Animate in
            setTimeout(() => notification.classList.add('show'), 10);

            // Auto remove
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },

        /**
         * Show inline quick view for a product
         */
        showInlineQuickView(product) {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'inline-quick-view';
            modal.innerHTML = `
                <div class="quick-view-backdrop" onclick="this.parentElement.remove()"></div>
                <div class="quick-view-panel">
                    <button class="quick-view-close" onclick="this.closest('.inline-quick-view').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="quick-view-image">
                        <img src="${product.image || '/Logo/69shopc.png'}" alt="${product.name}" onerror="this.src='/Logo/69shopc.png'">
                    </div>
                    <div class="quick-view-details">
                        <span class="quick-view-category">${product.category || 'General'}</span>
                        <h2>${product.name}</h2>
                        <p class="quick-view-description">${product.description || 'No description available.'}</p>
                        <div class="quick-view-price">
                            <span class="current-price">₹${product.price?.toLocaleString('en-IN') || '0'}</span>
                            ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                        </div>
                        <div class="quick-view-actions">
                            <button class="btn-add-cart" onclick="ProductCarousel.addToCartFromQuickView('${product.id}'); this.closest('.inline-quick-view').remove();">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <a href="/shop.html?product=${product.id}" class="btn-view-details">
                                View Full Details
                            </a>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Animate in
            setTimeout(() => modal.classList.add('show'), 10);
        },

        /**
         * Add to cart from quick view
         */
        addToCartFromQuickView(productId) {
            const product = window.productsData?.find(p => p.id === productId);
            if (!product) return;

            if (window.productManager?.addToCart) {
                window.productManager.addToCart(product);
            } else {
                let cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
                const existing = cart.find(item => item.id === product.id);
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                } else {
                    cart.push({ ...product, quantity: 1 });
                }
                localStorage.setItem('69shop_cart', JSON.stringify(cart));
                this.updateCartCount(cart);
            }
            this.showNotification(`${product.name} added to cart!`, 'success');
        },

        /**
         * Inject carousel styles
         */
        injectStyles() {
            if (document.getElementById('carousel-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'carousel-styles';
            styles.textContent = `
                /* Notification Toast */
                .carousel-notification {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: #1A1A1A;
                    color: white;
                    padding: 14px 24px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10000;
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .carousel-notification.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                .carousel-notification.success i { color: #10B981; }
                .carousel-notification.error i { color: #EF4444; }
                .carousel-notification.info i { color: #0066ff; }

                /* Inline Quick View */
                .inline-quick-view {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .inline-quick-view.show { opacity: 1; }
                .quick-view-backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                }
                .quick-view-panel {
                    position: relative;
                    background: white;
                    border-radius: 20px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: auto;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                .inline-quick-view.show .quick-view-panel { transform: scale(1); }
                .quick-view-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: rgba(0,0,0,0.1);
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .quick-view-close:hover { background: #EF4444; color: white; }
                .quick-view-image {
                    height: 250px;
                    background: #f5f5f5;
                    overflow: hidden;
                }
                .quick-view-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .quick-view-details { padding: 24px; }
                .quick-view-category {
                    display: inline-block;
                    background: #E6F2FF;
                    color: #0066ff;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                }
                .quick-view-details h2 {
                    font-size: 1.4rem;
                    margin-bottom: 8px;
                    color: #1A1A1A;
                }
                .quick-view-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 16px;
                    line-height: 1.6;
                }
                .quick-view-price {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .quick-view-price .current-price {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0066ff;
                }
                .quick-view-price .original-price {
                    font-size: 1rem;
                    color: #999;
                    text-decoration: line-through;
                }
                .quick-view-actions {
                    display: flex;
                    gap: 12px;
                }
                .quick-view-actions .btn-add-cart {
                    flex: 1;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, #0066ff, #00a3ff);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.2s;
                }
                .quick-view-actions .btn-add-cart:hover { transform: scale(1.02); }
                .quick-view-actions .btn-view-details {
                    padding: 14px 20px;
                    background: #f5f5f5;
                    color: #333;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: background 0.2s;
                }
                .quick-view-actions .btn-view-details:hover { background: #eee; }

                /* Carousel Section */
                .carousel-section {
                    padding: 60px 0;
                    background: linear-gradient(180deg, var(--light-grey, #F8F8F8) 0%, var(--white, #fff) 100%);
                    overflow: hidden;
                }

                .carousel-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .carousel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .carousel-title {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .carousel-title h2 {
                    font-family: 'Poppins', sans-serif;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--primary-black, #1A1A1A);
                    margin: 0;
                }

                .carousel-title .badge {
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .carousel-nav {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .carousel-nav-btn {
                    width: 44px;
                    height: 44px;
                    border: 2px solid #e5e7eb;
                    background: var(--white, #fff);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--dark-grey, #404040);
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .carousel-nav-btn:hover:not(:disabled) {
                    border-color: var(--blue-primary, #0066ff);
                    color: var(--blue-primary, #0066ff);
                    background: #E6F2FF;
                }

                .carousel-nav-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .view-all-link {
                    color: var(--blue-primary, #0066ff);
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: gap 0.3s ease;
                }

                .view-all-link:hover {
                    gap: 10px;
                }

                /* Carousel Track */
                .carousel-wrapper {
                    position: relative;
                    overflow: hidden;
                }

                .carousel-track {
                    display: flex;
                    gap: 24px;
                    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    cursor: grab;
                    padding: 10px 0;
                }

                .carousel-track:active {
                    cursor: grabbing;
                }

                .carousel-track.dragging {
                    transition: none;
                }

                /* Carousel Card */
                .carousel-card {
                    flex: 0 0 280px;
                    background: var(--white, #fff);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    position: relative;
                }

                .carousel-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                }

                .carousel-card-image {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                    background: var(--light-grey, #F8F8F8);
                }

                .carousel-card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }

                .carousel-card:hover .carousel-card-image img {
                    transform: scale(1.1);
                }

                .carousel-card-badge {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .carousel-card-wishlist {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--medium-grey, #666);
                    transition: all 0.3s ease;
                    opacity: 0;
                    transform: scale(0.8);
                }

                .carousel-card:hover .carousel-card-wishlist {
                    opacity: 1;
                    transform: scale(1);
                }

                .carousel-card-wishlist:hover {
                    color: #EF4444;
                    background: white;
                }

                .carousel-card-wishlist.active {
                    color: #EF4444;
                }

                .carousel-card-content {
                    padding: 20px;
                }

                .carousel-card-category {
                    font-size: 0.75rem;
                    color: var(--blue-primary, #0066ff);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }

                .carousel-card-title {
                    font-weight: 600;
                    color: var(--primary-black, #1A1A1A);
                    margin-bottom: 8px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.4;
                }

                .carousel-card-rating {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 12px;
                }

                .carousel-card-rating .stars {
                    color: #F59E0B;
                    font-size: 0.85rem;
                }

                .carousel-card-rating .count {
                    color: var(--medium-grey, #666);
                    font-size: 0.8rem;
                }

                .carousel-card-price {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .carousel-card-price .current {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary-black, #1A1A1A);
                }

                .carousel-card-price .original {
                    font-size: 0.9rem;
                    color: var(--medium-grey, #666);
                    text-decoration: line-through;
                }

                .carousel-card-price .discount {
                    font-size: 0.8rem;
                    color: #10B981;
                    font-weight: 600;
                }

                .carousel-card-actions {
                    display: flex;
                    gap: 10px;
                }

                .carousel-card-btn {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.3s ease;
                }

                .carousel-card-btn.primary {
                    background: var(--blue-primary, #0066ff);
                    color: white;
                }

                .carousel-card-btn.primary:hover {
                    background: var(--blue-dark, #0052cc);
                }

                .carousel-card-btn.secondary {
                    background: var(--light-grey, #F8F8F8);
                    color: var(--dark-grey, #404040);
                }

                .carousel-card-btn.secondary:hover {
                    background: #e5e7eb;
                }

                /* Scroll Indicators */
                .carousel-indicators {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 24px;
                }

                .carousel-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .carousel-indicator.active {
                    width: 24px;
                    border-radius: 4px;
                    background: var(--blue-primary, #0066ff);
                }

                /* Subtle edge indicators - not blocking content */
                .carousel-wrapper::before,
                .carousel-wrapper::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 20px;
                    z-index: 2;
                    pointer-events: none;
                    opacity: 0.5;
                }

                .carousel-wrapper::before {
                    left: 0;
                    background: linear-gradient(to right, rgba(0,0,0,0.05), transparent);
                }

                .carousel-wrapper::after {
                    right: 0;
                    background: linear-gradient(to left, rgba(0,0,0,0.05), transparent);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .carousel-section {
                        padding: 40px 0;
                    }

                    .carousel-container {
                        padding: 0 16px;
                    }

                    .carousel-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .carousel-title h2 {
                        font-size: 1.4rem;
                    }

                    .carousel-card {
                        flex: 0 0 240px;
                    }

                    .carousel-card-image {
                        height: 160px;
                    }

                    .carousel-nav-btn {
                        width: 38px;
                        height: 38px;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Create showcase section in the shop page
         */
        createShowcaseSection() {
            // Find products grid to insert before/after
            const productsGrid = document.getElementById('productsGrid');
            if (!productsGrid) return;

            // Get products from global data
            const products = window.productsData || [];
            if (!products.length) return;

            // Find a middle point to insert trending section
            // Insert after offers section if it exists, otherwise after featured accordion
            const offersSection = document.getElementById('offersSection');
            const featuredAccordion = document.getElementById('featuredAccordion');
            const insertPoint = offersSection || featuredAccordion;

            // Create "Trending Now" section - insert in the middle of the page
            const trendingProducts = this.getRandomProducts(products, 8);
            this.insertCarouselSection({
                id: 'trendingCarousel',
                title: 'Trending Now',
                badge: 'HOT',
                products: trendingProducts,
                insertAfter: insertPoint || productsGrid.parentElement
            });

            // Create "You May Also Like" section (at bottom)
            const recommendedProducts = this.getRandomProducts(products, 8);
            this.insertCarouselSection({
                id: 'recommendedCarousel',
                title: 'You May Also Like',
                products: recommendedProducts,
                insertAfter: productsGrid.parentElement
            });
        },

        /**
         * Get random products
         */
        getRandomProducts(products, count) {
            const shuffled = [...products].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        },

        /**
         * Insert carousel section
         */
        insertCarouselSection(config) {
            const section = document.createElement('section');
            section.className = 'carousel-section';
            section.id = config.id + 'Section';

            section.innerHTML = `
                <div class="carousel-container">
                    <div class="carousel-header">
                        <div class="carousel-title">
                            <h2>${config.title}</h2>
                            ${config.badge ? `<span class="badge">${config.badge}</span>` : ''}
                        </div>
                        <div class="carousel-nav">
                            <a href="/shop.html" class="view-all-link">
                                View All <i class="fas fa-arrow-right"></i>
                            </a>
                            <button class="carousel-nav-btn prev" data-carousel="${config.id}" aria-label="Previous">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="carousel-nav-btn next" data-carousel="${config.id}" aria-label="Next">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="carousel-wrapper">
                        <div class="carousel-track" id="${config.id}">
                            ${config.products.map(product => this.createCardHTML(product)).join('')}
                        </div>
                    </div>
                    <div class="carousel-indicators" id="${config.id}Indicators"></div>
                </div>
            `;

            // Insert into DOM
            if (config.insertBefore) {
                config.insertBefore.parentNode.insertBefore(section, config.insertBefore);
            } else if (config.insertAfter) {
                config.insertAfter.parentNode.insertBefore(section, config.insertAfter.nextSibling);
            }

            // Initialize carousel functionality
            this.initCarousel(config.id, config.products.length);
        },

        /**
         * Create card HTML
         */
        createCardHTML(product) {
            const discount = product.originalPrice 
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : 0;

            const rating = product.rating || (4 + Math.random()).toFixed(1);
            const reviews = product.reviews || Math.floor(Math.random() * 500) + 50;

            return `
                <div class="carousel-card" data-product-id="${product.id}">
                    <div class="carousel-card-image">
                        <img src="${product.image || '/Logo/69shopc.png'}" alt="${product.name}" loading="lazy" onerror="this.src='/Logo/69shopc.png'">
                        ${discount > 0 ? `<span class="carousel-card-badge">${discount}% OFF</span>` : ''}
                        <button class="carousel-card-wishlist" data-product-id="${product.id}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    <div class="carousel-card-content">
                        <div class="carousel-card-category">${product.category || 'General'}</div>
                        <h3 class="carousel-card-title">${product.name}</h3>
                        <div class="carousel-card-rating">
                            <span class="stars">${this.getStarsHTML(rating)}</span>
                            <span class="count">(${reviews})</span>
                        </div>
                        <div class="carousel-card-price">
                            <span class="current">₹${product.price.toLocaleString('en-IN')}</span>
                            ${product.originalPrice ? `
                                <span class="original">₹${product.originalPrice.toLocaleString('en-IN')}</span>
                                <span class="discount">${discount}% off</span>
                            ` : ''}
                        </div>
                        <div class="carousel-card-actions">
                            <button class="carousel-card-btn primary add-to-cart" data-product-id="${product.id}">
                                <i class="fas fa-shopping-cart"></i> Add
                            </button>
                            <button class="carousel-card-btn secondary quick-view-btn" data-product-id="${product.id}">
                                <i class="fas fa-eye"></i>
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
        initCarousel(carouselId, itemCount) {
            const track = document.getElementById(carouselId);
            if (!track) return;

            const wrapper = track.parentElement;
            const prevBtn = document.querySelector(`.carousel-nav-btn.prev[data-carousel="${carouselId}"]`);
            const nextBtn = document.querySelector(`.carousel-nav-btn.next[data-carousel="${carouselId}"]`);
            const indicatorsContainer = document.getElementById(carouselId + 'Indicators');

            const cardWidth = 280 + 24; // card width + gap
            const visibleCards = Math.floor(wrapper.offsetWidth / cardWidth);
            const maxIndex = Math.max(0, itemCount - visibleCards);
            let currentIndex = 0;

            // Create indicators
            const pageCount = Math.ceil(itemCount / visibleCards);
            for (let i = 0; i < pageCount; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'carousel-indicator' + (i === 0 ? ' active' : '');
                indicator.addEventListener('click', () => goTo(i * visibleCards));
                indicatorsContainer.appendChild(indicator);
            }

            // Update function
            function update() {
                track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
                prevBtn.disabled = currentIndex === 0;
                nextBtn.disabled = currentIndex >= maxIndex;

                // Update indicators
                const indicators = indicatorsContainer.querySelectorAll('.carousel-indicator');
                const activeIndicator = Math.floor(currentIndex / visibleCards);
                indicators.forEach((ind, i) => {
                    ind.classList.toggle('active', i === activeIndicator);
                });
            }

            function goTo(index) {
                currentIndex = Math.max(0, Math.min(index, maxIndex));
                update();
            }

            // Navigation buttons
            prevBtn.addEventListener('click', () => {
                currentIndex = Math.max(0, currentIndex - visibleCards);
                update();
            });

            nextBtn.addEventListener('click', () => {
                currentIndex = Math.min(maxIndex, currentIndex + visibleCards);
                update();
            });

            // Drag/swipe support
            let isDragging = false;
            let startX = 0;
            let scrollLeft = 0;

            track.addEventListener('mousedown', (e) => {
                isDragging = true;
                track.classList.add('dragging');
                startX = e.pageX;
                scrollLeft = currentIndex * cardWidth;
            });

            track.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const x = e.pageX;
                const walk = (startX - x);
                const newOffset = scrollLeft + walk;
                track.style.transform = `translateX(-${newOffset}px)`;
            });

            track.addEventListener('mouseup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                track.classList.remove('dragging');
                
                const walk = startX - e.pageX;
                if (Math.abs(walk) > 100) {
                    if (walk > 0) {
                        currentIndex = Math.min(maxIndex, currentIndex + 1);
                    } else {
                        currentIndex = Math.max(0, currentIndex - 1);
                    }
                }
                update();
            });

            track.addEventListener('mouseleave', () => {
                if (isDragging) {
                    isDragging = false;
                    track.classList.remove('dragging');
                    update();
                }
            });

            // Touch support
            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].pageX;
                scrollLeft = currentIndex * cardWidth;
            });

            track.addEventListener('touchmove', (e) => {
                const x = e.touches[0].pageX;
                const walk = (startX - x);
                track.style.transform = `translateX(-${(scrollLeft + walk)}px)`;
            });

            track.addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].pageX;
                const walk = startX - endX;
                
                if (Math.abs(walk) > 50) {
                    if (walk > 0) {
                        currentIndex = Math.min(maxIndex, currentIndex + 1);
                    } else {
                        currentIndex = Math.max(0, currentIndex - 1);
                    }
                }
                update();
            });

            // Add to cart handling
            track.querySelectorAll('.add-to-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    const product = window.productsData?.find(p => p.id === productId);
                    
                    if (product) {
                        // Try different cart methods
                        if (window.productManager?.addToCart) {
                            window.productManager.addToCart(product);
                        } else {
                            // Fallback - store in localStorage
                            let cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
                            const existing = cart.find(item => item.id === product.id);
                            if (existing) {
                                existing.quantity = (existing.quantity || 1) + 1;
                            } else {
                                cart.push({ ...product, quantity: 1 });
                            }
                            localStorage.setItem('69shop_cart', JSON.stringify(cart));
                            
                            // Update cart count in header
                            ProductCarousel.updateCartCount(cart);
                        }
                        
                        // Visual feedback
                        btn.innerHTML = '<i class="fas fa-check"></i> Added';
                        btn.style.background = '#10B981';
                        setTimeout(() => {
                            btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add';
                            btn.style.background = '';
                        }, 1500);
                        
                        if (window.SoundFX) {
                            window.SoundFX.play('addToCart');
                        }
                        
                        // Show notification
                        ProductCarousel.showNotification(`${product.name} added to cart!`, 'success');
                    } else {
                        // Product not found - redirect to shop
                        window.location.href = `/shop.html?product=${productId}`;
                    }
                });
            });

            // Quick view button handling
            track.querySelectorAll('.quick-view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    const product = window.productsData?.find(p => p.id === productId);
                    
                    if (product) {
                        // Try QuickView first
                        if (window.QuickView?.open) {
                            window.QuickView.open(product);
                        } else if (window.QuickView?.openById) {
                            window.QuickView.openById(productId);
                        } else {
                            // Fallback - show inline quick view
                            ProductCarousel.showInlineQuickView(product);
                        }
                    } else {
                        // Fallback - redirect to shop with product
                        window.location.href = `/shop.html?product=${productId}`;
                    }
                    
                    if (window.SoundFX) {
                        window.SoundFX.play('click');
                    }
                });
            });

            // Wishlist handling
            track.querySelectorAll('.carousel-card-wishlist').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    
                    // Toggle wishlist in localStorage - store IDs only for consistency
                    let wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
                    // Normalize: extract IDs if objects were stored
                    wishlist = wishlist.map(item => typeof item === 'object' ? item.id : item);
                    const existingIndex = wishlist.indexOf(productId);
                    
                    if (existingIndex > -1) {
                        wishlist.splice(existingIndex, 1);
                        btn.classList.remove('active');
                        ProductCarousel.showNotification('Removed from wishlist', 'info');
                    } else {
                        wishlist.push(productId);
                        btn.classList.add('active');
                        ProductCarousel.showNotification('Added to wishlist!', 'success');
                    }
                    
                    localStorage.setItem('69shop_wishlist', JSON.stringify(wishlist));
                    ProductCarousel.updateWishlistCount(wishlist);
                    
                    // Toggle icon
                    const icon = btn.querySelector('i');
                    icon.classList.toggle('far');
                    icon.classList.toggle('fas');
                    
                    if (window.SoundFX) {
                        window.SoundFX.play('wishlist');
                    }
                });
            });

            // Initial update
            update();

            // Store carousel reference
            this.carousels.push({
                id: carouselId,
                goTo,
                currentIndex: () => currentIndex
            });
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for products to load
        setTimeout(() => {
            ProductCarousel.init();
        }, 500);
    });

    // Expose globally
    window.ProductCarousel = ProductCarousel;

})();
