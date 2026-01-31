/**
 * 69SHOP.IN - Center Focus Carousel
 * Active product is zoomed/enlarged, side products are smaller until active
 */

(function() {
    'use strict';

    const CenterFocusCarousel = {
        carousels: [],
        
        /**
         * Initialize center focus carousels
         */
        init() {
            this.injectStyles();
            this.findAndEnhanceCarousels();
            console.log('🎯 Center Focus Carousel initialized');
        },

        /**
         * Inject carousel styles
         */
        injectStyles() {
            if (document.getElementById('center-focus-carousel-css')) return;

            const styles = document.createElement('style');
            styles.id = 'center-focus-carousel-css';
            styles.textContent = `
                /* Center Focus Carousel Container */
                .cf-carousel-section {
                    padding: 60px 0;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    overflow: hidden;
                }

                .cf-carousel-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .cf-carousel-header {
                    text-align: center;
                    margin-bottom: 48px;
                }

                .cf-carousel-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--blue-primary, #0066ff);
                    color: white;
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }

                .cf-carousel-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--primary-black, #1A1A1A);
                    margin-bottom: 8px;
                }

                .cf-carousel-subtitle {
                    color: var(--medium-grey, #666);
                    font-size: 1.1rem;
                }

                /* Carousel Wrapper */
                .cf-carousel-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 0;
                }

                /* Navigation Buttons */
                .cf-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 56px;
                    height: 56px;
                    background: white;
                    border: none;
                    border-radius: 50%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    color: var(--primary-black, #1A1A1A);
                }

                .cf-nav-btn:hover {
                    background: var(--blue-primary, #0066ff);
                    color: white;
                    transform: translateY(-50%) scale(1.1);
                }

                .cf-nav-btn.cf-prev {
                    left: 20px;
                }

                .cf-nav-btn.cf-next {
                    right: 20px;
                }

                .cf-nav-btn i {
                    font-size: 1.25rem;
                }

                /* Cards Container */
                .cf-cards-track {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    perspective: 1000px;
                }

                /* Product Card */
                .cf-card {
                    flex-shrink: 0;
                    width: 280px;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: scale(0.75) translateZ(-100px);
                    opacity: 0.5;
                    filter: blur(2px);
                    cursor: pointer;
                }

                /* Side cards (one step away from center) */
                .cf-card.cf-side {
                    transform: scale(0.85) translateZ(-50px);
                    opacity: 0.7;
                    filter: blur(1px);
                }

                /* Active/Center Card */
                .cf-card.cf-active {
                    width: 340px;
                    transform: scale(1) translateZ(0);
                    opacity: 1;
                    filter: blur(0);
                    box-shadow: 0 20px 60px rgba(0, 102, 255, 0.2);
                    z-index: 5;
                }

                /* Card Image */
                .cf-card-image {
                    position: relative;
                    width: 100%;
                    height: 200px;
                    overflow: hidden;
                    background: #f5f5f5;
                }

                .cf-card.cf-active .cf-card-image {
                    height: 260px;
                }

                .cf-card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }

                .cf-card:hover .cf-card-image img {
                    transform: scale(1.05);
                }

                /* Badges */
                .cf-card-badges {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .cf-badge {
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .cf-badge-sale {
                    background: #ef4444;
                    color: white;
                }

                .cf-badge-new {
                    background: #10b981;
                    color: white;
                }

                .cf-badge-trending {
                    background: linear-gradient(135deg, #8b5cf6, #6366f1);
                    color: white;
                }

                /* Quick Actions */
                .cf-quick-actions {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    opacity: 0;
                    transform: translateX(20px);
                    transition: all 0.3s ease;
                }

                .cf-card.cf-active:hover .cf-quick-actions {
                    opacity: 1;
                    transform: translateX(0);
                }

                .cf-quick-btn {
                    width: 40px;
                    height: 40px;
                    background: white;
                    border: none;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-black, #1A1A1A);
                    transition: all 0.2s ease;
                }

                .cf-quick-btn:hover {
                    background: var(--blue-primary, #0066ff);
                    color: white;
                    transform: scale(1.1);
                }

                .cf-quick-btn.in-wishlist {
                    background: #ef4444;
                    color: white;
                }

                /* Card Content */
                .cf-card-content {
                    padding: 20px;
                }

                .cf-card.cf-active .cf-card-content {
                    padding: 24px;
                }

                .cf-card-category {
                    font-size: 0.75rem;
                    color: var(--blue-primary, #0066ff);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 600;
                    margin-bottom: 6px;
                }

                .cf-card-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--primary-black, #1A1A1A);
                    margin-bottom: 8px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .cf-card.cf-active .cf-card-title {
                    font-size: 1.15rem;
                }

                /* Rating */
                .cf-card-rating {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 12px;
                }

                .cf-stars {
                    display: flex;
                    gap: 2px;
                }

                .cf-stars i {
                    font-size: 0.75rem;
                    color: #fbbf24;
                }

                .cf-rating-count {
                    font-size: 0.8rem;
                    color: var(--medium-grey, #666);
                }

                /* Price */
                .cf-card-price {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .cf-price-current {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary-black, #1A1A1A);
                }

                .cf-card.cf-active .cf-price-current {
                    font-size: 1.5rem;
                }

                .cf-price-original {
                    font-size: 0.9rem;
                    color: var(--medium-grey, #666);
                    text-decoration: line-through;
                }

                .cf-price-discount {
                    font-size: 0.75rem;
                    background: #dcfce7;
                    color: #16a34a;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                }

                /* Add to Cart Button */
                .cf-add-to-cart {
                    width: 100%;
                    padding: 14px 24px;
                    background: var(--blue-primary, #0066ff);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    opacity: 0;
                    transform: translateY(10px);
                }

                .cf-card.cf-active .cf-add-to-cart {
                    opacity: 1;
                    transform: translateY(0);
                }

                .cf-add-to-cart:hover {
                    background: #0052cc;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 102, 255, 0.3);
                }

                /* Pagination Dots */
                .cf-pagination {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 32px;
                }

                .cf-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #d1d5db;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .cf-dot.active {
                    width: 32px;
                    border-radius: 5px;
                    background: var(--blue-primary, #0066ff);
                }

                .cf-dot:hover:not(.active) {
                    background: #9ca3af;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .cf-carousel-title {
                        font-size: 1.75rem;
                    }

                    .cf-card {
                        width: 220px;
                    }

                    .cf-card.cf-active {
                        width: 280px;
                    }

                    .cf-card-image {
                        height: 160px;
                    }

                    .cf-card.cf-active .cf-card-image {
                        height: 200px;
                    }

                    .cf-nav-btn {
                        width: 44px;
                        height: 44px;
                    }

                    .cf-nav-btn.cf-prev {
                        left: 10px;
                    }

                    .cf-nav-btn.cf-next {
                        right: 10px;
                    }

                    .cf-cards-track {
                        gap: 16px;
                    }
                }

                @media (max-width: 480px) {
                    .cf-carousel-section {
                        padding: 40px 0;
                    }

                    .cf-card {
                        width: 180px;
                    }

                    .cf-card.cf-active {
                        width: 240px;
                    }

                    .cf-card.cf-side {
                        display: none;
                    }

                    .cf-card-content {
                        padding: 14px;
                    }

                    .cf-card-title {
                        font-size: 0.9rem;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Find existing carousels and enhance them
         */
        findAndEnhanceCarousels() {
            // Find the trending section or create a new center-focus section
            const productsSection = document.querySelector('.trending-section, .products-section, #trending-products');
            
            if (productsSection) {
                // Add center focus carousel after the existing section
                this.createCenterFocusSection(productsSection);
            } else {
                // Create the section before the main products grid
                const mainContent = document.querySelector('.shop-content, main, .container');
                if (mainContent) {
                    this.createCenterFocusSection(mainContent, 'prepend');
                }
            }
        },

        /**
         * Create the center focus carousel section
         */
        createCenterFocusSection(referenceElement, position = 'after') {
            // Get products from existing carousel or sample data
            const products = this.getProducts();
            
            if (products.length < 3) {
                console.log('Not enough products for center focus carousel');
                return;
            }

            const section = document.createElement('section');
            section.className = 'cf-carousel-section';
            section.innerHTML = `
                <div class="cf-carousel-container">
                    <div class="cf-carousel-header">
                        <span class="cf-carousel-label">
                            <i class="fas fa-fire"></i> Featured Products
                        </span>
                        <h2 class="cf-carousel-title">Spotlight Collection</h2>
                        <p class="cf-carousel-subtitle">Handpicked products just for you</p>
                    </div>
                    <div class="cf-carousel-wrapper">
                        <button class="cf-nav-btn cf-prev" aria-label="Previous">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="cf-cards-track">
                            ${products.slice(0, 7).map((product, index) => this.createCard(product, index)).join('')}
                        </div>
                        <button class="cf-nav-btn cf-next" aria-label="Next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="cf-pagination">
                        ${products.slice(0, 7).map((_, i) => `<div class="cf-dot ${i === Math.floor(products.slice(0, 7).length / 2) ? 'active' : ''}" data-index="${i}"></div>`).join('')}
                    </div>
                </div>
            `;

            if (position === 'prepend') {
                referenceElement.insertBefore(section, referenceElement.firstChild);
            } else {
                referenceElement.parentNode.insertBefore(section, referenceElement.nextSibling);
            }

            this.initCarousel(section, products.slice(0, 7));
        },

        /**
         * Create a product card
         */
        createCard(product, index) {
            const discount = product.originalPrice 
                ? Math.round((1 - product.price / product.originalPrice) * 100) 
                : 0;

            const badges = [];
            if (discount > 0) badges.push(`<span class="cf-badge cf-badge-sale">${discount}% OFF</span>`);
            if (product.isNew) badges.push('<span class="cf-badge cf-badge-new">New</span>');
            if (product.trending) badges.push('<span class="cf-badge cf-badge-trending">Trending</span>');

            return `
                <div class="cf-card" data-index="${index}" data-product-id="${product.id || index}">
                    <div class="cf-card-image">
                        <img src="${product.image || 'https://via.placeholder.com/340x260'}" alt="${product.name || 'Product'}" loading="lazy">
                        ${badges.length ? `<div class="cf-card-badges">${badges.join('')}</div>` : ''}
                        <div class="cf-quick-actions">
                            <button class="cf-quick-btn cf-wishlist-btn" aria-label="Add to wishlist">
                                <i class="far fa-heart"></i>
                            </button>
                            <button class="cf-quick-btn cf-quickview-btn" aria-label="Quick view">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="cf-quick-btn cf-share-btn" aria-label="Share">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="cf-card-content">
                        <div class="cf-card-category">${product.category || 'Electronics'}</div>
                        <h3 class="cf-card-title">${product.name || 'Product Name'}</h3>
                        <div class="cf-card-rating">
                            <div class="cf-stars">
                                ${this.renderStars(product.rating || 4.5)}
                            </div>
                            <span class="cf-rating-count">(${product.reviews || 128})</span>
                        </div>
                        <div class="cf-card-price">
                            <span class="cf-price-current">₹${(product.price || 999).toLocaleString()}</span>
                            ${product.originalPrice ? `<span class="cf-price-original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                            ${discount > 0 ? `<span class="cf-price-discount">Save ${discount}%</span>` : ''}
                        </div>
                        <button class="cf-add-to-cart">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
        },

        /**
         * Render star rating
         */
        renderStars(rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) {
                    stars += '<i class="fas fa-star"></i>';
                } else if (i - 0.5 <= rating) {
                    stars += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    stars += '<i class="far fa-star"></i>';
                }
            }
            return stars;
        },

        /**
         * Get products from existing data or use samples
         */
        getProducts() {
            // Try to get products from existing carousel
            const existingCards = document.querySelectorAll('.carousel-card, .product-card');
            if (existingCards.length > 0) {
                return Array.from(existingCards).map((card, i) => {
                    const img = card.querySelector('img');
                    const title = card.querySelector('.carousel-card-title, .product-title, h3, h4');
                    const price = card.querySelector('.carousel-current-price, .product-price, .price');
                    const originalPrice = card.querySelector('.carousel-original-price, .original-price');
                    
                    return {
                        id: card.dataset.productId || i,
                        name: title ? title.textContent.trim() : 'Product',
                        image: img ? img.src : '',
                        price: price ? parseInt(price.textContent.replace(/[₹,]/g, '')) || 999 : 999,
                        originalPrice: originalPrice ? parseInt(originalPrice.textContent.replace(/[₹,]/g, '')) : null,
                        category: card.dataset.category || 'Electronics',
                        rating: parseFloat(card.dataset.rating) || 4 + Math.random(),
                        reviews: parseInt(card.dataset.reviews) || Math.floor(50 + Math.random() * 200)
                    };
                });
            }

            // Sample products as fallback
            return [
                { id: 1, name: 'Premium Wireless Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', price: 2999, originalPrice: 5999, category: 'Audio', rating: 4.8, reviews: 342, trending: true },
                { id: 2, name: 'Smart Watch Pro Series', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', price: 8999, originalPrice: 12999, category: 'Wearables', rating: 4.6, reviews: 256, isNew: true },
                { id: 3, name: 'Ultra Slim Power Bank 20000mAh', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400', price: 1499, originalPrice: 2499, category: 'Accessories', rating: 4.5, reviews: 189 },
                { id: 4, name: 'Bluetooth Speaker Mini', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', price: 999, originalPrice: 1999, category: 'Audio', rating: 4.3, reviews: 421, trending: true },
                { id: 5, name: 'Wireless Earbuds Pro', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', price: 3499, originalPrice: 6999, category: 'Audio', rating: 4.7, reviews: 567, isNew: true },
                { id: 6, name: 'Laptop Stand Aluminum', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', price: 1999, originalPrice: 3499, category: 'Accessories', rating: 4.4, reviews: 234 },
                { id: 7, name: 'Gaming Mouse RGB', image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', price: 1299, originalPrice: 2499, category: 'Gaming', rating: 4.6, reviews: 312 }
            ];
        },

        /**
         * Initialize carousel interactions
         */
        initCarousel(section, products) {
            const track = section.querySelector('.cf-cards-track');
            const cards = section.querySelectorAll('.cf-card');
            const prevBtn = section.querySelector('.cf-prev');
            const nextBtn = section.querySelector('.cf-next');
            const dots = section.querySelectorAll('.cf-dot');
            
            let currentIndex = Math.floor(cards.length / 2);
            
            const updateCarousel = () => {
                cards.forEach((card, i) => {
                    card.classList.remove('cf-active', 'cf-side');
                    
                    const diff = i - currentIndex;
                    
                    if (diff === 0) {
                        card.classList.add('cf-active');
                    } else if (Math.abs(diff) === 1) {
                        card.classList.add('cf-side');
                    }
                });

                // Update dots
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentIndex);
                });

                // Calculate transform to center active card
                const cardWidth = cards[0].offsetWidth;
                const gap = 24;
                const offset = (currentIndex - Math.floor(cards.length / 2)) * (cardWidth + gap);
                track.style.transform = `translateX(${-offset}px)`;
            };

            // Initial state
            updateCarousel();

            // Navigation
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + cards.length) % cards.length;
                updateCarousel();
            });

            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % cards.length;
                updateCarousel();
            });

            // Click on card to make it active
            cards.forEach((card, i) => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.cf-quick-btn') || e.target.closest('.cf-add-to-cart')) return;
                    if (i !== currentIndex) {
                        currentIndex = i;
                        updateCarousel();
                    }
                });
            });

            // Dot navigation
            dots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                });
            });

            // Touch/Swipe support
            let startX = 0;
            let isDragging = false;

            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            });

            track.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
            });

            track.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        currentIndex = Math.min(currentIndex + 1, cards.length - 1);
                    } else {
                        currentIndex = Math.max(currentIndex - 1, 0);
                    }
                    updateCarousel();
                }
                isDragging = false;
            });

            // Keyboard navigation
            section.setAttribute('tabindex', '0');
            section.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
                    updateCarousel();
                } else if (e.key === 'ArrowRight') {
                    currentIndex = (currentIndex + 1) % cards.length;
                    updateCarousel();
                }
            });

            // Auto-play (optional)
            let autoplayInterval;
            const startAutoplay = () => {
                autoplayInterval = setInterval(() => {
                    currentIndex = (currentIndex + 1) % cards.length;
                    updateCarousel();
                }, 5000);
            };

            const stopAutoplay = () => {
                clearInterval(autoplayInterval);
            };

            // Start autoplay
            startAutoplay();

            // Pause on hover
            section.addEventListener('mouseenter', stopAutoplay);
            section.addEventListener('mouseleave', startAutoplay);

            // Handle quick action buttons
            this.initQuickActions(section, products);
        },

        /**
         * Initialize quick action buttons
         */
        initQuickActions(section, products) {
            // Wishlist buttons
            section.querySelectorAll('.cf-wishlist-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.cf-card');
                    const productId = card.dataset.productId;
                    
                    btn.classList.toggle('in-wishlist');
                    const icon = btn.querySelector('i');
                    
                    if (btn.classList.contains('in-wishlist')) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        this.addToWishlist(productId, products);
                        this.showNotification('Added to wishlist!', 'success');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        this.removeFromWishlist(productId);
                        this.showNotification('Removed from wishlist', 'info');
                    }
                });
            });

            // Quick view buttons
            section.querySelectorAll('.cf-quickview-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.cf-card');
                    const productId = card.dataset.productId;
                    const product = products.find(p => String(p.id) === productId) || products[0];
                    
                    if (window.QuickView && typeof window.QuickView.open === 'function') {
                        window.QuickView.open(product);
                    } else {
                        this.showQuickViewFallback(product);
                    }
                });
            });

            // Add to cart buttons
            section.querySelectorAll('.cf-add-to-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.cf-card');
                    const productId = card.dataset.productId;
                    const product = products.find(p => String(p.id) === productId) || products[0];
                    
                    this.addToCart(product);
                    
                    // Button animation
                    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
                    btn.style.background = '#10b981';
                    
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                        btn.style.background = '';
                    }, 2000);
                });
            });

            // Share buttons
            section.querySelectorAll('.cf-share-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.cf-card');
                    const title = card.querySelector('.cf-card-title').textContent;
                    
                    if (navigator.share) {
                        navigator.share({
                            title: title,
                            text: `Check out ${title} on 69Shop!`,
                            url: window.location.href
                        });
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                        this.showNotification('Link copied to clipboard!', 'success');
                    }
                });
            });
        },

        /**
         * Add product to cart
         */
        addToCart(product) {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const existing = cart.find(item => item.id === product.id);
            
            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            this.updateCartCount();
            this.showNotification(`${product.name} added to cart!`, 'success');
        },

        /**
         * Update cart count in header
         */
        updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            const cartBadge = document.querySelector('.cart-btn .badge, .cart-count, [data-cart-count]');
            if (cartBadge) {
                cartBadge.textContent = count;
                cartBadge.style.display = count > 0 ? 'flex' : 'none';
            }
        },

        /**
         * Add to wishlist
         */
        addToWishlist(productId, products) {
            const wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            const product = products.find(p => String(p.id) === productId);
            
            if (product && !wishlist.find(item => String(item.id) === productId)) {
                wishlist.push(product);
                localStorage.setItem('69shop_wishlist', JSON.stringify(wishlist));
                this.updateWishlistCount();
            }
        },

        /**
         * Remove from wishlist
         */
        removeFromWishlist(productId) {
            let wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            wishlist = wishlist.filter(item => String(item.id) !== productId);
            localStorage.setItem('69shop_wishlist', JSON.stringify(wishlist));
            this.updateWishlistCount();
        },

        /**
         * Update wishlist count
         */
        updateWishlistCount() {
            const wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            const count = wishlist.length;
            
            const wishlistBadge = document.querySelector('.wishlist-header-btn .badge, .wishlist-count, [data-wishlist-count]');
            if (wishlistBadge) {
                wishlistBadge.textContent = count;
                wishlistBadge.style.display = count > 0 ? 'flex' : 'none';
            }
        },

        /**
         * Show quick view fallback
         */
        showQuickViewFallback(product) {
            const modal = document.createElement('div');
            modal.className = 'cf-quickview-modal';
            modal.innerHTML = `
                <div class="cf-quickview-overlay"></div>
                <div class="cf-quickview-content">
                    <button class="cf-quickview-close">&times;</button>
                    <div class="cf-quickview-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="cf-quickview-info">
                        <span class="cf-card-category">${product.category}</span>
                        <h2>${product.name}</h2>
                        <div class="cf-card-rating">
                            <div class="cf-stars">${this.renderStars(product.rating)}</div>
                            <span class="cf-rating-count">(${product.reviews} reviews)</span>
                        </div>
                        <div class="cf-card-price">
                            <span class="cf-price-current">₹${product.price.toLocaleString()}</span>
                            ${product.originalPrice ? `<span class="cf-price-original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                        </div>
                        <p style="color: #666; margin: 16px 0;">High-quality product with premium features. Perfect for everyday use.</p>
                        <button class="cf-add-to-cart" onclick="CenterFocusCarousel.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}); this.closest('.cf-quickview-modal').remove();">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;

            // Add styles for quick view
            if (!document.getElementById('cf-quickview-styles')) {
                const style = document.createElement('style');
                style.id = 'cf-quickview-styles';
                style.textContent = `
                    .cf-quickview-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: fadeIn 0.3s ease;
                    }
                    .cf-quickview-overlay {
                        position: absolute;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                    }
                    .cf-quickview-content {
                        position: relative;
                        background: white;
                        border-radius: 20px;
                        max-width: 800px;
                        width: 90%;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        overflow: hidden;
                        animation: slideUp 0.3s ease;
                    }
                    .cf-quickview-close {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 36px;
                        height: 36px;
                        border: none;
                        background: rgba(0,0,0,0.1);
                        border-radius: 50%;
                        font-size: 20px;
                        cursor: pointer;
                        z-index: 1;
                    }
                    .cf-quickview-image {
                        background: #f5f5f5;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                    }
                    .cf-quickview-image img {
                        max-width: 100%;
                        max-height: 400px;
                        object-fit: contain;
                    }
                    .cf-quickview-info {
                        padding: 40px;
                    }
                    .cf-quickview-info h2 {
                        font-size: 1.5rem;
                        margin: 12px 0;
                        font-family: 'Poppins', sans-serif;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @media (max-width: 768px) {
                        .cf-quickview-content {
                            grid-template-columns: 1fr;
                            max-height: 90vh;
                            overflow-y: auto;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(modal);

            // Close handlers
            modal.querySelector('.cf-quickview-close').addEventListener('click', () => modal.remove());
            modal.querySelector('.cf-quickview-overlay').addEventListener('click', () => modal.remove());
        },

        /**
         * Show notification
         */
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = 'cf-notification';
            notification.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            `;

            if (!document.getElementById('cf-notification-styles')) {
                const style = document.createElement('style');
                style.id = 'cf-notification-styles';
                style.textContent = `
                    .cf-notification {
                        position: fixed;
                        bottom: 24px;
                        left: 50%;
                        transform: translateX(-50%) translateY(20px);
                        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
                        color: white;
                        padding: 14px 28px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                        z-index: 10001;
                        opacity: 0;
                        transition: all 0.3s ease;
                        font-weight: 500;
                    }
                `;
                document.head.appendChild(style);
            }

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
        setTimeout(() => {
            try {
                CenterFocusCarousel.init();
            } catch (error) {
                console.error('Center Focus Carousel initialization error:', error);
            }
        }, 1000);
    });

    // Expose globally
    window.CenterFocusCarousel = CenterFocusCarousel;

})();
