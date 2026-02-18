const path = require('path');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { resolveMailConfig } = require('./utils/secretVault');

admin.initializeApp();
const FieldValue = admin.firestore.FieldValue;

const REGION = 'asia-south1';
const MAIL_SECRETS_PATH = path.join(__dirname, 'secrets', 'mail.config.enc.json');
let cachedTransporter = null;

function normalizeEmail(value) {
    return (value || '').toString().trim().toLowerCase();
}

function collectAdminAliases(data = {}, adminId) {
    const aliases = new Set();
    [data.originalEmail, data.email, adminId]
        .filter(Boolean)
        .forEach((alias) => aliases.add(alias));
    (Array.isArray(data.aliases) ? data.aliases : [])
        .filter(Boolean)
        .forEach((alias) => aliases.add(alias));
    return Array.from(aliases);
}

async function normalizeAdminSnapshot(snapshot, context) {
    const adminId = context.params.adminId;
    const data = snapshot.data() || {};
    const normalizedId = normalizeEmail(data.email || adminId);

    if (!normalizedId) {
        functions.logger.warn('Skipping admin normalization due to missing email', { adminId });
        return null;
    }

    const aliases = collectAdminAliases(data, adminId);
    const normalizedFields = {
        email: normalizedId,
        originalEmail: data.originalEmail || data.email || adminId,
        aliases,
        normalizedAt: FieldValue.serverTimestamp(),
        normalizedBy: 'ensureAdminDocNormalized'
    };

    if (adminId === normalizedId) {
        const updates = {};
        if (data.email !== normalizedId) {
            updates.email = normalizedId;
        }
        if (!data.originalEmail) {
            updates.originalEmail = normalizedFields.originalEmail;
        }
        const aliasMismatch = !Array.isArray(data.aliases) || data.aliases.length !== aliases.length || data.aliases.some((alias, index) => alias !== aliases[index]);
        if (aliasMismatch && aliases.length) {
            updates.aliases = aliases;
        }
        if (!data.normalizedAt) {
            updates.normalizedAt = FieldValue.serverTimestamp();
        }
        if (!data.normalizedBy) {
            updates.normalizedBy = 'ensureAdminDocNormalized';
        }
        if (Object.keys(updates).length === 0) {
            return null;
        }
        return snapshot.ref.set(updates, { merge: true });
    }

    const targetRef = snapshot.ref.parent.doc(normalizedId);
    const existing = await targetRef.get();
    const mergedData = {
        ...data,
        ...normalizedFields,
        role: data.role || 'admin',
        isActive: data.isActive ?? true
    };

    if (!mergedData.addedAt) {
        mergedData.addedAt = FieldValue.serverTimestamp();
    }
    if (!mergedData.addedBy) {
        mergedData.addedBy = data.addedBy || null;
    }

    if (existing.exists) {
        const existingData = existing.data() || {};
        mergedData.role = data.role || existingData.role || mergedData.role;
        mergedData.addedAt = existingData.addedAt || mergedData.addedAt;
        mergedData.addedBy = existingData.addedBy || mergedData.addedBy;
        mergedData.isActive = data.isActive ?? existingData.isActive ?? true;
        const mergedAliases = new Set([...(existingData.aliases || []), ...aliases]);
        mergedData.aliases = Array.from(mergedAliases);
    }

    await targetRef.set(mergedData, { merge: true });
    await snapshot.ref.delete();
    functions.logger.info('Normalized admin document', { from: adminId, to: normalizedId });
    return null;
}

function assertMailConfig(mailConfig) {
    const required = ['host', 'user', 'pass', 'to'];
    const missing = required.filter((key) => !mailConfig[key]);
    if (missing.length) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            `Missing mail configuration: ${missing.join(', ')}. ` +
            'Set Firebase runtime config via `firebase functions:config:set mail.host="smtp.gmail.com" mail.port="465" mail.secure="true" mail.user="support@69shop.in" mail.pass="<APP_PASSWORD>" mail.to="bookings@69shop.in" mail.from="support@69shop.in"` or provide an encrypted config.'
        );
    }
}

function getTransporter(mailConfig) {
    if (!cachedTransporter) {
        assertMailConfig(mailConfig);
        cachedTransporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port ? Number(mailConfig.port) : 465,
            secure: mailConfig.secure !== 'false',
            auth: {
                user: mailConfig.user,
                pass: mailConfig.pass
            }
        });
    }
    return cachedTransporter;
}

function formatLabel(key) {
    return key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^./, (char) => char.toUpperCase());
}

function normalizeValue(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}

function buildHtmlTable(details = {}) {
    const rows = Object.entries(details)
        .filter(([key]) => !['recordId'].includes(key))
        .map(([key, value]) => `
            <tr>
                <td style="padding:8px 12px;border:1px solid #e5e5e5;background:#fafafa;font-weight:600;color:#222;">${formatLabel(key)}</td>
                <td style="padding:8px 12px;border:1px solid #e5e5e5;">${normalizeValue(value) || '-'}</td>
            </tr>
        `)
        .join('');

    return `
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;margin-top:16px;">
            <tbody>${rows}</tbody>
        </table>
    `;
}

