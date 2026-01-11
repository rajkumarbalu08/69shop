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
            sellerNotification: 'seller_notification',
            welcomeEmail: 'welcome_email'
        }
    },

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
     * Send Order Confirmation Email
     * @param {Object} order - Order details
     * @param {Object} customer - Customer details
     */
    async sendOrderConfirmation(order, customer) {
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
            subtotal: `₹${order.subtotal.toLocaleString('en-IN')}`,
            shipping: `₹${order.shipping.toLocaleString('en-IN')}`,
            total: `₹${order.total.toLocaleString('en-IN')}`,
            shipping_address: this.formatAddress(order.shippingAddress),
            payment_method: order.paymentMethod,
            estimated_delivery: order.estimatedDelivery || '3-5 business days'
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
        const templateParams = {
            to_email: customer.email,
            to_name: customer.name,
            order_id: order.id,
            tracking_number: shipping.trackingNumber,
            carrier: shipping.carrier,
            tracking_url: shipping.trackingUrl || '#',
            estimated_delivery: shipping.estimatedDelivery,
            shipping_address: this.formatAddress(order.shippingAddress)
        };

        return await this.sendEmail(this.config.templates.orderShipped, templateParams);
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
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.pincode,
            address.country || 'India'
        ].filter(Boolean);

        return parts.join(', ');
    }
};

/**
 * Order Completion Handler
 * Call this when a customer completes their purchase
 */
async function handleOrderCompletion(order, customer) {
    console.log('📧 Processing order emails...');
    
    // Send order confirmation
    const confirmationResult = await EmailService.sendOrderConfirmation(order, customer);
    
    // Send invoice
    const invoiceResult = await EmailService.sendInvoice(order, customer);
    
    // Notify seller(s)
    if (order.sellers && order.sellers.length) {
        for (const seller of order.sellers) {
            await EmailService.sendSellerNotification(order, seller);
        }
    }
    
    return {
        confirmation: confirmationResult,
        invoice: invoiceResult
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EmailService, handleOrderCompletion };
}

// Make available globally
window.EmailService = EmailService;
window.handleOrderCompletion = handleOrderCompletion;
