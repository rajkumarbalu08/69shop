class CheckoutManager {
    constructor(productManager) {
        this.productManager = productManager;
        this.checkoutOverlay = document.getElementById('checkoutOverlay');
        this.checkoutPanel = document.getElementById('checkoutPanel');
        this.closeCheckoutBtn = document.getElementById('closeCheckout');
        this.checkoutItemsList = document.getElementById('checkoutItemsList');
        this.checkoutItemsCount = document.getElementById('checkoutItemsCount');
        this.checkoutSubtotal = document.getElementById('checkoutSubtotal');
        this.checkoutShipping = document.getElementById('checkoutShipping');
        this.checkoutGrandTotal = document.getElementById('checkoutGrandTotal');
        this.deliveryDateEl = document.getElementById('checkoutDeliveryDate');
        this.checkoutForm = document.getElementById('checkoutForm');
        this.checkoutMessage = document.getElementById('checkoutMessage');
        this.placeOrderBtn = document.getElementById('placeOrderBtn');
        this.storageKey = '69shop_checkout_profile';
        this.shippingThreshold = 2000;
        this.defaultShippingFee = 79;
        this.formSaveTimeout = null;
        this.defaultButtonLabel = this.placeOrderBtn ? this.placeOrderBtn.innerHTML : '';
        this.isGuestMode = false;
        
        // Coupon state
        this.appliedCoupon = null;
        this.discountAmount = 0;
        this.couponInput = document.getElementById('couponCode');
        this.couponError = document.getElementById('couponError');
        this.couponApplied = document.getElementById('couponApplied');
        this.discountRow = document.getElementById('discountRow');
        this.checkoutDiscount = document.getElementById('checkoutDiscount');
        
        // Demo coupons (in production, these would come from Firestore)
        this.demoCoupons = {
            'WELCOME10': { type: 'percent', value: 10, minOrder: 500, maxDiscount: 200, description: '10% off' },
            'FLAT100': { type: 'flat', value: 100, minOrder: 999, description: '₹100 off' },
            'FIRST50': { type: 'percent', value: 50, minOrder: 1000, maxDiscount: 500, description: '50% off up to ₹500' },
            'FREESHIP': { type: 'freeship', value: 0, minOrder: 0, description: 'Free shipping' },
            'SAVE200': { type: 'flat', value: 200, minOrder: 1500, description: '₹200 off' }
        };
        
        this.initializeEvents();
    }

    // Set guest checkout mode - shows/hides appropriate UI elements
    setGuestMode(isGuest) {
        this.isGuestMode = isGuest;
        
        // Show/hide guest checkout UI elements
        const guestBanner = document.getElementById('guestCheckoutBanner');
        const guestEmailGroup = document.getElementById('guestEmailGroup');
        const emailInput = document.getElementById('checkoutEmail');
        
        if (guestBanner) {
            guestBanner.style.display = isGuest ? 'block' : 'none';
        }
        if (guestEmailGroup) {
            guestEmailGroup.style.display = isGuest ? 'block' : 'none';
        }
        if (emailInput) {
            emailInput.required = isGuest;
        }
    }

    initializeEvents() {
        if (this.closeCheckoutBtn) {
            this.closeCheckoutBtn.addEventListener('click', () => this.close());
        }
        if (this.checkoutOverlay) {
            this.checkoutOverlay.addEventListener('click', () => this.close());
        }
        if (this.placeOrderBtn) {
            this.placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }
        if (this.checkoutForm) {
            this.checkoutForm.addEventListener('input', () => this.handleFormInput());
        }
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    open() {
        if (!this.productManager || this.productManager.cart.length === 0) {
            uiManager?.showNotification('Your cart is empty!', 'error');
            return;
        }
        this.renderSummary();
        this.loadFormData();
        this.prefillFromProfile();
        this.loadSavedAddresses();
        this.clearMessage();
        this.togglePanel(true);
    }

    close() {
        this.togglePanel(false);
    }
    
    // =============================================
    // ADDRESS BOOK INTEGRATION
    // =============================================
    
    savedAddresses = [];
    selectedAddressId = null;
    
    async loadSavedAddresses() {
        const addressSection = document.getElementById('savedAddressesSection');
        const addressList = document.getElementById('savedAddressList');
        const user = authManager?.getUserData();
        
        if (!user || !db || this.isGuestMode) {
            if (addressSection) addressSection.style.display = 'none';
            return;
        }
        
        try {
            const snapshot = await db.collection('users').doc(user.uid)
                .collection('addresses').orderBy('isDefault', 'desc').get();
            
            this.savedAddresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (this.savedAddresses.length === 0) {
                if (addressSection) addressSection.style.display = 'none';
                return;
            }
            
            if (addressSection) addressSection.style.display = 'block';
            if (addressList) {
                addressList.innerHTML = this.savedAddresses.map(addr => `
                    <div class="saved-address-card ${addr.isDefault ? 'default' : ''} ${this.selectedAddressId === addr.id ? 'selected' : ''}"
                         onclick="checkoutManager.selectSavedAddress('${addr.id}')">
                        <div class="address-card-header">
                            <span class="address-label">
                                <i class="fas fa-${addr.label === 'home' ? 'home' : addr.label === 'work' ? 'briefcase' : 'map-marker-alt'}"></i>
                                ${addr.label || 'Address'}
                            </span>
                            ${addr.isDefault ? '<span class="default-badge">Default</span>' : ''}
                        </div>
                        <div class="address-card-body">
                            <strong>${addr.name || ''}</strong>
                            <p>${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}</p>
                            <p>${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}</p>
                            <p class="address-phone"><i class="fas fa-phone"></i> ${addr.phone || ''}</p>
                        </div>
                        ${this.selectedAddressId === addr.id ? '<div class="selected-indicator"><i class="fas fa-check-circle"></i></div>' : ''}
                    </div>
                `).join('');
            }
            
            // Auto-select default address if none selected
            if (!this.selectedAddressId && this.savedAddresses.length > 0) {
                const defaultAddr = this.savedAddresses.find(a => a.isDefault) || this.savedAddresses[0];
                this.selectSavedAddress(defaultAddr.id);
            }
            
        } catch (error) {
            console.error('Error loading saved addresses:', error);
            if (addressSection) addressSection.style.display = 'none';
        }
    }
    
    selectSavedAddress(addressId) {
        this.selectedAddressId = addressId;
        const addr = this.savedAddresses.find(a => a.id === addressId);
        
        if (!addr) return;
        
        // Fill form with selected address
        const form = this.checkoutForm;
        if (form) {
            form.querySelector('[name="fullName"]').value = addr.name || '';
            form.querySelector('[name="phone"]').value = addr.phone || '';
            form.querySelector('[name="addressLine1"]').value = addr.line1 || '';
            form.querySelector('[name="addressLine2"]').value = addr.line2 || '';
            form.querySelector('[name="city"]').value = addr.city || '';
            form.querySelector('[name="state"]').value = addr.state || '';
            form.querySelector('[name="postalCode"]').value = addr.pincode || '';
        }
        
        // Update visual selection
        document.querySelectorAll('.saved-address-card').forEach(card => {
            card.classList.remove('selected');
        });
        const selectedCard = document.querySelector(`.saved-address-card[onclick*="${addressId}"]`);
        if (selectedCard) selectedCard.classList.add('selected');
        selectedCard?.querySelector('.selected-indicator')?.remove();
        const indicator = document.createElement('div');
        indicator.className = 'selected-indicator';
        indicator.innerHTML = '<i class="fas fa-check-circle"></i>';
        selectedCard?.appendChild(indicator);
        
        // Hide form fields (already filled)
        if (form) form.style.display = 'none';
        
        this.showNotification(`Using address: ${addr.label || 'Saved Address'}`, 'success');
    }
    
    showNewAddressForm() {
        this.selectedAddressId = null;
        
        // Clear form
        if (this.checkoutForm) {
            this.checkoutForm.reset();
            this.checkoutForm.style.display = 'block';
        }
        
        // Clear selection visuals
        document.querySelectorAll('.saved-address-card').forEach(card => {
            card.classList.remove('selected');
            card.querySelector('.selected-indicator')?.remove();
        });
        
        // Focus on first field
        this.checkoutForm?.querySelector('[name="fullName"]')?.focus();
    }
    
    showNotification(message, type = 'info') {
        this.showMessage(message, type);
    }
    
    // ===== COUPON METHODS =====
    
    async applyCoupon() {
        const code = this.couponInput?.value.trim().toUpperCase();
        if (!code) {
            this.showCouponError('Please enter a coupon code');
            return;
        }
        
        // Show loading state
        const applyBtn = document.getElementById('applyCouponBtn');
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        try {
            const result = await this.validateCoupon(code);
            
            if (result.valid) {
                this.appliedCoupon = { ...result.coupon, code };
                this.showCouponSuccess(code, result.coupon.description);
                this.renderSummary(); // Recalculate totals
            } else {
                this.showCouponError(result.message);
            }
        } catch (error) {
            console.error('Coupon validation error:', error);
            this.showCouponError('Failed to validate coupon. Please try again.');
        } finally {
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.innerHTML = 'Apply';
            }
        }
    }
    
    async validateCoupon(code) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const subtotal = (this.productManager?.cart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Try to get from Firestore first (if available)
        if (typeof db !== 'undefined' && db) {
            try {
                const couponDoc = await db.collection('coupons').doc(code).get();
                if (couponDoc.exists) {
                    const coupon = couponDoc.data();
                    
                    // Check if coupon is active
                    if (!coupon.active) {
                        return { valid: false, message: 'This coupon is no longer active' };
                    }
                    
                    // Check expiry
                    if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
                        return { valid: false, message: 'This coupon has expired' };
                    }
                    
                    // Check minimum order
                    if (coupon.minOrder && subtotal < coupon.minOrder) {
                        return { valid: false, message: `Minimum order of ₹${coupon.minOrder} required` };
                    }
                    
                    // Check usage limit
                    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                        return { valid: false, message: 'This coupon has reached its usage limit' };
                    }
                    
                    return { valid: true, coupon };
                }
            } catch (error) {
                console.log('Firestore coupon lookup failed, using demo coupons:', error);
            }
        }
        
        // Fall back to demo coupons
        const coupon = this.demoCoupons[code];
        if (!coupon) {
            return { valid: false, message: 'Invalid coupon code' };
        }
        
        if (coupon.minOrder && subtotal < coupon.minOrder) {
            return { valid: false, message: `Minimum order of ₹${coupon.minOrder} required` };
        }
        
        return { valid: true, coupon };
    }
    
    removeCoupon() {
        this.appliedCoupon = null;
        this.discountAmount = 0;
        
        // Reset UI
        const wrapper = document.getElementById('couponInputWrapper');
        const applied = document.getElementById('couponApplied');
        if (wrapper) wrapper.style.display = 'flex';
        if (applied) applied.style.display = 'none';
        if (this.couponInput) this.couponInput.value = '';
        if (this.couponError) this.couponError.style.display = 'none';
        
        this.renderSummary(); // Recalculate totals
        this.showNotification('Coupon removed', 'info');
    }
    
    showCouponError(message) {
        if (this.couponError) {
            this.couponError.textContent = message;
            this.couponError.style.display = 'block';
            
            // Auto-hide after 4 seconds
            setTimeout(() => {
                if (this.couponError) this.couponError.style.display = 'none';
            }, 4000);
        }
    }
    
    showCouponSuccess(code, description) {
        const wrapper = document.getElementById('couponInputWrapper');
        const applied = document.getElementById('couponApplied');
        const codeSpan = document.getElementById('appliedCouponCode');
        
        if (wrapper) wrapper.style.display = 'none';
        if (applied) applied.style.display = 'flex';
        if (codeSpan) codeSpan.textContent = `${code} - ${description}`;
        if (this.couponError) this.couponError.style.display = 'none';
        
        this.showNotification(`Coupon "${code}" applied successfully!`, 'success');
    }

    togglePanel(shouldOpen) {
        if (this.checkoutPanel) {
            this.checkoutPanel.classList.toggle('active', shouldOpen);
            this.checkoutPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        }
        if (this.checkoutOverlay) {
            this.checkoutOverlay.classList.toggle('active', shouldOpen);
        }
        document.body.style.overflow = shouldOpen ? 'hidden' : '';
    }

    renderSummary() {
        if (!this.checkoutItemsList) return;
        const cart = this.productManager?.cart || [];

        if (cart.length === 0) {
            this.checkoutItemsList.innerHTML = `
                <div class="checkout-empty">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Your cart is empty. Add products to continue.</p>
                </div>
            `;
            this.setButtonDisabled(true);
            return;
        }

        const fallbackImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=200&q=60';

        this.checkoutItemsList.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <div class="checkout-item-image">
                    <img src="${item.image || fallbackImage}" alt="${item.name}">
                </div>
                <div class="checkout-item-info">
                    <p class="checkout-item-name">${item.name}</p>
                    <p class="checkout-item-meta">Qty: ${item.quantity}</p>
                </div>
                <div class="checkout-item-price">${this.formatCurrency(item.price * item.quantity)}</div>
            </div>
        `).join('');

        const totals = this.calculateTotals();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (this.checkoutItemsCount) {
            this.checkoutItemsCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
        }
        if (this.checkoutSubtotal) {
            this.checkoutSubtotal.textContent = this.formatCurrency(totals.subtotal);
        }
        if (this.checkoutShipping) {
            this.checkoutShipping.textContent = totals.shipping === 0 ? 'Free' : this.formatCurrency(totals.shipping);
        }
        
        // Update discount display
        if (this.discountRow && this.checkoutDiscount) {
            if (totals.discount > 0) {
                this.discountRow.style.display = 'flex';
                this.checkoutDiscount.textContent = `-${this.formatCurrency(totals.discount)}`;
            } else {
                this.discountRow.style.display = 'none';
            }
        }
        
        if (this.checkoutGrandTotal) {
            this.checkoutGrandTotal.textContent = this.formatCurrency(totals.total);
        }

        this.updateDeliveryEstimate();
        this.setButtonDisabled(false);
    }

    calculateTotals() {
        const subtotal = (this.productManager?.cart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shipping = subtotal === 0 || subtotal >= this.shippingThreshold ? 0 : this.defaultShippingFee;
        
        // Apply coupon discount
        let discount = 0;
        if (this.appliedCoupon) {
            const coupon = this.appliedCoupon;
            if (coupon.type === 'percent') {
                discount = Math.round(subtotal * (coupon.value / 100));
                if (coupon.maxDiscount) {
                    discount = Math.min(discount, coupon.maxDiscount);
                }
            } else if (coupon.type === 'flat') {
                discount = coupon.value;
            } else if (coupon.type === 'freeship') {
                shipping = 0;
            }
        }
        
        this.discountAmount = discount;
        
        return {
            subtotal,
            shipping,
            discount,
            total: Math.max(0, subtotal + shipping - discount)
        };
    }

    formatCurrency(value) {
        return `₹${(value || 0).toLocaleString()}`;
    }

    updateDeliveryEstimate() {
        if (!this.deliveryDateEl) return;
        const start = new Date();
        const end = new Date();
        start.setDate(start.getDate() + 2);
        end.setDate(end.getDate() + 5);
        this.deliveryDateEl.textContent = `${this.formatDate(start)} - ${this.formatDate(end)}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    handleFormInput() {
        if (this.checkoutMessage?.classList.contains('error')) {
            this.clearMessage();
        }
        if (this.formSaveTimeout) {
            clearTimeout(this.formSaveTimeout);
        }
        this.formSaveTimeout = setTimeout(() => this.saveFormData(), 400);
    }

    setButtonDisabled(isDisabled) {
        if (!this.placeOrderBtn) return;
        this.placeOrderBtn.disabled = isDisabled;
        this.placeOrderBtn.classList.toggle('disabled', isDisabled);
    }

    setButtonLoading(isLoading) {
        if (!this.placeOrderBtn) return;
        if (isLoading) {
            this.placeOrderBtn.disabled = true;
            this.placeOrderBtn.classList.add('loading');
            this.placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            this.placeOrderBtn.disabled = false;
            this.placeOrderBtn.classList.remove('loading');
            this.placeOrderBtn.innerHTML = this.defaultButtonLabel || '<i class="fas fa-lock"></i> Place Secure Order';
        }
    }

    placeOrder() {
        if (!this.checkoutForm) return;
        const formData = new FormData(this.checkoutForm);
        const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
        
        // For guest checkout, email is required
        if (this.isGuestMode) {
            requiredFields.unshift('email');
            const emailField = document.getElementById('checkoutEmail');
            if (emailField && emailField.value) {
                // Basic email validation
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(emailField.value)) {
                    this.showMessage('Please enter a valid email address.', 'error');
                    emailField.focus();
                    return;
                }
            }
        }
        
        const missingField = requiredFields.find((field) => !formData.get(field) || !formData.get(field).trim());

        if (missingField) {
            this.showMessage('Please complete all required shipping details.', 'error');
            const field = this.checkoutForm.querySelector(`[name="${missingField}"]`);
            field?.focus();
            return;
        }

        // Payment options are outside the form, so query from document
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethod) {
            this.showMessage('Select a payment method to continue.', 'error');
            return;
        }

        if (!this.productManager || this.productManager.cart.length === 0) {
            this.showMessage('Your cart is empty. Add products to continue.', 'error');
            return;
        }

        // Validate stock availability before checkout
        this.validateStockAvailability().then(stockValid => {
            if (!stockValid) return;
            
            this.saveFormData();
            const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
            
            // Build order data for email
            const orderData = this.buildOrderData(orderId, formData, paymentMethod.value);
            const customerData = this.buildCustomerData(formData);
            
            // Handle online payments via Razorpay
            if (['upi', 'card', 'netbanking'].includes(paymentMethod.value)) {
                this.initiateRazorpayPayment(orderId, orderData, customerData, paymentMethod.value);
                return;
            }
            
            // COD - process directly
            this.showMessage('Confirming your order...', 'info');
            this.setButtonLoading(true);

            // Process order and send emails
            this.processOrderWithEmail(orderId, orderData, customerData);
        });
    }
    
    // Validate stock availability before checkout
    async validateStockAvailability() {
        const cart = this.productManager?.cart || [];
        if (cart.length === 0) return true;
        
        const outOfStockItems = [];
        const reducedItems = [];
        
        for (const item of cart) {
            try {
                // Check real-time stock from Firestore
                if (typeof db !== 'undefined') {
                    const productDoc = await db.collection('products').doc(item.id).get();
                    if (productDoc.exists) {
                        const product = productDoc.data();
                        const availableStock = product.stock ?? product.quantity ?? 0;
                        
                        if (availableStock === 0) {
                            outOfStockItems.push(item.name);
                        } else if (availableStock < item.quantity) {
                            reducedItems.push({ ...item, availableStock });
                        }
                    }
                }
            } catch (error) {
                console.warn('Stock check failed for', item.id, error);
            }
        }
        
        // Handle out of stock items
        if (outOfStockItems.length > 0) {
            this.showMessage(`Sorry, these items are out of stock: ${outOfStockItems.join(', ')}. Please remove them from your cart.`, 'error');
            return false;
        }
        
        // Handle reduced quantity items
        if (reducedItems.length > 0) {
            const itemNames = reducedItems.map(i => `${i.name} (only ${i.availableStock} available)`).join(', ');
            this.showMessage(`Stock reduced for: ${itemNames}. Cart quantities have been adjusted.`, 'warning');
            
            // Auto-adjust cart quantities
            reducedItems.forEach(item => {
                this.productManager.updateCartQuantity(item.id, item.availableStock);
            });
            return false;
        }
        
        return true;
    }
    
    // Initiate Razorpay payment for online methods
    initiateRazorpayPayment(orderId, orderData, customerData, method) {
        const self = this;
        const config = window.razorpayConfig || {};
        
        // Demo mode - simulate payment flow
        if (config.demo_mode === true || !config.key_id || config.key_id.includes('DEMO')) {
            this.showDemoPaymentModal(orderId, orderData, customerData, method);
            return;
        }
        
        // Check if Razorpay is loaded
        if (typeof Razorpay === 'undefined') {
            this.showMessage('Payment gateway is loading. Please try again in a moment.', 'error');
            // Try loading Razorpay dynamically
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => this.initiateRazorpayPayment(orderId, orderData, customerData, method);
            document.head.appendChild(script);
            return;
        }
        
        // Amount in paise (INR smallest unit)
        const amountInPaise = Math.round(orderData.total * 100);
        
        const options = {
            key: config.key_id,
            amount: amountInPaise,
            currency: 'INR',
            name: config.business?.name || '69Shop.in',
            description: `Order ${orderId}`,
            image: config.business?.logo || '/Logo/69shopc.png',
            prefill: {
                name: customerData.name,
                email: customerData.email || '',
                contact: customerData.phone ? customerData.phone.replace(/[^0-9]/g, '') : ''
            },
            notes: {
                order_id: orderId,
                items_count: orderData.items.length
            },
            theme: config.theme || {
                color: '#0066ff',
                backdrop_color: 'rgba(0, 0, 0, 0.8)'
            },
            retry: config.checkout?.retry !== false,
            modal: {
                ondismiss: function() {
                    self.showMessage('Payment cancelled. Your order was not placed.', 'error');
                    self.setButtonLoading(false);
                },
                confirm_close: true,
                escape: false
            },
            handler: function(response) {
                // Payment successful
                orderData.paymentId = response.razorpay_payment_id;
                orderData.razorpayOrderId = response.razorpay_order_id || null;
                orderData.razorpaySignature = response.razorpay_signature || null;
                orderData.paymentStatus = 'paid';
                orderData.paymentMethod = self.getPaymentMethodLabel(method);
                
                self.showMessage('Payment successful! Confirming order...', 'info');
                self.setButtonLoading(true);
                self.processOrderWithEmail(orderId, orderData, customerData);
            }
        };
        
        // Set preferred payment method for better UX
        const methodConfig = {
            upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
            card: { name: 'Pay with Card', instruments: [{ method: 'card' }] },
            netbanking: { name: 'Net Banking', instruments: [{ method: 'netbanking' }] }
        };
        
        if (methodConfig[method]) {
            options.config = {
                display: {
                    blocks: { [method]: methodConfig[method] },
                    sequence: [`block.${method}`],
                    preferences: { show_default_blocks: true }
                }
            };
        }
        
        try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
                console.error('Payment failed:', response.error);
                self.showMessage(`Payment failed: ${response.error.description || 'Please try again'}`, 'error');
                self.setButtonLoading(false);
            });
            rzp.open();
        } catch (error) {
            console.error('Razorpay initialization error:', error);
            // Fallback to demo mode
            this.showDemoPaymentModal(orderId, orderData, customerData, method);
        }
    }
    
    // Demo payment modal for testing without real Razorpay credentials
    showDemoPaymentModal(orderId, orderData, customerData, method) {
        const self = this;
        const methodLabels = {
            'upi': { icon: 'fa-mobile-alt', name: 'UPI Payment', hint: 'Enter any UPI ID (e.g., demo@upi)' },
            'card': { icon: 'fa-credit-card', name: 'Card Payment', hint: 'Enter any 16-digit number' },
            'netbanking': { icon: 'fa-university', name: 'Net Banking', hint: 'Select any bank' }
        };
        const methodInfo = methodLabels[method] || methodLabels['card'];
        
        // Create demo payment modal
        const modal = document.createElement('div');
        modal.className = 'demo-payment-modal';
        modal.innerHTML = `
            <div class="demo-payment-overlay"></div>
            <div class="demo-payment-container">
                <div class="demo-payment-header">
                    <div class="demo-payment-logo">
                        <img src="/Logo/69shopc.png" alt="69Shop.in" onerror="this.style.display='none'">
                        <span>69Shop.in</span>
                    </div>
                    <button class="demo-payment-close" onclick="this.closest('.demo-payment-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="demo-payment-amount">
                    <span class="label">Amount to Pay</span>
                    <span class="amount">₹${orderData.total.toLocaleString('en-IN')}</span>
                </div>
                
                <div class="demo-payment-method">
                    <i class="fas ${methodInfo.icon}"></i>
                    <span>${methodInfo.name}</span>
                </div>
                
                <div class="demo-payment-form">
                    ${method === 'upi' ? `
                        <div class="form-group">
                            <label>UPI ID</label>
                            <input type="text" id="demoUpiId" placeholder="yourname@upi" value="demo@ybl">
                        </div>
                    ` : method === 'card' ? `
                        <div class="form-group">
                            <label>Card Number</label>
                            <input type="text" id="demoCardNumber" placeholder="1234 5678 9012 3456" value="4111 1111 1111 1111" maxlength="19">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Expiry</label>
                                <input type="text" id="demoExpiry" placeholder="MM/YY" value="12/28" maxlength="5">
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="password" id="demoCvv" placeholder="123" value="123" maxlength="3">
                            </div>
                        </div>
                    ` : `
                        <div class="form-group">
                            <label>Select Bank</label>
                            <select id="demoBank">
                                <option value="sbi">State Bank of India</option>
                                <option value="hdfc">HDFC Bank</option>
                                <option value="icici">ICICI Bank</option>
                                <option value="axis">Axis Bank</option>
                                <option value="kotak">Kotak Mahindra Bank</option>
                            </select>
                        </div>
                    `}
                </div>
                
                <div class="demo-payment-notice">
                    <i class="fas fa-info-circle"></i>
                    <span>Demo Mode: No real payment will be processed</span>
                </div>
                
                <button class="demo-payment-btn" id="demoPayBtn">
                    <i class="fas fa-lock"></i>
                    Pay ₹${orderData.total.toLocaleString('en-IN')}
                </button>
                
                <div class="demo-payment-footer">
                    <i class="fas fa-shield-alt"></i>
                    Secured by 69Shop.in
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .demo-payment-modal { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; }
            .demo-payment-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); }
            .demo-payment-container { position: relative; background: #fff; border-radius: 16px; width: 100%; max-width: 400px; margin: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); overflow: hidden; animation: slideUp 0.3s ease; }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .demo-payment-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: linear-gradient(135deg, #0066ff, #0052cc); color: #fff; }
            .demo-payment-logo { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 1.1rem; }
            .demo-payment-logo img { width: 32px; height: 32px; object-fit: contain; }
            .demo-payment-close { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .demo-payment-close:hover { background: rgba(255,255,255,0.3); }
            .demo-payment-amount { text-align: center; padding: 24px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
            .demo-payment-amount .label { display: block; color: #666; font-size: 0.85rem; margin-bottom: 4px; }
            .demo-payment-amount .amount { font-size: 2rem; font-weight: 700; color: #1a1a1a; }
            .demo-payment-method { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: #e6f2ff; color: #0066ff; font-weight: 600; }
            .demo-payment-form { padding: 20px; }
            .demo-payment-form .form-group { margin-bottom: 16px; }
            .demo-payment-form label { display: block; font-size: 0.85rem; font-weight: 500; color: #333; margin-bottom: 6px; }
            .demo-payment-form input, .demo-payment-form select { width: 100%; padding: 12px 14px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; }
            .demo-payment-form input:focus, .demo-payment-form select:focus { outline: none; border-color: #0066ff; }
            .demo-payment-form .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .demo-payment-notice { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #fff3cd; color: #856404; font-size: 0.85rem; }
            .demo-payment-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: calc(100% - 40px); margin: 20px; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
            .demo-payment-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
            .demo-payment-btn.processing { background: #6b7280; pointer-events: none; }
            .demo-payment-footer { text-align: center; padding: 16px; color: #999; font-size: 0.8rem; border-top: 1px solid #e9ecef; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Handle payment button click
        document.getElementById('demoPayBtn').addEventListener('click', function() {
            const btn = this;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.classList.add('processing');
            
            // Simulate payment processing
            setTimeout(() => {
                // Generate demo payment ID
                const demoPaymentId = 'pay_DEMO_' + Date.now().toString(36).toUpperCase();
                
                orderData.paymentId = demoPaymentId;
                orderData.paymentStatus = 'paid';
                orderData.paymentMethod = self.getPaymentMethodLabel(method);
                orderData.isDemo = true;
                
                modal.remove();
                self.showMessage('Payment successful! Confirming order...', 'success');
                self.setButtonLoading(true);
                self.processOrderWithEmail(orderId, orderData, customerData);
            }, 2000);
        });
        
        // Close on overlay click
        modal.querySelector('.demo-payment-overlay').addEventListener('click', () => {
            modal.remove();
            self.showMessage('Payment cancelled.', 'error');
        });
    }
    

    // Get readable payment method label
    getPaymentMethodLabel(method) {
        const labels = {
            'cod': 'Cash on Delivery',
            'upi': 'UPI Payment',
            'card': 'Card Payment',
            'netbanking': 'Net Banking'
        };
        return labels[method] || method;
    }

    // Build order data object from cart and form
    buildOrderData(orderId, formData, paymentMethod) {
        const cart = this.productManager.cart;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shipping = subtotal >= 999 ? 0 : 99;
        const tax = Math.round(subtotal * 0.18); // 18% GST
        
        // Apply coupon discount if present
        let discount = 0;
        let couponCode = null;
        if (this.appliedCoupon) {
            const coupon = this.appliedCoupon;
            couponCode = coupon.code;
            if (coupon.type === 'percent') {
                discount = Math.round(subtotal * (coupon.value / 100));
                if (coupon.maxDiscount) {
                    discount = Math.min(discount, coupon.maxDiscount);
                }
            } else if (coupon.type === 'flat') {
                discount = coupon.value;
            } else if (coupon.type === 'freeship') {
                shipping = 0;
            }
        }
        
        const total = Math.max(0, subtotal + shipping - discount);

        // Calculate estimated delivery (3-5 business days)
        const deliveryStart = new Date();
        deliveryStart.setDate(deliveryStart.getDate() + 3);
        const deliveryEnd = new Date();
        deliveryEnd.setDate(deliveryEnd.getDate() + 5);
        const formatDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        return {
            id: orderId,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                variant: item.variant || null,
                sellerId: item.sellerId || null,
                productId: item.id,
                isNegotiated: item.isNegotiated || false,
                originalPrice: item.originalPrice || item.price,
                negotiationId: item.negotiationId || null
            })),
            // Get unique seller IDs from cart items for order association
            sellerIds: [...new Set(cart.map(item => item.sellerId).filter(Boolean))],
            // Primary sellerId for single-seller orders (backward compatibility)
            sellerId: cart.length > 0 ? (cart[0].sellerId || null) : null,
            subtotal,
            shipping,
            tax,
            discount,
            couponCode,
            total,
            paymentMethod: this.getPaymentMethodLabel(paymentMethod),
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            estimatedDelivery: `${formatDate(deliveryStart)} - ${formatDate(deliveryEnd)}`,
            shippingAddress: {
                line1: formData.get('addressLine1'),
                line2: formData.get('addressLine2') || '',
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('postalCode'),
                country: 'India'
            },
            customerName: formData.get('fullName')
        };
    }

    // Build customer data from form
    buildCustomerData(formData) {
        const user = authManager?.user;
        let email = user?.email || '';
        
        // For guest checkout, get email from the form
        if (this.isGuestMode) {
            const guestEmail = formData.get('email') || document.getElementById('checkoutEmail')?.value;
            email = guestEmail || '';
        }
        
        return {
            name: formData.get('fullName'),
            email: email,
            phone: formData.get('phone'),
            isGuest: this.isGuestMode
        };
    }

    // Process order with email notifications
    async processOrderWithEmail(orderId, orderData, customerData) {
        try {
            // Save order to Firestore if available
            if (window.firebaseReady && db) {
                const orderDoc = {
                    ...orderData,
                    customerEmail: customerData.email,
                    customerPhone: customerData.phone,
                    customerName: customerData.name,
                    isGuestOrder: customerData.isGuest || false,
                    status: 'confirmed',
                    statusHistory: [{
                        status: 'confirmed',
                        timestamp: new Date().toISOString(),
                        updatedBy: 'system'
                    }],
                    statusTimestamps: {
                        confirmed: new Date().toISOString()
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add userId for logged-in users, use email/phone hash for guests
                if (authManager?.user) {
                    orderDoc.userId = authManager.user.uid;
                } else if (customerData.email) {
                    // For guest orders, we use email as identifier for tracking
                    orderDoc.guestIdentifier = customerData.email;
                }
                
                await db.collection('orders').doc(orderId).set(orderDoc);
            }

            // Send email notifications if customer has email
            if (customerData.email && window.EmailService) {
                // Initialize EmailJS if not already done
                EmailService.init();
                
                // Send order confirmation and invoice
                const emailResult = await handleOrderCompletion(orderData, customerData);
                console.log('📧 Email notifications sent:', emailResult);
            }

            // Clear cart and show success
            this.productManager.cart = [];
            this.productManager.saveCartToStorage();
            this.productManager.updateCartDisplay();
            this.setButtonLoading(false);
            
            const emailNote = customerData.email ? ' A confirmation email is on the way.' : '';
            this.showMessage(`Order ${orderId} confirmed!${emailNote}`, 'success');
            uiManager?.showNotification('Order placed successfully!' + (customerData.email ? ' Check your email for details.' : ''));

            setTimeout(() => {
                this.close();
            }, 1500);

        } catch (error) {
            console.error('Order processing error:', error);
            // Still complete the order even if email fails
            this.productManager.cart = [];
            this.productManager.saveCartToStorage();
            this.productManager.updateCartDisplay();
            this.setButtonLoading(false);
            this.showMessage(`Order ${orderId} confirmed! (Email notification may be delayed)`, 'success');
            
            setTimeout(() => {
                this.close();
            }, 1500);
        }
    }

    showMessage(message, type = 'info') {
        if (!this.checkoutMessage) return;
        this.checkoutMessage.textContent = message;
        this.checkoutMessage.className = `checkout-message ${type}`;
    }

    clearMessage() {
        if (!this.checkoutMessage) return;
        this.checkoutMessage.textContent = '';
        this.checkoutMessage.className = 'checkout-message';
    }

    loadFormData() {
        if (!this.checkoutForm) return;
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return;
            const values = JSON.parse(stored);
            Object.entries(values).forEach(([name, value]) => {
                const field = this.checkoutForm.querySelector(`[name="${name}"]`);
                if (field) {
                    field.value = value;
                }
            });
        } catch (error) {
            console.warn('Unable to load checkout preferences', error);
        }
    }

    saveFormData() {
        if (!this.checkoutForm) return;
        const fields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'instructions'];
        const payload = {};

        fields.forEach((name) => {
            const field = this.checkoutForm.querySelector(`[name="${name}"]`);
            if (field) {
                payload[name] = field.value;
            }
        });

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch (error) {
            console.warn('Unable to save checkout preferences', error);
        }
    }

    prefillFromProfile() {
        if (!authManager || !this.checkoutForm) return;
        const userData = authManager.getUserData?.();
        if (!userData) return;

        const nameField = this.checkoutForm.querySelector('[name="fullName"]');
        if (nameField && !nameField.value) {
            nameField.value = userData.name || '';
        }

        const phoneField = this.checkoutForm.querySelector('[name="phone"]');
        const possiblePhone = userData.phone || userData.phoneNumber;
        if (phoneField && !phoneField.value && possiblePhone) {
            phoneField.value = possiblePhone;
        }
    }

    isOpen() {
        return this.checkoutPanel?.classList.contains('active');
    }

    syncWithCart() {
        if (!this.isOpen()) return;
        if (!this.productManager || this.productManager.cart.length === 0) {
            this.renderSummary();
            this.showMessage('Your cart is empty. Continue shopping to place an order.', 'error');
            this.setButtonDisabled(true);
        } else {
            this.renderSummary();
        }
    }
}