function getMailConfigOrThrow() {
    try {
        const runtimeConfig = functions.config();
        const secretKey = process.env.MAIL_CONFIG_KEY || runtimeConfig?.secrets?.mail_key;
        const config = resolveMailConfig(runtimeConfig, {
            secretsPath: MAIL_SECRETS_PATH,
            secretKey
        });
        assertMailConfig(config);
        return config;
    } catch (error) {
        functions.logger.error('Mail config error', error);
        const message = error.message || 'Mail configuration unavailable.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }
}

exports.sendServiceEmail = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
        const mailConfig = getMailConfigOrThrow();

        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'Payload is missing.');
        }

        const service = data.service;
        if (!service) {
            throw new functions.https.HttpsError('invalid-argument', 'Service name is required.');
        }

        const submittedAt = data.submittedAt || new Date().toISOString();
        const contact = data.contact || {};
        const requesterName = contact.name || 'Client';
        const requesterEmail = contact.email || mailConfig.to;

        const transporter = getTransporter(mailConfig);
        const subject = `[${service}] concierge brief from ${requesterName}`;
        const htmlContent = `
            <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;line-height:1.6;">
                <h2 style="margin-bottom:4px;">New ${service} enquiry</h2>
                <p style="margin-top:0;color:#666;">Submitted at ${submittedAt}</p>
                <div style="margin-top:12px;padding:12px;border-left:4px solid #0066ff;background:#f5f7ff;">
                    <p style="margin:0;font-size:15px;">
                        <strong>Requester:</strong> ${requesterName}<br>
                        <strong>Email:</strong> ${contact.email || '-'}<br>
                        <strong>Phone:</strong> ${contact.phone || '-'}<br>
                        <strong>City:</strong> ${contact.city || '-'}
                    </p>
                </div>
                ${buildHtmlTable(data.details || data)}
            </div>
        `;

        const mailOptions = {
            from: mailConfig.from || mailConfig.user,
            to: mailConfig.to,
            replyTo: requesterEmail,
            subject,
            text: `New ${service} enquiry from ${requesterName} (email: ${contact.email || '-'}). Submitted at ${submittedAt}.` +
                '\n\nDetails:\n' + normalizeValue(data.details || data),
            html: htmlContent
        };

        try {
            await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            functions.logger.error('Unable to send concierge email', error);
            throw new functions.https.HttpsError('internal', 'Unable to send email right now.');
        }
    });

exports.ensureAdminDocNormalized = functions
    .region(REGION)
    .firestore.document('admins/{adminId}')
    .onWrite(async (change, context) => {
        if (!change.after.exists) {
            return null;
        }
        try {
            return await normalizeAdminSnapshot(change.after, context);
        } catch (error) {
            functions.logger.error('Failed to normalize admin document', {
                adminId: context.params.adminId,
                error: error.message
            });
            return null;
        }
    });
// ==================== ORDER MANAGEMENT ====================

/**
 * Send Order Email - HTTPS Callable function to send order-related emails
 * Called from frontend when order is placed or status changes
 */
