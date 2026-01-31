/**
 * 69Shop.in - Reusable Footer Component
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Add <div id="shop-footer"></div> where you want the footer
 * 3. Call ShopFooter.init({ containerId: 'shop-footer' })
 */

(function(global) {
    'use strict';

    const DEFAULT_OPTIONS = {
        containerId: 'shop-footer',
        showSocials: true,
        showQuickLinks: true,
        showSellerLinks: true,
        showSupportLinks: true,
        copyrightYear: new Date().getFullYear()
    };

    function getFooterHTML(options) {
        return `
        <footer class="shop-footer">
            <div class="footer-container">
                <div class="footer-content">
                    <div class="footer-column">
                        <div class="footer-logo">69Shop.in</div>
                        <p class="footer-description">
                            India's premium marketplace connecting buyers with quality products and helping sellers grow their businesses. Join our community today!
                        </p>
                        ${options.showSocials ? `
                        <div class="footer-socials">
                            <a href="https://www.instagram.com/69shopin" target="_blank" rel="noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                            <a href="https://www.facebook.com/69shopin" target="_blank" rel="noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                            <a href="https://twitter.com/69shopin" target="_blank" rel="noreferrer" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                            <a href="https://www.linkedin.com/company/69shopin" target="_blank" rel="noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                            <a href="https://www.youtube.com/@69shopin" target="_blank" rel="noreferrer" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${options.showQuickLinks ? `
                    <div class="footer-column">
                        <h3 class="footer-heading">Quick Links</h3>
                        <ul class="footer-links">
                            <li><a href="/"><i class="fas fa-home"></i> Home</a></li>
                            <li><a href="/shop.html"><i class="fas fa-store"></i> Shop</a></li>
                            <li><a href="/mobiles.html"><i class="fas fa-mobile-alt"></i> Mobiles</a></li>
                            <li><a href="/headphones.html"><i class="fas fa-headphones"></i> Headphones</a></li>
                            <li><a href="/appliances.html"><i class="fas fa-blender"></i> Appliances</a></li>
                            <li><a href="/home-needs.html"><i class="fas fa-lightbulb"></i> Home Needs</a></li>
                            <li><a href="/#sell"><i class="fas fa-briefcase"></i> Sell on 69Shop</a></li>
                            <li><a href="/#about"><i class="fas fa-info-circle"></i> About Us</a></li>
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${options.showSellerLinks ? `
                    <div class="footer-column">
                        <h3 class="footer-heading">For Sellers</h3>
                        <ul class="footer-links">
                            <li><a href="/#sell"><i class="fas fa-rocket"></i> Start Selling</a></li>
                            <li><a href="/seller-dashboard.html"><i class="fas fa-chart-line"></i> Seller Dashboard</a></li>
                            <li><a href="/profile.html?section=help"><i class="fas fa-graduation-cap"></i> Seller Education</a></li>
                            <li><a href="/services.html#distributors"><i class="fas fa-handshake"></i> Partner Program</a></li>
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${options.showSupportLinks ? `
                    <div class="footer-column">
                        <h3 class="footer-heading">Support</h3>
                        <ul class="footer-links">
                            <li><a href="/#contact"><i class="fas fa-question-circle"></i> Help Center</a></li>
                            <li><a href="/docs/privacy.html"><i class="fas fa-shield-alt"></i> Privacy Policy</a></li>
                            <li><a href="/docs/terms.html"><i class="fas fa-file-contract"></i> Terms of Service</a></li>
                            <li><a href="/docs/shipping.html"><i class="fas fa-truck"></i> Shipping Policy</a></li>
                        </ul>
                    </div>
                    ` : ''}
                </div>
                
                <div class="footer-copyright">
                    &copy; ${options.copyrightYear} 69Shop.in - India's Premium Marketplace. All rights reserved.
                </div>
            </div>
        </footer>
        `;
    }

    function getFooterCSS() {
        return `
        <style id="shop-footer-styles">
        .shop-footer {
            background: var(--primary-black, #1A1A1A);
            color: #fff;
            padding: 60px 0 0;
            margin-top: auto;
        }

        .footer-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px;
        }

        .footer-content {
            display: grid;
            grid-template-columns: 1.5fr repeat(3, 1fr);
            gap: 48px;
            padding-bottom: 40px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .footer-logo {
            font-family: 'Poppins', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 16px;
        }

        .footer-description {
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
            line-height: 1.7;
            margin-bottom: 20px;
        }

        .footer-socials {
            display: flex;
            gap: 12px;
        }

        .footer-socials a {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .footer-socials a:hover {
            background: var(--blue-primary, #0066ff);
            transform: translateY(-3px);
        }

        .footer-heading {
            font-family: 'Poppins', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 20px;
        }

        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-links li {
            margin-bottom: 12px;
        }

        .footer-links a {
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        }

        .footer-links a:hover {
            color: #fff;
            transform: translateX(5px);
        }

        .footer-links a i {
            width: 16px;
            text-align: center;
            font-size: 0.85rem;
        }

        .footer-copyright {
            text-align: center;
            padding: 24px 0;
            color: rgba(255,255,255,0.5);
            font-size: 0.85rem;
        }

        @media (max-width: 992px) {
            .footer-content {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 576px) {
            .shop-footer {
                padding: 40px 0 0;
            }

            .footer-content {
                grid-template-columns: 1fr;
                gap: 32px;
            }

            .footer-column {
                text-align: center;
            }

            .footer-socials {
                justify-content: center;
            }

            .footer-links a {
                justify-content: center;
            }

            .footer-links a:hover {
                transform: none;
            }
        }
        </style>
        `;
    }

    function init(options = {}) {
        const config = { ...DEFAULT_OPTIONS, ...options };
        const container = document.getElementById(config.containerId);
        
        if (!container) {
            console.error('ShopFooter: Container not found:', config.containerId);
            return null;
        }

        // Add CSS if not already present
        if (!document.getElementById('shop-footer-styles')) {
            document.head.insertAdjacentHTML('beforeend', getFooterCSS());
        }

        // Render footer
        container.innerHTML = getFooterHTML(config);

        return true;
    }

    global.ShopFooter = {
        init
    };

})(window);
