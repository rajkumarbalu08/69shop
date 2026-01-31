/**
 * 69Shop.in - Reusable Cart Drawer Component
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Add <div id="cart-drawer"></div> where you want the cart
 * 3. Call CartDrawer.init({ containerId: 'cart-drawer' })
 */

(function(global) {
    'use strict';

    const DEFAULT_OPTIONS = {
        containerId: 'cart-drawer',
        storageKey: '69shop_cart',
        onCheckout: null,
        onItemRemove: null,
        onQuantityChange: null,
        enableGuestCheckout: true,
        minOrderValue: 0
    };

    let options = DEFAULT_OPTIONS;
    let isOpen = false;

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(options.storageKey) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(options.storageKey, JSON.stringify(cart));
        updateCartBadge();
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    }

    function updateCartBadge() {
        const cart = getCart();
        const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Update all cart badges
        document.querySelectorAll('.cart-badge, #headerCartCount, #cartCount').forEach(badge => {
            badge.textContent = total > 99 ? '99+' : total;
            badge.style.display = total > 0 ? 'flex' : 'none';
        });

        if (global.ShopHeader) {
            global.ShopHeader.updateCartBadge(total);
        }
    }

    function getTotal() {
        return getCart().reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    }

    function getItemCount() {
        return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    function addItem(product, quantity = 1) {
        const cart = getCart();
        const existing = cart.find(item => String(item.id) === String(product.id));
        
        if (existing) {
            existing.quantity = (existing.quantity || 1) + quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || product.images?.[0],
                quantity: quantity,
                seller: product.seller?.name || product.sellerName || 'Unknown'
            });
        }
        
        saveCart(cart);
        renderCartItems();
        showToast(`${product.name} added to cart`, 'success');
    }

    function removeItem(productId) {
        const cart = getCart().filter(item => String(item.id) !== String(productId));
        saveCart(cart);
        renderCartItems();
        
        if (options.onItemRemove) {
            options.onItemRemove(productId);
        }
    }

    function updateQuantity(productId, quantity) {
        const cart = getCart();
        const item = cart.find(item => String(item.id) === String(productId));
        
        if (item) {
            if (quantity <= 0) {
                removeItem(productId);
            } else {
                item.quantity = quantity;
                saveCart(cart);
                renderCartItems();
            }
        }
        
        if (options.onQuantityChange) {
            options.onQuantityChange(productId, quantity);
        }
    }

    function clearCart() {
        saveCart([]);
        renderCartItems();
    }

    function renderCartItems() {
        const itemsContainer = document.getElementById('cartItemsList');
        const totalEl = document.getElementById('cartTotalAmount');
        const checkoutBtn = document.getElementById('cartCheckoutBtn');
        const emptyState = document.getElementById('cartEmptyState');
        
        if (!itemsContainer) return;
        
        const cart = getCart();
        const total = getTotal();
        
        if (cart.length === 0) {
            itemsContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            if (checkoutBtn) checkoutBtn.disabled = true;
        } else {
            itemsContainer.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';
            if (checkoutBtn) checkoutBtn.disabled = total < options.minOrderValue;
            
            itemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" data-product-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://via.placeholder.com/80x80?text=Product'}" 
                             alt="${item.name}"
                             onerror="this.src='https://via.placeholder.com/80x80?text=Product'">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <p class="cart-item-seller">by ${item.seller}</p>
                        <p class="cart-item-price">₹${item.price?.toLocaleString('en-IN') || 0}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="qty-btn minus" data-product-id="${item.id}" data-action="decrease">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="qty-value">${item.quantity || 1}</span>
                            <button class="qty-btn plus" data-product-id="${item.id}" data-action="increase">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-btn" data-product-id="${item.id}" aria-label="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Setup event listeners
            itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const productId = btn.dataset.productId;
                    const action = btn.dataset.action;
                    const item = cart.find(i => String(i.id) === String(productId));
                    if (item) {
                        const newQty = action === 'increase' ? (item.quantity || 1) + 1 : (item.quantity || 1) - 1;
                        updateQuantity(productId, newQty);
                    }
                });
            });
            
            itemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    removeItem(btn.dataset.productId);
                });
            });
        }
        
        if (totalEl) {
            totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
        }
    }

    function open() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        
        if (drawer) {
            drawer.classList.add('open');
            isOpen = true;
        }
        if (overlay) {
            overlay.classList.add('active');
        }
        
        document.body.style.overflow = 'hidden';
        renderCartItems();
    }

    function close() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        
        if (drawer) {
            drawer.classList.remove('open');
            isOpen = false;
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        document.body.style.overflow = '';
    }

    function toggle() {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }

    function getDrawerHTML() {
        return `
        <div class="cart-overlay" id="cartOverlay"></div>
        <div class="cart-drawer" id="cartDrawer">
            <div class="cart-header">
                <h3 class="cart-title">
                    <i class="fas fa-shopping-cart"></i>
                    Your Cart
                </h3>
                <button class="cart-close" id="cartCloseBtn" aria-label="Close cart">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="cart-empty" id="cartEmptyState">
                <div class="empty-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h4>Your cart is empty</h4>
                <p>Start shopping to add items to your cart</p>
                <button class="continue-shopping-btn" id="continueShoppingBtn">
                    <i class="fas fa-store"></i>
                    Continue Shopping
                </button>
            </div>
            
            <div class="cart-items" id="cartItemsList"></div>
            
            <div class="cart-footer">
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span id="cartTotalAmount">₹0</span>
                    </div>
                    <p class="shipping-note">
                        <i class="fas fa-truck"></i>
                        Free shipping on orders over ₹499
                    </p>
                </div>
                <button class="checkout-btn" id="cartCheckoutBtn" disabled>
                    <i class="fas fa-lock"></i>
                    Proceed to Checkout
                </button>
                ${options.enableGuestCheckout ? `
                <p class="guest-checkout-note">
                    <i class="fas fa-user"></i>
                    Guest checkout available
                </p>
                ` : ''}
            </div>
        </div>
        `;
    }

    function getDrawerCSS() {
        return `
        <style id="cart-drawer-styles">
        .cart-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .cart-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .cart-drawer {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            max-width: 420px;
            height: 100vh;
            background: #fff;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: -10px 0 30px rgba(0,0,0,0.1);
        }

        .cart-drawer.open {
            transform: translateX(0);
        }

        .cart-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .cart-title {
            font-size: 1.25rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #1A1A1A;
        }

        .cart-close {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f5f5f5;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .cart-close:hover {
            background: #eee;
        }

        .cart-empty {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        }

        .cart-empty .empty-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }

        .cart-empty .empty-icon i {
            font-size: 2rem;
            color: #ccc;
        }

        .cart-empty h4 {
            font-size: 1.1rem;
            color: #333;
            margin-bottom: 8px;
        }

        .cart-empty p {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 20px;
        }

        .continue-shopping-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #0066ff 0%, #009cf7 100%);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .continue-shopping-btn:hover {
            filter: brightness(1.1);
        }

        .cart-items {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .cart-item {
            display: flex;
            gap: 12px;
            padding: 16px;
            background: #f9f9f9;
            border-radius: 12px;
            margin-bottom: 12px;
        }

        .cart-item-image {
            width: 70px;
            height: 70px;
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
        }

        .cart-item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .cart-item-details {
            flex: 1;
            min-width: 0;
        }

        .cart-item-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .cart-item-seller {
            font-size: 0.75rem;
            color: #666;
            margin-bottom: 4px;
        }

        .cart-item-price {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0066ff;
        }

        .cart-item-actions {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        }

        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #fff;
            border-radius: 6px;
            padding: 2px;
        }

        .qty-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: #eee;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            transition: all 0.2s ease;
        }

        .qty-btn:hover {
            background: #0066ff;
            color: #fff;
        }

        .qty-value {
            min-width: 28px;
            text-align: center;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .remove-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: #fee;
            color: #EF4444;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            transition: all 0.2s ease;
        }

        .remove-btn:hover {
            background: #EF4444;
            color: #fff;
        }

        .cart-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            background: #fff;
        }

        .cart-summary {
            margin-bottom: 16px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.1rem;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 8px;
        }

        .shipping-note {
            font-size: 0.8rem;
            color: #10B981;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .checkout-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #0066ff 0%, #009cf7 100%);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .checkout-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .checkout-btn:not(:disabled):hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }

        .guest-checkout-note {
            text-align: center;
            font-size: 0.8rem;
            color: #666;
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        @media (max-width: 480px) {
            .cart-drawer {
                max-width: 100%;
            }
        }
        </style>
        `;
    }

    function showToast(message, type = 'success') {
        if (global.ProductCard) {
            global.ProductCard.showToast(message, type);
        }
    }

    function init(opts = {}) {
        options = { ...DEFAULT_OPTIONS, ...opts };
        const container = document.getElementById(options.containerId);
        
        if (!container) {
            console.error('CartDrawer: Container not found:', options.containerId);
            return null;
        }

        // Add CSS if not already present
        if (!document.getElementById('cart-drawer-styles')) {
            document.head.insertAdjacentHTML('beforeend', getDrawerCSS());
        }

        // Render drawer
        container.innerHTML = getDrawerHTML();

        // Setup event listeners
        const closeBtn = document.getElementById('cartCloseBtn');
        const overlay = document.getElementById('cartOverlay');
        const checkoutBtn = document.getElementById('cartCheckoutBtn');
        const continueBtn = document.getElementById('continueShoppingBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }

        if (overlay) {
            overlay.addEventListener('click', close);
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (options.onCheckout) {
                    options.onCheckout(getCart(), getTotal());
                } else {
                    // Default behavior: redirect to checkout
                    window.location.href = '/shop.html#checkout';
                }
            });
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                close();
                window.location.href = '/shop.html';
            });
        }

        // Listen for cart updates
        window.addEventListener('cartUpdated', renderCartItems);

        // Initial render
        updateCartBadge();
        renderCartItems();

        return {
            open,
            close,
            toggle,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            getCart,
            getTotal,
            getItemCount
        };
    }

    global.CartDrawer = {
        init,
        open,
        close,
        toggle,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getCart,
        getTotal,
        getItemCount,
        updateCartBadge
    };

})(window);