exports.sendOrderEmail = functions.region(REGION).https.onCall(async (data, context) => {
    const mailConfig = getMailConfigOrThrow();
    
    const { type, order, customer } = data;
    
    if (!order || !customer || !customer.email) {
        throw new functions.https.HttpsError('invalid-argument', 'Order and customer email are required');
    }
    
    const transporter = getTransporter(mailConfig);
    
    // Email templates for different order events
    const templates = {
        confirmation: {
            subject: `🛍️ Order Confirmed! #${order.id} - 69Shop.in`,
            getHtml: () => `
                <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                    <div style="background:linear-gradient(135deg,#0066ff,#00c6ff);padding:32px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:28px;">🎉 Order Confirmed!</h1>
                    </div>
                    <div style="padding:32px;">
                        <p style="font-size:16px;color:#333;">Hi <strong>${customer.name || 'Valued Customer'}</strong>,</p>
                        <p style="color:#666;">Thank you for your order! We're getting it ready for you.</p>
                        
                        <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:24px 0;">
                            <h3 style="margin:0 0 16px;color:#333;">Order Details</h3>
                            <p style="margin:4px 0;color:#666;"><strong>Order ID:</strong> ${order.id}</p>
                            <p style="margin:4px 0;color:#666;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p style="margin:4px 0;color:#666;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Online'}</p>
                        </div>
                        
                        ${order.items ? `
                        <div style="border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;margin:24px 0;">
                            <table style="width:100%;border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f8f9fa;">
                                        <th style="padding:12px;text-align:left;border-bottom:1px solid #e5e5e5;">Item</th>
                                        <th style="padding:12px;text-align:center;border-bottom:1px solid #e5e5e5;">Qty</th>
                                        <th style="padding:12px;text-align:right;border-bottom:1px solid #e5e5e5;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(item => `
                                        <tr>
                                            <td style="padding:12px;border-bottom:1px solid #eee;">${item.name || item.title}</td>
                                            <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">${item.quantity || 1}</td>
                                            <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr style="background:#f8f9fa;">
                                        <td colspan="2" style="padding:12px;text-align:right;font-weight:600;">Total:</td>
                                        <td style="padding:12px;text-align:right;font-weight:600;color:#0066ff;">₹${(order.total || order.totalAmount || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        ` : ''}
                        
                        <div style="background:#e8f4ff;border-radius:12px;padding:20px;margin:24px 0;">
                            <h4 style="margin:0 0 8px;color:#0066ff;">📦 Delivery Address</h4>
                            <p style="margin:0;color:#666;">${order.shippingAddress || customer.address || 'Address on file'}</p>
                        </div>
                        
                        <div style="text-align:center;margin:32px 0;">
                            <a href="https://shop69-1.web.app/order-tracking.html?order=${order.id}" 
                               style="display:inline-block;background:#0066ff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
                                Track Your Order
                            </a>
                        </div>
                        
                        <p style="color:#999;font-size:12px;text-align:center;margin-top:32px;">
                            Questions? Reply to this email or contact us at support@69shop.in
                        </p>
                    </div>
                    <div style="background:#1a1a1a;padding:24px;text-align:center;">
                        <p style="color:#fff;margin:0;font-size:14px;">Thank you for shopping with 69Shop.in! 🛍️</p>
                    </div>
                </div>
            `
        },
        shipped: {
            subject: `📦 Your Order is on the Way! #${order.id} - 69Shop.in`,
            getHtml: () => `
                <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                    <div style="background:linear-gradient(135deg,#00c853,#69f0ae);padding:32px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:28px;">🚚 Order Shipped!</h1>
                    </div>
                    <div style="padding:32px;">
                        <p style="font-size:16px;color:#333;">Hi <strong>${customer.name || 'Valued Customer'}</strong>,</p>
                        <p style="color:#666;">Great news! Your order is on its way to you.</p>
                        
                        <div style="background:#e8f5e9;border-radius:12px;padding:20px;margin:24px 0;">
                            <h4 style="margin:0 0 8px;color:#00c853;">📍 Tracking Info</h4>
                            <p style="margin:4px 0;color:#666;"><strong>Order ID:</strong> ${order.id}</p>
                            ${order.trackingNumber ? `<p style="margin:4px 0;color:#666;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
                            <p style="margin:4px 0;color:#666;"><strong>Estimated Delivery:</strong> ${order.estimatedDelivery || '2-3 business days'}</p>
                        </div>
                        
                        <div style="text-align:center;margin:32px 0;">
                            <a href="https://shop69-1.web.app/order-tracking.html?order=${order.id}" 
                               style="display:inline-block;background:#00c853;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
                                Track Your Package
                            </a>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;padding:24px;text-align:center;">
                        <p style="color:#fff;margin:0;font-size:14px;">Thank you for shopping with 69Shop.in! 🛍️</p>
                    </div>
                </div>
            `
        },
        delivered: {
            subject: `✅ Order Delivered! #${order.id} - 69Shop.in`,
            getHtml: () => `
                <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                    <div style="background:linear-gradient(135deg,#4caf50,#81c784);padding:32px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:28px;">✅ Delivered!</h1>
                    </div>
                    <div style="padding:32px;">
                        <p style="font-size:16px;color:#333;">Hi <strong>${customer.name || 'Valued Customer'}</strong>,</p>
                        <p style="color:#666;">Your order has been delivered! We hope you love it.</p>
                        
                        <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
                            <p style="font-size:18px;color:#333;margin:0 0 16px;">How was your experience?</p>
                            <a href="https://shop69-1.web.app/shop.html#reviews" 
                               style="display:inline-block;background:#ff9800;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                                ⭐ Leave a Review
                            </a>
                        </div>
                        
                        <p style="color:#999;font-size:12px;text-align:center;margin-top:32px;">
                            Need help? Contact us at support@69shop.in
                        </p>
                    </div>
                    <div style="background:#1a1a1a;padding:24px;text-align:center;">
                        <p style="color:#fff;margin:0;font-size:14px;">Thank you for shopping with 69Shop.in! 🛍️</p>
                    </div>
                </div>
            `
        }
    };
    
    const template = templates[type] || templates.confirmation;
    
    const mailOptions = {
        from: mailConfig.from || mailConfig.user,
        to: customer.email,
        subject: template.subject,
        html: template.getHtml()
    };
    
    try {
        await transporter.sendMail(mailOptions);
        functions.logger.log(`Order email sent: ${type} for order ${order.id}`);
        return { success: true, type, orderId: order.id };
    } catch (error) {
        functions.logger.error('Error sending order email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send email');
    }
});

/**
 * Firestore Trigger: Create seller notification when new order is placed
 * Also handles inventory decrement
 */
exports.onNewOrderPlaced = functions.region(REGION).firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const { orderId } = context.params;
        const order = snap.data();
        const db = admin.firestore();

        try {
            // Create seller notification
            await db.collection('notifications').add({
                type: 'new_order',
                audience: `seller:${order.sellerId}`,
                sellerId: order.sellerId,
                customerId: order.customerId,
                orderId: orderId,
                title: 'New Order Received!',
                message: `Customer placed order for ₹${order.totalAmount}`,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
                link: `/seller-orders.html?order=${orderId}`
            });

            // Decrement stock for each item in the order
            const orderItems = order.items || [];
            const stockUpdatePromises = orderItems.map(async (item) => {
                if (!item.productId && !item.id) return;
                
                const productId = item.productId || item.id;
                const quantity = item.quantity || 1;
                
                try {
                    const productRef = db.collection('products').doc(productId);
                    const productSnap = await productRef.get();
                    
                    if (productSnap.exists) {
                        const currentStock = productSnap.data().stock || 0;
                        const newStock = Math.max(0, currentStock - quantity);
                        
                        await productRef.update({
                            stock: newStock,
                            lastStockUpdate: FieldValue.serverTimestamp()
                        });
                        
                        // Create low stock alert if below threshold
                        if (newStock <= 5 && newStock > 0) {
                            await db.collection('notifications').add({
                                type: 'low_stock',
                                audience: `seller:${order.sellerId}`,
                                sellerId: productSnap.data().sellerId || order.sellerId,
                                productId: productId,
                                title: 'Low Stock Alert! ⚠️',
                                message: `${productSnap.data().name || 'Product'} has only ${newStock} items left`,
                                read: false,
                                createdAt: FieldValue.serverTimestamp(),
                                link: `/seller-products.html?product=${productId}`
                            });
                            functions.logger.log(`Low stock alert created for product ${productId}`);
                        }
                        
                        // Create out of stock alert
                        if (newStock === 0) {
                            await db.collection('notifications').add({
                                type: 'out_of_stock',
                                audience: `seller:${order.sellerId}`,
                                sellerId: productSnap.data().sellerId || order.sellerId,
                                productId: productId,
                                title: 'Out of Stock! 🚨',
                                message: `${productSnap.data().name || 'Product'} is now out of stock`,
                                read: false,
                                createdAt: FieldValue.serverTimestamp(),
                                link: `/seller-products.html?product=${productId}`
                            });
                            functions.logger.log(`Out of stock alert created for product ${productId}`);
                        }
                        
                        functions.logger.log(`Stock updated for ${productId}: ${currentStock} -> ${newStock}`);
                    }
                } catch (stockError) {
                    functions.logger.error(`Failed to update stock for product ${productId}:`, stockError);
                }
            });
            
            await Promise.all(stockUpdatePromises);

            // Send confirmation email to customer if email exists
            if (order.customerEmail || order.customer?.email) {
                const customerEmail = order.customerEmail || order.customer?.email;
                const customerName = order.customerName || order.customer?.name || 'Valued Customer';
                
                try {
                    const mailConfig = getMailConfigOrThrow();
                    const transporter = getTransporter(mailConfig);
                    
                    await transporter.sendMail({
                        from: mailConfig.from || mailConfig.user,
                        to: customerEmail,
                        subject: `🛍️ Order Confirmed! #${orderId} - 69Shop.in`,
                        html: `
                            <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">
                                <div style="background:linear-gradient(135deg,#0066ff,#00c6ff);padding:32px;text-align:center;">
                                    <h1 style="color:#fff;margin:0;">🎉 Order Confirmed!</h1>
                                </div>
                                <div style="padding:32px;">
                                    <p>Hi <strong>${customerName}</strong>,</p>
                                    <p>Thank you for your order! Your order <strong>#${orderId}</strong> has been confirmed.</p>
                                    <p><strong>Total:</strong> ₹${(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</p>
                                    <div style="text-align:center;margin:24px 0;">
                                        <a href="https://shop69-1.web.app/order-tracking.html?order=${orderId}" 
                                           style="background:#0066ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
                                            Track Order
                                        </a>
                                    </div>
                                </div>
                                <div style="background:#1a1a1a;padding:20px;text-align:center;">
                                    <p style="color:#fff;margin:0;">Thank you for shopping with 69Shop.in!</p>
                                </div>
                            </div>
                        `
                    });
                    functions.logger.log(`Order confirmation email sent to ${customerEmail}`);
                } catch (emailError) {
                    functions.logger.error('Failed to send confirmation email:', emailError);
                }
            }

            functions.logger.log(`Order notification created for seller: ${order.sellerId}`);
        } catch (error) {
            functions.logger.error('Error creating order notification:', error);
        }
    });

