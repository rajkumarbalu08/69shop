/**
 * 69Shop.in Email Service
 * Handles sending order confirmations, invoices, and notifications
 * 
 * Setup Instructions:
 * 1. Create an account at https://www.emailjs.com/
 * 2. Create a new email service (Gmail recommended)
 * 3. Create email templates with the following IDs:
 *    - order_confirmation: For order confirmations
 *    - invoice: For invoice emails
 *    - order_shipped: For shipping notifications
 *    - order_status: For status updates
 *    - order_delivered: For delivery confirmation
 * 4. Update the configuration below with your credentials
 */

const EmailService = {
    // EmailJS Configuration - Update these with your credentials
    config: {
        publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',      // Get from EmailJS dashboard
        serviceId: 'YOUR_SERVICE_ID',               // Your email service ID
        templates: {
            orderConfirmation: 'order_confirmation',
            invoice: 'invoice',
            orderShipped: 'order_shipped',
            orderStatus: 'order_status',
            orderDelivered: 'order_delivered',
            orderOutForDelivery: 'order_out_delivery',
            sellerNotification: 'seller_notification',
            welcomeEmail: 'welcome_email',
            leadCapture: 'lead_capture'
        },
        
        // Email content templates (fallback if EmailJS not configured)
        contentTemplates: {
            orderConfirmation: {
                subject: 'Order Confirmed! Your 69Shop.in Order #{order_id}',
                preview: 'Thank you for your order. We\'re getting it ready!'
            },
            orderShipped: {
                subject: 'Your Order is on the Way! 🚚 #{order_id}',
                preview: 'Great news! Your order has been shipped.'
            },
            orderDelivered: {
                subject: 'Delivered! ✅ Your Order #{order_id}',
                preview: 'Your order has been delivered. Enjoy!'
            },
            orderOutForDelivery: {
                subject: 'Out for Delivery Today! 📦 #{order_id}',
                preview: 'Your order will arrive today.'
            }
        }
    },

    // Track sent emails to avoid duplicates
    sentEmails: new Set(),

    // Initialize EmailJS
    init() {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(this.config.publicKey);
            console.log('✅ EmailJS initialized');
            return true;
        } else {
            console.warn('⚠️ EmailJS library not loaded. Add the script tag first.');
            return false;
        }
    },

    /**
     * Check if email was already sent
     */
    isDuplicate(orderId, emailType) {
        const key = `${orderId}_${emailType}`;
        if (this.sentEmails.has(key)) {
            console.log(`📧 Skipping duplicate email: ${key}`);
            return true;
        }
        this.sentEmails.add(key);
        return false;
    },

    /**
     * Send Order Confirmation Email
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details
     */
    async sendOrderConfirmation(order, customer) {
        if (this.isDuplicate(order.id, 'confirmation')) return { success: true, skipped: true };
        
        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            order_id: order.id,
            order_date: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            order_items: this.formatOrderItems(order.items),
            items_html: this.generateOrderItemsHTML(order.items),
            subtotal: `₹${order.subtotal.toLocaleString('en-IN')}`,
            shipping: order.shipping > 0 ? `₹${order.shipping.toLocaleString('en-IN')}` : 'FREE',
            total: `₹${order.total.toLocaleString('en-IN')}`,
            shipping_address: this.formatAddress(order.shippingAddress),
            payment_method: order.paymentMethod,
            estimated_delivery: order.estimatedDelivery || '3-5 business days',
            tracking_url: `https://69shop.in/order-tracking.html?order=${order.id}`,
            shop_url: 'https://69shop.in/shop.html'
        };

        return await this.sendEmail(this.config.templates.orderConfirmation, templateParams);
    },

    /**
     * Send Invoice Email
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details  
     */
    async sendInvoice(order, customer) {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, '0')}`;
        
        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            invoice_number: invoiceNumber,
            invoice_date: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            order_id: order.id,
            items_html: this.generateInvoiceItemsHTML(order.items),
            subtotal: `₹${order.subtotal.toLocaleString('en-IN')}`,
            tax: `₹${(order.tax || 0).toLocaleString('en-IN')}`,
            shipping: `₹${order.shipping.toLocaleString('en-IN')}`,
            total: `₹${order.total.toLocaleString('en-IN')}`,
            billing_address: this.formatAddress(order.billingAddress || order.shippingAddress),
            payment_status: 'Paid',
            payment_method: order.paymentMethod
        };

        return await this.sendEmail(this.config.templates.invoice, templateParams);
    },

    /**
     * Send Shipping Notification
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details
     * @param {Object} shipping - Shipping details
     */
    async sendShippingNotification(order, customer, shipping) {
        if (this.isDuplicate(order.id, 'shipped')) return { success: true, skipped: true };
        
        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            order_id: order.id,
            tracking_number: shipping.trackingNumber || 'Not available yet',
            carrier: shipping.carrier || 'Our Delivery Partner',
            tracking_url: shipping.trackingUrl || `https://69shop.in/order-tracking.html?order=${order.id}`,
            estimated_delivery: shipping.estimatedDelivery || '2-3 business days',
            shipping_address: this.formatAddress(order.shippingAddress),
            items_preview: order.items?.slice(0, 3).map(i => i.name).join(', '),
            order_tracking_url: `https://69shop.in/order-tracking.html?order=${order.id}`
        };

        return await this.sendEmail(this.config.templates.orderShipped, templateParams);
    },

    /**
     * Send Out for Delivery Notification
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details
     * @param {Object} delivery - Delivery details
     */
    async sendOutForDeliveryNotification(order, customer, delivery = {}) {
        if (this.isDuplicate(order.id, 'out_for_delivery')) return { success: true, skipped: true };
        
        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            order_id: order.id,
            delivery_time: delivery.estimatedTime || 'by end of day',
            delivery_agent: delivery.agentName || 'Our delivery partner',
            agent_phone: delivery.agentPhone || '',
            tracking_url: `https://69shop.in/order-tracking.html?order=${order.id}`,
            items_count: order.items?.length || 1,
            shipping_address: this.formatAddress(order.shippingAddress)
        };

        return await this.sendEmail(this.config.templates.orderOutForDelivery, templateParams);
    },

    /**
     * Send Delivery Confirmation
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details
     */
    async sendDeliveryConfirmation(order, customer) {
        if (this.isDuplicate(order.id, 'delivered')) return { success: true, skipped: true };
        
        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            order_id: order.id,
            delivered_at: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            items_html: this.generateOrderItemsHTML(order.items),
            total: `₹${order.total.toLocaleString('en-IN')}`,
            review_url: `https://69shop.in/profile.html?tab=orders&review=${order.id}`,
            shop_url: 'https://69shop.in/shop.html',
            support_url: 'https://69shop.in/messages.html'
        };

        return await this.sendEmail(this.config.templates.orderDelivered, templateParams);
    },

    /**
     * Send Order Status Update
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details
     * @param {string} newStatus - New order status
     * @param {string} statusMessage - Optional custom message
     */
    async sendOrderStatusUpdate(order, customer, newStatus, statusMessage = '') {
        const statusLabels = {
            'confirmed': 'Order Confirmed',
            'processing': 'Being Prepared',
            'shipped': 'Shipped',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };

        const statusIcons = {
            'confirmed': '✅',
            'processing': '📦',
            'shipped': '🚚',
            'out_for_delivery': '🏃',
            'delivered': '🎉',
            'cancelled': '❌'
        };

        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            order_id: order.id,
            status_icon: statusIcons[newStatus] || '📋',
            status_label: statusLabels[newStatus] || newStatus,
            status_message: statusMessage || `Your order status has been updated to: ${statusLabels[newStatus]}`,
            order_date: this.formatOrderDate(order.createdAt),
            tracking_url: `https://69shop.in/order-tracking.html?order=${order.id}`,
            items_preview: order.items?.slice(0, 2).map(i => i.name).join(', ')
        };

        return await this.sendEmail(this.config.templates.orderStatus, templateParams);
    },

    /**
     * Send Seller Order Notification
     * @param {Object} order - Order details
     * @param {Object} seller - Seller details
     */
    async sendSellerNotification(order, seller) {
        const templateParams = {
            to_email: seller.email,
            to_name: seller.name || seller.businessName,
            order_id: order.id,
            order_date: new Date().toLocaleDateString('en-IN'),
            customer_name: order.customerName,
            items: this.formatOrderItems(order.items),
            total: `₹${order.total.toLocaleString('en-IN')}`,
            action_url: `https://69shop.in/seller-orders.html?order=${order.id}`
        };

        return await this.sendEmail(this.config.templates.sellerNotification, templateParams);
    },

    /**
     * Send Welcome Email to New Users
     * @param {Object} user - User details
     */
    async sendWelcomeEmail(user) {
        const templateParams = {
            to_email: user.email,
            to_name: user.name || user.email.split('@')[0],
            user_type: user.userType === 'seller' ? 'Seller' : 'Shopper',
            action_url: user.userType === 'seller' 
                ? 'https://69shop.in/seller-dashboard.html'
                : 'https://69shop.in/shop.html'
        };

        return await this.sendEmail(this.config.templates.welcomeEmail, templateParams);
    },

    /**
     * Core email sending function
     */
    async sendEmail(templateId, params) {
        try {
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS not initialized');
            }

            const response = await emailjs.send(
                this.config.serviceId,
                templateId,
                params
            );

            console.log('✅ Email sent successfully:', response.status);
            return { success: true, status: response.status };

        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Format order items for email
     */
    formatOrderItems(items) {
        if (!items || !items.length) return 'No items';
        
        return items.map(item => 
            `${item.name} x ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
        ).join('\n');
    },

    /**
     * Generate HTML for order items (styled)
     */
    generateOrderItemsHTML(items) {
        if (!items || !items.length) return '<p>No items</p>';

        return items.map(item => `
            <div style="display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #E5E7EB;">
                <div style="width: 60px; height: 60px; background: #F3F4F6; border-radius: 8px; overflow: hidden;">
                    <img src="${item.image || 'https://69shop.in/Logo/69shopc.png'}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1A1A1A;">${item.name}</div>
                    ${item.variant ? `<div style="font-size: 13px; color: #666;">Variant: ${item.variant}</div>` : ''}
                    <div style="font-size: 13px; color: #666;">Qty: ${item.quantity}</div>
                </div>
                <div style="font-weight: 600; color: #0066ff;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
            </div>
        `).join('');
    },

    /**
     * Generate HTML for invoice items
     */
    generateInvoiceItemsHTML(items) {
        if (!items || !items.length) return '<tr><td colspan="4">No items</td></tr>';

        return items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${item.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');
    },

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return 'Address not provided';
        
        const parts = [
            address.fullName || address.name,
            address.line1 || address.addressLine1,
            address.line2 || address.addressLine2,
            address.city,
            address.state,
            address.pincode,
            address.country || 'India'
        ].filter(Boolean);

        return parts.join(', ');
    },

    /**
     * Format order date
     */
    formatOrderDate(date) {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
};

/**
 * Order Status Change Handler
 * Call this when order status changes
 */
async function handleOrderStatusChange(order, customer, newStatus, details = {}) {
    console.log(`📧 Processing status change email: ${newStatus}`);
    
    let result;
    
    switch (newStatus) {
        case 'confirmed':
            // Send confirmation if not already sent
            result = await EmailService.sendOrderStatusUpdate(order, customer, newStatus, 
                'Great news! Your order has been confirmed and is being prepared.');
            break;
            
        case 'processing':
            result = await EmailService.sendOrderStatusUpdate(order, customer, newStatus,
                'Your order is being carefully packed and prepared for shipping.');
            break;
            
        case 'shipped':
            result = await EmailService.sendShippingNotification(order, customer, {
                trackingNumber: details.trackingNumber,
                carrier: details.carrier,
                estimatedDelivery: details.estimatedDelivery
            });
            break;
            
        case 'out_for_delivery':
            result = await EmailService.sendOutForDeliveryNotification(order, customer, {
                estimatedTime: details.estimatedTime,
                agentName: details.agentName,
                agentPhone: details.agentPhone
            });
            break;
            
        case 'delivered':
            result = await EmailService.sendDeliveryConfirmation(order, customer);
            break;
            
        case 'cancelled':
            result = await EmailService.sendOrderStatusUpdate(order, customer, newStatus,
                details.reason || 'Your order has been cancelled. Refund will be processed within 5-7 business days.');
            break;
            
        default:
            result = await EmailService.sendOrderStatusUpdate(order, customer, newStatus);
    }
    
    return result;
}

/**
 * Order Completion Handler
 * Call this when a customer completes their purchase
 */
async function handleOrderCompletion(order, customer) {
    console.log('📧 Processing order emails...');
    
    const results = {
        confirmation: null,
        invoice: null,
        sellerNotifications: []
    };
    
    // Send order confirmation
    results.confirmation = await EmailService.sendOrderConfirmation(order, customer);
    
    // Send invoice
    results.invoice = await EmailService.sendInvoice(order, customer);
    
    // Notify seller(s)
    if (order.sellers && order.sellers.length) {
        for (const seller of order.sellers) {
            const sellerResult = await EmailService.sendSellerNotification(order, seller);
            results.sellerNotifications.push(sellerResult);
        }
    }
    
    // Save order to localStorage for tracking (backup)
    saveOrderLocally(order);
    
    return results;
}

/**
 * Save order locally for offline tracking
 */
function saveOrderLocally(order) {
    try {
        const orders = JSON.parse(localStorage.getItem('69shop_orders') || '[]');
        const existingIndex = orders.findIndex(o => o.id === order.id);
        
        if (existingIndex >= 0) {
            orders[existingIndex] = order;
        } else {
            orders.push(order);
        }
        
        // Keep only last 50 orders
        if (orders.length > 50) {
            orders.shift();
        }
        
        localStorage.setItem('69shop_orders', JSON.stringify(orders));
    } catch (error) {
        console.warn('Could not save order locally:', error);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EmailService, handleOrderCompletion, handleOrderStatusChange };
}

// Make available globally
window.EmailService = EmailService;
window.handleOrderCompletion = handleOrderCompletion;
window.handleOrderStatusChange = handleOrderStatusChange;
