/**
 * 69Shop.in - Payment Splits Cloud Functions
 * 
 * Handles automatic payment distribution to sellers:
 * - Calculate platform commission
 * - Credit seller wallets
 * - Process withdrawal requests
 * - Handle refunds and chargebacks
 * 
 * Deploy: firebase deploy --only functions:paymentSplits
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const REGION = 'asia-south1';

// Platform commission rates by category
const COMMISSION_RATES = {
    default: 0.10,          // 10% default
    electronics: 0.08,      // 8% for electronics
    fashion: 0.12,          // 12% for fashion
    groceries: 0.05,        // 5% for groceries
    services: 0.15,         // 15% for services
    beauty: 0.12,           // 12% for beauty
    books: 0.06,            // 6% for books
    jewelry: 0.10,          // 10% for jewelry
    sports: 0.10,           // 10% for sports
    toys: 0.12,             // 12% for toys
    automotive: 0.08,       // 8% for automotive
    home: 0.10              // 10% for home
};

// Minimum withdrawal amount
const MIN_WITHDRAWAL = 500;

// Payout processing fee
const PAYOUT_FEE = 5;

/**
 * Calculate commission for an order
 */
function calculateCommission(order) {
    const category = order.category || 'default';
    const rate = COMMISSION_RATES[category] || COMMISSION_RATES.default;
    
    // Custom seller rate if specified
    const sellerRate = order.sellerCommissionRate;
    const effectiveRate = sellerRate !== undefined ? sellerRate : rate;
    
    const subtotal = order.subtotal || order.total;
    const commission = Math.round(subtotal * effectiveRate * 100) / 100;
    const sellerAmount = subtotal - commission;
    
    return {
        subtotal,
        commission,
        commissionRate: effectiveRate,
        sellerAmount,
        platformAmount: commission
    };
}

/**
 * Firestore Trigger: Process payment when order is marked as delivered
 */
exports.processOrderPayment = functions
    .region(REGION)
    .firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const orderId = context.params.orderId;
        
        // Only process when status changes to 'delivered'
        if (before.status !== 'delivered' && after.status === 'delivered') {
            try {
                await creditSellerWallet(orderId, after);
                functions.logger.info('Processed payment for order', { orderId });
            } catch (error) {
                functions.logger.error('Failed to process payment', { orderId, error });
            }
        }
        
        return null;
    });

/**
 * Credit seller wallet after successful delivery
 */
async function creditSellerWallet(orderId, order) {
    const sellerId = order.sellerId;
    if (!sellerId) {
        functions.logger.warn('Order has no sellerId', { orderId });
        return;
    }
    
    // Check if already processed
    const existingTx = await db.collection('transactions')
        .where('orderId', '==', orderId)
        .where('type', '==', 'order_credit')
        .limit(1)
        .get();
    
    if (!existingTx.empty) {
        functions.logger.info('Payment already processed for order', { orderId });
        return;
    }
    
    const split = calculateCommission(order);
    
    // Create transaction record
    const transaction = {
        orderId,
        sellerId,
        type: 'order_credit',
        amount: split.sellerAmount,
        commission: split.commission,
        commissionRate: split.commissionRate,
        orderTotal: split.subtotal,
        status: 'completed',
        description: `Order ${orderId} - Seller credit`,
        createdAt: FieldValue.serverTimestamp()
    };
    
    await db.collection('transactions').add(transaction);
    
    // Update seller wallet
    const walletRef = db.collection('sellerWallet').doc(sellerId);
    const walletDoc = await walletRef.get();
    
    if (walletDoc.exists) {
        await walletRef.update({
            availableBalance: FieldValue.increment(split.sellerAmount),
            totalEarnings: FieldValue.increment(split.sellerAmount),
            totalCommissionPaid: FieldValue.increment(split.commission),
            lastUpdated: FieldValue.serverTimestamp()
        });
    } else {
        await walletRef.set({
            sellerId,
            availableBalance: split.sellerAmount,
            pendingBalance: 0,
            totalEarnings: split.sellerAmount,
            totalCommissionPaid: split.commission,
            totalWithdrawn: 0,
            createdAt: FieldValue.serverTimestamp(),
            lastUpdated: FieldValue.serverTimestamp()
        });
    }
    
    // Create platform earnings record
    await db.collection('platformEarnings').add({
        orderId,
        sellerId,
        commission: split.commission,
        commissionRate: split.commissionRate,
        orderTotal: split.subtotal,
        createdAt: FieldValue.serverTimestamp()
    });
    
    functions.logger.info('Credited seller wallet', {
        orderId,
        sellerId,
        sellerAmount: split.sellerAmount,
        commission: split.commission
    });
}