/**
 * Firestore Trigger: Send notifications when order status changes
 */
exports.onOrderStatusUpdate = functions.region(REGION).firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Only trigger if status changed
        if (before.status === after.status) {
            return;
        }

        const { orderId } = context.params;
        const messageTemplates = {
            confirmed: {
                title: 'Order Confirmed! 🎉',
                body: `Your order #${orderId} has been confirmed.`,
                emailSubject: `✅ Order Confirmed #${orderId} - 69Shop.in`,
                bgColor: '#0066ff'
            },
            shipped: {
                title: 'Order Shipped! 📦',
                body: `Your order #${orderId} is on its way. Tracking: ${after.trackingNumber || 'N/A'}`,
                emailSubject: `📦 Order Shipped #${orderId} - 69Shop.in`,
                bgColor: '#00c853'
            },
            delivered: {
                title: 'Order Delivered! ✅',
                body: `Your order #${orderId} has been delivered. Thank you for shopping!`,
                emailSubject: `🎉 Order Delivered #${orderId} - 69Shop.in`,
                bgColor: '#4caf50'
            },
            cancelled: {
                title: 'Order Cancelled',
                body: `Your order #${orderId} has been cancelled.`,
                emailSubject: `❌ Order Cancelled #${orderId} - 69Shop.in`,
                bgColor: '#f44336'
            }
        };

        const template = messageTemplates[after.status];
        if (!template) return;

        try {
            // Log notification event
            await admin.firestore().collection('orderNotifications').add({
                orderId,
                customerId: after.customerId,
                status: after.status,
                notificationType: 'email',
                sentAt: FieldValue.serverTimestamp(),
                deliveryStatus: 'pending',
                message: template
            });

            // Send email notification to customer
            const customerEmail = after.customerEmail || after.customer?.email;
            const customerName = after.customerName || after.customer?.name || 'Valued Customer';
            
            if (customerEmail) {
                try {
                    const mailConfig = getMailConfigOrThrow();
                    const transporter = getTransporter(mailConfig);
                    
                    await transporter.sendMail({
                        from: mailConfig.from || mailConfig.user,
                        to: customerEmail,
                        subject: template.emailSubject,
                        html: `
                            <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">
                                <div style="background:${template.bgColor};padding:32px;text-align:center;">
                                    <h1 style="color:#fff;margin:0;font-size:24px;">${template.title}</h1>
                                </div>
                                <div style="padding:32px;">
                                    <p>Hi <strong>${customerName}</strong>,</p>
                                    <p>${template.body}</p>
                                    ${after.trackingNumber ? `<p><strong>Tracking Number:</strong> ${after.trackingNumber}</p>` : ''}
                                    <div style="text-align:center;margin:24px 0;">
                                        <a href="https://shop69-1.web.app/order-tracking.html?order=${orderId}" 
                                           style="background:${template.bgColor};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
                                            Track Order
                                        </a>
                                    </div>
                                </div>
                                <div style="background:#1a1a1a;padding:20px;text-align:center;">
                                    <p style="color:#fff;margin:0;">Thank you for shopping with 69Shop.in!</p>
                                </div>
                            </div>
                        `
                    });
                    
                    // Update notification status
                    await admin.firestore().collection('orderNotifications')
                        .where('orderId', '==', orderId)
                        .where('status', '==', after.status)
                        .limit(1)
                        .get()
                        .then(snapshot => {
                            snapshot.forEach(doc => {
                                doc.ref.update({ deliveryStatus: 'sent' });
                            });
                        });
                        
                    functions.logger.log(`Status email sent to ${customerEmail} for order ${orderId}`);
                } catch (emailError) {
                    functions.logger.error('Failed to send status email:', emailError);
                }
            }

            functions.logger.log(`Notification sent for order ${orderId}: ${after.status}`);
        } catch (error) {
            functions.logger.error('Error logging notification:', error);
        }
    });

