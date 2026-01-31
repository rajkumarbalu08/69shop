/**
 * 69SHOP.IN - Product Quick View Modal
 * Allows viewing product details without page navigation
 */

(function() {
    'use strict';

    const QuickView = {
        modal: null,
        currentProduct: null,

        /**
         * Initialize Quick View
         */
        init() {
            this.createModal();
            this.bindEvents();
            console.log('👁️ Quick View initialized');
        },

        /**
         * Create modal HTML
         */
        createModal() {
            const modal = document.createElement('div');
            modal.className = 'quick-view-overlay';
            modal.id = 'quickViewOverlay';
            modal.innerHTML = `
                <div class="quick-view-modal" role="dialog" aria-modal="true" aria-labelledby="quickViewTitle">
                    <button class="quick-view-close" id="quickViewClose" aria-label="Close quick view">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="quick-view-content">
                        <!-- Image Gallery -->
                        <div class="quick-view-gallery">
                            <div class="gallery-main">
                                <img id="quickViewMainImage" src="" alt="">
                                <div class="gallery-badges" id="quickViewBadges"></div>
                                <button class="gallery-nav prev" id="galleryPrev"><i class="fas fa-chevron-left"></i></button>
                                <button class="gallery-nav next" id="galleryNext"><i class="fas fa-chevron-right"></i></button>
                            </div>
                            <div class="gallery-thumbs" id="quickViewThumbs"></div>
                        </div>
                        
                        <!-- Product Info -->
                        <div class="quick-view-info">
                            <div class="quick-view-header">
                                <span class="quick-view-category" id="quickViewCategory"></span>
                                <h2 class="quick-view-title" id="quickViewTitle"></h2>
                                <div class="quick-view-rating" id="quickViewRating"></div>
                            </div>
                            
                            <div class="quick-view-price" id="quickViewPrice"></div>
                            
                            <div class="quick-view-stock" id="quickViewStock"></div>
                            
                            <p class="quick-view-description" id="quickViewDescription"></p>
                            
                            <!-- Variants -->
                            <div class="quick-view-variants" id="quickViewVariants"></div>
                            
                            <!-- Quantity -->
                            <div class="quick-view-quantity">
                                <label>Quantity:</label>
                                <div class="quantity-selector">
                                    <button class="qty-btn" id="qtyMinus">−</button>
                                    <input type="number" id="qtyInput" value="1" min="1" max="10">
                                    <button class="qty-btn" id="qtyPlus">+</button>
                                </div>
                            </div>
                            
                            <!-- Actions -->
                            <div class="quick-view-actions">
                                <button class="btn-add-to-cart" id="quickViewAddCart">
                                    <i class="fas fa-shopping-cart"></i>
                                    Add to Cart
                                </button>
                                <button class="btn-wishlist" id="quickViewWishlist">
                                    <i class="far fa-heart"></i>
                                </button>
                            </div>
                            
                            <!-- Seller Info -->
                            <div class="quick-view-seller" id="quickViewSeller"></div>
                            
                            <!-- Delivery Info -->
                            <div class="quick-view-delivery">
                                <div class="delivery-item">
                                    <i class="fas fa-truck"></i>
                                    <span>Free delivery on orders above ₹2,000</span>
                                </div>
                                <div class="delivery-item">
                                    <i class="fas fa-undo"></i>
                                    <span>7 day easy returns</span>
                                </div>
                                <div class="delivery-item">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>Secure checkout</span>
                                </div>
                            </div>
                            
                            <a class="quick-view-full-link" id="quickViewFullLink">
                                View Full Details <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.modal = modal;
            this.injectStyles();
        },

        /**
         * Inject styles
         */
        injectStyles() {
            if (document.getElementById('quick-view-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'quick-view-styles';
            styles.textContent = `
                .quick-view-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .quick-view-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .quick-view-modal {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    max-width: 1000px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: hidden;
                    position: relative;
                    transform: scale(0.95) translateY(20px);
                    transition: transform 0.3s ease;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                }
                
                .quick-view-overlay.active .quick-view-modal {
                    transform: scale(1) translateY(0);
                }
                
                .quick-view-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: var(--light-grey);
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .quick-view-close:hover {
                    background: var(--danger, #EF4444);
                    color: white;
                }
                
                .quick-view-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    max-height: 90vh;
                }
                
                /* Gallery */
                .quick-view-gallery {
                    background: var(--light-grey);
                    padding: 24px;
                }
                
                .gallery-main {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    background: white;
                    margin-bottom: 16px;
                }
                
                .gallery-main img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .gallery-badges {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .gallery-badges .badge {
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .gallery-badges .badge-sale { background: #EF4444; color: white; }
                .gallery-badges .badge-new { background: #10B981; color: white; }
                .gallery-badges .badge-hot { background: #F59E0B; color: white; }
                
                .gallery-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .gallery-nav:hover {
                    background: var(--blue-primary);
                    color: white;
                }
                
                .gallery-nav.prev { left: 12px; }
                .gallery-nav.next { right: 12px; }
                
                .gallery-thumbs {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }
                
                .gallery-thumb {
                    width: 60px;
                    height: 60px;
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s ease;
                }
                
                .gallery-thumb:hover,
                .gallery-thumb.active {
                    border-color: var(--blue-primary);
                }
                
                .gallery-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                /* Info Panel */
                .quick-view-info {
                    padding: 32px;
                    overflow-y: auto;
                    max-height: 90vh;
                }
                
                .quick-view-category {
                    font-size: 0.8rem;
                    color: var(--blue-primary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 600;
                }
                
                .quick-view-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 8px 0 12px;
                    line-height: 1.3;
                }
                
                .quick-view-rating {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .quick-view-rating .stars {
                    color: #F59E0B;
                }
                
                .quick-view-rating .count {
                    color: var(--medium-grey);
                    font-size: 0.85rem;
                }
                
                .quick-view-price {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .quick-view-price .current {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--blue-primary);
                }
                
                .quick-view-price .original {
                    font-size: 1.1rem;
                    color: var(--medium-grey);
                    text-decoration: line-through;
                }
                
                .quick-view-price .discount {
                    font-size: 0.9rem;
                    color: #10B981;
                    font-weight: 600;
                }
                
                .quick-view-stock {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 999px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                
                .quick-view-stock.in-stock {
                    background: #D1FAE5;
                    color: #059669;
                }
                
                .quick-view-stock.low-stock {
                    background: #FEF3C7;
                    color: #D97706;
                }
                
                .quick-view-stock.out-of-stock {
                    background: #FEE2E2;
                    color: #DC2626;
                }
                
                .quick-view-description {
                    color: var(--medium-grey);
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                
                /* Variants */
                .quick-view-variants {
                    margin-bottom: 20px;
                }
                
                .variant-group {
                    margin-bottom: 12px;
                }
                
                .variant-label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                    display: block;
                }
                
                .variant-options {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .variant-option {
                    padding: 8px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: var(--radius-sm);
                    background: white;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                }
                
                .variant-option:hover {
                    border-color: var(--blue-primary);
                }
                
                .variant-option.selected {
                    border-color: var(--blue-primary);
                    background: var(--blue-light);
                    color: var(--blue-primary);
                    font-weight: 600;
                }
                
                .variant-option.color {
                    width: 36px;
                    height: 36px;
                    padding: 0;
                    border-radius: 50%;
                }
                
                /* Quantity */
                .quick-view-quantity {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .quick-view-quantity label {
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .quantity-selector {
                    display: flex;
                    align-items: center;
                    border: 1px solid #e5e7eb;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                }
                
                .qty-btn {
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: var(--light-grey);
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: all 0.2s ease;
                }
                
                .qty-btn:hover {
                    background: var(--blue-primary);
                    color: white;
                }
                
                #qtyInput {
                    width: 60px;
                    height: 40px;
                    border: none;
                    text-align: center;
                    font-size: 1rem;
                    font-weight: 600;
                }
                
                #qtyInput::-webkit-inner-spin-button,
                #qtyInput::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                }
                
                /* Actions */
                .quick-view-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .btn-add-to-cart {
                    flex: 1;
                    padding: 14px 24px;
                    background: var(--blue-primary);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s ease;
                }
                
                .btn-add-to-cart:hover {
                    background: var(--blue-dark);
                    transform: translateY(-2px);
                }
                
                .btn-add-to-cart:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .btn-wishlist {
                    width: 50px;
                    height: 50px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    font-size: 1.25rem;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .btn-wishlist:hover {
                    border-color: #EF4444;
                    color: #EF4444;
                }
                
                .btn-wishlist.active {
                    background: #FEE2E2;
                    border-color: #EF4444;
                    color: #EF4444;
                }
                
                .btn-wishlist.active i {
                    font-weight: 900;
                }
                
                /* Seller */
                .quick-view-seller {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--light-grey);
                    border-radius: var(--radius-md);
                    margin-bottom: 16px;
                }
                
                .seller-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--blue-primary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                }
                
                .seller-info .seller-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .seller-info .seller-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--blue-primary);
                }
                
                /* Delivery */
                .quick-view-delivery {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .delivery-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 6px;
                    padding: 12px;
                    background: var(--light-grey);
                    border-radius: var(--radius-md);
                    font-size: 0.75rem;
                    color: var(--medium-grey);
                }
                
                .delivery-item i {
                    font-size: 1.25rem;
                    color: var(--blue-primary);
                }
                
                /* Full Link */
                .quick-view-full-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: var(--radius-md);
                    color: var(--text-dark);
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .quick-view-full-link:hover {
                    border-color: var(--blue-primary);
                    color: var(--blue-primary);
                }

                /* Loading */
                .quick-view-loading {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .quick-view-loading.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .loading-spinner {
                    text-align: center;
                    color: white;
                }
                
                .loading-spinner i {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }
                
                .loading-spinner p {
                    font-size: 1rem;
                    opacity: 0.8;
                }
                
                /* Mobile */
                @media (max-width: 768px) {
                    .quick-view-content {
                        grid-template-columns: 1fr;
                    }
                    
                    .quick-view-gallery {
                        padding: 16px;
                    }
                    
                    .gallery-main {
                        aspect-ratio: 4/3;
                    }
                    
                    .quick-view-info {
                        padding: 20px;
                        max-height: 50vh;
                    }
                    
                    .quick-view-delivery {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Bind events
         */
        bindEvents() {
            // Close button
            document.getElementById('quickViewClose')?.addEventListener('click', () => this.close());
            
            // Overlay click
            this.modal?.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
            
            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                    this.close();
                }
            });
            
            // Quantity controls
            document.getElementById('qtyMinus')?.addEventListener('click', () => {
                const input = document.getElementById('qtyInput');
                if (input.value > 1) input.value = parseInt(input.value) - 1;
            });
            
            document.getElementById('qtyPlus')?.addEventListener('click', () => {
                const input = document.getElementById('qtyInput');
                if (input.value < 10) input.value = parseInt(input.value) + 1;
            });
            
            // Add to cart
            document.getElementById('quickViewAddCart')?.addEventListener('click', () => {
                if (this.currentProduct) {
                    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
                    for (let i = 0; i < qty; i++) {
                        if (window.productManager) {
                            window.productManager.addToCart(this.currentProduct);
                        }
                    }
                    this.close();
                }
            });
            
            // Wishlist
            document.getElementById('quickViewWishlist')?.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                btn.classList.toggle('active');
                if (this.currentProduct && window.productManager) {
                    window.productManager.toggleWishlist(this.currentProduct);
                }
            });
            
            // Gallery navigation
            document.getElementById('galleryPrev')?.addEventListener('click', () => this.prevImage());
            document.getElementById('galleryNext')?.addEventListener('click', () => this.nextImage());
            
            // Delegate quick view button clicks
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-quick-view]');
                if (btn) {
                    const productId = btn.dataset.quickView;
                    this.openById(productId);
                }
            });
        },

        /**
         * Open quick view for product
         */
        open(product) {
            if (!product) return;
            
            this.currentProduct = product;
            this.currentImageIndex = 0;
            
            // Set content
            document.getElementById('quickViewMainImage').src = product.image || '';
            document.getElementById('quickViewCategory').textContent = product.category || 'Product';
            document.getElementById('quickViewTitle').textContent = product.name || '';
            document.getElementById('quickViewDescription').textContent = product.description || 'No description available.';
            
            // Price
            const priceEl = document.getElementById('quickViewPrice');
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPercent = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
            
            priceEl.innerHTML = `
                <span class="current">₹${(product.price || 0).toLocaleString()}</span>
                ${hasDiscount ? `<span class="original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                ${hasDiscount ? `<span class="discount">${discountPercent}% OFF</span>` : ''}
            `;
            
            // Rating
            const rating = product.rating || 4;
            const ratingCount = product.ratingCount || Math.floor(Math.random() * 500) + 50;
            document.getElementById('quickViewRating').innerHTML = `
                <span class="stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
                <span class="count">(${ratingCount} reviews)</span>
            `;
            
            // Stock
            const stock = product.stock ?? Math.floor(Math.random() * 50) + 1;
            const stockEl = document.getElementById('quickViewStock');
            if (stock === 0) {
                stockEl.className = 'quick-view-stock out-of-stock';
                stockEl.innerHTML = '<i class="fas fa-times-circle"></i> Out of Stock';
                document.getElementById('quickViewAddCart').disabled = true;
            } else if (stock <= 5) {
                stockEl.className = 'quick-view-stock low-stock';
                stockEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Only ${stock} left!`;
                document.getElementById('quickViewAddCart').disabled = false;
            } else {
                stockEl.className = 'quick-view-stock in-stock';
                stockEl.innerHTML = '<i class="fas fa-check-circle"></i> In Stock';
                document.getElementById('quickViewAddCart').disabled = false;
            }
            
            // Badges
            const badgesEl = document.getElementById('quickViewBadges');
            let badges = '';
            if (product.badge) badges += `<span class="badge badge-${product.badge.toLowerCase()}">${product.badge}</span>`;
            if (hasDiscount) badges += `<span class="badge badge-sale">${discountPercent}% OFF</span>`;
            badgesEl.innerHTML = badges;
            
            // Seller
            const sellerName = product.sellerName || 'Verified Seller';
            document.getElementById('quickViewSeller').innerHTML = `
                <div class="seller-avatar">${sellerName.charAt(0).toUpperCase()}</div>
                <div class="seller-info">
                    <div class="seller-name">${sellerName}</div>
                    <div class="seller-badge"><i class="fas fa-check-circle"></i> Verified Seller</div>
                </div>
            `;
            
            // Full link
            document.getElementById('quickViewFullLink').href = `/product.html?id=${product.id}`;
            
            // Reset quantity
            document.getElementById('qtyInput').value = 1;
            
            // Check wishlist
            const wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
            const isWishlisted = wishlist.some(w => w.id === product.id);
            document.getElementById('quickViewWishlist').classList.toggle('active', isWishlisted);
            
            // Show modal
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        /**
         * Open by product ID - Enhanced with Firestore fallback
         */
        async openById(productId) {
            // Try from memory first
            const products = window.productsData || [];
            let product = products.find(p => p.id == productId);
            
            if (product) {
                this.open(product);
                return;
            }
            
            // Try from Firestore if available
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    // Show loading
                    this.showLoading();
                    
                    const doc = await firebase.firestore().collection('products').doc(productId).get();
                    if (doc.exists) {
                        product = { id: doc.id, ...doc.data() };
                        this.open(product);
                        
                        // Cache for future use
                        if (!window.productsData) window.productsData = [];
                        window.productsData.push(product);
                        return;
                    }
                } catch (error) {
                    console.warn('Could not fetch product from Firestore:', error);
                } finally {
                    this.hideLoading();
                }
            }
            
            // Final fallback - redirect to shop
            console.warn('Product not found:', productId);
            window.location.href = `/shop.html?product=${productId}`;
        },

        /**
         * Show loading state
         */
        showLoading() {
            if (!this.loadingEl) {
                this.loadingEl = document.createElement('div');
                this.loadingEl.className = 'quick-view-loading';
                this.loadingEl.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading product...</p>
                    </div>
                `;
                document.body.appendChild(this.loadingEl);
            }
            this.loadingEl.classList.add('active');
        },

        /**
         * Hide loading state
         */
        hideLoading() {
            this.loadingEl?.classList.remove('active');
        },

        /**
         * Close modal
         */
        close() {
            this.modal?.classList.remove('active');
            document.body.style.overflow = '';
            this.currentProduct = null;
        },

        /**
         * Next image in gallery
         */
        nextImage() {
            // For products with multiple images
        },

        /**
         * Previous image in gallery
         */
        prevImage() {
            // For products with multiple images
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        QuickView.init();
    });

    // Expose globally
    window.QuickView = QuickView;

})();
