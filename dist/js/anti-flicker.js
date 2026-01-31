/**
 * 69SHOP.IN - Anti-Flicker & Performance Optimizations
 * Prevents animation flickering and improves rendering performance
 */

(function() {
    'use strict';

    const AntiFlicker = {
        /**
         * Initialize anti-flicker measures
         */
        init() {
            this.injectStyles();
            this.optimizeAnimations();
            this.handleVisibilityChange();
            this.fixImageFlicker();
            console.log('⚡ Anti-flicker optimizations applied');
        },

        /**
         * Inject performance-optimized styles
         */
        injectStyles() {
            if (document.getElementById('anti-flicker-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'anti-flicker-styles';
            styles.textContent = `
                /* GPU Acceleration for animated elements */
                .scroll-reveal,
                .reveal-fade-up,
                .reveal-fade-down,
                .reveal-fade-left,
                .reveal-fade-right,
                .reveal-scale,
                .carousel-card,
                .carousel-track,
                .product-card,
                .animate-in,
                .floating-badges .badge,
                .back-to-top,
                .scroll-progress,
                [class*="animate"],
                [class*="pulse"],
                [class*="shimmer"] {
                    will-change: transform, opacity;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    perspective: 1000px;
                }

                /* Prevent layout shifts */
                img {
                    content-visibility: auto;
                }

                /* Smooth scrolling performance */
                .carousel-track,
                .products-grid,
                .carousel-wrapper {
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }

                /* Fix skeleton shimmer flicker */
                .skeleton,
                .skeleton-card,
                [class*="skeleton"] {
                    transform: translateZ(0);
                    isolation: isolate;
                }

                /* Reduce animation jank on low-end devices */
                @media (prefers-reduced-motion: reduce) {
                    .scroll-reveal,
                    .reveal-fade-up,
                    .animate-in {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }

                /* Fix header shrink flicker */
                .header {
                    transform: translateZ(0);
                    will-change: transform, box-shadow;
                }

                .header.scrolled {
                    transform: translateZ(0);
                }

                /* Fix button hover flicker */
                button, .btn, a.btn {
                    transform: translateZ(0);
                    will-change: transform;
                }

                /* Smooth product card interactions */
                .product-card,
                .carousel-card {
                    contain: layout style paint;
                }

                /* Fix badge pulse flicker */
                .cart-count,
                .wishlist-count,
                [class*="badge"] {
                    transform: translateZ(0);
                }

                /* Image loading optimization */
                img[loading="lazy"] {
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                img[loading="lazy"].loaded,
                img[loading="lazy"][src]:not([src=""]) {
                    opacity: 1;
                }

                /* Fix gradient animation flicker */
                [style*="linear-gradient"],
                [class*="gradient"] {
                    transform: translateZ(0);
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Optimize running animations
         */
        optimizeAnimations() {
            // Pause animations when not visible
            const animatedElements = document.querySelectorAll('[class*="animate"], [style*="animation"]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationPlayState = 'running';
                    } else {
                        entry.target.style.animationPlayState = 'paused';
                    }
                });
            }, { threshold: 0, rootMargin: '100px' });

            animatedElements.forEach(el => observer.observe(el));
        },

        /**
         * Handle page visibility changes
         */
        handleVisibilityChange() {
            document.addEventListener('visibilitychange', () => {
                const animations = document.querySelectorAll('[class*="animate"], [style*="animation"]');
                
                if (document.hidden) {
                    animations.forEach(el => {
                        el.style.animationPlayState = 'paused';
                    });
                } else {
                    animations.forEach(el => {
                        el.style.animationPlayState = 'running';
                    });
                }
            });
        },

        /**
         * Fix image loading flicker
         */
        fixImageFlicker() {
            // Add loaded class to images when they load
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                if (img.complete) {
                    img.classList.add('loaded');
                } else {
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                    });
                }
            });

            // Observe new images added to DOM
            const imgObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'IMG' && node.loading === 'lazy') {
                            if (node.complete) {
                                node.classList.add('loaded');
                            } else {
                                node.addEventListener('load', () => {
                                    node.classList.add('loaded');
                                });
                            }
                        }
                    });
                });
            });

            imgObserver.observe(document.body, { childList: true, subtree: true });
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AntiFlicker.init());
    } else {
        AntiFlicker.init();
    }

    // Expose globally
    window.AntiFlicker = AntiFlicker;

})();