/**
 * Scheduled: Aggregate daily seller metrics (runs at 2 AM IST daily)
 */
exports.aggregateDailyMetrics = functions.region(REGION).pubsub
    .schedule('0 2 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const tomorrow = new Date(yesterday);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateKey = yesterday.toISOString().slice(0, 10);
        const db = admin.firestore();

        try {
            // Get all sellers
            const sellersSnap = await db.collection('sellers').get();

            for (const sellerDoc of sellersSnap.docs) {
                const sellerId = sellerDoc.id;

                // Get yesterday's orders for this seller
                const ordersSnap = await db.collection('orders')
                    .where('sellerId', '==', sellerId)
                    .where('createdAt', '>=', yesterday)
                    .where('createdAt', '<', tomorrow)
                    .get();

                if (ordersSnap.empty) continue;

                let revenue = 0;
                let ordersCount = 0;
                const hourlyOrders = {};

                for (let i = 0; i < 24; i++) hourlyOrders[i] = 0;

                ordersSnap.docs.forEach(orderDoc => {
                    const order = orderDoc.data();
                    revenue += order.totalAmount || 0;
                    ordersCount += 1;

                    const hour = new Date(order.createdAt?.toDate()).getHours();
                    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
                });

                // Find peak hour
                const peakHour = Object.entries(hourlyOrders).reduce((max, [hour, count]) =>
                    count > hourlyOrders[max] ? hour : max, 0);

                // Store metrics
                const analyticsRef = db.collection('sellerAnalytics')
                    .doc(sellerId)
                    .collection('daily')
                    .doc(dateKey);

                await analyticsRef.set({
                    date: dateKey,
                    revenue,
                    ordersCount,
                    avgOrderValue: revenue / ordersCount,
                    hourlyOrders,
                    peakHour: parseInt(peakHour),
                    lastUpdated: FieldValue.serverTimestamp()
                });

                functions.logger.log(`Updated analytics for seller ${sellerId} on ${dateKey}`);
            }
        } catch (error) {
            functions.logger.error('Error aggregating metrics:', error);
        }
    });

