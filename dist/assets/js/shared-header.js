/**
 * 69Shop.in — Shared Static Header (Post-Login)
 * Renders a consistent header across all user-facing pages after login.
 * Include this script AFTER Firebase init on pages that need the unified header.
 */
(function () {
    'use strict';

    /** Get nav pages — Home destination varies by auth state */
    function getHeaderPages(isLoggedIn) {
        return [
            { label: 'Home', href: isLoggedIn ? '/shop.html' : '/', icon: 'fas fa-home' },
            { label: 'Shop', href: '/shop.html', icon: 'fas fa-store' },
            { label: 'Services', href: '/services.html', icon: 'fas fa-concierge-bell' }
        ];
    }

    /** Detect which page is currently active */
    function getActivePage() {
        const path = window.location.pathname;
        if (path === '/' || path.endsWith('index.html')) return '/';
        if (path.includes('shop.html')) return '/shop.html';
        if (path.includes('services.html') || path.includes('book-service.html')) return '/services.html';
        return '';
    }

    /** Build the unified header HTML */
    function buildHeaderHTML(user) {
        const activePath = getActivePage();
        const pages = getHeaderPages(true);
        const navLinksHTML = pages.map(p => {
            const isActive = p.href === activePath ? ' class="active"' : '';
            return `<li><a href="${p.href}"${isActive}><i class="${p.icon}"></i> ${p.label}</a></li>`;
        }).join('\n                        ');

        const mobileNavLinksHTML = pages.map(p => {
            const isActive = p.href === activePath ? ' active' : '';
            return `<a href="${p.href}" class="mobile-drawer-link${isActive}"><i class="${p.icon}"></i> ${p.label}</a>`;
        }).join('\n                    ');

        const initial = user && user.displayName
            ? user.displayName.charAt(0).toUpperCase()
            : (user && user.email ? user.email.charAt(0).toUpperCase() : 'U');

        const displayName = user && user.displayName
            ? user.displayName.split(' ')[0]
            : 'Account';

        const userEmail = user && user.email ? user.email : '';
        const avatarStyle = user && user.photoURL
            ? `background-image:url(${user.photoURL});background-size:cover;background-position:center;color:transparent;`
            : '';

        return `
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo">
                    <div class="logo-icon">
                        <img src="/Logo/69shopc.png" alt="69Shop.in Logo" style="width:100%;height:100%;object-fit:contain;">
                    </div>
                    <div class="logo-text">
                        <div class="site-name">69SHOP.IN</div>
                        <div class="tagline">Premium Marketplace</div>
                    </div>
                </a>

                <!-- Search Bar -->
                <div class="shared-search-container" id="sharedSearchContainer">
                    <div class="shared-search-wrapper">
                        <i class="fas fa-search shared-search-icon"></i>
                        <input type="text" class="shared-search-input" id="sharedSearchInput"
                               placeholder="Search products, brands & more..." autocomplete="off">
                    </div>
                </div>

                <nav class="main-nav shared-nav" id="sharedMainNav">
                    <ul class="nav-links">
                        ${navLinksHTML}
                    </ul>
                </nav>

                <div class="header-actions shared-header-actions">
                    <button class="header-icon-btn shared-search-toggle" id="sharedSearchToggle" aria-label="Search" title="Search" onclick="toggleSharedSearch()">
                        <i class="fas fa-search"></i>
                    </button>
                    <a href="/profile.html?section=wishlist" class="header-icon-btn" aria-label="Wishlist" title="Wishlist">
                        <i class="fas fa-heart"></i>
                    </a>
                    <a href="/messages.html" class="header-icon-btn" aria-label="Messages" title="Messages">
                        <i class="fas fa-envelope"></i>
                        <span class="shared-messages-count" id="sharedMessagesCount">0</span>
                    </a>
                    <a href="/profile.html?section=cart" class="header-icon-btn shared-cart-link" aria-label="Cart" title="Cart">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="shared-cart-count" id="sharedCartCount">0</span>
                    </a>
                    <a href="/profile.html" class="header-user-btn" title="My Profile">
                        <div class="header-user-avatar">${initial}</div>
                        <span class="header-user-name">${displayName}</span>
                    </a>
                    <button class="header-icon-btn header-logout-btn" onclick="sharedHeaderLogout()" aria-label="Logout" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                    <button class="header-hamburger" id="sharedHamburger" aria-label="Open menu" onclick="toggleSharedMobileNav()">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
        </div>
        <!-- Mobile Nav Drawer -->
        <div class="shared-mobile-overlay" id="sharedMobileOverlay" onclick="toggleSharedMobileNav()"></div>
        <aside class="shared-mobile-drawer" id="sharedMobileDrawer">
            <div class="mobile-drawer-header">
                <a href="/profile.html" class="mobile-drawer-user">
                    <div class="mobile-drawer-avatar" style="${avatarStyle}">${avatarStyle ? '' : initial}</div>
                    <div class="mobile-drawer-user-info">
                        <strong>${displayName}</strong>
                        <span>${userEmail}</span>
                    </div>
                </a>
                <button class="mobile-drawer-close" onclick="toggleSharedMobileNav()" aria-label="Close menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <nav class="mobile-drawer-nav">
                ${mobileNavLinksHTML}
                <a href="/profile.html" class="mobile-drawer-link"><i class="fas fa-user"></i> My Account</a>
                <a href="/profile.html?section=wishlist" class="mobile-drawer-link"><i class="fas fa-heart"></i> Wishlist</a>
                <a href="/profile.html?section=cart" class="mobile-drawer-link"><i class="fas fa-shopping-cart"></i> Cart</a>
                <a href="/messages.html" class="mobile-drawer-link"><i class="fas fa-envelope"></i> Messages</a>
                <a href="/profile.html?section=orders" class="mobile-drawer-link"><i class="fas fa-box"></i> My Orders</a>
            </nav>
            <div class="mobile-drawer-footer">
                <button onclick="sharedHeaderLogout()" class="mobile-drawer-logout"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
            </div>
        </aside>`;
    }

    /** Build a guest header for non-logged-in users */
    function buildGuestHeaderHTML() {
        const activePath = getActivePage();
        const pages = getHeaderPages(false);
        const navLinksHTML = pages.map(p => {
            const isActive = p.href === activePath ? ' class="active"' : '';
            return `<li><a href="${p.href}"${isActive}><i class="${p.icon}"></i> ${p.label}</a></li>`;
        }).join('\n                        ');

        const mobileNavLinksHTML = pages.map(p => {
            const isActive = p.href === activePath ? ' active' : '';
            return `<a href="${p.href}" class="mobile-drawer-link${isActive}"><i class="${p.icon}"></i> ${p.label}</a>`;
        }).join('\n                    ');

        return `
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo">
                    <div class="logo-icon">
                        <img src="/Logo/69shopc.png" alt="69Shop.in Logo" style="width:100%;height:100%;object-fit:contain;">
                    </div>
                    <div class="logo-text">
                        <div class="site-name">69SHOP.IN</div>
                        <div class="tagline">Premium Marketplace</div>
                    </div>
                </a>

                <!-- Search Bar -->
                <div class="shared-search-container" id="sharedSearchContainer">
                    <div class="shared-search-wrapper">
                        <i class="fas fa-search shared-search-icon"></i>
                        <input type="text" class="shared-search-input" id="sharedSearchInput"
                               placeholder="Search products, brands & more..." autocomplete="off">
                    </div>
                </div>

                <nav class="main-nav shared-nav" id="sharedMainNav">
                    <ul class="nav-links">
                        ${navLinksHTML}
                    </ul>
                </nav>

                <div class="header-actions shared-header-actions">
                    <button class="header-icon-btn shared-search-toggle" id="sharedSearchToggle" aria-label="Search" title="Search" onclick="toggleSharedSearch()">
                        <i class="fas fa-search"></i>
                    </button>
                    <a href="/shop-login.html" class="header-icon-btn header-guest-login" title="Login">
                        <i class="fas fa-sign-in-alt"></i>
                        <span class="header-login-label">Login</span>
                    </a>
                    <a href="/shop-login.html" class="header-guest-signup-btn" title="Sign Up">
                        <i class="fas fa-user-plus"></i> Sign Up
                    </a>
                    <button class="header-icon-btn header-hamburger" id="sharedHamburger" aria-label="Open menu" onclick="toggleSharedMobileNav()">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
        </div>
        <!-- Mobile Nav Drawer -->
        <div class="shared-mobile-overlay" id="sharedMobileOverlay" onclick="toggleSharedMobileNav()"></div>
        <aside class="shared-mobile-drawer" id="sharedMobileDrawer">
            <div class="mobile-drawer-header">
                <div class="mobile-drawer-user" style="pointer-events:none;">
                    <div class="mobile-drawer-avatar" style="background:var(--blue-primary,#0066ff);"><i class="fas fa-user" style="color:#fff;font-size:1rem;"></i></div>
                    <div class="mobile-drawer-user-info">
                        <strong>Welcome!</strong>
                        <span>Sign in to get started</span>
                    </div>
                </div>
                <button class="mobile-drawer-close" onclick="toggleSharedMobileNav()" aria-label="Close menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <nav class="mobile-drawer-nav">
                ${mobileNavLinksHTML}
            </nav>
            <div class="mobile-drawer-footer">
                <a href="/shop-login.html" class="mobile-drawer-logout" style="background:var(--blue-primary,#0066ff);color:#fff;text-decoration:none;text-align:center;border:0;"><i class="fas fa-sign-in-alt"></i> Login / Sign Up</a>
            </div>
        </aside>`;
    }

    /** Logout handler */
    window.sharedHeaderLogout = function () {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().then(function () {
                localStorage.removeItem('69shop_cart');
                localStorage.removeItem('69shop_wishlist');
                window.location.href = '/shop-login.html';
            }).catch(function () {
                window.location.href = '/shop-login.html';
            });
        } else {
            window.location.href = '/shop-login.html';
        }
    };

    /** Mobile nav drawer toggle */
    window.toggleSharedMobileNav = function () {
        var drawer = document.getElementById('sharedMobileDrawer');
        var overlay = document.getElementById('sharedMobileOverlay');
        var hamburger = document.getElementById('sharedHamburger');
        if (!drawer) return;
        var isOpen = drawer.classList.contains('open');
        drawer.classList.toggle('open', !isOpen);
        if (overlay) overlay.classList.toggle('open', !isOpen);
        if (hamburger) hamburger.classList.toggle('open', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
    };

    /** Search bar toggle (mobile) */
    window.toggleSharedSearch = function () {
        var container = document.getElementById('sharedSearchContainer');
        if (!container) return;
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
            var input = document.getElementById('sharedSearchInput');
            if (input) input.focus();
        }
    };

    /** Update shared header cart count from localStorage */
    function updateSharedCartCount() {
        try {
            var raw = localStorage.getItem('69shop_cart');
            var cart = raw ? JSON.parse(raw) : [];
            var total = cart.reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);
            var badges = document.querySelectorAll('.shared-cart-count');
            badges.forEach(function (badge) {
                badge.textContent = total;
                badge.style.display = total > 0 ? 'flex' : 'none';
            });
        } catch (e) { /* ignore parse errors */ }
    }

    /** Initialize cart count and listen for changes */
    function initCartCount() {
        updateSharedCartCount();
        // Listen for cart changes from other tabs
        window.addEventListener('storage', function (e) {
            if (e.key === '69shop_cart') updateSharedCartCount();
        });
        // Patch localStorage.setItem to detect same-tab cart changes
        var origSetItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function (key, value) {
            origSetItem(key, value);
            if (key === '69shop_cart') updateSharedCartCount();
        };
    }

    /** Update shared header unread messages count from Firestore */
    function updateSharedMessagesCount() {
        if (typeof firebase === 'undefined' || !firebase.auth) return;
        var user = firebase.auth().currentUser;
        if (!user) return;
        try {
            firebase.firestore().collection('conversations')
                .where('customerId', '==', user.uid)
                .get()
                .then(function (snapshot) {
                    var total = 0;
                    snapshot.forEach(function (doc) {
                        total += (doc.data().customerUnread || 0);
                    });
                    var badges = document.querySelectorAll('.shared-messages-count');
                    badges.forEach(function (badge) {
                        badge.textContent = total;
                        badge.style.display = total > 0 ? 'flex' : 'none';
                    });
                })
                .catch(function () { /* silently fail */ });
        } catch (e) { /* silently fail */ }
    }

    /** Search bar — redirect to shop with query */
    function initSharedSearch() {
        var input = document.getElementById('sharedSearchInput');
        if (!input) return;
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var q = input.value.trim();
                if (q) {
                    window.location.href = '/shop.html?search=' + encodeURIComponent(q);
                }
            }
        });
    }

    /** Inject mobile bottom nav on shared-header pages */
    function injectMobileBottomNav(isLoggedIn) {
        // Don't inject if one already exists
        if (document.getElementById('mobileBottomNav')) return;
        var homeHref = isLoggedIn ? '/shop.html' : '/';
        var nav = document.createElement('nav');
        nav.className = 'mobile-bottom-nav shared-mobile-bottom-nav';
        nav.id = 'mobileBottomNav';
        nav.setAttribute('aria-label', 'Mobile navigation');
        nav.innerHTML = '<div class="mobile-nav-items">' +
            '<a href="' + homeHref + '" class="mobile-nav-item" aria-label="Home"><i class="fas fa-home"></i><span>Home</span></a>' +
            '<a href="/shop.html" class="mobile-nav-item" aria-label="Search"><i class="fas fa-search"></i><span>Search</span></a>' +
            '<a href="/profile.html?section=cart" class="mobile-nav-item shared-cart-link" aria-label="Cart"><i class="fas fa-shopping-cart"></i><span class="shared-cart-count" id="sharedMobileCartCount">0</span><span>Cart</span></a>' +
            '<a href="/profile.html?section=wishlist" class="mobile-nav-item" aria-label="Wishlist"><i class="fas fa-heart"></i><span>Wishlist</span></a>' +
            '<a href="/messages.html" class="mobile-nav-item" aria-label="Messages"><i class="fas fa-envelope"></i><span>Messages</span></a>' +
            '<a href="/profile.html" class="mobile-nav-item" aria-label="Profile"><i class="fas fa-user"></i><span>Profile</span></a>' +
            '</div>';
        document.body.appendChild(nav);
    }

    /** Initialize: wait for auth state, then render header */
    function initSharedHeader() {
        // Skip shop.html — it has its own comprehensive header with search
        if (window.location.pathname.includes('shop.html') && !window.location.pathname.includes('shop-login.html')) return;
        // Skip landing page — it has its own 6-item nav with auth state management
        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) return;
        // Skip seller/admin pages
        if (window.location.pathname.includes('seller-') || window.location.pathname.includes('admin-')) return;
        // Skip login pages
        if (window.location.pathname.includes('login')) return;

        // Find the existing header element
        var header = document.querySelector('header.header, header.top-bar, header.booking-header, nav.nav');
        if (!header) return;

        // If it's a <nav>, convert to <header>
        if (header.tagName === 'NAV') {
            var newHeader = document.createElement('header');
            newHeader.className = 'header shared-header';
            header.parentNode.insertBefore(newHeader, header);
            header.remove();
            header = newHeader;
        } else {
            header.className = 'header shared-header';
        }

        // Check if Firebase auth is available
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    // User is logged in — render authenticated header
                    header.innerHTML = buildHeaderHTML(user);
                    // Update avatar if photo URL exists
                    if (user.photoURL) {
                        var avatar = header.querySelector('.header-user-avatar');
                        if (avatar) {
                            avatar.style.backgroundImage = 'url(' + user.photoURL + ')';
                            avatar.style.backgroundSize = 'cover';
                            avatar.style.backgroundPosition = 'center';
                            avatar.textContent = '';
                        }
                        var drawerAvatar = header.querySelector('.mobile-drawer-avatar');
                        if (drawerAvatar) {
                            drawerAvatar.style.backgroundImage = 'url(' + user.photoURL + ')';
                            drawerAvatar.style.backgroundSize = 'cover';
                            drawerAvatar.style.backgroundPosition = 'center';
                            drawerAvatar.textContent = '';
                        }
                    }
                } else {
                    // Not logged in — render guest header with Login / Sign Up
                    header.innerHTML = buildGuestHeaderHTML();
                }
                initSharedSearch();
                initCartCount();
                updateSharedMessagesCount();
                injectMobileBottomNav(!!user);
            });
        } else {
            // Firebase not available — render guest header
            header.innerHTML = buildGuestHeaderHTML();
            initSharedSearch();
            initCartCount();
            injectMobileBottomNav(false);
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSharedHeader);
    } else {
        initSharedHeader();
    }
})();
