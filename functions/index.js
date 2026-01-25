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
 * Firestore Trigger: Create seller notification when new order is placed
 */
exports.onNewOrderPlaced = functions.region(REGION).firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const { orderId } = context.params;
        const order = snap.data();

        try {
            // Create seller notification
            await admin.firestore().collection('notifications').add({
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
                body: `Your order #${orderId} has been confirmed.`
            },
            shipped: {
                title: 'Order Shipped! 📦',
                body: `Your order #${orderId} is on its way. Tracking: ${after.trackingNumber || 'N/A'}`
            },
            delivered: {
                title: 'Order Delivered! ✅',
                body: `Your order #${orderId} has been delivered. Thank you for shopping!`
            },
            cancelled: {
                title: 'Order Cancelled',
                body: `Your order #${orderId} has been cancelled.`
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
                deliveryStatus: 'sent',
                message: template
            });

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