// ==================== REVIEWS & RATINGS ====================

/**
 * Firestore Trigger: Update seller ratings when reviews change
 */
exports.updateSellerRatings = functions.region(REGION).firestore
    .document('reviews/{reviewId}')
    .onWrite(async (change, context) => {
        const before = change.before.exists ? change.before.data() : null;
        const after = change.after.exists ? change.after.data() : null;

        // Determine seller ID
        const sellerId = after?.sellerId || before?.sellerId;
        if (!sellerId) return;

        const db = admin.firestore();

        try {
            // Get all non-flagged reviews for this seller
            const reviewsSnap = await db.collection('reviews')
                .where('sellerId', '==', sellerId)
                .where('flagged', '!=', true)
                .get();

            if (reviewsSnap.empty) {
                await db.collection('sellerRatings').doc(sellerId).delete();
                return;
            }

            let totalRating = 0;
            const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const categoryAverages = { communication: 0, quality: 0, delivery: 0, pricing: 0 };
            const categories = ['communication', 'quality', 'delivery', 'pricing'];

            reviewsSnap.docs.forEach(doc => {
                const review = doc.data();
                totalRating += review.rating || 0;
                ratingBreakdown[review.rating] = (ratingBreakdown[review.rating] || 0) + 1;

                categories.forEach(cat => {
                    categoryAverages[cat] += review.categories?.[cat] || 0;
                });
            });

            const totalReviews = reviewsSnap.docs.length;
            const averageRating = (totalRating / totalReviews).toFixed(2);

            categories.forEach(cat => {
                categoryAverages[cat] = (categoryAverages[cat] / totalReviews).toFixed(2);
            });

            await db.collection('sellerRatings').doc(sellerId).set({
                sellerId,
                averageRating: parseFloat(averageRating),
                totalReviews,
                ratingBreakdown,
                categoryAverages,
                lastUpdated: FieldValue.serverTimestamp()
            });

            functions.logger.log(`Updated ratings for seller ${sellerId}`);
        } catch (error) {
            functions.logger.error('Error updating seller ratings:', error);
        }
    });

/**
 * Scheduled: Calculate seller performance scores (Sunday 3 AM IST)
 */
exports.calculateSellerPerformance = functions.region(REGION).pubsub
    .schedule('0 3 * * 0')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const db = admin.firestore();
        
        try {
            const sellersSnap = await db.collection('sellers').get();

            for (const sellerDoc of sellersSnap.docs) {
                const sellerId = sellerDoc.id;

                // Get last 30 days metrics
                const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
                const ordersSnap = await db.collection('orders')
                    .where('sellerId', '==', sellerId)
                    .where('createdAt', '>=', thirtyDaysAgo)
                    .get();

                const ratingsSnap = await db.collection('sellerRatings')
                    .doc(sellerId)
                    .get();

                const rating = ratingsSnap.data()?.averageRating || 0;
                const deliveredCount = ordersSnap.docs.filter(d => 
                    d.data().status === 'delivered'
                ).length;
                const orderFulfillmentRate = ordersSnap.docs.length > 0 ? 
                    (deliveredCount / ordersSnap.docs.length) * 100 : 0;

                const performanceScore = Math.min(100,
                    (rating / 5) * 40 +
                    (orderFulfillmentRate / 100) * 40 +
                    (90) * 20 // Default response time
                );

                const tier = performanceScore > 85 ? 'gold' : 
                             performanceScore > 70 ? 'silver' : 'bronze';

                await db.collection('sellerPerformance').doc(sellerId).set({
                    sellerId,
                    performanceScore: Math.round(performanceScore),
                    scoreBreakdown: {
                        orderFulfillment: Math.round(orderFulfillmentRate),
                        customerRating: Math.round((rating / 5) * 100),
                        responseTime: 90,
                        returnRate: 5,
                        reportCount: 0
                    },
                    tier,
                    lastCalculated: FieldValue.serverTimestamp()
                });

                functions.logger.log(`Updated performance for seller ${sellerId}`);
            }
        } catch (error) {
            functions.logger.error('Error calculating performance:', error);
        }
    });