/**
 * HTTP Callable: Request withdrawal
 */
exports.requestWithdrawal = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
        }
        
        const sellerId = context.auth.uid;
        const { amount, bankDetails } = data;
        
        // Validate amount
        if (!amount || amount < MIN_WITHDRAWAL) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`
            );
        }
        
        // Check wallet balance
        const walletDoc = await db.collection('sellerWallet').doc(sellerId).get();
        if (!walletDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Wallet not found');
        }
        
        const wallet = walletDoc.data();
        const netAmount = amount - PAYOUT_FEE;
        
        if (wallet.availableBalance < amount) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                `Insufficient balance. Available: ₹${wallet.availableBalance}`
            );
        }
        
        // Create withdrawal request
        const withdrawal = {
            sellerId,
            amount,
            fee: PAYOUT_FEE,
            netAmount,
            bankDetails: bankDetails || wallet.payoutDetails,
            status: 'pending',
            requestedAt: FieldValue.serverTimestamp()
        };
        
        const withdrawalRef = await db.collection('withdrawalRequests').add(withdrawal);
        
        // Move amount from available to pending
        await db.collection('sellerWallet').doc(sellerId).update({
            availableBalance: FieldValue.increment(-amount),
            pendingBalance: FieldValue.increment(amount),
            lastUpdated: FieldValue.serverTimestamp()
        });
        
        // Create transaction record
        await db.collection('transactions').add({
            sellerId,
            type: 'withdrawal_request',
            amount: -amount,
            withdrawalId: withdrawalRef.id,
            status: 'pending',
            description: 'Withdrawal request',
            createdAt: FieldValue.serverTimestamp()
        });
        
        return {
            success: true,
            withdrawalId: withdrawalRef.id,
            amount,
            fee: PAYOUT_FEE,
            netAmount,
            message: 'Withdrawal request submitted. Processing in 2-3 business days.'
        };
    });

/**
 * HTTP Callable: Admin - Process withdrawal
 */
exports.processWithdrawal = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
        // Verify admin
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
        }
        
        const adminDoc = await db.collection('admins').doc(context.auth.token.email.toLowerCase()).get();
        if (!adminDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }
        
        const { withdrawalId, action, transactionId, note } = data;
        
        if (!['approve', 'reject'].includes(action)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
        }
        
        const withdrawalRef = db.collection('withdrawalRequests').doc(withdrawalId);
        const withdrawalDoc = await withdrawalRef.get();
        
        if (!withdrawalDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Withdrawal not found');
        }
        
        const withdrawal = withdrawalDoc.data();
        
        if (withdrawal.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Withdrawal already processed');
        }
        
        const sellerId = withdrawal.sellerId;
        const batch = db.batch();
        
        if (action === 'approve') {
            // Update withdrawal status
            batch.update(withdrawalRef, {
                status: 'completed',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: context.auth.uid,
                transactionId: transactionId || null,
                note: note || null
            });
            
            // Update wallet
            batch.update(db.collection('sellerWallet').doc(sellerId), {
                pendingBalance: FieldValue.increment(-withdrawal.amount),
                totalWithdrawn: FieldValue.increment(withdrawal.netAmount),
                lastUpdated: FieldValue.serverTimestamp()
            });
            
            // Update transaction
            const txQuery = await db.collection('transactions')
                .where('withdrawalId', '==', withdrawalId)
                .limit(1)
                .get();
            
            if (!txQuery.empty) {
                batch.update(txQuery.docs[0].ref, {
                    status: 'completed',
                    completedAt: FieldValue.serverTimestamp()
                });
            }
            
        } else {
            // Reject - return funds to available balance
            batch.update(withdrawalRef, {
                status: 'rejected',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: context.auth.uid,
                rejectionReason: note || 'Rejected by admin'
            });
            
            batch.update(db.collection('sellerWallet').doc(sellerId), {
                pendingBalance: FieldValue.increment(-withdrawal.amount),
                availableBalance: FieldValue.increment(withdrawal.amount),
                lastUpdated: FieldValue.serverTimestamp()
            });
            
            // Update transaction
            const txQuery = await db.collection('transactions')
                .where('withdrawalId', '==', withdrawalId)
                .limit(1)
                .get();
            
            if (!txQuery.empty) {
                batch.update(txQuery.docs[0].ref, {
                    status: 'rejected',
                    rejectedAt: FieldValue.serverTimestamp()
                });
            }
        }
        
        await batch.commit();
        
        return {
            success: true,
            action,
            withdrawalId,
            message: action === 'approve' ? 'Withdrawal approved and processed' : 'Withdrawal rejected'
        };
    });

/**
 * HTTP Callable: Get seller wallet details
 */
exports.getSellerWallet = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
        }
        
        const sellerId = context.auth.uid;
        
        // Get wallet
        const walletDoc = await db.collection('sellerWallet').doc(sellerId).get();
        const wallet = walletDoc.exists ? walletDoc.data() : {
            availableBalance: 0,
            pendingBalance: 0,
            totalEarnings: 0,
            totalWithdrawn: 0
        };
        
        // Get recent transactions
        const transactionsQuery = await db.collection('transactions')
            .where('sellerId', '==', sellerId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        const transactions = transactionsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Get pending withdrawals
        const withdrawalsQuery = await db.collection('withdrawalRequests')
            .where('sellerId', '==', sellerId)
            .where('status', '==', 'pending')
            .get();
        
        const pendingWithdrawals = withdrawalsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return {
            wallet,
            transactions,
            pendingWithdrawals,
            minimumWithdrawal: MIN_WITHDRAWAL,
            payoutFee: PAYOUT_FEE
        };
    });

/**
 * Process refund (admin only)
 */
exports.processRefund = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
        }
        
        // Verify admin
        const adminDoc = await db.collection('admins').doc(context.auth.token.email.toLowerCase()).get();
        if (!adminDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }
        
        const { orderId, reason, amount } = data;
        
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Order not found');
        }
        
        const order = orderDoc.data();
        const refundAmount = amount || order.total;
        const sellerId = order.sellerId;
        
        // Check if seller has enough balance
        const walletDoc = await db.collection('sellerWallet').doc(sellerId).get();
        if (walletDoc.exists) {
            const wallet = walletDoc.data();
            const split = calculateCommission({ ...order, subtotal: refundAmount });
            
            // Deduct from seller wallet (only seller portion)
            if (wallet.availableBalance >= split.sellerAmount) {
                await db.collection('sellerWallet').doc(sellerId).update({
                    availableBalance: FieldValue.increment(-split.sellerAmount),
                    totalEarnings: FieldValue.increment(-split.sellerAmount),
                    lastUpdated: FieldValue.serverTimestamp()
                });
            }
        }
        
        // Create refund record
        await db.collection('refunds').add({
            orderId,
            sellerId,
            buyerId: order.buyerId || order.customerId,
            amount: refundAmount,
            reason,
            status: 'completed',
            processedBy: context.auth.uid,
            createdAt: FieldValue.serverTimestamp()
        });
        
        // Update order status
        await db.collection('orders').doc(orderId).update({
            status: 'refunded',
            refundAmount,
            refundReason: reason,
            refundedAt: FieldValue.serverTimestamp()
        });
        
        // Create transaction record
        await db.collection('transactions').add({
            sellerId,
            type: 'refund',
            amount: -refundAmount,
            orderId,
            status: 'completed',
            description: `Refund for order ${orderId}: ${reason}`,
            createdAt: FieldValue.serverTimestamp()
        });
        
        return {
            success: true,
            refundAmount,
            message: 'Refund processed successfully'
        };
    });

/**
 * Scheduled: Daily settlement report
 */
exports.dailySettlementReport = functions
    .region(REGION)
    .pubsub
    .schedule('0 6 * * *')  // 6 AM daily
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all transactions from yesterday
        const transactionsQuery = await db.collection('transactions')
            .where('createdAt', '>=', yesterday)
            .where('createdAt', '<', today)
            .get();
        
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalCommission = 0;
        let totalWithdrawals = 0;
        
        transactionsQuery.docs.forEach(doc => {
            const tx = doc.data();
            if (tx.type === 'order_credit') {
                totalOrders++;
                totalRevenue += tx.orderTotal || 0;
                totalCommission += tx.commission || 0;
            } else if (tx.type === 'withdrawal_request' && tx.status === 'completed') {
                totalWithdrawals += Math.abs(tx.amount);
            }
        });
        
        // Save daily report
        await db.collection('dailyReports').add({
            date: yesterday,
            totalOrders,
            totalRevenue,
            totalCommission,
            totalWithdrawals,
            netPlatformEarnings: totalCommission - totalWithdrawals,
            generatedAt: FieldValue.serverTimestamp()
        });
        
        functions.logger.info('Daily settlement report generated', {
            date: yesterday.toISOString(),
            totalOrders,
            totalRevenue,
            totalCommission
        });
        
        return null;
    });

module.exports = {
    processOrderPayment: exports.processOrderPayment,
    requestWithdrawal: exports.requestWithdrawal,
    processWithdrawal: exports.processWithdrawal,
    getSellerWallet: exports.getSellerWallet,
    processRefund: exports.processRefund,
    dailySettlementReport: exports.dailySettlementReport
};
