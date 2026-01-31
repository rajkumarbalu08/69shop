/**
 * 69SHOP.IN - Enhanced Scroll Animations
 * Smooth scroll reveals, parallax, stagger effects
 */

(function() {
    'use strict';

    const ScrollMagic = {
        config: {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            staggerDelay: 80,
            parallaxStrength: 0.3,
            smoothScrollDuration: 800
        },

        observers: [],

        /**
         * Initialize scroll animations
         */
        init() {
            this.injectStyles();
            this.initScrollReveal();
            this.initParallax();
            this.initSmoothScroll();
            this.initScrollProgress();
            this.initFloatingElements();
            console.log('✨ Scroll Magic initialized');
        },

        /**
         * Inject animation styles
         */
        injectStyles() {
            if (document.getElementById('scroll-magic-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'scroll-magic-styles';
            styles.textContent = `
                /* Base reveal animations */
                .scroll-reveal {
                    opacity: 0;
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .scroll-reveal.revealed {
                    opacity: 1;
                }

                /* Fade Up */
                .reveal-fade-up {
                    transform: translateY(60px);
                }
                .reveal-fade-up.revealed {
                    transform: translateY(0);
                }

                /* Fade Down */
                .reveal-fade-down {
                    transform: translateY(-60px);
                }
                .reveal-fade-down.revealed {
                    transform: translateY(0);
                }

                /* Fade Left */
                .reveal-fade-left {
                    transform: translateX(-60px);
                }
                .reveal-fade-left.revealed {
                    transform: translateX(0);
                }

                /* Fade Right */
                .reveal-fade-right {
                    transform: translateX(60px);
                }
                .reveal-fade-right.revealed {
                    transform: translateX(0);
                }

                /* Scale Up */
                .reveal-scale {
                    transform: scale(0.8);
                }
                .reveal-scale.revealed {
                    transform: scale(1);
                }

                /* Rotate In */
                .reveal-rotate {
                    transform: rotate(-10deg) scale(0.9);
                }
                .reveal-rotate.revealed {
                    transform: rotate(0) scale(1);
                }

                /* Flip */
                .reveal-flip {
                    transform: perspective(1000px) rotateY(90deg);
                }
                .reveal-flip.revealed {
                    transform: perspective(1000px) rotateY(0);
                }

                /* Bounce In */
                .reveal-bounce {
                    transform: scale(0.3);
                    animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                .reveal-bounce.revealed {
                    transform: scale(1);
                }

                /* Zoom Blur */
                .reveal-zoom-blur {
                    transform: scale(1.2);
                    filter: blur(10px);
                }
                .reveal-zoom-blur.revealed {
                    transform: scale(1);
                    filter: blur(0);
                }

                /* Stagger children */
                .stagger-children > * {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .stagger-children.revealed > * {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* Parallax elements */
                .parallax-element {
                    will-change: transform;
                    transition: transform 0.1s linear;
                }

                /* Floating animation */
                .floating {
                    animation: floating 3s ease-in-out infinite;
                }

                @keyframes floating {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                /* Scroll progress bar */
                .scroll-progress-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 0%;
                    height: 3px;
                    background: linear-gradient(90deg, var(--blue-primary, #0066ff), #00d4ff);
                    z-index: 9999;
                    transition: width 0.1s linear;
                    box-shadow: 0 0 10px rgba(0, 102, 255, 0.5);
                }

                /* Reveal with shadow */
                .reveal-shadow {
                    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
                }
                .reveal-shadow.revealed {
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                }

                /* Text reveal line by line */
                .text-reveal-line {
                    overflow: hidden;
                }
                .text-reveal-line span {
                    display: block;
                    transform: translateY(100%);
                    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .text-reveal-line.revealed span {
                    transform: translateY(0);
                }

                /* Counter animation */
                .count-up {
                    transition: all 0.3s ease;
                }

                /* Glow effect on reveal */
                .reveal-glow {
                    opacity: 0;
                    filter: drop-shadow(0 0 0 transparent);
                }
                .reveal-glow.revealed {
                    opacity: 1;
                    filter: drop-shadow(0 0 20px rgba(0, 102, 255, 0.4));
                }

                /* Typing effect placeholder */
                .typing-effect {
                    overflow: hidden;
                    white-space: nowrap;
                    border-right: 2px solid var(--blue-primary, #0066ff);
                    animation: typing 3s steps(40) 1s forwards, blink 0.75s step-end infinite;
                    width: 0;
                }
                .typing-effect.revealed {
                    width: 100%;
                }

                @keyframes typing {
                    to { width: 100%; }
                }
                @keyframes blink {
                    50% { border-color: transparent; }
                }

                /* Scroll-linked rotation */
                .scroll-rotate {
                    transition: transform 0.1s linear;
                }

                /* Wave animation for groups */
                .wave-animation > * {
                    animation: wave 0.5s ease forwards;
                    opacity: 0;
                }

                @keyframes wave {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Magnetic hover effect */
                .magnetic {
                    transition: transform 0.3s ease;
                }

                /* Smooth section transitions */
                .section-transition {
                    position: relative;
                }
                .section-transition::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 100px;
                    background: linear-gradient(to bottom, var(--bg-color, #fff), transparent);
                    pointer-events: none;
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Initialize scroll reveal
         */
        initScrollReveal() {
            // Auto-apply reveal classes to common elements
            this.autoApplyRevealClasses();

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        
                        // Handle stagger children
                        if (el.classList.contains('stagger-children')) {
                            this.staggerReveal(el);
                        } else {
                            el.classList.add('revealed');
                        }
                        
                        // Handle count-up numbers
                        if (el.classList.contains('count-up')) {
                            this.animateCounter(el);
                        }
                        
                        observer.unobserve(el);
                    }
                });
            }, {
                threshold: this.config.threshold,
                rootMargin: this.config.rootMargin
            });

            // Observe all reveal elements
            document.querySelectorAll('.scroll-reveal, .stagger-children, .count-up').forEach(el => {
                observer.observe(el);
            });

            this.observers.push(observer);
        },

        /**
         * Auto-apply reveal classes to elements
         */
        autoApplyRevealClasses() {
            // Product cards
            document.querySelectorAll('.product-card').forEach((card, index) => {
                if (!card.classList.contains('scroll-reveal')) {
                    card.classList.add('scroll-reveal', 'reveal-fade-up');
                    card.style.transitionDelay = `${(index % 4) * 100}ms`;
                }
            });

            // Section headings
            document.querySelectorAll('h1, h2, .section-title').forEach(heading => {
                if (!heading.classList.contains('scroll-reveal') && !heading.closest('.header')) {
                    heading.classList.add('scroll-reveal', 'reveal-fade-up');
                }
            });

            // Cards and feature boxes
            document.querySelectorAll('.feature-card, .stat-card, .info-card').forEach((card, index) => {
                if (!card.classList.contains('scroll-reveal')) {
                    card.classList.add('scroll-reveal', 'reveal-scale');
                    card.style.transitionDelay = `${index * 100}ms`;
                }
            });
        },

        /**
         * Stagger reveal children
         */
        staggerReveal(parent) {
            const children = parent.children;
            Array.from(children).forEach((child, index) => {
                setTimeout(() => {
                    child.style.opacity = '1';
                    child.style.transform = 'translateY(0)';
                }, index * this.config.staggerDelay);
            });
            parent.classList.add('revealed');
        },

        /**
         * Animate counter
         */
        animateCounter(el) {
            const target = parseInt(el.dataset.count || el.textContent, 10);
            const duration = parseInt(el.dataset.duration, 10) || 2000;
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = Math.floor(current).toLocaleString();
            }, 16);
        },

        /**
         * Initialize parallax effects
         */
        initParallax() {
            const parallaxElements = document.querySelectorAll('.parallax-element, [data-parallax]');
            if (!parallaxElements.length) return;

            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        const scrollY = window.scrollY;
                        
                        parallaxElements.forEach(el => {
                            const speed = parseFloat(el.dataset.parallax) || this.config.parallaxStrength;
                            const rect = el.getBoundingClientRect();
                            const offsetY = (rect.top + scrollY) - scrollY;
                            el.style.transform = `translateY(${offsetY * speed}px)`;
                        });
                        
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        },

        /**
         * Initialize smooth scroll for anchor links
         */
        initSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const target = document.querySelector(targetId);
                    if (target) {
                        e.preventDefault();
                        this.smoothScrollTo(target);
                    }
                });
            });
        },

        /**
         * Smooth scroll to element
         */
        smoothScrollTo(element) {
            const targetPosition = element.getBoundingClientRect().top + window.scrollY - 100;
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = this.config.smoothScrollDuration;
            let start = null;

            const animation = (currentTime) => {
                if (!start) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing function
                const ease = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                window.scrollTo(0, startPosition + distance * ease);

                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            };

            requestAnimationFrame(animation);
        },

        /**
         * Initialize scroll progress bar
         */
        initScrollProgress() {
            // Create progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress-bar';
            progressBar.id = 'scrollProgressBar';
            document.body.appendChild(progressBar);

            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = (scrollTop / docHeight) * 100;
                progressBar.style.width = `${scrollPercent}%`;
            });
        },

        /**
         * Initialize floating elements
         */
        initFloatingElements() {
            document.querySelectorAll('.floating, [data-floating]').forEach(el => {
                const delay = Math.random() * 2;
                el.style.animationDelay = `${delay}s`;
            });
        },

        /**
         * Magnetic hover effect
         */
        initMagneticHover() {
            document.querySelectorAll('.magnetic').forEach(el => {
                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    el.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
                });
                
                el.addEventListener('mouseleave', () => {
                    el.style.transform = 'translate(0, 0)';
                });
            });
        },

        /**
         * Trigger reveal for dynamic content
         */
        refreshObservers() {
            this.autoApplyRevealClasses();
            this.initScrollReveal();
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ScrollMagic.init());
    } else {
        ScrollMagic.init();
    }

    // Expose globally
    window.ScrollMagic = ScrollMagic;

})();