// ==================== PAYMENT SPLITS ====================
const paymentSplits = require('./payment-splits');

exports.processOrderPayment = paymentSplits.processOrderPayment;
exports.requestWithdrawal = paymentSplits.requestWithdrawal;
exports.processWithdrawal = paymentSplits.processWithdrawal;
exports.getSellerWallet = paymentSplits.getSellerWallet;
exports.processRefund = paymentSplits.processRefund;
exports.dailySettlementReport = paymentSplits.dailySettlementReport;

// ==================== NEGOTIATION MANAGEMENT ====================

/**
 * Scheduled: Expire stale negotiations (runs every hour)
 * Negotiations expire 48 hours after the last offer
 */
exports.expireNegotiations = functions.region(REGION).pubsub
    .schedule('0 * * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const db = admin.firestore();
        const now = admin.firestore.Timestamp.now();

        try {
            const expiredSnap = await db.collection('negotiations')
                .where('status', '==', 'active')
                .where('expiresAt', '<=', now)
                .get();

            if (expiredSnap.empty) {
                functions.logger.log('No expired negotiations found');
                return null;
            }

            const batch = db.batch();
            const conversationUpdates = [];

            expiredSnap.docs.forEach(doc => {
                const data = doc.data();

                batch.update(doc.ref, {
                    status: 'expired',
                    updatedAt: FieldValue.serverTimestamp()
                });

                // Queue conversation message update
                if (data.conversationId) {
                    conversationUpdates.push({
                        conversationId: data.conversationId,
                        negotiationId: doc.id,
                        productName: data.productName,
                        customerId: data.customerId,
                        sellerId: data.sellerId
                    });
                }
            });

            await batch.commit();
            functions.logger.log(`Expired ${expiredSnap.size} negotiations`);

            // Send expiry messages to conversations
            for (const update of conversationUpdates) {
                try {
                    await db.collection('conversations')
                        .doc(update.conversationId)
                        .collection('messages')
                        .add({
                            text: `Negotiation for "${update.productName || 'product'}" has expired`,
                            messageType: 'deal_expired',
                            negotiationData: {
                                negotiationId: update.negotiationId,
                                productName: update.productName
                            },
                            senderId: 'system',
                            senderName: 'System',
                            senderRole: 'system',
                            read: false,
                            createdAt: FieldValue.serverTimestamp()
                        });

                    await db.collection('conversations')
                        .doc(update.conversationId)
                        .update({
                            lastMessage: 'Negotiation expired',
                            lastMessageAt: FieldValue.serverTimestamp()
                        });

                    // Notify both parties
                    await db.collection('notifications').add({
                        type: 'negotiation_expired',
                        audience: `seller:${update.sellerId}`,
                        sellerId: update.sellerId,
                        title: 'Negotiation Expired',
                        message: `Negotiation for "${update.productName || 'product'}" has expired`,
                        read: false,
                        createdAt: FieldValue.serverTimestamp(),
                        link: '/seller-messages.html'
                    });
                } catch (msgError) {
                    functions.logger.error('Error sending expiry message:', msgError);
                }
            }

            return null;
        } catch (error) {
            functions.logger.error('Error expiring negotiations:', error);
            return null;
        }
    });

/**
 * Firestore Trigger: Notify seller/customer when a new negotiation offer is made
 */
exports.onNewNegotiationOffer = functions.region(REGION).firestore
    .document('negotiations/{negotiationId}/offers/{offerId}')
    .onCreate(async (snap, context) => {
        const { negotiationId } = context.params;
        const offer = snap.data();
        const db = admin.firestore();

        try {
            const negDoc = await db.collection('negotiations').doc(negotiationId).get();
            if (!negDoc.exists) return;

            const negotiation = negDoc.data();
            const isCustomerOffer = offer.proposedBy === 'customer';

            // Notify the other party
            const notifyId = isCustomerOffer ? negotiation.sellerId : negotiation.customerId;
            const audience = isCustomerOffer ? `seller:${negotiation.sellerId}` : `customer:${negotiation.customerId}`;
            const title = isCustomerOffer ? 'New Price Offer Received' : 'Seller Responded to Your Offer';
            const message = isCustomerOffer
                ? `${negotiation.customerName || 'Customer'} offered ₹${offer.amount} for "${negotiation.productName || 'product'}"`
                : `${negotiation.sellerName || 'Seller'} counter-offered ₹${offer.amount} for "${negotiation.productName || 'product'}"`;

            await db.collection('notifications').add({
                type: 'negotiation_offer',
                audience,
                userId: notifyId,
                sellerId: negotiation.sellerId,
                customerId: negotiation.customerId,
                negotiationId,
                title,
                message,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
                link: isCustomerOffer ? '/seller-messages.html' : '/messages.html'
            });

            functions.logger.log(`Negotiation offer notification sent for ${negotiationId}`);
        } catch (error) {
            functions.logger.error('Error on new negotiation offer:', error);
        }
    });

