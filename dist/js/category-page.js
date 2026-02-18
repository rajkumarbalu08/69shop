/**
 * 69SHOP.IN - Category Page JavaScript
 * Handles product filtering, sorting, cart, and wishlist for category pages
 */

// Global scroll function for trending carousel
function scrollTrending(direction) {
    const carousel = document.getElementById('trendingCarousel');
    if (!carousel) return;
    
    const scrollAmount = 300;
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

const CategoryPage = {
    category: '',
    subcategories: [],
    products: [],
    filteredProducts: [],
    cart: [],
    wishlist: [],
    currentSort: 'popular',
    currentPriceFilter: 'all',
    currentSubcategory: 'all',

    /**
     * Initialize category page
     */
    init(category, subcategories = []) {
        this.category = category;
        this.subcategories = subcategories;
        this.loadCart();
        this.loadWishlist();
        this.loadProducts();
        this.renderTrending();
        this.setupEventListeners();
        this.updateCounts();
        this.setupAuth();
        console.log(`📁 Category Page initialized: ${category}`);
    },

    /**
     * Render trending products carousel
     */
    renderTrending() {
        const carousel = document.getElementById('trendingCarousel');
        if (!carousel) return;

        // Get top 6 products by rating
        const trendingProducts = [...this.products]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        if (trendingProducts.length === 0) {
            carousel.closest('.trending-section').style.display = 'none';
            return;
        }

        carousel.innerHTML = trendingProducts.map(product => {
            const inWishlist = this.wishlist.includes(product.id);
            const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
            
            return `
                <div class="product-card trending-product-card" data-product-id="${product.id}">
                    <a href="/product.html?id=${product.id}" class="product-image-link">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='/Logo/placeholder.svg'">
                            <div class="product-badges">
                                <span class="product-badge badge-trending">TRENDING</span>
                            </div>
                            <div class="product-actions">
                                <button class="product-action-btn ${inWishlist ? 'in-wishlist' : ''}" 
                                        onclick="event.preventDefault(); event.stopPropagation(); CategoryPage.toggleWishlist('${product.id}')" 
                                        aria-label="Add to wishlist">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <button class="product-action-btn quick-view-btn" 
                                        onclick="event.preventDefault(); event.stopPropagation(); CategoryPage.quickView('${product.id}')"
                                        aria-label="Quick view">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </a>
                    <div class="product-content">
                        <div class="product-brand">${product.brand || product.seller}</div>
                        <a href="/product.html?id=${product.id}" class="product-name-link">
                            <h3 class="product-name">${product.name}</h3>
                        </a>
                        <div class="product-rating">
                            <span class="rating-stars">${stars}</span>
                            <span class="rating-value">${product.rating}</span>
                        </div>
                        <div class="product-price">
                            <span class="price-current">₹${product.price.toLocaleString()}</span>
                            ${product.originalPrice ? `<span class="price-original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                        </div>
                        <div class="product-cta">
                            <button class="btn-add-cart" onclick="event.stopPropagation(); CategoryPage.addToCart('${product.id}')">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <a href="/product.html?id=${product.id}" class="btn-view-product">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Load products for this category
     * Also exposed globally as window.loadProducts for compatibility
     */
    loadProducts() {
        const allProducts = window.productsData || [];
        // Expose globally for test compatibility
        if (!window.loadProducts) {
            window.loadProducts = () => this.loadProducts();
        }
        
        // Filter by category
        this.products = allProducts.filter(p => {
            // Direct category match
            if (p.category === this.category) return true;
            
            // Check tags for related products
            if (p.tags && p.tags.some(tag => 
                tag.toLowerCase().includes(this.category.toLowerCase())
            )) return true;
            
            return false;
        });

        // Update product count
        document.getElementById('productCount').textContent = this.products.length;
        
        // Update filtered count
        const filteredCountEl = document.getElementById('filteredCount');
        if (filteredCountEl) filteredCountEl.textContent = this.products.length;
        
        this.filteredProducts = [...this.products];
        this.renderProducts();
    },

    /**
     * Render products grid
     */
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;

        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');
        
        // Animate cards
        const cards = grid.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    },

    /**
     * Create product card HTML
     */
    createProductCard(product) {
        const inWishlist = this.wishlist.includes(product.id);
        const originalPrice = Math.round(product.price * 1.3);
        const discount = Math.round((1 - product.price / originalPrice) * 100);
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='/Logo/placeholder.svg'">
                    <div class="product-badges">
                        ${discount >= 20 ? '<span class="product-badge badge-sale">Sale</span>' : ''}
                        ${product.tags?.includes('new') ? '<span class="product-badge badge-new">New</span>' : ''}
                    </div>
                    <div class="product-actions">
                        <button class="product-action-btn ${inWishlist ? 'in-wishlist' : ''}" 
                                onclick="CategoryPage.toggleWishlist('${product.id}')" 
                                aria-label="Add to wishlist">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="product-action-btn" 
                                onclick="CategoryPage.quickView('${product.id}')" 
                                aria-label="Quick view">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-content">
                    <div class="product-brand">${product.brand || product.seller}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-rating">
                        <span class="rating-stars">${stars}</span>
                        <span class="rating-value">${product.rating}</span>
                    </div>
                    <div class="product-price">
                        <span class="price-current">₹${product.price.toLocaleString()}</span>
                        <span class="price-original">₹${originalPrice.toLocaleString()}</span>
                        <span class="price-discount">${discount}% OFF</span>
                    </div>
                    <div class="product-cta">
                        <button class="btn-add-cart" onclick="CategoryPage.addToCart('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn-quick-view" onclick="CategoryPage.quickView('${product.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Subcategory filter tags
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                this.currentSubcategory = tag.dataset.subcategory;
                this.applyFilters();
            });
        });

        // Cart sidebar
        const cartBtn = document.getElementById('cartBtn');
        const cartOverlay = document.getElementById('cartOverlay');
        const closeCart = document.getElementById('closeCart');
        const cartSidebar = document.getElementById('cartSidebar');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                cartSidebar?.classList.add('active');
                cartOverlay?.classList.add('active');
                this.renderCart();
            });
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => {
                cartSidebar?.classList.remove('active');
                cartOverlay?.classList.remove('active');
            });
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                cartSidebar?.classList.remove('active');
                cartOverlay?.classList.remove('active');
            });
        }

        // Checkout button - redirect to shop.html with cart open
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.cart.length === 0) {
                    this.showNotification('Your cart is empty!', 'error');
                    return;
                }
                // Save cart and redirect to shop for full checkout
                this.saveCart();
                window.location.href = '/shop.html?openCheckout=true';
            });
        }

        // Profile sidebar
        const profileOverlay = document.getElementById('profileOverlay');
        const closeProfile = document.getElementById('closeProfile');
        const profileSidebar = document.getElementById('profileSidebar');

        if (closeProfile) {
            closeProfile.addEventListener('click', () => {
                profileSidebar?.classList.remove('active');
                profileOverlay?.classList.remove('active');
            });
        }

        if (profileOverlay) {
            profileOverlay.addEventListener('click', () => {
                profileSidebar?.classList.remove('active');
                profileOverlay?.classList.remove('active');
            });
        }

        // Quick view modal
        const quickViewOverlay = document.getElementById('quickViewOverlay');
        const quickViewClose = document.getElementById('quickViewClose');
        const quickViewModal = document.getElementById('quickViewModal');

        if (quickViewClose) {
            quickViewClose.addEventListener('click', () => {
                quickViewModal?.classList.remove('active');
                quickViewOverlay?.classList.remove('active');
            });
        }

        if (quickViewOverlay) {
            quickViewOverlay.addEventListener('click', () => {
                quickViewModal?.classList.remove('active');
                quickViewOverlay?.classList.remove('active');
            });
        }

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }
    },

    /**
     * Sort products
     */
    sortProducts(sortBy) {
        this.currentSort = sortBy;
        this.applyFilters();
    },

    /**
     * Filter by price
     */
    filterByPrice(priceRange) {
        this.currentPriceFilter = priceRange;
        this.applyFilters();
    },

    /**
     * Apply all filters and sorting
     */
    applyFilters() {
        let filtered = [...this.products];

        // Apply subcategory filter
        if (this.currentSubcategory !== 'all') {
            filtered = filtered.filter(p => {
                if (p.tags) {
                    return p.tags.some(tag => 
                        tag.toLowerCase().includes(this.currentSubcategory.toLowerCase())
                    );
                }
                return false;
            });
        }

        // Apply price filter
        if (this.currentPriceFilter !== 'all') {
            const [min, max] = this.currentPriceFilter.split('-').map(v => {
                if (v.includes('+')) return Infinity;
                return parseInt(v);
            });
            filtered = filtered.filter(p => p.price >= min && p.price <= (max || Infinity));
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                filtered.reverse();
                break;
            case 'popular':
            default:
                filtered.sort((a, b) => b.rating - a.rating);
                break;
        }

        this.filteredProducts = filtered;
        
        // Update filtered count
        const filteredCountEl = document.getElementById('filteredCount');
        if (filteredCountEl) filteredCountEl.textContent = this.filteredProducts.length;
        
        this.renderProducts();
    },

    /**
     * Search products
     */
    searchProducts(query) {
        if (!query.trim()) {
            this.filteredProducts = [...this.products];
        } else {
            const q = query.toLowerCase();
            this.filteredProducts = this.products.filter(p => 
                p.name.toLowerCase().includes(q) ||
                (p.brand && p.brand.toLowerCase().includes(q)) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q)))
            );
        }
        this.renderProducts();
    },

    /**
     * Reset filters
     */
    resetFilters() {
        this.currentSort = 'popular';
        this.currentPriceFilter = 'all';
        this.currentSubcategory = 'all';
        
        document.getElementById('sortSelect').value = 'popular';
        document.getElementById('priceFilter').value = 'all';
        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        document.querySelector('.filter-tag[data-subcategory="all"]')?.classList.add('active');
        
        this.filteredProducts = [...this.products];
        this.renderProducts();
    },

    /**
     * Load cart from localStorage
     */
    loadCart() {
        this.cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
    },

    /**
     * Save cart to localStorage
     */
    saveCart() {
        localStorage.setItem('69shop_cart', JSON.stringify(this.cart));
        this.updateCounts();
    },

    /**
     * Add to cart
     */
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId) || 
                       (window.productsData || []).find(p => p.id === productId);
        if (!product) return;

        const existing = this.cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }

        this.saveCart();
        this.showNotification(`${product.name} added to cart!`);
        
        // Open cart sidebar
        document.getElementById('cartSidebar')?.classList.add('active');
        document.getElementById('cartOverlay')?.classList.add('active');
        this.renderCart();
    },

    /**
     * Remove from cart
     */
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.renderCart();
    },

    /**
     * Update cart quantity
     */
    updateQuantity(productId, delta) {
        const item = this.cart.find(i => i.id === productId);
        if (item) {
            item.quantity = Math.max(1, (item.quantity || 1) + delta);
            this.saveCart();
            this.renderCart();
        }
    },

    /**
     * Render cart sidebar
     */
    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="/shop.html" class="btn-shop">Start Shopping</a>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = '₹0';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">₹${item.price.toLocaleString()}</p>
                    <div class="cart-item-qty">
                        <button onclick="CategoryPage.updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity || 1}</span>
                        <button onclick="CategoryPage.updateQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="CategoryPage.removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString()}`;
    },

    /**
     * Load wishlist from localStorage
     */
    loadWishlist() {
        let wishlist = JSON.parse(localStorage.getItem('69shop_wishlist') || '[]');
        // Normalize to IDs only
        this.wishlist = wishlist.map(item => typeof item === 'object' ? item.id : item);
    },

    /**
     * Save wishlist to localStorage
     */
    saveWishlist() {
        localStorage.setItem('69shop_wishlist', JSON.stringify(this.wishlist));
        this.updateCounts();
    },

    /**
     * Toggle wishlist
     */
    toggleWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        const product = this.products.find(p => p.id === productId) || 
                       (window.productsData || []).find(p => p.id === productId);

        if (index > -1) {
            this.wishlist.splice(index, 1);
            this.showNotification('Removed from wishlist');
        } else {
            this.wishlist.push(productId);
            this.showNotification(`${product?.name || 'Item'} added to wishlist!`);
        }

        this.saveWishlist();
        this.renderProducts();
    },

    /**
     * Update cart and wishlist counts
     */
    updateCounts() {
        const cartCount = document.getElementById('cartCount');
        const wishlistCount = document.getElementById('wishlistCount');

        if (cartCount) {
            const total = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCount.textContent = total;
            cartCount.style.display = total > 0 ? 'flex' : 'none';
        }

        if (wishlistCount) {
            wishlistCount.textContent = this.wishlist.length;
            wishlistCount.style.display = this.wishlist.length > 0 ? 'flex' : 'none';
        }
    },

    /**
     * Quick view product
     */
    quickView(productId) {
        const product = this.products.find(p => p.id === productId) || 
                       (window.productsData || []).find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('quickViewModal');
        const overlay = document.getElementById('quickViewOverlay');
        const content = document.getElementById('quickViewContent');

        if (!modal || !content) return;

        const originalPrice = Math.round(product.price * 1.3);
        const discount = Math.round((1 - product.price / originalPrice) * 100);
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));

        content.innerHTML = `
            <div class="quick-view-grid">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <span class="quick-view-brand">${product.brand || product.seller}</span>
                    <h2>${product.name}</h2>
                    <div class="quick-view-rating">
                        <span class="stars">${stars}</span>
                        <span class="rating-value">${product.rating} / 5</span>
                    </div>
                    <p class="quick-view-desc">${product.description || 'No description available.'}</p>
                    <div class="quick-view-price">
                        <span class="current">₹${product.price.toLocaleString()}</span>
                        <span class="original">₹${originalPrice.toLocaleString()}</span>
                        <span class="discount">${discount}% OFF</span>
                    </div>
                    <div class="quick-view-actions">
                        <button class="btn-add-cart" onclick="CategoryPage.addToCart('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn-wishlist ${this.wishlist.includes(product.id) ? 'active' : ''}" 
                                onclick="CategoryPage.toggleWishlist('${product.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                    <div class="quick-view-tags">
                        ${(product.tags || []).slice(0, 5).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        overlay?.classList.add('active');
    },

    /**
     * Show notification
     */
    showNotification(message) {
        const existing = document.querySelector('.category-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'category-notification';
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
    },

    /**
     * Setup authentication
     */
    setupAuth() {
        if (!window.firebaseReady || !auth) return;

        auth.onAuthStateChanged(user => {
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            const profileAvatarLarge = document.getElementById('profileAvatarLarge');
            const profileNameLarge = document.getElementById('profileNameLarge');
            const profileEmail = document.getElementById('profileEmail');
            const loginBtn = document.getElementById('loginBtn');

            if (user) {
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                const initial = displayName.charAt(0).toUpperCase();

                if (userAvatar) userAvatar.textContent = initial;
                if (userName) userName.textContent = displayName;
                if (profileAvatarLarge) profileAvatarLarge.textContent = initial;
                if (profileNameLarge) profileNameLarge.textContent = displayName;
                if (profileEmail) profileEmail.textContent = user.email;
                if (loginBtn) {
                    loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
                    loginBtn.onclick = () => auth.signOut().then(() => window.location.reload());
                }
            }
        });
    }
};

// Global functions for inline handlers
window.sortProducts = (value) => CategoryPage.sortProducts(value);
window.filterByPrice = (value) => CategoryPage.filterByPrice(value);
window.resetFilters = () => CategoryPage.resetFilters();

// Profile sidebar
window.openProfileSidebar = (event) => {
    event?.preventDefault();
    document.getElementById('profileSidebar')?.classList.add('active');
    document.getElementById('profileOverlay')?.classList.add('active');
};

// Expose globally
window.CategoryPage = CategoryPage;
