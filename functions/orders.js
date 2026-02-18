// Order Management Cloud Functions
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * HTTP Trigger: Update order status (for admins/sellers)
 * POST /updateOrderStatus
 * Body: { orderId, status, note?, trackingNumber? }
 */
exports.updateOrderStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, status, note, trackingNumber } = req.body;
    const uid = req.headers['x-user-id'];

    if (!orderId || !status || !uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderSnap.data();

    // Authorization: only seller/admin can update
    if (orderData.sellerId !== uid) {
      const userSnap = await db.collection('users').doc(uid).get();
      if (!userSnap.exists || userSnap.data().accountType !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    const currentStatus = orderData.status;
    const statusHierarchy = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      out_for_delivery: 4,
      delivered: 5,
      cancelled: 6
    };

    // Prevent backwards status transitions (except cancellations)
    if (status !== 'cancelled' && statusHierarchy[status] <= statusHierarchy[currentStatus]) {
      return res.status(400).json({ error: 'Cannot move to previous status' });
    }

    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      [`statusTimestamps.${status}`]: new Date().toISOString(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status,
        timestamp: new Date().toISOString(),
        note: note || ''
      })
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (status === 'delivered') {
      updateData.estimatedDelivery = admin.firestore.FieldValue.serverTimestamp();
    }

    await orderRef.update(updateData);

    // Create notification record
    await db.collection('orderNotifications').add({
      orderId,
      customerId: orderData.userId || orderData.customerId,
      status,
      notificationType: 'email',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveryStatus: 'pending'
    });

    res.json({ success: true, message: `Order updated to ${status}` });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Firestore Trigger: Send notifications when order status changes
 * Path: orders/{orderId}
 */
exports.onOrderStatusUpdate = functions.firestore
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
        body: `Your order #${orderId} has been confirmed.${after.estimatedDelivery ? ' Expected delivery: ' + new Date(after.estimatedDelivery?.toDate?.() || after.estimatedDelivery).toLocaleDateString('en-IN') : ''}`
      },
      processing: {
        title: 'Order Being Processed 🔄',
        body: `Your order #${orderId} is being prepared and will be shipped soon.`
      },
      shipped: {
        title: 'Order Shipped! 📦',
        body: `Your order #${orderId} is on its way. Tracking number: ${after.trackingNumber || 'N/A'}`
      },
      out_for_delivery: {
        title: 'Out for Delivery! 🏍️',
        body: `Your order #${orderId} is out for delivery and will arrive today.`
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
      await db.collection('orderNotifications').add({
        orderId,
        customerId: after.userId || after.customerId,
        status: after.status,
        notificationType: 'email',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryStatus: 'sent',
        message: template
      });

      console.log(`Notification sent for order ${orderId}: ${after.status}`);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  });

/**
 * Firestore Trigger: Create seller notification when new order is placed
 * Path: orders/{orderId}
 */
exports.onNewOrderPlaced = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const { orderId } = context.params;
    const order = snap.data();

    try {
      // Create admin notification
      await db.collection('notifications').add({
        type: 'new_order',
        audience: `seller:${order.sellerId}`,
        sellerId: order.sellerId,
        customerId: order.userId || order.customerId,
        orderId: orderId,
        title: 'New Order Received!',
        message: `Customer placed order for ₹${order.total || order.totalAmount}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        link: `/seller-orders?order=${orderId}`
      });

      console.log(`New order notification created for seller: ${order.sellerId}`);
    } catch (error) {
      console.error('Error creating order notification:', error);
    }
  });

/**
 * Scheduled: Calculate daily seller order metrics (runs at 2 AM daily)
 */
exports.aggregateDailyMetrics = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateKey = yesterday.toISOString().slice(0, 10);

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
        const topProducts = {};

        for (let i = 0; i < 24; i++) hourlyOrders[i] = 0;

        ordersSnap.docs.forEach(orderDoc => {
          const order = orderDoc.data();
          revenue += order.totalAmount || 0;
          ordersCount += 1;

          const hour = new Date(order.createdAt?.toDate()).getHours();
          hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;

          // Track top products
          (order.productIds || []).forEach(productId => {
            topProducts[productId] = (topProducts[productId] || 0) + 1;
          });
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
          peakHour,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Updated analytics for seller ${sellerId} on ${dateKey}`);
      }
    } catch (error) {
      console.error('Error aggregating metrics:', error);
    }
  });
