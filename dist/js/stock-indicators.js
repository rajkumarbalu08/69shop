/**
 * 69SHOP.IN - Stock Indicators
 * Visual stock status badges for product cards
 */

(function() {
    'use strict';

    const StockIndicators = {
        config: {
            lowStockThreshold: 5,
            veryLowStockThreshold: 3,
            showExactCount: true,
            animateOnView: true
        },

        /**
         * Initialize stock indicators
         */
        init() {
            this.injectStyles();
            this.observeProductCards();
            console.log('📦 Stock Indicators initialized');
        },

        /**
         * Inject styles
         */
        injectStyles() {
            if (document.getElementById('stock-indicator-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'stock-indicator-styles';
            styles.textContent = `
                /* Stock Badge Container */
                .stock-badge {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    z-index: 5;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                .stock-badge.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                /* In Stock - Green */
                .stock-badge.in-stock {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                }
                
                /* Low Stock - Warning Orange */
                .stock-badge.low-stock {
                    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                    color: white;
                    animation: pulse-warning 2s ease-in-out infinite;
                }
                
                /* Very Low Stock - Urgent Red */
                .stock-badge.critical-stock {
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    color: white;
                    animation: pulse-urgent 1.5s ease-in-out infinite;
                }
                
                /* Out of Stock */
                .stock-badge.out-of-stock {
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                }
                
                /* Selling Fast */
                .stock-badge.selling-fast {
                    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
                    color: white;
                }
                
                /* Badge Icon */
                .stock-badge i {
                    font-size: 0.65rem;
                }
                
                /* Animations */
                @keyframes pulse-warning {
                    0%, 100% {
                        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
                    }
                    50% {
                        box-shadow: 0 2px 16px rgba(245, 158, 11, 0.6);
                    }
                }
                
                @keyframes pulse-urgent {
                    0%, 100% {
                        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                    }
                    50% {
                        box-shadow: 0 2px 20px rgba(239, 68, 68, 0.7);
                        transform: scale(1.02);
                    }
                }
                
                /* Progress bar for stock level */
                .stock-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    z-index: 5;
                }
                
                .stock-progress-bar {
                    height: 100%;
                    transition: width 0.8s ease;
                }
                
                .stock-progress-bar.high {
                    background: linear-gradient(90deg, #10B981, #34D399);
                }
                
                .stock-progress-bar.medium {
                    background: linear-gradient(90deg, #F59E0B, #FBBF24);
                }
                
                .stock-progress-bar.low {
                    background: linear-gradient(90deg, #EF4444, #F87171);
                }
                
                /* Out of stock overlay */
                .product-card.out-of-stock .product-image {
                    position: relative;
                }
                
                .product-card.out-of-stock .product-image::after {
                    content: 'OUT OF STOCK';
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    letter-spacing: 2px;
                }
                
                .product-card.out-of-stock .add-to-cart,
                .product-card.out-of-stock .buy-now {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                /* Notify Me Button */
                .notify-me-btn {
                    width: 100%;
                    padding: 12px;
                    background: var(--primary-black);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .notify-me-btn:hover {
                    background: var(--secondary-black);
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Observe product cards for adding stock badges
         */
        observeProductCards() {
            // Initial check for existing cards
            this.processExistingCards();
            
            // Observe for new cards added dynamically
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.classList?.contains('product-card')) {
                                this.addStockBadge(node);
                            }
                            node.querySelectorAll?.('.product-card').forEach(card => {
                                this.addStockBadge(card);
                            });
                        }
                    });
                });
            });
            
            const grid = document.getElementById('productsGrid');
            if (grid) {
                observer.observe(grid, { childList: true, subtree: true });
            }
        },

        /**
         * Process existing product cards
         */
        processExistingCards() {
            document.querySelectorAll('.product-card').forEach(card => {
                this.addStockBadge(card);
            });
        },

        /**
         * Add stock badge to product card
         */
        addStockBadge(card) {
            // Check if already has badge
            if (card.querySelector('.stock-badge')) return;
            
            // Get product data
            const productId = card.dataset.productId;
            const product = this.getProductData(productId, card);
            
            if (!product) return;
            
            const stock = product.stock ?? product.quantity ?? 10; // Default to 10 if not set
            const badge = this.createBadge(stock);
            
            // Add badge to product image container
            const imageContainer = card.querySelector('.product-image') || card;
            imageContainer.style.position = 'relative';
            imageContainer.appendChild(badge);
            
            // Add progress bar
            if (stock > 0 && stock <= 20) {
                const progress = this.createProgressBar(stock);
                imageContainer.appendChild(progress);
            }
            
            // Mark out of stock cards
            if (stock === 0) {
                card.classList.add('out-of-stock');
                this.replaceAddToCartWithNotify(card);
            }
            
            // Animate badge on view
            if (this.config.animateOnView) {
                const viewObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                badge.classList.add('visible');
                            }, 200);
                            viewObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.3 });
                
                viewObserver.observe(card);
            } else {
                badge.classList.add('visible');
            }
        },

        /**
         * Get product data from card or global products
         */
        getProductData(productId, card) {
            // Try to get from window.productsData
            if (window.productsData && productId) {
                const product = window.productsData.find(p => p.id === productId);
                if (product) return product;
            }
            
            // Try to extract from card data attributes
            if (card.dataset.stock) {
                return { stock: parseInt(card.dataset.stock) };
            }
            
            // Generate random stock for demo
            return { stock: Math.floor(Math.random() * 20) };
        },

        /**
         * Create stock badge element
         */
        createBadge(stock) {
            const badge = document.createElement('div');
            badge.className = 'stock-badge';
            
            if (stock === 0) {
                badge.classList.add('out-of-stock');
                badge.innerHTML = `<i class="fas fa-ban"></i> Out of Stock`;
            } else if (stock <= this.config.veryLowStockThreshold) {
                badge.classList.add('critical-stock');
                badge.innerHTML = `<i class="fas fa-fire"></i> Only ${stock} left!`;
            } else if (stock <= this.config.lowStockThreshold) {
                badge.classList.add('low-stock');
                badge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${stock} left`;
            } else if (stock <= 10) {
                badge.classList.add('selling-fast');
                badge.innerHTML = `<i class="fas fa-bolt"></i> Selling Fast`;
            } else {
                badge.classList.add('in-stock');
                badge.innerHTML = `<i class="fas fa-check-circle"></i> In Stock`;
            }
            
            return badge;
        },

        /**
         * Create stock progress bar
         */
        createProgressBar(stock) {
            const progress = document.createElement('div');
            progress.className = 'stock-progress';
            
            const maxStock = 20; // Assume max stock for visual
            const percentage = Math.min((stock / maxStock) * 100, 100);
            
            let colorClass = 'high';
            if (stock <= this.config.veryLowStockThreshold) {
                colorClass = 'low';
            } else if (stock <= this.config.lowStockThreshold) {
                colorClass = 'medium';
            }
            
            progress.innerHTML = `<div class="stock-progress-bar ${colorClass}" style="width: ${percentage}%"></div>`;
            
            return progress;
        },

        /**
         * Replace add to cart button with notify me button
         */
        replaceAddToCartWithNotify(card) {
            const addToCartBtn = card.querySelector('.add-to-cart');
            if (!addToCartBtn) return;
            
            const notifyBtn = document.createElement('button');
            notifyBtn.className = 'notify-me-btn';
            notifyBtn.innerHTML = `<i class="fas fa-bell"></i> Notify Me`;
            notifyBtn.onclick = (e) => {
                e.stopPropagation();
                this.showNotifyModal(card);
            };
            
            addToCartBtn.replaceWith(notifyBtn);
        },

        /**
         * Show notify me modal
         */
        showNotifyModal(card) {
            const productName = card.querySelector('.product-title')?.textContent || 'This product';
            
            // Use lead generation signup if available
            if (window.LeadGeneration) {
                window.LeadGeneration.showPopup('signupPrompt');
                return;
            }
            
            // Simple alert fallback
            alert(`Sign up to get notified when "${productName}" is back in stock!`);
        },

        /**
         * Update stock for a specific product
         */
        updateStock(productId, newStock) {
            const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (!card) return;
            
            // Remove old badge
            const oldBadge = card.querySelector('.stock-badge');
            const oldProgress = card.querySelector('.stock-progress');
            oldBadge?.remove();
            oldProgress?.remove();
            
            // Re-add with new stock
            card.dataset.stock = newStock;
            this.addStockBadge(card);
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        StockIndicators.init();
    });

    // Expose globally
    window.StockIndicators = StockIndicators;

})();
