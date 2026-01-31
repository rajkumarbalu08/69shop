/**
 * 69SHOP.IN - Product Image Zoom System
 * Multiple zoom options: hover, click, lightbox, magnifier
 */

(function() {
    'use strict';

    const ProductZoom = {
        config: {
            zoomLevel: 2.5,
            lensSize: 150,
            animationDuration: 300
        },

        /**
         * Initialize zoom system
         */
        init() {
            this.injectStyles();
            this.initHoverZoom();
            this.initClickZoom();
            this.initLightbox();
            console.log('🔍 Product Zoom initialized');
        },

        /**
         * Inject styles
         */
        injectStyles() {
            if (document.getElementById('product-zoom-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'product-zoom-styles';
            styles.textContent = `
                /* Hover Zoom Container */
                .zoom-container {
                    position: relative;
                    overflow: hidden;
                    cursor: zoom-in;
                }

                .zoom-container.zoomed {
                    cursor: zoom-out;
                }

                /* Magnifier Lens */
                .zoom-lens {
                    position: absolute;
                    border: 3px solid rgba(0, 102, 255, 0.5);
                    border-radius: 50%;
                    width: 150px;
                    height: 150px;
                    background-repeat: no-repeat;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                    pointer-events: none;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: opacity 0.2s, transform 0.2s;
                    z-index: 100;
                }

                .zoom-container:hover .zoom-lens {
                    opacity: 1;
                    transform: scale(1);
                }

                /* Zoom Result Panel (side preview) */
                .zoom-result {
                    position: absolute;
                    right: -420px;
                    top: 0;
                    width: 400px;
                    height: 400px;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    background-repeat: no-repeat;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s, visibility 0.3s;
                    z-index: 100;
                    overflow: hidden;
                }

                .zoom-container:hover .zoom-result {
                    opacity: 1;
                    visibility: visible;
                }

                /* Lightbox */
                .zoom-lightbox {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    cursor: zoom-out;
                }

                .zoom-lightbox.active {
                    opacity: 1;
                    visibility: visible;
                }

                .zoom-lightbox-image {
                    max-width: 90vw;
                    max-height: 90vh;
                    object-fit: contain;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                    border-radius: 8px;
                }

                .zoom-lightbox.active .zoom-lightbox-image {
                    transform: scale(1);
                }

                .zoom-lightbox-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zoom-lightbox-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .zoom-lightbox-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 50px;
                    height: 50px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zoom-lightbox-nav:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .zoom-lightbox-nav.prev { left: 20px; }
                .zoom-lightbox-nav.next { right: 20px; }

                .zoom-lightbox-counter {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9rem;
                }

                /* Zoom Controls */
                .zoom-controls {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    display: flex;
                    gap: 8px;
                    z-index: 10;
                }

                .zoom-control-btn {
                    width: 36px;
                    height: 36px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    color: #666;
                    transition: all 0.2s;
                }

                .zoom-control-btn:hover {
                    background: #0066ff;
                    color: white;
                    border-color: #0066ff;
                }

                .zoom-control-btn.active {
                    background: #0066ff;
                    color: white;
                    border-color: #0066ff;
                }

                /* Pinch zoom for mobile */
                .zoom-pinch {
                    touch-action: none;
                }

                /* Zoom indicator */
                .zoom-indicator {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .zoom-container:hover .zoom-indicator {
                    opacity: 1;
                }

                /* 360 Spin View */
                .zoom-spin-control {
                    position: absolute;
                    bottom: 12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .zoom-spin-control i {
                    animation: spin360 2s linear infinite;
                }

                @keyframes spin360 {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Thumbnail strip */
                .zoom-thumbnails {
                    display: flex;
                    gap: 10px;
                    margin-top: 16px;
                    justify-content: center;
                }

                .zoom-thumbnail {
                    width: 60px;
                    height: 60px;
                    border: 2px solid transparent;
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: all 0.2s;
                }

                .zoom-thumbnail:hover,
                .zoom-thumbnail.active {
                    border-color: #0066ff;
                    opacity: 1;
                }

                .zoom-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Initialize hover zoom on product images
         */
        initHoverZoom() {
            // Add zoom functionality to product card images
            document.querySelectorAll('.product-card-image, .carousel-card-image').forEach(container => {
                if (container.classList.contains('zoom-initialized')) return;
                container.classList.add('zoom-initialized');

                const img = container.querySelector('img');
                if (!img) return;

                // Add zoom controls
                this.addZoomControls(container, img);
            });

            // Watch for new images
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const containers = node.querySelectorAll?.('.product-card-image, .carousel-card-image') || [];
                            containers.forEach(container => {
                                if (!container.classList.contains('zoom-initialized')) {
                                    container.classList.add('zoom-initialized');
                                    const img = container.querySelector('img');
                                    if (img) this.addZoomControls(container, img);
                                }
                            });
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        },

        /**
         * Add zoom controls to an image container
         */
        addZoomControls(container, img) {
            // Create zoom controls
            const controls = document.createElement('div');
            controls.className = 'zoom-controls';
            controls.innerHTML = `
                <button class="zoom-control-btn" data-zoom="magnify" title="Magnify">
                    <i class="fas fa-search-plus"></i>
                </button>
                <button class="zoom-control-btn" data-zoom="fullscreen" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
            `;
            container.appendChild(controls);

            // Handle zoom buttons
            controls.querySelectorAll('.zoom-control-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const zoomType = btn.dataset.zoom;
                    if (zoomType === 'magnify') {
                        this.toggleMagnifier(container, img, btn);
                    } else if (zoomType === 'fullscreen') {
                        this.openLightbox(img.src);
                    }
                });
            });
        },

        /**
         * Toggle magnifier on image
         */
        toggleMagnifier(container, img, btn) {
            if (container.querySelector('.zoom-lens')) {
                // Remove magnifier
                container.querySelector('.zoom-lens')?.remove();
                container.querySelector('.zoom-result')?.remove();
                btn.classList.remove('active');
                container.removeEventListener('mousemove', container._zoomHandler);
                return;
            }

            btn.classList.add('active');

            // Create lens
            const lens = document.createElement('div');
            lens.className = 'zoom-lens';
            container.appendChild(lens);

            // Create result panel
            const result = document.createElement('div');
            result.className = 'zoom-result';
            container.appendChild(result);

            // Calculate ratios
            const cx = result.offsetWidth / lens.offsetWidth;
            const cy = result.offsetHeight / lens.offsetHeight;

            // Set background
            result.style.backgroundImage = `url('${img.src}')`;
            lens.style.backgroundImage = `url('${img.src}')`;

            // Zoom handler
            container._zoomHandler = (e) => {
                e.preventDefault();
                
                const rect = container.getBoundingClientRect();
                let x = e.clientX - rect.left - (lens.offsetWidth / 2);
                let y = e.clientY - rect.top - (lens.offsetHeight / 2);

                // Bounds
                x = Math.max(0, Math.min(x, container.offsetWidth - lens.offsetWidth));
                y = Math.max(0, Math.min(y, container.offsetHeight - lens.offsetHeight));

                lens.style.left = x + 'px';
                lens.style.top = y + 'px';

                // Lens background
                const bgSize = this.config.zoomLevel * 100;
                lens.style.backgroundSize = `${img.offsetWidth * this.config.zoomLevel}px ${img.offsetHeight * this.config.zoomLevel}px`;
                lens.style.backgroundPosition = `-${x * this.config.zoomLevel}px -${y * this.config.zoomLevel}px`;

                // Result background
                result.style.backgroundSize = `${img.offsetWidth * cx}px ${img.offsetHeight * cy}px`;
                result.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
            };

            container.addEventListener('mousemove', container._zoomHandler);
        },

        /**
         * Initialize click zoom
         */
        initClickZoom() {
            document.addEventListener('click', (e) => {
                const img = e.target.closest('.product-card-image img, .carousel-card-image img, .gallery-main img');
                if (img && !e.target.closest('.zoom-controls')) {
                    // Check if double click for zoom
                    if (e.detail === 2) {
                        this.openLightbox(img.src);
                    }
                }
            });
        },

        /**
         * Initialize lightbox
         */
        initLightbox() {
            // Create lightbox element
            const lightbox = document.createElement('div');
            lightbox.className = 'zoom-lightbox';
            lightbox.id = 'zoomLightbox';
            lightbox.innerHTML = `
                <button class="zoom-lightbox-close">
                    <i class="fas fa-times"></i>
                </button>
                <button class="zoom-lightbox-nav prev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <img class="zoom-lightbox-image" src="" alt="Zoomed image">
                <button class="zoom-lightbox-nav next">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="zoom-lightbox-counter"></div>
            `;
            document.body.appendChild(lightbox);

            // Close handlers
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target.closest('.zoom-lightbox-close')) {
                    this.closeLightbox();
                }
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('active')) return;
                
                if (e.key === 'Escape') {
                    this.closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    this.navigateLightbox(-1);
                } else if (e.key === 'ArrowRight') {
                    this.navigateLightbox(1);
                }
            });

            // Navigation buttons
            lightbox.querySelector('.prev').addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateLightbox(-1);
            });

            lightbox.querySelector('.next').addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateLightbox(1);
            });

            this.lightbox = lightbox;
            this.currentImages = [];
            this.currentIndex = 0;
        },

        /**
         * Open lightbox with image
         */
        openLightbox(src, images = []) {
            if (!this.lightbox) return;

            this.currentImages = images.length ? images : [src];
            this.currentIndex = images.indexOf(src);
            if (this.currentIndex < 0) this.currentIndex = 0;

            this.updateLightboxImage();
            this.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Hide nav if single image
            const showNav = this.currentImages.length > 1;
            this.lightbox.querySelector('.prev').style.display = showNav ? 'flex' : 'none';
            this.lightbox.querySelector('.next').style.display = showNav ? 'flex' : 'none';
            this.lightbox.querySelector('.zoom-lightbox-counter').style.display = showNav ? 'block' : 'none';
        },

        /**
         * Close lightbox
         */
        closeLightbox() {
            if (!this.lightbox) return;
            this.lightbox.classList.remove('active');
            document.body.style.overflow = '';
        },

        /**
         * Navigate lightbox
         */
        navigateLightbox(direction) {
            this.currentIndex += direction;
            if (this.currentIndex < 0) this.currentIndex = this.currentImages.length - 1;
            if (this.currentIndex >= this.currentImages.length) this.currentIndex = 0;
            this.updateLightboxImage();
        },

        /**
         * Update lightbox image
         */
        updateLightboxImage() {
            const img = this.lightbox.querySelector('.zoom-lightbox-image');
            const counter = this.lightbox.querySelector('.zoom-lightbox-counter');
            
            img.src = this.currentImages[this.currentIndex];
            counter.textContent = `${this.currentIndex + 1} / ${this.currentImages.length}`;
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for images to load
        setTimeout(() => {
            try {
                ProductZoom.init();
            } catch (error) {
                console.error('Product Zoom initialization error:', error);
            }
        }, 1000);
    });

    // Expose globally
    window.ProductZoom = ProductZoom;

})();