/**
 * Firestore Trigger: Handle negotiation status changes (accepted/rejected)
 */
exports.onNegotiationStatusChange = functions.region(REGION).firestore
    .document('negotiations/{negotiationId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (before.status === after.status) return;

        const { negotiationId } = context.params;
        const db = admin.firestore();

        try {
            if (after.status === 'accepted') {
                // Notify customer that deal was accepted
                await db.collection('notifications').add({
                    type: 'negotiation_accepted',
                    audience: `customer:${after.customerId}`,
                    userId: after.customerId,
                    sellerId: after.sellerId,
                    negotiationId,
                    title: 'Deal Accepted!',
                    message: `Your offer of ₹${after.agreedPrice} for "${after.productName || 'product'}" was accepted! Add it to your cart.`,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    link: '/messages.html'
                });

                // Notify seller
                await db.collection('notifications').add({
                    type: 'negotiation_accepted',
                    audience: `seller:${after.sellerId}`,
                    sellerId: after.sellerId,
                    negotiationId,
                    title: 'Deal Accepted',
                    message: `You accepted ₹${after.agreedPrice} for "${after.productName || 'product'}"`,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    link: '/seller-messages.html'
                });

                functions.logger.log(`Negotiation ${negotiationId} accepted at ₹${after.agreedPrice}`);
            }

            if (after.status === 'rejected') {
                // Notify customer that deal was rejected
                const rejectedBy = after.rejectedBy || 'seller';
                const notifyId = rejectedBy === 'seller' ? after.customerId : after.sellerId;
                const audience = rejectedBy === 'seller' ? `customer:${after.customerId}` : `seller:${after.sellerId}`;

                await db.collection('notifications').add({
                    type: 'negotiation_rejected',
                    audience,
                    userId: notifyId,
                    sellerId: after.sellerId,
                    negotiationId,
                    title: 'Negotiation Declined',
                    message: `The negotiation for "${after.productName || 'product'}" has been declined`,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    link: rejectedBy === 'seller' ? '/messages.html' : '/seller-messages.html'
                });

                functions.logger.log(`Negotiation ${negotiationId} rejected`);
            }
        } catch (error) {
            functions.logger.error('Error on negotiation status change:', error);
        }
    });

// ═══════════════════════════════════════════════════════════
// PRICE DROP ALERTS — Trigger when a product price decreases
// ═══════════════════════════════════════════════════════════
exports.onProductPriceChange = functions.region(REGION).firestore
    .document('products/{productId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Only trigger if price actually decreased
        if (after.price == null || before.price == null || after.price >= before.price) {
            return null;
        }

        const db = admin.firestore();
        const productId = context.params.productId;

        try {
            // Find all active alerts for this product where target price >= new price
            const alertsSnap = await db.collection('priceAlerts')
                .where('productId', '==', productId)
                .where('status', '==', 'active')
                .where('targetPrice', '>=', after.price)
                .get();

            if (alertsSnap.empty) {
                functions.logger.log(`Product ${productId} price dropped ₹${before.price} → ₹${after.price}, but no matching alerts`);
                return null;
            }

            const batch = db.batch();

            for (const alertDoc of alertsSnap.docs) {
                const alertData = alertDoc.data();

                // Update alert status to triggered
                batch.update(alertDoc.ref, {
                    status: 'triggered',
                    triggered: true,
                    triggeredAt: FieldValue.serverTimestamp(),
                    currentPrice: after.price,
                    updatedAt: FieldValue.serverTimestamp()
                });

                // Create notification for the user
                const notifRef = db.collection('notifications').doc();
                batch.set(notifRef, {
                    type: 'price_drop',
                    audience: 'user:' + alertData.userId,
                    userId: alertData.userId,
                    title: 'Price Drop Alert!',
                    message: `${after.name || alertData.productName} dropped to ₹${Number(after.price).toLocaleString('en-IN')} — below your target of ₹${Number(alertData.targetPrice).toLocaleString('en-IN')}!`,
                    link: '/product.html?id=' + productId,
                    image: alertData.productImage || after.images?.[0] || null,
                    read: false,
                    createdAt: FieldValue.serverTimestamp()
                });
            }

            await batch.commit();
            functions.logger.log(`Triggered ${alertsSnap.size} price alert(s) for product ${productId} (₹${before.price} → ₹${after.price})`);
            return null;
        } catch (error) {
            functions.logger.error('Error processing price drop alerts:', error);
            return null;
        }
    });