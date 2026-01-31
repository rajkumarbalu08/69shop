/**
 * 69SHOP.IN - Shop Animations & Modern Filters
 * Premium micro-interactions and horizontal filter system
 */

(function() {
    'use strict';

    // =============================================
    // ANIMATION UTILITIES
    // =============================================
    
    const ShopAnimations = {
        /**
         * Initialize all animations
         */
        init() {
            this.initScrollProgress();
            this.initBackToTop();
            this.initHeaderShrink();
            this.initScrollReveal();
            this.initProductCardAnimations();
            this.initCartBadgeBounce();
            this.initSkeletonLoading();
            console.log('🎨 Shop animations initialized');
        },

        /**
         * Scroll progress bar at top
         */
        initScrollProgress() {
            const progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            document.body.prepend(progressBar);

            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = (scrollTop / docHeight) * 100;
                progressBar.style.width = `${progress}%`;
            });
        },

        /**
         * Back to top button
         */
        initBackToTop() {
            const btn = document.createElement('button');
            btn.className = 'back-to-top';
            btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            btn.setAttribute('aria-label', 'Back to top');
            document.body.appendChild(btn);

            window.addEventListener('scroll', () => {
                if (window.scrollY > 400) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
            });

            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },

        /**
         * Header shrink on scroll
         */
        initHeaderShrink() {
            const header = document.querySelector('.header');
            if (!header) return;

            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        },

        /**
         * Scroll reveal for sections
         */
        initScrollReveal() {
            const elements = document.querySelectorAll('.promotion-card, .section-title, .shop-hero-content');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('scroll-reveal', 'revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '50px' });

            elements.forEach(el => observer.observe(el));
        },

        /**
         * Product card entrance animations
         */
        initProductCardAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            // Observe existing cards
            document.querySelectorAll('.product-card').forEach(card => {
                observer.observe(card);
            });

            // Observe new cards added dynamically
            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                const mutationObserver = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.classList && node.classList.contains('product-card')) {
                                observer.observe(node);
                            }
                        });
                    });
                });
                mutationObserver.observe(productsGrid, { childList: true });
            }
        },

        /**
         * Cart badge bounce on update
         */
        initCartBadgeBounce() {
            const cartCount = document.getElementById('cartCount');
            if (!cartCount) return;

            // Watch for changes
            const observer = new MutationObserver(() => {
                cartCount.classList.add('bump');
                setTimeout(() => cartCount.classList.remove('bump'), 400);
            });

            observer.observe(cartCount, { childList: true, characterData: true, subtree: true });
        },

        /**
         * Show skeleton loading
         */
        initSkeletonLoading() {
            // Add skeleton cards before products load
            const grid = document.getElementById('productsGrid');
            if (!grid || grid.children.length > 0) return;

            const skeletonHTML = `
                <div class="skeleton-card">
                    <div class="skeleton-image skeleton"></div>
                    <div class="skeleton-text medium skeleton"></div>
                    <div class="skeleton-text short skeleton"></div>
                    <div class="skeleton-price skeleton"></div>
                </div>
            `.repeat(8);

            grid.innerHTML = skeletonHTML;
        },

        /**
         * Animate add to cart
         */
        animateAddToCart(button, productImage) {
            // Ripple effect on button
            button.classList.add('added');
            
            // Fly to cart animation
            if (productImage) {
                const cartBtn = document.getElementById('cartBtn');
                if (cartBtn) {
                    const imgRect = productImage.getBoundingClientRect();
                    const cartRect = cartBtn.getBoundingClientRect();
                    
                    const flyingImg = document.createElement('img');
                    flyingImg.src = productImage.src;
                    flyingImg.style.cssText = `
                        position: fixed;
                        width: 50px;
                        height: 50px;
                        object-fit: cover;
                        border-radius: 8px;
                        z-index: 9999;
                        pointer-events: none;
                        left: ${imgRect.left}px;
                        top: ${imgRect.top}px;
                        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    `;
                    document.body.appendChild(flyingImg);

                    requestAnimationFrame(() => {
                        flyingImg.style.left = `${cartRect.left}px`;
                        flyingImg.style.top = `${cartRect.top}px`;
                        flyingImg.style.transform = 'scale(0.3)';
                        flyingImg.style.opacity = '0';
                    });

                    setTimeout(() => flyingImg.remove(), 600);
                }
            }

            setTimeout(() => button.classList.remove('added'), 1500);
        },

        /**
         * Show confetti on order success
         */
        showConfetti() {
            const container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);

            const colors = ['#0066ff', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
            
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    left: ${Math.random() * 100}%;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    animation-delay: ${Math.random() * 0.5}s;
                    animation-duration: ${2 + Math.random() * 2}s;
                `;
                container.appendChild(confetti);
            }

            setTimeout(() => container.remove(), 4000);
        },

        /**
         * Show success checkmark
         */
        showSuccessCheckmark(container) {
            const svg = `
                <div class="success-checkmark">
                    <svg viewBox="0 0 52 52">
                        <circle class="check-circle" cx="26" cy="26" r="25"/>
                        <path class="check-mark" d="M14 27l7 7 16-16"/>
                    </svg>
                </div>
            `;
            if (container) {
                container.innerHTML = svg;
            }
        }
    };

    // =============================================
    // MODERN FILTER SYSTEM
    // =============================================

    const ModernFilters = {
        state: {
            category: 'all',
            priceMin: 0,
            priceMax: 50000,
            sortBy: 'featured',
            sellerType: [],
            deliveryTime: [],
            rating: null
        },

        /**
         * Initialize modern filter bar
         */
        init() {
            this.createFilterBar();
            this.createFiltersModal();
            this.bindEvents();
            console.log('🔍 Modern filters initialized');
        },

        /**
         * Create horizontal filter bar
         */
        createFilterBar() {
            const shopContainer = document.querySelector('.shop-container');
            if (!shopContainer) return;

            const filterBar = document.createElement('div');
            filterBar.className = 'modern-filter-bar';
            filterBar.id = 'modernFilterBar';
            filterBar.innerHTML = `
                <div class="filter-bar-content">
                    <div class="filter-groups-row">
                        <!-- Category Dropdown -->
                        <div class="filter-dropdown-wrapper" data-filter="category">
                            <button class="filter-dropdown-trigger" aria-expanded="false">
                                <i class="fas fa-th-large"></i>
                                <span>Category</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="filter-dropdown-panel">
                                <label class="filter-option selected" data-value="all">
                                    <input type="radio" name="category" value="all" checked>
                                    All Products
                                </label>
                                <label class="filter-option" data-value="mobiles">
                                    <input type="radio" name="category" value="mobiles">
                                    📱 Mobiles
                                </label>
                                <label class="filter-option" data-value="electronics">
                                    <input type="radio" name="category" value="electronics">
                                    💻 Electronics
                                </label>
                                <label class="filter-option" data-value="fashion">
                                    <input type="radio" name="category" value="fashion">
                                    👔 Fashion
                                </label>
                                <label class="filter-option" data-value="beauty">
                                    <input type="radio" name="category" value="beauty">
                                    💄 Beauty
                                </label>
                                <label class="filter-option" data-value="appliances">
                                    <input type="radio" name="category" value="appliances">
                                    🏠 Appliances
                                </label>
                                <label class="filter-option" data-value="headphones">
                                    <input type="radio" name="category" value="headphones">
                                    🎧 Headphones
                                </label>
                            </div>
                        </div>

                        <!-- Price Dropdown -->
                        <div class="filter-dropdown-wrapper" data-filter="price">
                            <button class="filter-dropdown-trigger" aria-expanded="false">
                                <i class="fas fa-rupee-sign"></i>
                                <span>Price</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="filter-dropdown-panel price-range-dropdown">
                                <div class="price-range-header">
                                    <input type="number" class="price-range-input" id="priceMin" value="0" min="0" max="50000">
                                    <span>to</span>
                                    <input type="number" class="price-range-input" id="priceMax" value="50000" min="0" max="50000">
                                </div>
                                <div class="price-presets">
                                    <button class="price-preset" data-min="0" data-max="1000">Under ₹1K</button>
                                    <button class="price-preset" data-min="1000" data-max="5000">₹1K - ₹5K</button>
                                    <button class="price-preset" data-min="5000" data-max="10000">₹5K - ₹10K</button>
                                    <button class="price-preset" data-min="10000" data-max="25000">₹10K - ₹25K</button>
                                    <button class="price-preset" data-min="25000" data-max="50000">₹25K+</button>
                                </div>
                            </div>
                        </div>

                        <!-- Rating Dropdown -->
                        <div class="filter-dropdown-wrapper" data-filter="rating">
                            <button class="filter-dropdown-trigger" aria-expanded="false">
                                <i class="fas fa-star"></i>
                                <span>Rating</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="filter-dropdown-panel">
                                <label class="filter-option" data-value="4">
                                    <input type="radio" name="rating" value="4">
                                    ⭐⭐⭐⭐ & Up
                                </label>
                                <label class="filter-option" data-value="3">
                                    <input type="radio" name="rating" value="3">
                                    ⭐⭐⭐ & Up
                                </label>
                                <label class="filter-option" data-value="2">
                                    <input type="radio" name="rating" value="2">
                                    ⭐⭐ & Up
                                </label>
                            </div>
                        </div>

                        <!-- Delivery Dropdown -->
                        <div class="filter-dropdown-wrapper" data-filter="delivery">
                            <button class="filter-dropdown-trigger" aria-expanded="false">
                                <i class="fas fa-truck"></i>
                                <span>Delivery</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="filter-dropdown-panel">
                                <label class="filter-option" data-value="1day">
                                    <input type="checkbox" name="delivery" value="1day">
                                    🚀 1 Day Delivery
                                </label>
                                <label class="filter-option" data-value="2day">
                                    <input type="checkbox" name="delivery" value="2day">
                                    📦 2 Day Delivery
                                </label>
                                <label class="filter-option" data-value="week">
                                    <input type="checkbox" name="delivery" value="week">
                                    📅 Within a Week
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Sort Dropdown -->
                    <div class="sort-dropdown-wrapper">
                        <div class="filter-dropdown-wrapper" data-filter="sort">
                            <button class="sort-dropdown-trigger" aria-expanded="false">
                                <i class="fas fa-sort"></i>
                                <span>Sort: Featured</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="filter-dropdown-panel">
                                <label class="filter-option selected" data-value="featured">
                                    <input type="radio" name="sort" value="featured" checked>
                                    Featured
                                </label>
                                <label class="filter-option" data-value="price-low">
                                    <input type="radio" name="sort" value="price-low">
                                    Price: Low to High
                                </label>
                                <label class="filter-option" data-value="price-high">
                                    <input type="radio" name="sort" value="price-high">
                                    Price: High to Low
                                </label>
                                <label class="filter-option" data-value="rating">
                                    <input type="radio" name="sort" value="rating">
                                    Highest Rated
                                </label>
                                <label class="filter-option" data-value="newest">
                                    <input type="radio" name="sort" value="newest">
                                    Newest First
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- View Toggle -->
                    <div class="view-toggle-group">
                        <button class="view-toggle-btn active" data-view="grid" aria-label="Grid view">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="view-toggle-btn" data-view="list" aria-label="List view">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>

                    <!-- Advanced Filters -->
                    <button class="advanced-filters-btn" id="openAdvancedFilters">
                        <i class="fas fa-sliders-h"></i>
                        <span>All Filters</span>
                    </button>
                </div>

                <!-- Active Filters Row -->
                <div class="active-filters-row" id="activeFiltersRow"></div>
            `;

            // Insert before shop container
            shopContainer.parentNode.insertBefore(filterBar, shopContainer);
        },

        /**
         * Create advanced filters modal
         */
        createFiltersModal() {
            const modal = document.createElement('div');
            modal.className = 'filters-modal-overlay';
            modal.id = 'filtersModalOverlay';
            modal.innerHTML = `
                <div class="filters-modal">
                    <div class="filters-modal-header">
                        <h3><i class="fas fa-filter"></i> All Filters</h3>
                        <button class="filters-modal-close" id="closeFiltersModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="filters-modal-body">
                        <!-- Category Section -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">Category</h4>
                            <div class="filter-options-grid" id="modalCategoryOptions">
                                <label class="filter-option-card selected" data-value="all">
                                    <input type="radio" name="modal-category" value="all" checked>
                                    <span class="option-icon">🛍️</span>
                                    <span class="option-label">All</span>
                                </label>
                                <label class="filter-option-card" data-value="mobiles">
                                    <input type="radio" name="modal-category" value="mobiles">
                                    <span class="option-icon">📱</span>
                                    <span class="option-label">Mobiles</span>
                                </label>
                                <label class="filter-option-card" data-value="electronics">
                                    <input type="radio" name="modal-category" value="electronics">
                                    <span class="option-icon">💻</span>
                                    <span class="option-label">Electronics</span>
                                </label>
                                <label class="filter-option-card" data-value="fashion">
                                    <input type="radio" name="modal-category" value="fashion">
                                    <span class="option-icon">👔</span>
                                    <span class="option-label">Fashion</span>
                                </label>
                                <label class="filter-option-card" data-value="beauty">
                                    <input type="radio" name="modal-category" value="beauty">
                                    <span class="option-icon">💄</span>
                                    <span class="option-label">Beauty</span>
                                </label>
                                <label class="filter-option-card" data-value="appliances">
                                    <input type="radio" name="modal-category" value="appliances">
                                    <span class="option-icon">🏠</span>
                                    <span class="option-label">Appliances</span>
                                </label>
                                <label class="filter-option-card" data-value="headphones">
                                    <input type="radio" name="modal-category" value="headphones">
                                    <span class="option-icon">🎧</span>
                                    <span class="option-label">Headphones</span>
                                </label>
                                <label class="filter-option-card" data-value="home-needs">
                                    <input type="radio" name="modal-category" value="home-needs">
                                    <span class="option-icon">🛋️</span>
                                    <span class="option-label">Home Needs</span>
                                </label>
                            </div>
                        </div>

                        <!-- Seller Type Section -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">Seller Type</h4>
                            <div class="filter-options-grid">
                                <label class="filter-option-card" data-value="premium">
                                    <input type="checkbox" name="seller-type" value="premium">
                                    <span class="option-icon">⭐</span>
                                    <span class="option-label">Premium</span>
                                </label>
                                <label class="filter-option-card" data-value="verified">
                                    <input type="checkbox" name="seller-type" value="verified">
                                    <span class="option-icon">✅</span>
                                    <span class="option-label">Verified</span>
                                </label>
                                <label class="filter-option-card" data-value="new">
                                    <input type="checkbox" name="seller-type" value="new">
                                    <span class="option-icon">🆕</span>
                                    <span class="option-label">New Sellers</span>
                                </label>
                            </div>
                        </div>

                        <!-- Delivery Time Section -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">Delivery Time</h4>
                            <div class="filter-options-grid">
                                <label class="filter-option-card" data-value="1day">
                                    <input type="checkbox" name="delivery-time" value="1day">
                                    <span class="option-icon">🚀</span>
                                    <span class="option-label">1 Day</span>
                                </label>
                                <label class="filter-option-card" data-value="2day">
                                    <input type="checkbox" name="delivery-time" value="2day">
                                    <span class="option-icon">📦</span>
                                    <span class="option-label">2 Days</span>
                                </label>
                                <label class="filter-option-card" data-value="week">
                                    <input type="checkbox" name="delivery-time" value="week">
                                    <span class="option-icon">📅</span>
                                    <span class="option-label">Within Week</span>
                                </label>
                            </div>
                        </div>

                        <!-- Rating Section -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">Customer Rating</h4>
                            <div class="filter-options-grid">
                                <label class="filter-option-card" data-value="4">
                                    <input type="radio" name="modal-rating" value="4">
                                    <span class="option-icon">⭐</span>
                                    <span class="option-label">4★ & Up</span>
                                </label>
                                <label class="filter-option-card" data-value="3">
                                    <input type="radio" name="modal-rating" value="3">
                                    <span class="option-icon">⭐</span>
                                    <span class="option-label">3★ & Up</span>
                                </label>
                                <label class="filter-option-card" data-value="2">
                                    <input type="radio" name="modal-rating" value="2">
                                    <span class="option-icon">⭐</span>
                                    <span class="option-label">2★ & Up</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="filters-modal-footer">
                        <div class="results-count">
                            <strong id="modalResultsCount">0</strong> products found
                        </div>
                        <div class="filters-modal-actions">
                            <button class="btn-reset-filters" id="resetFiltersBtn">Reset All</button>
                            <button class="btn-apply-filters" id="applyFiltersBtn">Apply Filters</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        },

        /**
         * Bind all events
         */
        bindEvents() {
            // Dropdown toggles
            document.querySelectorAll('.filter-dropdown-trigger, .sort-dropdown-trigger').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const wrapper = trigger.closest('.filter-dropdown-wrapper');
                    const panel = wrapper.querySelector('.filter-dropdown-panel');
                    const isOpen = panel.classList.contains('open');
                    
                    // Close all dropdowns
                    document.querySelectorAll('.filter-dropdown-panel.open').forEach(p => p.classList.remove('open'));
                    document.querySelectorAll('.filter-dropdown-trigger.open').forEach(t => t.classList.remove('open'));
                    
                    if (!isOpen) {
                        panel.classList.add('open');
                        trigger.classList.add('open');
                    }
                });
            });

            // Close dropdowns on outside click
            document.addEventListener('click', () => {
                document.querySelectorAll('.filter-dropdown-panel.open').forEach(p => p.classList.remove('open'));
                document.querySelectorAll('.filter-dropdown-trigger.open').forEach(t => t.classList.remove('open'));
            });

            // Filter option selection
            document.querySelectorAll('.filter-dropdown-panel .filter-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const input = option.querySelector('input');
                    const wrapper = option.closest('.filter-dropdown-wrapper');
                    const filterType = wrapper.dataset.filter;
                    
                    if (input.type === 'radio') {
                        wrapper.querySelectorAll('.filter-option').forEach(o => o.classList.remove('selected'));
                        option.classList.add('selected');
                        
                        if (filterType === 'sort') {
                            const sortLabel = wrapper.querySelector('.sort-dropdown-trigger span');
                            sortLabel.textContent = `Sort: ${option.textContent.trim()}`;
                        }
                    } else {
                        option.classList.toggle('selected');
                    }
                    
                    this.updateFiltersFromUI();
                    this.applyFilters();
                });
            });

            // Price presets
            document.querySelectorAll('.price-preset').forEach(preset => {
                preset.addEventListener('click', () => {
                    document.querySelectorAll('.price-preset').forEach(p => p.classList.remove('active'));
                    preset.classList.add('active');
                    
                    document.getElementById('priceMin').value = preset.dataset.min;
                    document.getElementById('priceMax').value = preset.dataset.max;
                    
                    this.state.priceMin = parseInt(preset.dataset.min);
                    this.state.priceMax = parseInt(preset.dataset.max);
                    this.applyFilters();
                });
            });

            // Price inputs
            ['priceMin', 'priceMax'].forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('change', () => {
                        this.state.priceMin = parseInt(document.getElementById('priceMin').value) || 0;
                        this.state.priceMax = parseInt(document.getElementById('priceMax').value) || 50000;
                        this.applyFilters();
                    });
                }
            });

            // View toggle
            document.querySelectorAll('.view-toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const view = btn.dataset.view;
                    const grid = document.getElementById('productsGrid');
                    if (grid) {
                        grid.classList.toggle('list-view', view === 'list');
                    }
                });
            });

            // Advanced filters modal
            document.getElementById('openAdvancedFilters')?.addEventListener('click', () => {
                document.getElementById('filtersModalOverlay')?.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            document.getElementById('closeFiltersModal')?.addEventListener('click', () => {
                this.closeModal();
            });

            document.getElementById('filtersModalOverlay')?.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal();
                }
            });

            // Modal option cards
            document.querySelectorAll('.filter-option-card').forEach(card => {
                card.addEventListener('click', () => {
                    const input = card.querySelector('input');
                    if (input.type === 'radio') {
                        const section = card.closest('.filter-section');
                        section.querySelectorAll('.filter-option-card').forEach(c => c.classList.remove('selected'));
                    }
                    card.classList.toggle('selected', input.checked || input.type === 'radio');
                });
            });

            // Apply filters button
            document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
                this.updateFiltersFromModal();
                this.applyFilters();
                this.closeModal();
            });

            // Reset filters
            document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
                this.resetFilters();
            });

            // Sticky filter bar
            window.addEventListener('scroll', () => {
                const filterBar = document.getElementById('modernFilterBar');
                if (filterBar && window.scrollY > 200) {
                    filterBar.classList.add('scrolled');
                } else if (filterBar) {
                    filterBar.classList.remove('scrolled');
                }
            });
        },

        /**
         * Close modal
         */
        closeModal() {
            document.getElementById('filtersModalOverlay')?.classList.remove('active');
            document.body.style.overflow = '';
        },

        /**
         * Update state from dropdown UI
         */
        updateFiltersFromUI() {
            // Category
            const categoryOption = document.querySelector('[data-filter="category"] .filter-option.selected');
            if (categoryOption) {
                this.state.category = categoryOption.dataset.value;
            }

            // Sort
            const sortOption = document.querySelector('[data-filter="sort"] .filter-option.selected');
            if (sortOption) {
                this.state.sortBy = sortOption.dataset.value;
            }

            // Rating
            const ratingOption = document.querySelector('[data-filter="rating"] .filter-option.selected');
            this.state.rating = ratingOption ? parseInt(ratingOption.dataset.value) : null;

            // Delivery
            this.state.deliveryTime = [];
            document.querySelectorAll('[data-filter="delivery"] .filter-option.selected').forEach(opt => {
                this.state.deliveryTime.push(opt.dataset.value);
            });

            this.updateActiveFiltersDisplay();
        },

        /**
         * Update state from modal
         */
        updateFiltersFromModal() {
            // Category
            const catOption = document.querySelector('#modalCategoryOptions .filter-option-card.selected');
            if (catOption) {
                this.state.category = catOption.dataset.value;
            }

            // Seller type
            this.state.sellerType = [];
            document.querySelectorAll('[name="seller-type"]:checked').forEach(cb => {
                this.state.sellerType.push(cb.value);
            });

            // Delivery time
            this.state.deliveryTime = [];
            document.querySelectorAll('[name="delivery-time"]:checked').forEach(cb => {
                this.state.deliveryTime.push(cb.value);
            });

            // Rating
            const ratingCb = document.querySelector('[name="modal-rating"]:checked');
            this.state.rating = ratingCb ? parseInt(ratingCb.value) : null;

            this.updateActiveFiltersDisplay();
        },

        /**
         * Update active filters chips display
         */
        updateActiveFiltersDisplay() {
            const container = document.getElementById('activeFiltersRow');
            if (!container) return;

            const chips = [];

            if (this.state.category !== 'all') {
                chips.push(`<span class="active-filter-chip">Category: ${this.state.category} <span class="remove-filter" data-filter="category"><i class="fas fa-times"></i></span></span>`);
            }

            if (this.state.priceMin > 0 || this.state.priceMax < 50000) {
                chips.push(`<span class="active-filter-chip">₹${this.state.priceMin} - ₹${this.state.priceMax} <span class="remove-filter" data-filter="price"><i class="fas fa-times"></i></span></span>`);
            }

            if (this.state.rating) {
                chips.push(`<span class="active-filter-chip">${this.state.rating}★ & Up <span class="remove-filter" data-filter="rating"><i class="fas fa-times"></i></span></span>`);
            }

            this.state.deliveryTime.forEach(d => {
                chips.push(`<span class="active-filter-chip">${d} <span class="remove-filter" data-filter="delivery" data-value="${d}"><i class="fas fa-times"></i></span></span>`);
            });

            this.state.sellerType.forEach(s => {
                chips.push(`<span class="active-filter-chip">${s} Seller <span class="remove-filter" data-filter="seller" data-value="${s}"><i class="fas fa-times"></i></span></span>`);
            });

            if (chips.length > 0) {
                chips.push(`<button class="clear-all-filters">Clear All</button>`);
            }

            container.innerHTML = chips.join('');

            // Bind remove events
            container.querySelectorAll('.remove-filter').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filter = btn.dataset.filter;
                    const value = btn.dataset.value;

                    switch (filter) {
                        case 'category':
                            this.state.category = 'all';
                            break;
                        case 'price':
                            this.state.priceMin = 0;
                            this.state.priceMax = 50000;
                            break;
                        case 'rating':
                            this.state.rating = null;
                            break;
                        case 'delivery':
                            this.state.deliveryTime = this.state.deliveryTime.filter(d => d !== value);
                            break;
                        case 'seller':
                            this.state.sellerType = this.state.sellerType.filter(s => s !== value);
                            break;
                    }

                    this.syncUIWithState();
                    this.applyFilters();
                });
            });

            container.querySelector('.clear-all-filters')?.addEventListener('click', () => {
                this.resetFilters();
            });
        },

        /**
         * Sync UI with current state
         */
        syncUIWithState() {
            // Sync category dropdown
            document.querySelectorAll('[data-filter="category"] .filter-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === this.state.category);
            });

            // Sync sort dropdown
            document.querySelectorAll('[data-filter="sort"] .filter-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === this.state.sortBy);
            });

            // Sync price
            document.getElementById('priceMin').value = this.state.priceMin;
            document.getElementById('priceMax').value = this.state.priceMax;

            this.updateActiveFiltersDisplay();
        },

        /**
         * Reset all filters
         */
        resetFilters() {
            this.state = {
                category: 'all',
                priceMin: 0,
                priceMax: 50000,
                sortBy: 'featured',
                sellerType: [],
                deliveryTime: [],
                rating: null
            };

            // Reset UI
            document.querySelectorAll('.filter-option.selected, .filter-option-card.selected').forEach(opt => {
                opt.classList.remove('selected');
            });
            document.querySelectorAll('[value="all"], [value="featured"]').forEach(opt => {
                opt.closest('.filter-option, .filter-option-card')?.classList.add('selected');
            });
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('.price-preset.active').forEach(p => p.classList.remove('active'));
            document.getElementById('priceMin').value = 0;
            document.getElementById('priceMax').value = 50000;

            this.updateActiveFiltersDisplay();
            this.applyFilters();
        },

        /**
         * Apply filters to products
         */
        applyFilters() {
            // Trigger existing filter system if available
            if (window.productManager && typeof window.productManager.filterProducts === 'function') {
                window.productManager.filterProducts(this.state);
            } else if (typeof filterProducts === 'function') {
                filterProducts();
            }
            
            // Also sync with old sidebar filters if they exist
            const categoryBtns = document.querySelectorAll('#categoryFilters .filter-option');
            categoryBtns.forEach(btn => {
                const isActive = btn.dataset.category === this.state.category || 
                                 (this.state.category === 'all' && btn.dataset.category === 'all');
                btn.classList.toggle('active', isActive);
            });

            // Sync sort buttons
            const sortBtns = document.querySelectorAll('#sortOptions .filter-option');
            sortBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === this.state.sortBy);
            });

            // Update price range
            const priceRange = document.getElementById('priceRange');
            if (priceRange) {
                priceRange.value = this.state.priceMax;
            }

            console.log('🔍 Filters applied:', this.state);
        }
    };

    // =============================================
    // INITIALIZE ON DOM READY
    // =============================================
    
    document.addEventListener('DOMContentLoaded', () => {
        ShopAnimations.init();
        // ModernFilters.init(); // Disabled - using category page navigation instead
    });

    // Expose globally
    window.ShopAnimations = ShopAnimations;
    window.ModernFilters = ModernFilters;

})();
