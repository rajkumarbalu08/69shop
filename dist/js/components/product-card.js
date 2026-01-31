/**
 * 69Shop.in - Reusable Product Card Component
 * Version: 1.0.0
 * 
 * Usage:
 * ProductCard.render(product, options) - Returns HTML string
 * ProductCard.createGrid(products, containerId, options) - Renders grid to container
 */

(function(global) {
    'use strict';

    const DEFAULT_OPTIONS = {
        showWishlist: true,
        showQuickView: true,
        showSellerBadge: true,
        showRating: true,
        lazyLoad: true,
        onAddToCart: null,
        onWishlistToggle: null,
        onQuickView: null,
        onProductClick: null
    };

    // Wishlist state
    let wishlist = [];

    function loadWishlist() {
        try {
            wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
        } catch (e) {
            wishlist = [];
        }
        return wishlist;
    }

    function saveWishlist() {
        localStorage.setItem('69shop_wishlist', JSON.stringify(wishlist));
    }

    function isInWishlist(productId) {
        loadWishlist();
        return wishlist.some(item => item.id === productId || item === productId);
    }

    function toggleWishlist(product) {
        loadWishlist();
        const index = wishlist.findIndex(item => (item.id || item) === product.id);
        
        if (index > -1) {
            wishlist.splice(index, 1);
            saveWishlist();
            return false;
        } else {
            wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image });
            saveWishlist();
            return true;
        }
    }

    function getBadgeHTML(product) {
        let badges = '';
        
        if (product.isNew) {
            badges += '<span class="product-badge badge-new">NEW</span>';
        }
        if (product.discount && product.discount > 0) {
            badges += `<span class="product-badge badge-sale">-${product.discount}%</span>`;
        }
        if (product.isBestseller || product.bestseller) {
            badges += '<span class="product-badge badge-hot">BEST</span>';
        }
        if (product.isHot || product.hot) {
            badges += '<span class="product-badge badge-hot">HOT</span>';
        }
        if (product.isPremium || product.premium) {
            badges += '<span class="product-badge badge-premium">PREMIUM</span>';
        }
        
        return badges;
    }

    function getSellerBadge(product) {
        if (!product.seller && !product.sellerVerified) return '';
        
        const isVerified = product.sellerVerified || product.seller?.verified;
        const isPremium = product.sellerPremium || product.seller?.premium;
        
        if (isPremium) {
            return '<span class="seller-badge premium"><i class="fas fa-crown"></i> Premium</span>';
        } else if (isVerified) {
            return '<span class="seller-badge verified"><i class="fas fa-check-circle"></i> Verified</span>';
        }
        return '';
    }

    function getRatingHTML(rating, reviews) {
        if (!rating) return '';
        
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalf) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return `
            <div class="product-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${rating.toFixed(1)}</span>
                ${reviews ? `<span class="review-count">(${reviews})</span>` : ''}
            </div>
        `;
    }

    function render(product, options = {}) {
        const config = { ...DEFAULT_OPTIONS, ...options };
        const inWishlist = isInWishlist(product.id);
        const imageSrc = config.lazyLoad ? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' : (product.image || product.images?.[0] || '');
        const dataImg = product.image || product.images?.[0] || '';
        
        const originalPrice = product.originalPrice || (product.discount ? Math.round(product.price / (1 - product.discount/100)) : null);
        
        return `
        <article class="product-card" data-product-id="${product.id}" data-category="${product.category || ''}">
            <div class="product-image-wrapper">
                <img src="${imageSrc}" 
                     data-src="${dataImg}"
                     alt="${product.name}" 
                     class="product-image ${config.lazyLoad ? 'lazy-image' : ''}"
                     loading="${config.lazyLoad ? 'lazy' : 'eager'}"
                     onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                
                <div class="product-badges">
                    ${getBadgeHTML(product)}
                </div>
                
                <div class="product-actions">
                    ${config.showWishlist ? `
                    <button class="action-btn wishlist-btn ${inWishlist ? 'active' : ''}" 
                            data-product-id="${product.id}" 
                            aria-label="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    ` : ''}
                    ${config.showQuickView ? `
                    <button class="action-btn quickview-btn" data-product-id="${product.id}" aria-label="Quick view">
                        <i class="fas fa-eye"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="product-info">
                <div class="product-meta">
                    <span class="product-category">${product.category || 'General'}</span>
                    ${config.showSellerBadge ? getSellerBadge(product) : ''}
                </div>
                
                <h3 class="product-title">
                    <a href="/product.html?id=${product.id}" class="product-link">${product.name}</a>
                </h3>
                
                ${product.seller?.name ? `<p class="product-seller">by ${product.seller.name}</p>` : ''}
                
                ${config.showRating ? getRatingHTML(product.rating, product.reviews) : ''}
                
                <div class="product-pricing">
                    <span class="current-price">₹${product.price?.toLocaleString('en-IN') || 0}</span>
                    ${originalPrice ? `<span class="original-price">₹${originalPrice.toLocaleString('en-IN')}</span>` : ''}
                    ${product.discount ? `<span class="discount-tag">-${product.discount}%</span>` : ''}
                </div>
                
                ${product.stock !== undefined && product.stock <= 5 && product.stock > 0 ? 
                    `<p class="low-stock">Only ${product.stock} left!</p>` : ''}
                
                <button class="add-to-cart-btn" data-product-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
            </div>
        </article>
        `;
    }

    function createGrid(products, containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('ProductCard: Container not found:', containerId);
            return;
        }

        const config = { ...DEFAULT_OPTIONS, ...options };
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(p => render(p, config)).join('');

        // Setup lazy loading
        if (config.lazyLoad) {
            setupLazyLoading(container);
        }

        // Setup event listeners
        setupEventListeners(container, products, config);
    }

    function setupLazyLoading(container) {
        const images = container.querySelectorAll('.lazy-image');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        if (src) {
                            img.src = src;
                            img.classList.remove('lazy-image');
                            img.classList.add('loaded');
                        }
                        obs.unobserve(img);
                    }
                });
            }, {
                rootMargin: '100px',
                threshold: 0.1
            });

            images.forEach(img => observer.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }

    function setupEventListeners(container, products, config) {
        // Add to cart buttons
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productId = btn.dataset.productId;
                const product = products.find(p => String(p.id) === String(productId));
                
                if (product && config.onAddToCart) {
                    config.onAddToCart(product);
                } else if (product) {
                    addToCart(product);
                }
            });
        });

        // Wishlist buttons
        container.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productId = btn.dataset.productId;
                const product = products.find(p => String(p.id) === String(productId));
                
                if (product) {
                    const added = toggleWishlist(product);
                    btn.classList.toggle('active', added);
                    btn.innerHTML = `<i class="${added ? 'fas' : 'far'} fa-heart"></i>`;
                    
                    if (config.onWishlistToggle) {
                        config.onWishlistToggle(product, added);
                    }
                    
                    showToast(added ? 'Added to wishlist' : 'Removed from wishlist');
                }
            });
        });

        // Quick view buttons
        container.querySelectorAll('.quickview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productId = btn.dataset.productId;
                const product = products.find(p => String(p.id) === String(productId));
                
                if (product && config.onQuickView) {
                    config.onQuickView(product);
                }
            });
        });

        // Product click
        container.querySelectorAll('.product-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (config.onProductClick) {
                    e.preventDefault();
                    const productId = link.closest('.product-card').dataset.productId;
                    const product = products.find(p => String(p.id) === String(productId));
                    config.onProductClick(product);
                }
            });
        });
    }

    function addToCart(product) {
        try {
            let cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            const existing = cart.find(item => String(item.id) === String(product.id));
            
            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image || product.images?.[0],
                    quantity: 1,
                    seller: product.seller?.name || 'Unknown'
                });
            }
            
            localStorage.setItem('69shop_cart', JSON.stringify(cart));
            
            // Update cart badge if ShopHeader is available
            if (global.ShopHeader) {
                const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                global.ShopHeader.updateCartBadge(totalItems);
            }
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
            
            showToast(`${product.name} added to cart`);
        } catch (e) {
            console.error('ProductCard: Failed to add to cart', e);
        }
    }

    function showToast(message, type = 'success') {
        // Check if toast container exists
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-top: 10px;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function getCSS() {
        return `
        <style id="product-card-styles">
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }

        .product-card {
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
        }

        .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .product-image-wrapper {
            position: relative;
            aspect-ratio: 1;
            overflow: hidden;
            background: #f5f5f5;
        }

        .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s ease;
        }

        .product-image.lazy-image {
            filter: blur(5px);
        }

        .product-image.loaded {
            filter: none;
        }

        .product-card:hover .product-image {
            transform: scale(1.05);
        }

        .product-badges {
            position: absolute;
            top: 12px;
            left: 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .product-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-new { background: #3B82F6; color: #fff; }
        .badge-sale { background: #EF4444; color: #fff; }
        .badge-hot { background: #F59E0B; color: #fff; }
        .badge-premium { background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; }

        .product-actions {
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            opacity: 0;
            transform: translateX(10px);
            transition: all 0.3s ease;
        }

        .product-card:hover .product-actions {
            opacity: 1;
            transform: translateX(0);
        }

        .action-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #fff;
            border: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .action-btn:hover {
            transform: scale(1.1);
        }

        .wishlist-btn { color: #999; }
        .wishlist-btn:hover, .wishlist-btn.active { color: #EF4444; }
        .quickview-btn { color: #666; }
        .quickview-btn:hover { color: #0066ff; }

        .product-info {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
        }

        .product-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .product-category {
            font-size: 0.75rem;
            color: #0066ff;
            font-weight: 500;
            text-transform: uppercase;
        }

        .seller-badge {
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .seller-badge.verified { background: #D1FAE5; color: #059669; }
        .seller-badge.premium { background: #FEF3C7; color: #D97706; }

        .product-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: #1A1A1A;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .product-link {
            color: inherit;
            text-decoration: none;
        }

        .product-link:hover {
            color: #0066ff;
        }

        .product-seller {
            font-size: 0.8rem;
            color: #666;
        }

        .product-rating {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
        }

        .product-rating .stars { color: #F59E0B; }
        .product-rating .rating-value { font-weight: 600; color: #1A1A1A; }
        .product-rating .review-count { color: #999; }

        .product-pricing {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .current-price {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1A1A1A;
        }

        .original-price {
            font-size: 0.85rem;
            color: #999;
            text-decoration: line-through;
        }

        .discount-tag {
            font-size: 0.75rem;
            font-weight: 600;
            color: #10B981;
        }

        .low-stock {
            font-size: 0.75rem;
            color: #EF4444;
            font-weight: 500;
        }

        .add-to-cart-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #0066ff 0%, #009cf7 100%);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
            margin-top: auto;
        }

        .add-to-cart-btn:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }

        .empty-products {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .empty-products i {
            font-size: 3rem;
            color: #ddd;
            margin-bottom: 16px;
        }

        .empty-products h3 {
            font-size: 1.25rem;
            color: #333;
            margin-bottom: 8px;
        }
        </style>
        `;
    }

    // Inject CSS on load
    if (!document.getElementById('product-card-styles')) {
        document.head.insertAdjacentHTML('beforeend', getCSS());
    }

    global.ProductCard = {
        render,
        createGrid,
        addToCart,
        toggleWishlist,
        isInWishlist,
        showToast,
        setupLazyLoading
    };

})(window);
