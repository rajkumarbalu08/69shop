/**
 * 69SHOP.IN - Offers Carousel
 * Center-focus carousel for featured deals and offers
 * Active product is zoomed, side products are smaller
 */

(function() {
    'use strict';

    const OffersCarousel = {
        currentIndex: 0,
        offers: [],
        autoplayInterval: null,
        
        /**
         * Initialize offers carousel
         */
        init() {
            try {
                this.injectStyles();
                this.createOffersSection();
                console.log('🎁 Offers Carousel initialized');
            } catch (error) {
                console.error('Offers Carousel error:', error);
            }
        },

        /**
         * Inject carousel styles
         */
        injectStyles() {
            if (document.getElementById('offers-carousel-css')) return;

            const styles = document.createElement('style');
            styles.id = 'offers-carousel-css';
            styles.textContent = `
                /* Offers Section */
                .offers-section {
                    padding: 60px 0;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    overflow: hidden;
                    position: relative;
                }

                .offers-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    pointer-events: none;
                }

                .offers-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                    position: relative;
                }

                /* Header */
                .offers-header {
                    text-align: center;
                    margin-bottom: 48px;
                }

                .offers-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    color: white;
                    padding: 10px 24px;
                    border-radius: 30px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }

                .offers-badge i {
                    font-size: 1rem;
                }

                .offers-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 12px;
                    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
                }

                .offers-subtitle {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1.1rem;
                    max-width: 500px;
                    margin: 0 auto;
                }

                /* Carousel Container */
                .offers-carousel-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 450px;
                    perspective: 1000px;
                }

                /* Navigation Buttons */
                .offers-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 56px;
                    height: 56px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    z-index: 10;
                    transition: all 0.3s ease;
                }

                .offers-nav:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-50%) scale(1.1);
                }

                .offers-nav.prev { left: 20px; }
                .offers-nav.next { right: 20px; }

                /* Cards Track */
                .offers-track {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 30px;
                    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                /* Offer Card */
                .offer-card {
                    flex-shrink: 0;
                    width: 300px;
                    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    transform: scale(0.75) translateZ(-150px);
                    opacity: 0.4;
                    filter: blur(2px);
                    cursor: pointer;
                }

                .offer-card.side-left {
                    transform: scale(0.85) translateZ(-80px) rotateY(8deg);
                    opacity: 0.7;
                    filter: blur(1px);
                }

                .offer-card.side-right {
                    transform: scale(0.85) translateZ(-80px) rotateY(-8deg);
                    opacity: 0.7;
                    filter: blur(1px);
                }

                .offer-card.active {
                    width: 360px;
                    transform: scale(1) translateZ(0);
                    opacity: 1;
                    filter: blur(0);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 60px rgba(255, 107, 107, 0.2);
                    z-index: 5;
                }

                /* Offer Image */
                .offer-image {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .offer-card.active .offer-image {
                    height: 240px;
                }

                .offer-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }

                .offer-card:hover .offer-image img {
                    transform: scale(1.05);
                }

                /* Discount Badge */
                .offer-discount {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    color: white;
                    padding: 10px 18px;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 800;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.5);
                }

                /* Timer Badge */
                .offer-timer {
                    position: absolute;
                    bottom: 16px;
                    left: 16px;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .offer-timer i {
                    color: #ff6b6b;
                }

                /* Offer Content */
                .offer-content {
                    padding: 24px;
                }

                .offer-card.active .offer-content {
                    padding: 28px;
                }

                .offer-category {
                    display: inline-block;
                    background: #e8f4fd;
                    color: #0066ff;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }

                .offer-name {
                    font-family: 'Poppins', sans-serif;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 8px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .offer-card.active .offer-name {
                    font-size: 1.25rem;
                }

                /* Price */
                .offer-price {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .offer-price-current {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #1a1a1a;
                }

                .offer-card.active .offer-price-current {
                    font-size: 1.75rem;
                }

                .offer-price-original {
                    font-size: 1rem;
                    color: #94a3b8;
                    text-decoration: line-through;
                }

                .offer-savings {
                    background: #dcfce7;
                    color: #15803d;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                /* CTA Button */
                .offer-cta {
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #0066ff 0%, #00a3ff 100%);
                    color: white;
                    border: none;
                    border-radius: 14px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    opacity: 0;
                    transform: translateY(10px);
                }

                .offer-card.active .offer-cta {
                    opacity: 1;
                    transform: translateY(0);
                }

                .offer-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 102, 255, 0.4);
                }

                /* Pagination */
                .offers-pagination {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 40px;
                }

                .offers-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .offers-dot.active {
                    width: 36px;
                    border-radius: 6px;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                }

                .offers-dot:hover:not(.active) {
                    background: rgba(255, 255, 255, 0.5);
                }

                /* Floating Elements */
                .offers-float {
                    position: absolute;
                    pointer-events: none;
                    opacity: 0.1;
                }

                .offers-float-1 {
                    top: 10%;
                    left: 5%;
                    font-size: 80px;
                    animation: float1 6s ease-in-out infinite;
                }

                .offers-float-2 {
                    bottom: 15%;
                    right: 8%;
                    font-size: 60px;
                    animation: float2 8s ease-in-out infinite;
                }

                @keyframes float1 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                }

                @keyframes float2 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(20px) rotate(-10deg); }
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .offers-section {
                        padding: 40px 0;
                    }

                    .offers-title {
                        font-size: 1.75rem;
                    }

                    .offer-card {
                        width: 240px;
                    }

                    .offer-card.active {
                        width: 280px;
                    }

                    .offer-image {
                        height: 160px;
                    }

                    .offer-card.active .offer-image {
                        height: 180px;
                    }

                    .offers-nav {
                        width: 44px;
                        height: 44px;
                    }

                    .offers-nav.prev { left: 10px; }
                    .offers-nav.next { right: 10px; }

                    .offers-track {
                        gap: 20px;
                    }

                    .offer-card.side-left,
                    .offer-card.side-right {
                        display: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Get offers data
         */
        getOffers() {
            const products = window.productsData || [];
            
            // Create offers from products with discounts
            return products
                .filter(p => p.price < 50000) // Filter reasonable prices
                .slice(0, 7)
                .map((product, index) => {
                    const originalPrice = Math.round(product.price * (1.3 + Math.random() * 0.4));
                    const discount = Math.round((1 - product.price / originalPrice) * 100);
                    const hoursLeft = Math.floor(2 + Math.random() * 22);
                    
                    return {
                        id: product.id,
                        name: product.name,
                        image: product.image,
                        category: product.category || 'Electronics',
                        price: product.price,
                        originalPrice: originalPrice,
                        discount: discount,
                        hoursLeft: hoursLeft,
                        savings: originalPrice - product.price
                    };
                });
        },

        /**
         * Create offers section
         */
        createOffersSection() {
            // Find where to insert (after category filters or hero)
            const categorySection = document.querySelector('.promotion-section, #shopByCategory');
            if (!categorySection) return;

            this.offers = this.getOffers();
            if (this.offers.length < 3) return;

            const section = document.createElement('section');
            section.className = 'offers-section';
            section.id = 'offersSection';
            section.innerHTML = `
                <div class="offers-float offers-float-1">🎁</div>
                <div class="offers-float offers-float-2">⚡</div>
                
                <div class="offers-container">
                    <div class="offers-header">
                        <span class="offers-badge">
                            <i class="fas fa-bolt"></i> Flash Deals
                        </span>
                        <h2 class="offers-title">Today's Hot Offers</h2>
                        <p class="offers-subtitle">Limited time deals on top products. Grab them before they're gone!</p>
                    </div>
                    
                    <div class="offers-carousel-wrapper">
                        <button class="offers-nav prev" aria-label="Previous offer">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div class="offers-track" id="offersTrack">
                            ${this.offers.map((offer, index) => this.createOfferCard(offer, index)).join('')}
                        </div>
                        
                        <button class="offers-nav next" aria-label="Next offer">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="offers-pagination">
                        ${this.offers.map((_, i) => `<div class="offers-dot ${i === Math.floor(this.offers.length / 2) ? 'active' : ''}" data-index="${i}"></div>`).join('')}
                    </div>
                </div>
            `;

            // Insert after category section
            categorySection.parentNode.insertBefore(section, categorySection.nextSibling);

            // Set initial state
            this.currentIndex = Math.floor(this.offers.length / 2);
            this.initCarousel(section);
        },

        /**
         * Create offer card HTML
         */
        createOfferCard(offer, index) {
            return `
                <div class="offer-card" data-index="${index}" data-product-id="${offer.id}">
                    <div class="offer-image">
                        <img src="${offer.image}" alt="${offer.name}" loading="lazy" onerror="this.src='/Logo/placeholder.png'">
                        <div class="offer-discount">-${offer.discount}%</div>
                        <div class="offer-timer">
                            <i class="fas fa-clock"></i>
                            ${offer.hoursLeft}h left
                        </div>
                    </div>
                    <div class="offer-content">
                        <span class="offer-category">${offer.category}</span>
                        <h3 class="offer-name">${offer.name}</h3>
                        <div class="offer-price">
                            <span class="offer-price-current">₹${offer.price.toLocaleString()}</span>
                            <span class="offer-price-original">₹${offer.originalPrice.toLocaleString()}</span>
                            <span class="offer-savings">Save ₹${offer.savings.toLocaleString()}</span>
                        </div>
                        <button class="offer-cta" data-product-id="${offer.id}">
                            <i class="fas fa-shopping-cart"></i>
                            Grab Deal
                        </button>
                    </div>
                </div>
            `;
        },

        /**
         * Initialize carousel interactions
         */
        initCarousel(section) {
            const track = section.querySelector('.offers-track');
            const cards = section.querySelectorAll('.offer-card');
            const prevBtn = section.querySelector('.offers-nav.prev');
            const nextBtn = section.querySelector('.offers-nav.next');
            const dots = section.querySelectorAll('.offers-dot');

            const updateCarousel = () => {
                cards.forEach((card, i) => {
                    card.classList.remove('active', 'side-left', 'side-right');
                    
                    const diff = i - this.currentIndex;
                    
                    if (diff === 0) {
                        card.classList.add('active');
                    } else if (diff === -1) {
                        card.classList.add('side-left');
                    } else if (diff === 1) {
                        card.classList.add('side-right');
                    }
                });

                // Update dots
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === this.currentIndex);
                });

                // Calculate transform
                const cardWidth = cards[0].offsetWidth;
                const gap = 30;
                const offset = (this.currentIndex - Math.floor(cards.length / 2)) * (cardWidth + gap);
                track.style.transform = `translateX(${-offset}px)`;
            };

            // Initial update
            updateCarousel();

            // Navigation
            prevBtn.addEventListener('click', () => {
                this.currentIndex = (this.currentIndex - 1 + cards.length) % cards.length;
                updateCarousel();
                this.resetAutoplay();
            });

            nextBtn.addEventListener('click', () => {
                this.currentIndex = (this.currentIndex + 1) % cards.length;
                updateCarousel();
                this.resetAutoplay();
            });

            // Dot navigation
            dots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    this.currentIndex = i;
                    updateCarousel();
                    this.resetAutoplay();
                });
            });

            // Card click to activate
            cards.forEach((card, i) => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.offer-cta') && i !== this.currentIndex) {
                        this.currentIndex = i;
                        updateCarousel();
                        this.resetAutoplay();
                    }
                });
            });

            // Add to cart buttons
            section.querySelectorAll('.offer-cta').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    this.addToCart(productId);
                    
                    // Visual feedback
                    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
                    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Grab Deal';
                        btn.style.background = '';
                    }, 2000);
                });
            });

            // Touch/swipe support
            let startX = 0;
            let isDragging = false;

            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            });

            track.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.currentIndex = Math.min(this.currentIndex + 1, cards.length - 1);
                    } else {
                        this.currentIndex = Math.max(this.currentIndex - 1, 0);
                    }
                    updateCarousel();
                    this.resetAutoplay();
                }
                isDragging = false;
            });

            // Autoplay
            this.startAutoplay(cards, updateCarousel);

            // Pause on hover
            section.addEventListener('mouseenter', () => this.stopAutoplay());
            section.addEventListener('mouseleave', () => this.startAutoplay(cards, updateCarousel));
        },

        /**
         * Start autoplay
         */
        startAutoplay(cards, updateFn) {
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => {
                this.currentIndex = (this.currentIndex + 1) % cards.length;
                updateFn();
            }, 4000);
        },

        /**
         * Stop autoplay
         */
        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        },

        /**
         * Reset autoplay
         */
        resetAutoplay() {
            const section = document.getElementById('offersSection');
            if (!section) return;
            const cards = section.querySelectorAll('.offer-card');
            const track = section.querySelector('.offers-track');
            const dots = section.querySelectorAll('.offers-dot');
            
            this.startAutoplay(cards, () => {
                cards.forEach((card, i) => {
                    card.classList.remove('active', 'side-left', 'side-right');
                    if (i === this.currentIndex) card.classList.add('active');
                    else if (i === this.currentIndex - 1) card.classList.add('side-left');
                    else if (i === this.currentIndex + 1) card.classList.add('side-right');
                });
                dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
                const cardWidth = cards[0].offsetWidth;
                const offset = (this.currentIndex - Math.floor(cards.length / 2)) * (cardWidth + 30);
                track.style.transform = `translateX(${-offset}px)`;
            });
        },

        /**
         * Add to cart
         */
        addToCart(productId) {
            const products = window.productsData || [];
            const product = products.find(p => p.id === productId);
            
            if (!product) return;
            
            let cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const existing = cart.find(item => item.id === product.id);
            
            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            
            // Update cart count
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                cartCount.textContent = total;
                cartCount.style.display = 'flex';
            }
            
            // Show notification
            this.showNotification(`${product.name} added to cart!`);
        },

        /**
         * Show notification
         */
        showNotification(message) {
            const existing = document.querySelector('.offers-notification');
            if (existing) existing.remove();

            const notification = document.createElement('div');
            notification.className = 'offers-notification';
            notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            notification.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 14px 28px;
                border-radius: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
                z-index: 10001;
                opacity: 0;
                transition: all 0.3s ease;
            `;
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
            OffersCarousel.init();
        }, 1200);
    });

    // Expose globally
    window.OffersCarousel = OffersCarousel;

})();
