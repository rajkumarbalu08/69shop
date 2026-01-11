/**
 * EmailJS Configuration Sample
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://www.emailjs.com/ and create a free account
 * 2. Connect your Gmail or other email service
 * 3. Create email templates for each type (see below)
 * 4. Copy this file to 'emailjs-config.js' (same folder)
 * 5. Replace all placeholder values with your actual credentials
 * 
 * FREE TIER: 200 emails/month
 * PAID PLANS: Higher limits available
 */

// Update email-service.js config section with these values
const EMAILJS_CONFIG = {
    // Your EmailJS Public Key (found in Account > General)
    publicKey: 'YOUR_PUBLIC_KEY_HERE',
    
    // Your Email Service ID (found in Email Services)
    serviceId: 'YOUR_SERVICE_ID_HERE',
    
    // Template IDs (create these in Email Templates)
    templates: {
        // Order confirmation template
        orderConfirmation: 'template_order_confirmation',
        
        // Invoice template
        invoice: 'template_invoice',
        
        // Shipping notification template
        orderShipped: 'template_order_shipped',
        
        // Seller notification template
        sellerNotification: 'template_seller_notification',
        
        // Welcome email template
        welcomeEmail: 'template_welcome'
    }
};

/**
 * ===== EMAIL TEMPLATE SETUP =====
 * 
 * Create each template in EmailJS Dashboard with these variables:
 * 
 * 1. ORDER CONFIRMATION TEMPLATE (template_order_confirmation)
 *    Subject: "Your 69Shop.in Order {{order_id}} is Confirmed! 🎉"
 *    
 *    Variables available:
 *    - {{to_name}} - Customer name
 *    - {{to_email}} - Customer email
 *    - {{order_id}} - Order ID
 *    - {{order_date}} - Order date
 *    - {{order_items}} - List of items
 *    - {{subtotal}} - Subtotal amount
 *    - {{shipping}} - Shipping cost
 *    - {{total}} - Total amount
 *    - {{shipping_address}} - Delivery address
 *    - {{payment_method}} - Payment method
 *    - {{estimated_delivery}} - Delivery estimate
 * 
 * 2. INVOICE TEMPLATE (template_invoice)
 *    Subject: "Invoice {{invoice_number}} - 69Shop.in"
 *    
 *    Variables available:
 *    - {{to_name}} - Customer name
 *    - {{to_email}} - Customer email
 *    - {{invoice_number}} - Invoice number
 *    - {{invoice_date}} - Invoice date
 *    - {{order_id}} - Order ID
 *    - {{items_html}} - HTML table of items
 *    - {{subtotal}} - Subtotal
 *    - {{tax}} - Tax amount
 *    - {{shipping}} - Shipping cost
 *    - {{total}} - Total amount
 *    - {{billing_address}} - Billing address
 *    - {{payment_status}} - Payment status
 *    - {{payment_method}} - Payment method
 * 
 * 3. SHIPPING NOTIFICATION TEMPLATE (template_order_shipped)
 *    Subject: "Your Order {{order_id}} Has Shipped! 📦"
 *    
 *    Variables available:
 *    - {{to_name}} - Customer name
 *    - {{order_id}} - Order ID
 *    - {{tracking_number}} - Tracking number
 *    - {{carrier}} - Shipping carrier
 *    - {{tracking_url}} - Tracking URL
 *    - {{estimated_delivery}} - Estimated delivery
 *    - {{shipping_address}} - Shipping address
 * 
 * 4. SELLER NOTIFICATION TEMPLATE (template_seller_notification)
 *    Subject: "New Order Received! Order #{{order_id}}"
 *    
 *    Variables available:
 *    - {{to_name}} - Seller name
 *    - {{to_email}} - Seller email
 *    - {{order_id}} - Order ID
 *    - {{order_date}} - Order date
 *    - {{customer_name}} - Customer name
 *    - {{items}} - Order items
 *    - {{total}} - Order total
 *    - {{action_url}} - Link to seller dashboard
 * 
 * 5. WELCOME EMAIL TEMPLATE (template_welcome)
 *    Subject: "Welcome to 69Shop.in! 🎊"
 *    
 *    Variables available:
 *    - {{to_name}} - User name
 *    - {{to_email}} - User email
 *    - {{user_type}} - Seller or Shopper
 *    - {{action_url}} - Link to dashboard
 */

// Example HTML template for Order Confirmation:
const SAMPLE_ORDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0066ff, #4d94ff); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .total-row { font-weight: bold; font-size: 1.1em; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        .btn { display: inline-block; background: #0066ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmed! 🎉</h1>
            <p>Thank you for shopping with 69Shop.in</p>
        </div>
        <div class="content">
            <p>Hi {{to_name}},</p>
            <p>Great news! Your order has been confirmed and is being processed.</p>
            
            <div class="order-info">
                <p><strong>Order ID:</strong> {{order_id}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
            </div>
            
            <h3>Order Summary</h3>
            <p>{{order_items}}</p>
            
            <table class="items-table">
                <tr><td>Subtotal</td><td style="text-align:right">{{subtotal}}</td></tr>
                <tr><td>Shipping</td><td style="text-align:right">{{shipping}}</td></tr>
                <tr class="total-row"><td>Total</td><td style="text-align:right">{{total}}</td></tr>
            </table>
            
            <h3>Shipping Address</h3>
            <p>{{shipping_address}}</p>
            
            <p><strong>Payment Method:</strong> {{payment_method}}</p>
            
            <p style="text-align:center; margin-top:30px;">
                <a href="https://69shop.in/shop.html" class="btn">Continue Shopping</a>
            </p>
        </div>
        <div class="footer">
            <p>Questions? Contact us at support@69shop.in</p>
            <p>© 2024 69Shop.in - Premium Marketplace</p>
        </div>
    </div>
</body>
</html>
`;

// Export for reference
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EMAILJS_CONFIG, SAMPLE_ORDER_TEMPLATE };
}
