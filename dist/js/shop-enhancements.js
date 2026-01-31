/**
 * 69SHOP.IN - Shop Page Enhancements
 * Modern UI features, improved UX, premium shopping experience
 */

(function() {
    'use strict';

    const ShopEnhancements = {
        /**
         * Initialize all enhancements
         */
        init() {
            try {
                this.injectStyles();
                this.addFloatingFilters();
                this.addProductQuickActions();
                this.enhanceSearchExperience();
                this.addStickyBuyBar();
                this.addProductComparison();
                this.addScrollToTop();
                console.log('✨ Shop Enhancements loaded');
            } catch (error) {
                console.error('Shop Enhancements error:', error);
            }
        },

        /**
         * Inject enhancement styles
         */
        injectStyles() {
            if (document.getElementById('shop-enhancements-css')) return;

            const styles = document.createElement('style');
            styles.id = 'shop-enhancements-css';
            styles.textContent = `
                /* ===== FLOATING FILTER PILLS ===== */
                .floating-filter-bar {
                    position: sticky;
                    top: 80px;
                    z-index: 100;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                    padding: 12px 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    transition: all 0.3s ease;
                }

                .floating-filter-bar::-webkit-scrollbar {
                    display: none;
                }

                .filter-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #475569;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                }

                .filter-pill:hover {
                    background: #e2e8f0;
                    border-color: #cbd5e1;
                }

                .filter-pill.active {
                    background: var(--blue-primary, #0066ff);
                    border-color: var(--blue-primary, #0066ff);
                    color: white;
                }

                .filter-pill i {
                    font-size: 0.9rem;
                }

                .filter-pill .count {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                }

                .filter-pill.active .count {
                    background: rgba(255, 255, 255, 0.2);
                }

                /* Active Filters */
                .active-filters {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #fef3c7;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    color: #92400e;
                }

                .active-filters .clear-all {
                    color: #dc2626;
                    cursor: pointer;
                    font-weight: 600;
                }

                .active-filters .clear-all:hover {
                    text-decoration: underline;
                }

                /* ===== PRODUCT QUICK ACTIONS ===== */
                .product-card-enhanced {
                    position: relative;
                }

                .quick-action-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
                    padding: 40px 16px 16px;
                    display: flex;
                    justify-content: space-around;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s ease;
                }

                .product-card-enhanced:hover .quick-action-bar {
                    opacity: 1;
                    transform: translateY(0);
                }

                .quick-action-btn {
                    width: 40px;
                    height: 40px;
                    background: white;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-black, #1a1a1a);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                .quick-action-btn:hover {
                    transform: scale(1.1);
                    background: var(--blue-primary, #0066ff);
                    color: white;
                }

                .quick-action-btn.in-wishlist {
                    background: #ef4444;
                    color: white;
                }

                /* ===== ENHANCED SEARCH ===== */
                .search-suggestions {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    margin-top: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.2s ease;
                }

                .search-suggestions.active {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .search-section-title {
                    padding: 12px 16px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #94a3b8;
                    background: #f8fafc;
                }

                .search-suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .search-suggestion-item:hover {
                    background: #f1f5f9;
                }

                .search-suggestion-item img {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                }

                .search-suggestion-item .info {
                    flex: 1;
                }

                .search-suggestion-item .name {
                    font-weight: 500;
                    color: #1e293b;
                }

                .search-suggestion-item .category {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .search-suggestion-item .price {
                    font-weight: 600;
                    color: var(--blue-primary, #0066ff);
                }

                /* Trending Searches */
                .trending-searches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 12px 16px;
                }

                .trending-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: #f1f5f9;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .trending-tag:hover {
                    background: var(--blue-primary, #0066ff);
                    color: white;
                }

                .trending-tag i {
                    color: #f59e0b;
                }

                /* ===== STICKY BUY BAR ===== */
                .sticky-buy-bar {
                    position: fixed;
                    bottom: -100px;
                    left: 0;
                    right: 0;
                    background: white;
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
                    padding: 12px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 1000;
                    transition: bottom 0.3s ease;
                }

                .sticky-buy-bar.visible {
                    bottom: 0;
                }

                .sticky-buy-bar .product-summary {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sticky-buy-bar .product-summary img {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                }

                .sticky-buy-bar .product-summary .details h4 {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                }

                .sticky-buy-bar .product-summary .details .price {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--blue-primary, #0066ff);
                }

                .sticky-buy-bar .actions {
                    display: flex;
                    gap: 12px;
                }

                .sticky-buy-btn {
                    padding: 12px 28px;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .sticky-buy-btn.primary {
                    background: var(--blue-primary, #0066ff);
                    color: white;
                    border: none;
                }

                .sticky-buy-btn.primary:hover {
                    background: #0052cc;
                    transform: translateY(-2px);
                }

                .sticky-buy-btn.secondary {
                    background: transparent;
                    border: 2px solid #e2e8f0;
                    color: #475569;
                }

                .sticky-buy-btn.secondary:hover {
                    border-color: var(--blue-primary, #0066ff);
                    color: var(--blue-primary, #0066ff);
                }

                /* ===== PRODUCT COMPARISON ===== */
                .compare-badge {
                    position: fixed;
                    bottom: 24px;
                    left: 24px;
                    background: var(--blue-primary, #0066ff);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 20px rgba(0, 102, 255, 0.4);
                    cursor: pointer;
                    z-index: 1000;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                }

                .compare-badge.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .compare-badge .count-badge {
                    background: white;
                    color: var(--blue-primary, #0066ff);
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .compare-badge:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(0, 102, 255, 0.5);
                }

                /* ===== SCROLL TO TOP ===== */
                .scroll-to-top {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 48px;
                    height: 48px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    cursor: pointer;
                    z-index: 999;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .scroll-to-top.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .scroll-to-top:hover {
                    background: var(--blue-primary, #0066ff);
                    border-color: var(--blue-primary, #0066ff);
                    color: white;
                    transform: translateY(-3px);
                }

                /* ===== VIEW TOGGLE ===== */
                .view-toggle {
                    display: flex;
                    gap: 4px;
                    background: #f1f5f9;
                    padding: 4px;
                    border-radius: 10px;
                }

                .view-toggle-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .view-toggle-btn.active {
                    background: white;
                    color: var(--blue-primary, #0066ff);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .view-toggle-btn:hover:not(.active) {
                    color: #1e293b;
                }

                /* ===== PRODUCT COUNT BADGE ===== */
                .products-count {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f0fdf4;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    color: #15803d;
                    font-weight: 500;
                }

                .products-count i {
                    color: #22c55e;
                }

                /* ===== MOBILE OPTIMIZATIONS ===== */
                @media (max-width: 768px) {
                    .floating-filter-bar {
                        top: 60px;
                        padding: 10px 16px;
                    }

                    .sticky-buy-bar {
                        flex-direction: column;
                        gap: 12px;
                        padding: 16px;
                    }

                    .sticky-buy-bar .actions {
                        width: 100%;
                    }

                    .sticky-buy-btn {
                        flex: 1;
                        text-align: center;
                    }

                    .compare-badge {
                        left: 50%;
                        transform: translateX(-50%) translateY(20px);
                        bottom: 80px;
                    }

                    .compare-badge.visible {
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Add floating filter pills
         */
        addFloatingFilters() {
            const existingFilters = document.querySelector('.category-quick-filters');
            if (!existingFilters) return;

            // Add view toggle to filters
            const viewToggle = document.createElement('div');
            viewToggle.className = 'view-toggle';
            viewToggle.innerHTML = `
                <button class="view-toggle-btn active" data-view="grid" title="Grid view">
                    <i class="fas fa-th"></i>
                </button>
                <button class="view-toggle-btn" data-view="list" title="List view">
                    <i class="fas fa-list"></i>
                </button>
            `;

            existingFilters.appendChild(viewToggle);

            // Handle view toggle
            viewToggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    viewToggle.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const grid = document.getElementById('productsGrid');
                    if (grid) {
                        if (btn.dataset.view === 'list') {
                            grid.style.gridTemplateColumns = '1fr';
                        } else {
                            grid.style.gridTemplateColumns = '';
                        }
                    }
                });
            });
        },

        /**
         * Add quick action buttons to product cards
         */
        addProductQuickActions() {
            // Watch for product cards being added
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('product-card')) {
                            this.enhanceProductCard(node);
                        }
                    });
                });
            });

            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                observer.observe(productsGrid, { childList: true, subtree: true });
                
                // Enhance existing cards
                productsGrid.querySelectorAll('.product-card').forEach(card => {
                    this.enhanceProductCard(card);
                });
            }
        },

        /**
         * Enhance individual product card
         */
        enhanceProductCard(card) {
            if (card.classList.contains('product-card-enhanced')) return;
            card.classList.add('product-card-enhanced');

            // Add compare checkbox (future feature)
            const imageContainer = card.querySelector('.product-image, .image-container');
            if (imageContainer && !imageContainer.querySelector('.compare-checkbox')) {
                const compareCheck = document.createElement('label');
                compareCheck.className = 'compare-checkbox';
                compareCheck.innerHTML = `
                    <input type="checkbox" class="compare-input" style="display:none;">
                    <span class="compare-indicator" style="position:absolute;top:8px;left:8px;width:24px;height:24px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <i class="far fa-square"></i>
                    </span>
                `;
                imageContainer.style.position = 'relative';
                imageContainer.appendChild(compareCheck);

                // Show on hover
                card.addEventListener('mouseenter', () => {
                    compareCheck.querySelector('.compare-indicator').style.opacity = '1';
                });
                card.addEventListener('mouseleave', () => {
                    const input = compareCheck.querySelector('.compare-input');
                    if (!input.checked) {
                        compareCheck.querySelector('.compare-indicator').style.opacity = '0';
                    }
                });

                // Handle check
                const input = compareCheck.querySelector('.compare-input');
                const indicator = compareCheck.querySelector('.compare-indicator');
                indicator.addEventListener('click', () => {
                    input.checked = !input.checked;
                    indicator.innerHTML = input.checked 
                        ? '<i class="fas fa-check" style="color:#22c55e;"></i>'
                        : '<i class="far fa-square"></i>';
                    this.updateCompareCount();
                });
            }
        },

        /**
         * Update compare count badge
         */
        updateCompareCount() {
            const count = document.querySelectorAll('.compare-input:checked').length;
            let badge = document.querySelector('.compare-badge');

            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'compare-badge';
                    badge.innerHTML = `
                        <i class="fas fa-balance-scale"></i>
                        <span>Compare</span>
                        <span class="count-badge">${count}</span>
                    `;
                    document.body.appendChild(badge);
                    
                    badge.addEventListener('click', () => {
                        this.showComparison();
                    });
                } else {
                    badge.querySelector('.count-badge').textContent = count;
                }
                badge.classList.add('visible');
            } else if (badge) {
                badge.classList.remove('visible');
            }
        },

        /**
         * Show comparison view
         */
        showComparison() {
            const checkedProducts = document.querySelectorAll('.compare-input:checked');
            if (checkedProducts.length < 2) {
                alert('Select at least 2 products to compare');
                return;
            }

            // TODO: Implement comparison modal
            alert(`Comparing ${checkedProducts.length} products... (Feature coming soon)`);
        },

        /**
         * Enhance search experience
         */
        enhanceSearchExperience() {
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;

            // Add trending searches below
            let suggestions = document.querySelector('.search-suggestions');
            if (!suggestions) {
                suggestions = document.createElement('div');
                suggestions.className = 'search-suggestions';
                suggestions.innerHTML = `
                    <div class="search-section-title">
                        <i class="fas fa-fire"></i> Trending Searches
                    </div>
                    <div class="trending-searches">
                        <span class="trending-tag"><i class="fas fa-bolt"></i> iPhone 15</span>
                        <span class="trending-tag"><i class="fas fa-bolt"></i> Headphones</span>
                        <span class="trending-tag"><i class="fas fa-bolt"></i> Smart Watch</span>
                        <span class="trending-tag"><i class="fas fa-bolt"></i> Air Fryer</span>
                        <span class="trending-tag"><i class="fas fa-bolt"></i> Sneakers</span>
                    </div>
                `;
                searchInput.parentElement.appendChild(suggestions);
            }

            // Show/hide on focus
            searchInput.addEventListener('focus', () => {
                suggestions.classList.add('active');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    suggestions.classList.remove('active');
                }
            });

            // Handle trending tag clicks
            suggestions.querySelectorAll('.trending-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    const text = tag.textContent.trim();
                    searchInput.value = text;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    suggestions.classList.remove('active');
                });
            });
        },

        /**
         * Add sticky buy bar (for product detail view)
         */
        addStickyBuyBar() {
            // This will activate when user scrolls past a product detail
            // For now, we'll skip this for the main shop page
        },

        /**
         * Add product comparison feature
         */
        addProductComparison() {
            // Already handled in addProductQuickActions
        },

        /**
         * Add scroll to top button
         */
        addScrollToTop() {
            if (document.querySelector('.scroll-to-top')) return;

            const btn = document.createElement('button');
            btn.className = 'scroll-to-top';
            btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            btn.setAttribute('aria-label', 'Scroll to top');
            document.body.appendChild(btn);

            // Show/hide based on scroll
            window.addEventListener('scroll', () => {
                if (window.scrollY > 500) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
            });

            // Scroll to top on click
            btn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ShopEnhancements.init();
        }, 1500);
    });

    // Expose globally
    window.ShopEnhancements = ShopEnhancements;

})();
