/**
 * 69Shop.in - Reusable Header Component
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Add <div id="shop-header"></div> where you want the header
 * 3. Call ShopHeader.init({ containerId: 'shop-header', options... })
 */

(function(global) {
    'use strict';

    const DEFAULT_OPTIONS = {
        containerId: 'shop-header',
        showSearch: true,
        showCart: true,
        showProfile: true,
        logoLink: '/',
        searchPlaceholder: 'Search for products, brands, and more...',
        cartBadgeId: 'headerCartCount',
        onCartClick: null,
        onProfileClick: null,
        onSearchSubmit: null,
        onLogoClick: null
    };

    let state = {
        user: null,
        cartCount: 0,
        isSearchOpen: false,
        isMobileMenuOpen: false
    };

    function getHeaderHTML(options) {
        return `
        <header class="shop-header">
            <div class="header-container">
                <div class="header-content">
                    <a href="${options.logoLink}" class="header-logo" id="headerLogo">
                        <div class="logo-icon">
                            <img src="/Logo/69shopc.png" alt="69Shop.in Logo">
                        </div>
                        <div class="logo-text">
                            <div class="site-name">69SHOP.IN</div>
                            <div class="tagline">Premium Marketplace</div>
                        </div>
                    </a>

                    <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu">
                        <i class="fas fa-bars"></i>
                    </button>

                    ${options.showSearch ? `
                    <div class="header-search" id="headerSearchContainer">
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" class="search-input" id="headerSearchInput" 
                                   placeholder="${options.searchPlaceholder}" autocomplete="off">
                            <div class="search-results" id="headerSearchResults"></div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="header-actions">
                        ${options.showSearch ? `
                        <button class="header-action-btn search-mobile-toggle" id="searchMobileToggle" aria-label="Toggle search">
                            <i class="fas fa-search"></i>
                        </button>
                        ` : ''}

                        ${options.showCart ? `
                        <button class="header-action-btn cart-btn" id="headerCartBtn" aria-label="Open cart">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="cart-badge" id="${options.cartBadgeId}">0</span>
                        </button>
                        ` : ''}

                        ${options.showProfile ? `
                        <button type="button" class="header-profile-btn" id="headerProfileBtn">
                            <div class="profile-avatar" id="headerAvatar">G</div>
                            <span class="profile-name" id="headerUserName">Guest</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </header>
        `;
    }

    function getHeaderCSS() {
        return `
        <style id="shop-header-styles">
        .shop-header {
            position: sticky;
            top: 0;
            background: var(--primary-black, #1A1A1A);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .header-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px;
        }

        .header-content {
            display: flex;
            align-items: center;
            height: 70px;
            gap: 24px;
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            flex-shrink: 0;
        }

        .header-logo .logo-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            overflow: hidden;
            background: linear-gradient(135deg, #0066ff 0%, #009cf7 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-logo .logo-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .header-logo .logo-text {
            display: flex;
            flex-direction: column;
        }

        .header-logo .site-name {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 1.25rem;
            color: #fff;
            letter-spacing: -0.5px;
        }

        .header-logo .tagline {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.6);
            letter-spacing: 0.5px;
        }

        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 8px;
        }

        .header-search {
            flex: 1;
            max-width: 600px;
        }

        .search-input-wrapper {
            position: relative;
            width: 100%;
        }

        .search-input-wrapper .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
        }

        .search-input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            background: rgba(255,255,255,0.1);
            color: #fff;
            transition: all 0.3s ease;
        }

        .search-input::placeholder {
            color: rgba(255,255,255,0.5);
        }

        .search-input:focus {
            outline: none;
            background: rgba(255,255,255,0.15);
            box-shadow: 0 0 0 2px rgba(0,102,255,0.3);
        }

        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            margin-top: 8px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            z-index: 1001;
        }

        .search-results.active {
            display: block;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-action-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.3s ease;
        }

        .header-action-btn:hover {
            background: rgba(255,255,255,0.2);
        }

        .cart-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #0066ff;
            color: #fff;
            font-size: 0.7rem;
            font-weight: 600;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
        }

        .search-mobile-toggle {
            display: none;
        }

        .header-profile-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.1);
            border: none;
            padding: 6px 12px 6px 6px;
            border-radius: 24px;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .header-profile-btn:hover {
            background: rgba(255,255,255,0.2);
        }

        .profile-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0066ff 0%, #009cf7 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .profile-name {
            font-weight: 500;
            font-size: 0.9rem;
        }

        .header-profile-btn .fa-chevron-down {
            font-size: 0.7rem;
            opacity: 0.7;
        }

        @media (max-width: 768px) {
            .header-content {
                height: 60px;
                gap: 12px;
            }

            .header-logo .logo-text {
                display: none;
            }

            .mobile-menu-toggle {
                display: flex;
            }

            .header-search {
                position: absolute;
                top: 60px;
                left: 0;
                right: 0;
                background: var(--primary-black, #1A1A1A);
                padding: 12px 16px;
                max-width: none;
                display: none;
            }

            .header-search.active {
                display: block;
            }

            .search-mobile-toggle {
                display: flex;
            }

            .profile-name {
                display: none;
            }

            .header-profile-btn .fa-chevron-down {
                display: none;
            }

            .header-profile-btn {
                padding: 6px;
                border-radius: 50%;
            }
        }
        </style>
        `;
    }

    function updateCartBadge(count) {
        state.cartCount = count;
        const badge = document.getElementById(DEFAULT_OPTIONS.cartBadgeId);
        if (badge) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    function updateUserInfo(user) {
        state.user = user;
        const avatar = document.getElementById('headerAvatar');
        const name = document.getElementById('headerUserName');
        
        if (user) {
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            const initial = displayName.charAt(0).toUpperCase();
            if (avatar) avatar.textContent = initial;
            if (name) name.textContent = displayName.split(' ')[0];
        } else {
            if (avatar) avatar.textContent = 'G';
            if (name) name.textContent = 'Guest';
        }
    }

    function init(options = {}) {
        const config = { ...DEFAULT_OPTIONS, ...options };
        const container = document.getElementById(config.containerId);
        
        if (!container) {
            console.error('ShopHeader: Container not found:', config.containerId);
            return null;
        }

        // Add CSS if not already present
        if (!document.getElementById('shop-header-styles')) {
            document.head.insertAdjacentHTML('beforeend', getHeaderCSS());
        }

        // Render header
        container.innerHTML = getHeaderHTML(config);

        // Setup event listeners
        const cartBtn = document.getElementById('headerCartBtn');
        const profileBtn = document.getElementById('headerProfileBtn');
        const searchInput = document.getElementById('headerSearchInput');
        const searchToggle = document.getElementById('searchMobileToggle');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const logo = document.getElementById('headerLogo');

        if (cartBtn && config.onCartClick) {
            cartBtn.addEventListener('click', config.onCartClick);
        }

        if (profileBtn && config.onProfileClick) {
            profileBtn.addEventListener('click', config.onProfileClick);
        }

        if (searchInput && config.onSearchSubmit) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    config.onSearchSubmit(searchInput.value);
                }
            });
        }

        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                const searchContainer = document.getElementById('headerSearchContainer');
                if (searchContainer) {
                    searchContainer.classList.toggle('active');
                    state.isSearchOpen = searchContainer.classList.contains('active');
                }
            });
        }

        if (logo && config.onLogoClick) {
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                config.onLogoClick(e);
            });
        }

        // Load cart count from localStorage
        try {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');
            updateCartBadge(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
        } catch (e) {
            console.warn('ShopHeader: Failed to load cart');
        }

        return {
            updateCartBadge,
            updateUserInfo,
            getSearchInput: () => document.getElementById('headerSearchInput'),
            getSearchResults: () => document.getElementById('headerSearchResults')
        };
    }

    global.ShopHeader = {
        init,
        updateCartBadge,
        updateUserInfo
    };

})(window);
