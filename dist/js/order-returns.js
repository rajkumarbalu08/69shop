/**
 * 69Shop.in - Order Returns & RMA System
 * 
 * Features:
 * - Return request submission
 * - RMA number generation
 * - Return reason tracking
 * - Photo upload for damaged items
 * - Refund/replacement options
 * - Return shipping labels
 * - Status tracking
 * - Seller approval workflow
 * 
 * Usage:
 *   const returns = new OrderReturns();
 *   await returns.createReturnRequest(orderId, items, reason);
 */

class OrderReturns {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage ? firebase.storage() : null;
    }

    // Return reasons
    static REASONS = {
        DEFECTIVE: { id: 'defective', label: 'Product is defective/damaged', requiresPhoto: true },
        WRONG_ITEM: { id: 'wrong_item', label: 'Wrong item received', requiresPhoto: true },
        NOT_AS_DESCRIBED: { id: 'not_as_described', label: 'Item not as described', requiresPhoto: false },
        QUALITY: { id: 'quality', label: 'Quality not satisfactory', requiresPhoto: false },
        SIZE_FIT: { id: 'size_fit', label: 'Size/fit issue', requiresPhoto: false },
        CHANGED_MIND: { id: 'changed_mind', label: 'Changed my mind', requiresPhoto: false },
        LATE_DELIVERY: { id: 'late_delivery', label: 'Delivered too late', requiresPhoto: false },
        MISSING_PARTS: { id: 'missing_parts', label: 'Missing parts/accessories', requiresPhoto: true },
        OTHER: { id: 'other', label: 'Other reason', requiresPhoto: false }
    };

    // Return status
    static STATUS = {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        SHIPPED: 'shipped',
        RECEIVED: 'received',
        INSPECTING: 'inspecting',
        REFUNDED: 'refunded',
        REPLACED: 'replaced',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    };

    // Resolution types
    static RESOLUTION = {
        REFUND: 'refund',
        REPLACEMENT: 'replacement',
        STORE_CREDIT: 'store_credit'
    };

    /**
     * Check if order is eligible for return
     */
    async checkEligibility(orderId) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const orderDoc = await this.db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) throw new Error('Order not found');

        const order = orderDoc.data();

        // Verify ownership
        if (order.customerId !== user.uid && order.buyerId !== user.uid) {
            throw new Error('Not authorized');
        }

        // Check if order is delivered
        if (order.status !== 'delivered') {
            return {
                eligible: false,
                reason: 'Order must be delivered before requesting a return'
            };
        }

        // Check return window (typically 7-30 days)
        const deliveredAt = order.deliveredAt?.toDate() || order.updatedAt?.toDate();
        if (!deliveredAt) {
            return { eligible: true, daysRemaining: 7 };
        }

        const returnWindowDays = order.returnWindowDays || 7;
        const daysSinceDelivery = Math.floor((Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = returnWindowDays - daysSinceDelivery;

        if (daysRemaining <= 0) {
            return {
                eligible: false,
                reason: `Return window of ${returnWindowDays} days has expired`
            };
        }

        // Check if already has a pending return
        const existingReturn = await this.db.collection('returnRequests')
            .where('orderId', '==', orderId)
            .where('status', 'in', ['pending', 'approved', 'shipped', 'received', 'inspecting'])
            .limit(1)
            .get();

        if (!existingReturn.empty) {
            return {
                eligible: false,
                reason: 'A return request already exists for this order'
            };
        }

        return {
            eligible: true,
            daysRemaining,
            order: { id: orderId, ...order }
        };
    }

    /**
     * Create a return request
     */
    async createReturnRequest(orderId, data) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        // Check eligibility
        const eligibility = await this.checkEligibility(orderId);
        if (!eligibility.eligible) {
            throw new Error(eligibility.reason);
        }

        const order = eligibility.order;

        // Validate items
        if (!data.items || data.items.length === 0) {
            throw new Error('Select at least one item to return');
        }

        // Generate RMA number
        const rmaNumber = await this.generateRMANumber();

        // Calculate refund amount
        let refundAmount = 0;
        const returnItems = [];

        for (const item of data.items) {
            const orderItem = order.items?.find(i => i.productId === item.productId);
            if (!orderItem) {
                throw new Error(`Item ${item.productId} not found in order`);
            }

            const quantity = Math.min(item.quantity, orderItem.quantity);
            const itemRefund = orderItem.price * quantity;
            refundAmount += itemRefund;

            returnItems.push({
                productId: item.productId,
                productName: orderItem.name || orderItem.title,
                productImage: orderItem.image,
                quantity,
                price: orderItem.price,
                refundAmount: itemRefund
            });
        }

        const returnRequest = {
            rmaNumber,
            orderId,
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'Customer',
            sellerId: order.sellerId,
            
            items: returnItems,
            reason: data.reason,
            reasonDetails: data.reasonDetails || '',
            resolution: data.resolution || OrderReturns.RESOLUTION.REFUND,
            
            status: OrderReturns.STATUS.PENDING,
            refundAmount,
            refundMethod: data.refundMethod || 'original',
            
            photos: [],
            
            shippingAddress: data.pickupAddress || order.shippingAddress,
            pickupRequired: data.pickupRequired !== false,
            pickupDate: data.pickupDate || null,
            
            sellerNotes: null,
            adminNotes: null,
            
            approvedAt: null,
            approvedBy: null,
            rejectedAt: null,
            rejectedReason: null,
            shippedAt: null,
            receivedAt: null,
            inspectedAt: null,
            refundedAt: null,
            
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const returnRef = await this.db.collection('returnRequests').add(returnRequest);

        // Upload photos if provided
        if (data.photos && data.photos.length > 0) {
            const photoUrls = await this.uploadPhotos(returnRef.id, data.photos);
            await returnRef.update({ photos: photoUrls });
            returnRequest.photos = photoUrls;
        }

        // Update order status
        await this.db.collection('orders').doc(orderId).update({
            hasReturnRequest: true,
            returnRequestId: returnRef.id,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create notification for seller
        await this.db.collection('notifications').add({
            type: 'return_request',
            audience: `seller:${order.sellerId}`,
            sellerId: order.sellerId,
            title: 'New Return Request',
            message: `Return request RMA-${rmaNumber} for order ${orderId}`,
            link: `/seller-orders.html?return=${returnRef.id}`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return {
            id: returnRef.id,
            rmaNumber,
            ...returnRequest
        };
    }

    /**
     * Generate RMA number
     */
    async generateRMANumber() {
        const date = new Date();
        const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${datePart}${random}`;
    }

    /**
     * Upload photos
     */
    async uploadPhotos(returnId, files) {
        if (!this.storage) {
            console.warn('Storage not available');
            return [];
        }

        const urls = [];
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Photo size must be less than 5MB');
            }

            const fileName = `returns/${returnId}/${Date.now()}_${file.name}`;
            const storageRef = this.storage.ref(fileName);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();
            urls.push(url);
        }

        return urls;
    }

    /**
     * Get user's return requests
     */
    async getMyReturns(filters = {}) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        let query = this.db.collection('returnRequests')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc');

        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const snapshot = await query.get();
        const returns = [];

        snapshot.forEach(doc => {
            returns.push({ id: doc.id, ...doc.data() });
        });

        return returns;
    }

    /**
     * Get return details
     */
    async getReturn(returnId) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const returnDoc = await this.db.collection('returnRequests').doc(returnId).get();
        if (!returnDoc.exists) throw new Error('Return request not found');

        const returnData = { id: returnDoc.id, ...returnDoc.data() };

        if (returnData.userId !== user.uid) {
            throw new Error('Not authorized');
        }

        // Get status history
        const historySnapshot = await this.db.collection('returnRequests')
            .doc(returnId)
            .collection('statusHistory')
            .orderBy('createdAt', 'desc')
            .get();

        returnData.statusHistory = [];
        historySnapshot.forEach(doc => {
            returnData.statusHistory.push({ id: doc.id, ...doc.data() });
        });

        return returnData;
    }

    /**
     * Cancel return request
     */
    async cancelReturn(returnId) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const returnRef = this.db.collection('returnRequests').doc(returnId);
        const returnDoc = await returnRef.get();

        if (!returnDoc.exists) throw new Error('Return not found');

        const returnData = returnDoc.data();

        if (returnData.userId !== user.uid) {
            throw new Error('Not authorized');
        }

        // Can only cancel pending requests
        if (returnData.status !== OrderReturns.STATUS.PENDING) {
            throw new Error('Can only cancel pending return requests');
        }

        await returnRef.update({
            status: OrderReturns.STATUS.CANCELLED,
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Add to history
        await returnRef.collection('statusHistory').add({
            status: OrderReturns.STATUS.CANCELLED,
            note: 'Cancelled by customer',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update order
        await this.db.collection('orders').doc(returnData.orderId).update({
            hasReturnRequest: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Update return with shipping info
     */
    async updateShippingInfo(returnId, trackingNumber, courier) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const returnRef = this.db.collection('returnRequests').doc(returnId);
        const returnDoc = await returnRef.get();

        if (!returnDoc.exists || returnDoc.data().userId !== user.uid) {
            throw new Error('Not authorized');
        }

        const returnData = returnDoc.data();

        if (returnData.status !== OrderReturns.STATUS.APPROVED) {
            throw new Error('Return must be approved before shipping');
        }

        await returnRef.update({
            status: OrderReturns.STATUS.SHIPPED,
            trackingNumber,
            courier,
            shippedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await returnRef.collection('statusHistory').add({
            status: OrderReturns.STATUS.SHIPPED,
            note: `Shipped via ${courier}. Tracking: ${trackingNumber}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Get return policy
     */
    getReturnPolicy() {
        return {
            windowDays: 7,
            conditions: [
                'Item must be unused and in original packaging',
                'All tags and labels must be attached',
                'Include original receipt or proof of purchase',
                'Item must not be damaged (unless reporting damage)',
                'Electronics must include all accessories'
            ],
            nonReturnable: [
                'Perishable goods (food, flowers)',
                'Personal care items (opened)',
                'Customized/personalized items',
                'Digital downloads',
                'Gift cards'
            ],
            refundTimeline: {
                inspection: '3-5 business days',
                refund: '5-7 business days after approval'
            }
        };
    }

    /**
     * Render return form
     */
    renderReturnForm(containerId, orderId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const reasons = Object.values(OrderReturns.REASONS);

        container.innerHTML = `
            <form id="return-form" class="return-form">
                <h3>Return Request</h3>
                
                <div class="form-group">
                    <label>Reason for return *</label>
                    <select id="return-reason" required>
                        <option value="">Select reason...</option>
                        ${reasons.map(r => `
                            <option value="${r.id}" data-requires-photo="${r.requiresPhoto}">
                                ${r.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Additional details</label>
                    <textarea id="return-details" rows="3" placeholder="Please provide more details about the issue..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Resolution preference *</label>
                    <div class="resolution-options">
                        <label class="resolution-option">
                            <input type="radio" name="resolution" value="refund" checked>
                            <span>💰 Refund to original payment method</span>
                        </label>
                        <label class="resolution-option">
                            <input type="radio" name="resolution" value="replacement">
                            <span>📦 Replacement</span>
                        </label>
                        <label class="resolution-option">
                            <input type="radio" name="resolution" value="store_credit">
                            <span>🎁 Store credit</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group" id="photo-upload-section" style="display: none;">
                    <label>Upload photos (required) *</label>
                    <input type="file" id="return-photos" multiple accept="image/*">
                    <small>Upload clear photos showing the issue</small>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="pickup-required" checked>
                        Request pickup from my address
                    </label>
                </div>
                
                <button type="submit" class="submit-btn">Submit Return Request</button>
            </form>
        `;

        // Show/hide photo upload based on reason
        const reasonSelect = container.querySelector('#return-reason');
        const photoSection = container.querySelector('#photo-upload-section');
        
        reasonSelect.addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            if (option.dataset.requiresPhoto === 'true') {
                photoSection.style.display = 'block';
                photoSection.querySelector('input').required = true;
            } else {
                photoSection.style.display = 'none';
                photoSection.querySelector('input').required = false;
            }
        });

        // Handle submission
        container.querySelector('#return-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = e.target.querySelector('.submit-btn');
            btn.disabled = true;
            btn.textContent = 'Processing...';

            try {
                // Get order items (should be passed or fetched)
                const order = await this.db.collection('orders').doc(orderId).get();
                const orderData = order.data();

                const result = await this.createReturnRequest(orderId, {
                    items: (orderData.items || []).map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    })),
                    reason: document.getElementById('return-reason').value,
                    reasonDetails: document.getElementById('return-details').value,
                    resolution: document.querySelector('input[name="resolution"]:checked').value,
                    photos: document.getElementById('return-photos').files,
                    pickupRequired: document.getElementById('pickup-required').checked
                });

                container.innerHTML = `
                    <div class="return-success">
                        <div class="success-icon">✅</div>
                        <h3>Return Request Submitted</h3>
                        <p>RMA Number: <strong>RMA-${result.rmaNumber}</strong></p>
                        <p>We'll review your request within 24-48 hours.</p>
                        <a href="/profile.html#returns" class="btn">View My Returns</a>
                    </div>
                `;
            } catch (error) {
                btn.disabled = false;
                btn.textContent = 'Submit Return Request';
                alert('Error: ' + error.message);
            }
        });

        this.addReturnStyles();
    }

    addReturnStyles() {
        if (document.getElementById('return-form-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'return-form-styles';
        styles.textContent = `
            .return-form { max-width: 600px; margin: 0 auto; }
            .return-form .form-group { margin-bottom: 20px; }
            .return-form label { display: block; font-weight: 600; margin-bottom: 8px; }
            .return-form select, .return-form textarea, .return-form input[type="file"] {
                width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;
            }
            .resolution-options { display: flex; flex-direction: column; gap: 10px; }
            .resolution-option {
                display: flex; align-items: center; gap: 10px; padding: 12px;
                border: 1px solid #ddd; border-radius: 8px; cursor: pointer;
            }
            .resolution-option:has(input:checked) { border-color: #0066ff; background: #f0f7ff; }
            .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
            .submit-btn {
                width: 100%; padding: 14px; background: #0066ff; color: white;
                border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;
            }
            .submit-btn:disabled { background: #ccc; }
            .return-success { text-align: center; padding: 40px; }
            .return-success .success-icon { font-size: 48px; }
            .return-success .btn {
                display: inline-block; margin-top: 20px; padding: 12px 24px;
                background: #0066ff; color: white; text-decoration: none; border-radius: 8px;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.OrderReturns = OrderReturns;
}
