/**
 * NegotiationManager — Chat-based price negotiation engine
 * Max 3 rounds, 48-hour expiry per offer, structured message cards
 */
class NegotiationManager {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.activeListeners = new Map();
        this.EXPIRY_HOURS = 48;
        this.MAX_ROUNDS = 3;
    }

    get user() {
        return this.auth.currentUser;
    }

    /**
     * Start a new negotiation — creates negotiation doc, conversation, first offer
     * Called from product page by customer
     */
    async startNegotiation({ sellerId, sellerName, productId, productName, productImage, originalPrice, offerAmount, message }) {
        if (!this.user) throw new Error('Login required');
        if (offerAmount <= 0 || offerAmount >= originalPrice) {
            throw new Error('Offer must be between ₹1 and the listed price');
        }

        // Check for existing active negotiation on this product
        const existing = await this.db.collection('negotiations')
            .where('customerId', '==', this.user.uid)
            .where('productId', '==', productId)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (!existing.empty) {
            const doc = existing.docs[0];
            return { id: doc.id, ...doc.data(), existing: true };
        }

        // Create conversation first
        const conversationData = {
            customerId: this.user.uid,
            customerName: this.user.displayName || this.user.email?.split('@')[0] || 'Customer',
            customerPhoto: this.user.photoURL || null,
            sellerId,
            sellerName,
            sellerPhoto: null,
            product: { id: productId, name: productName, image: productImage, price: originalPrice },
            negotiationId: null, // will update after negotiation created
            type: 'negotiation',
            lastMessage: `Price offer: ₹${offerAmount.toLocaleString('en-IN')}`,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            customerUnread: 0,
            sellerUnread: 1,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const convRef = await this.db.collection('conversations').add(conversationData);
        const conversationId = convRef.id;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.EXPIRY_HOURS);

        // Create negotiation document
        const negotiationData = {
            customerId: this.user.uid,
            customerName: this.user.displayName || this.user.email?.split('@')[0] || 'Customer',
            customerEmail: this.user.email,
            sellerId,
            sellerName,
            productId,
            productName,
            productImage: productImage || null,
            originalPrice,
            status: 'active',
            currentOffer: offerAmount,
            currentOfferBy: 'customer',
            roundCount: 1,
            maxRounds: this.MAX_ROUNDS,
            agreedPrice: null,
            expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
            conversationId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const negRef = await this.db.collection('negotiations').add(negotiationData);

        // Link conversation to negotiation
        await convRef.update({ negotiationId: negRef.id });

        // Create first offer in subcollection
        await this.db.collection('negotiations').doc(negRef.id)
            .collection('offers').add({
                amount: offerAmount,
                proposedBy: 'customer',
                proposerId: this.user.uid,
                proposerName: this.user.displayName || 'Customer',
                message: message || null,
                roundNumber: 1,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Send structured message in conversation
        await this._sendProposalMessage(conversationId, {
            type: 'price_proposal',
            amount: offerAmount,
            proposedBy: 'customer',
            roundNumber: 1,
            originalPrice,
            productName,
            message,
            negotiationId: negRef.id
        });

        return { id: negRef.id, conversationId, ...negotiationData };
    }

    /**
     * Submit a counter-offer (by either party)
     */
    async counterOffer(negotiationId, amount, message) {
        if (!this.user) throw new Error('Login required');

        const negRef = this.db.collection('negotiations').doc(negotiationId);
        const negDoc = await negRef.get();
        if (!negDoc.exists) throw new Error('Negotiation not found');

        const neg = negDoc.data();
        if (neg.status !== 'active') throw new Error('Negotiation is no longer active');
        if (neg.roundCount >= neg.maxRounds) throw new Error('Maximum rounds reached');

        // Determine role
        const isSeller = neg.sellerId === this.user.uid;
        const isCustomer = neg.customerId === this.user.uid;
        if (!isSeller && !isCustomer) throw new Error('Not a participant');

        const role = isSeller ? 'seller' : 'customer';

        // Can't counter your own offer
        if (neg.currentOfferBy === role) throw new Error('Waiting for the other party to respond');

        if (amount <= 0 || amount >= neg.originalPrice) {
            throw new Error('Offer must be between ₹1 and the listed price');
        }

        const newRound = neg.roundCount + 1;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.EXPIRY_HOURS);

        // Update negotiation
        await negRef.update({
            currentOffer: amount,
            currentOfferBy: role,
            roundCount: newRound,
            expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Add offer to subcollection
        await negRef.collection('offers').add({
            amount,
            proposedBy: role,
            proposerId: this.user.uid,
            proposerName: this.user.displayName || role.charAt(0).toUpperCase() + role.slice(1),
            message: message || null,
            roundNumber: newRound,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Send structured message
        await this._sendProposalMessage(neg.conversationId, {
            type: 'price_proposal',
            amount,
            proposedBy: role,
            roundNumber: newRound,
            originalPrice: neg.originalPrice,
            productName: neg.productName,
            message,
            negotiationId
        });

        // Update conversation unread
        const unreadField = isSeller ? 'customerUnread' : 'sellerUnread';
        await this.db.collection('conversations').doc(neg.conversationId).update({
            lastMessage: `Counter offer: ₹${amount.toLocaleString('en-IN')}`,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            [unreadField]: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { roundNumber: newRound, amount };
    }

    /**
     * Accept the current offer
     */
    async acceptOffer(negotiationId) {
        if (!this.user) throw new Error('Login required');

        const negRef = this.db.collection('negotiations').doc(negotiationId);
        const negDoc = await negRef.get();
        if (!negDoc.exists) throw new Error('Negotiation not found');

        const neg = negDoc.data();
        if (neg.status !== 'active') throw new Error('Negotiation is no longer active');

        const isSeller = neg.sellerId === this.user.uid;
        const isCustomer = neg.customerId === this.user.uid;
        if (!isSeller && !isCustomer) throw new Error('Not a participant');

        const role = isSeller ? 'seller' : 'customer';

        // Can only accept the OTHER party's offer
        if (neg.currentOfferBy === role) throw new Error('Cannot accept your own offer');

        await negRef.update({
            status: 'accepted',
            agreedPrice: neg.currentOffer,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Send acceptance message
        await this._sendStructuredMessage(neg.conversationId, {
            messageType: 'deal_accepted',
            negotiationData: {
                negotiationId,
                amount: neg.currentOffer,
                originalPrice: neg.originalPrice,
                productName: neg.productName,
                productId: neg.productId,
                acceptedBy: role,
                customerId: neg.customerId,
                sellerId: neg.sellerId
            }
        }, `Deal accepted at ₹${neg.currentOffer.toLocaleString('en-IN')}`);

        // Update conversation
        const unreadField = isSeller ? 'customerUnread' : 'sellerUnread';
        await this.db.collection('conversations').doc(neg.conversationId).update({
            lastMessage: `Deal accepted at ₹${neg.currentOffer.toLocaleString('en-IN')}`,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            [unreadField]: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { agreedPrice: neg.currentOffer, productId: neg.productId };
    }

    /**
     * Reject the negotiation
     */
    async rejectOffer(negotiationId) {
        if (!this.user) throw new Error('Login required');

        const negRef = this.db.collection('negotiations').doc(negotiationId);
        const negDoc = await negRef.get();
        if (!negDoc.exists) throw new Error('Negotiation not found');

        const neg = negDoc.data();
        if (neg.status !== 'active') throw new Error('Negotiation is no longer active');

        const isSeller = neg.sellerId === this.user.uid;
        const isCustomer = neg.customerId === this.user.uid;
        if (!isSeller && !isCustomer) throw new Error('Not a participant');

        const role = isSeller ? 'seller' : 'customer';

        await negRef.update({
            status: 'rejected',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await this._sendStructuredMessage(neg.conversationId, {
            messageType: 'deal_rejected',
            negotiationData: {
                negotiationId,
                lastOffer: neg.currentOffer,
                originalPrice: neg.originalPrice,
                productName: neg.productName,
                rejectedBy: role
            }
        }, 'Negotiation declined');

        const unreadField = isSeller ? 'customerUnread' : 'sellerUnread';
        await this.db.collection('conversations').doc(neg.conversationId).update({
            lastMessage: 'Negotiation declined',
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            [unreadField]: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Subscribe to real-time negotiation updates
     */
    subscribeToNegotiation(negotiationId, callback) {
        const unsubscribe = this.db.collection('negotiations')
            .doc(negotiationId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                }
            });
        this.activeListeners.set(`neg_${negotiationId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Get all negotiations for the current user (as customer or seller)
     */
    async getNegotiations(role = 'customer') {
        if (!this.user) return [];
        const field = role === 'seller' ? 'sellerId' : 'customerId';
        const snapshot = await this.db.collection('negotiations')
            .where(field, '==', this.user.uid)
            .orderBy('updatedAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Get offer history for a negotiation
     */
    async getOffers(negotiationId) {
        const snapshot = await this.db.collection('negotiations')
            .doc(negotiationId)
            .collection('offers')
            .orderBy('createdAt', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // === HTML Renderers ===

    /**
     * Render a price proposal card (used inside chat messages)
     */
    static renderProposalCard(data, currentUserId) {
        const { amount, originalPrice, proposedBy, roundNumber, productName, message, negotiationId, status } = data;
        const discount = Math.round(((originalPrice - amount) / originalPrice) * 100);
        const isMine = (proposedBy === 'customer' && data.proposerId === currentUserId) ||
                       (proposedBy === 'seller' && data.proposerId === currentUserId);

        const statusClass = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'pending';

        return `
            <div class="negotiate-proposal-card ${statusClass}" data-negotiation-id="${negotiationId}">
                <div class="negotiate-card-header">
                    <span class="negotiate-card-icon"><i class="fas fa-handshake"></i></span>
                    <span class="negotiate-card-title">Price ${isMine ? 'Offer Sent' : 'Offer Received'}</span>
                    <span class="negotiate-round-badge">Round ${roundNumber}/3</span>
                </div>
                <div class="negotiate-card-body">
                    <div class="negotiate-price-row">
                        <div class="negotiate-original">
                            <span class="negotiate-label">Listed Price</span>
                            <span class="negotiate-amount original">₹${originalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="negotiate-arrow"><i class="fas fa-arrow-right"></i></div>
                        <div class="negotiate-offered">
                            <span class="negotiate-label">Offered Price</span>
                            <span class="negotiate-amount offered">₹${amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="negotiate-discount">-${discount}%</div>
                    </div>
                    ${message ? `<div class="negotiate-message">"${NegotiationManager.escapeHtml(message)}"</div>` : ''}
                </div>
            </div>`;
    }

    /**
     * Render action buttons for a proposal (Accept / Counter / Reject)
     */
    static renderProposalActions(negotiationId, negotiation, currentUserId) {
        if (negotiation.status !== 'active') return '';

        const isMyOffer = (negotiation.currentOfferBy === 'customer' && negotiation.customerId === currentUserId) ||
                          (negotiation.currentOfferBy === 'seller' && negotiation.sellerId === currentUserId);

        if (isMyOffer) {
            return `<div class="negotiate-waiting">
                <i class="fas fa-clock"></i> Waiting for response...
            </div>`;
        }

        const canCounter = negotiation.roundCount < negotiation.maxRounds;

        return `
            <div class="negotiate-actions" data-negotiation-id="${negotiationId}">
                <button class="negotiate-btn accept" onclick="NegotiationManager.handleAccept('${negotiationId}')">
                    <i class="fas fa-check"></i> Accept ₹${negotiation.currentOffer.toLocaleString('en-IN')}
                </button>
                ${canCounter ? `
                <button class="negotiate-btn counter" onclick="NegotiationManager.showCounterInput('${negotiationId}')">
                    <i class="fas fa-exchange-alt"></i> Counter Offer
                </button>` : ''}
                <button class="negotiate-btn reject" onclick="NegotiationManager.handleReject('${negotiationId}')">
                    <i class="fas fa-times"></i> Decline
                </button>
            </div>`;
    }

    /**
     * Render deal accepted card
     */
    static renderDealAcceptedCard(data, currentUserId) {
        const { amount, originalPrice, productName, productId, negotiationId } = data;
        const isCustomer = data.customerId === currentUserId;
        const safeName = (productName || 'Negotiated Product').replace(/'/g, "\\'");

        return `
            <div class="negotiate-deal-card accepted">
                <div class="negotiate-deal-icon"><i class="fas fa-check-circle"></i></div>
                <div class="negotiate-deal-content">
                    <h4>Deal Accepted!</h4>
                    <p>${productName || 'Product'} — <strong>₹${amount.toLocaleString('en-IN')}</strong>
                        <span class="negotiate-savings">(Save ₹${(originalPrice - amount).toLocaleString('en-IN')})</span>
                    </p>
                    ${isCustomer ? `
                    <button class="negotiate-btn add-to-cart" onclick="NegotiationManager.addDealToCart('${productId}', '${negotiationId}', ${amount}, ${originalPrice}, '${safeName}')">
                        <i class="fas fa-cart-plus"></i> Add to Cart at ₹${amount.toLocaleString('en-IN')}
                    </button>` : ''}
                </div>
            </div>`;
    }

    /**
     * Render deal rejected card
     */
    static renderDealRejectedCard(data) {
        return `
            <div class="negotiate-deal-card rejected">
                <div class="negotiate-deal-icon"><i class="fas fa-times-circle"></i></div>
                <div class="negotiate-deal-content">
                    <h4>Negotiation Declined</h4>
                    <p>The negotiation for ${data.productName} has been declined.</p>
                </div>
            </div>`;
    }

    /**
     * Render deal expired card
     */
    static renderDealExpiredCard(data) {
        return `
            <div class="negotiate-deal-card expired">
                <div class="negotiate-deal-icon"><i class="fas fa-hourglass-end"></i></div>
                <div class="negotiate-deal-content">
                    <h4>Offer Expired</h4>
                    <p>The negotiation for ${data.productName} has expired (48h timeout).</p>
                </div>
            </div>`;
    }

    // === Static Action Handlers (called from onclick) ===

    static async handleAccept(negotiationId) {
        try {
            const mgr = NegotiationManager.getInstance();
            const result = await mgr.acceptOffer(negotiationId);
            if (typeof showToast === 'function') showToast('Deal accepted!', 'success');
            return result;
        } catch (err) {
            console.error('Accept failed:', err);
            if (typeof showToast === 'function') showToast(err.message, 'error');
        }
    }

    static async handleReject(negotiationId) {
        if (!confirm('Are you sure you want to decline this negotiation?')) return;
        try {
            const mgr = NegotiationManager.getInstance();
            await mgr.rejectOffer(negotiationId);
            if (typeof showToast === 'function') showToast('Negotiation declined', 'success');
        } catch (err) {
            console.error('Reject failed:', err);
            if (typeof showToast === 'function') showToast(err.message, 'error');
        }
    }

    static showCounterInput(negotiationId) {
        const existing = document.querySelector('.negotiate-counter-bar');
        if (existing) existing.remove();

        const actionsEl = document.querySelector(`.negotiate-actions[data-negotiation-id="${negotiationId}"]`);
        if (!actionsEl) return;

        const bar = document.createElement('div');
        bar.className = 'negotiate-counter-bar';
        bar.innerHTML = `
            <input type="number" class="negotiate-counter-input" id="counterAmount_${negotiationId}"
                   placeholder="Your price (₹)" min="1">
            <input type="text" class="negotiate-counter-message" id="counterMsg_${negotiationId}"
                   placeholder="Optional message...">
            <button class="negotiate-btn accept" onclick="NegotiationManager.submitCounter('${negotiationId}')">
                <i class="fas fa-paper-plane"></i> Send
            </button>
            <button class="negotiate-btn reject" onclick="this.closest('.negotiate-counter-bar').remove()">
                <i class="fas fa-times"></i>
            </button>`;
        actionsEl.after(bar);

        document.getElementById(`counterAmount_${negotiationId}`)?.focus();
    }

    static async submitCounter(negotiationId) {
        const amountInput = document.getElementById(`counterAmount_${negotiationId}`);
        const msgInput = document.getElementById(`counterMsg_${negotiationId}`);
        const amount = parseFloat(amountInput?.value);
        const message = msgInput?.value?.trim() || '';

        if (!amount || amount <= 0) {
            if (typeof showToast === 'function') showToast('Enter a valid price', 'error');
            return;
        }

        try {
            const mgr = NegotiationManager.getInstance();
            await mgr.counterOffer(negotiationId, amount, message);
            const bar = document.querySelector('.negotiate-counter-bar');
            if (bar) bar.remove();
            if (typeof showToast === 'function') showToast('Counter offer sent!', 'success');
        } catch (err) {
            console.error('Counter offer failed:', err);
            if (typeof showToast === 'function') showToast(err.message, 'error');
        }
    }

    static addDealToCart(productId, negotiationId, agreedPrice, originalPrice, productName) {
        try {
            const cart = JSON.parse(localStorage.getItem('69shop_cart') || '[]');

            // Remove any existing entry for this product
            const filtered = cart.filter(item => item.id !== productId);

            filtered.push({
                id: productId,
                name: productName || 'Negotiated Product',
                negotiationId,
                price: agreedPrice,
                originalPrice,
                isNegotiated: true,
                quantity: 1
            });

            localStorage.setItem('69shop_cart', JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('cartUpdated'));

            if (typeof showToast === 'function') {
                showToast(`Added to cart at ₹${agreedPrice.toLocaleString('en-IN')}!`, 'success');
            }
            if (typeof CartDrawer !== 'undefined') {
                CartDrawer.open();
            }
        } catch (err) {
            console.error('Add to cart failed:', err);
            if (typeof showToast === 'function') showToast('Failed to add to cart', 'error');
        }
    }

    // === Internal Helpers ===

    async _sendProposalMessage(conversationId, proposalData) {
        await this.db.collection('conversations').doc(conversationId)
            .collection('messages').add({
                senderId: this.user.uid,
                senderName: this.user.displayName || 'User',
                senderRole: proposalData.proposedBy,
                text: `Price offer: ₹${proposalData.amount.toLocaleString('en-IN')}`,
                messageType: 'price_proposal',
                negotiationData: {
                    negotiationId: proposalData.negotiationId,
                    amount: proposalData.amount,
                    proposedBy: proposalData.proposedBy,
                    proposerId: this.user.uid,
                    roundNumber: proposalData.roundNumber,
                    originalPrice: proposalData.originalPrice,
                    productName: proposalData.productName,
                    message: proposalData.message || null,
                    status: 'pending'
                },
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    async _sendStructuredMessage(conversationId, { messageType, negotiationData }, text) {
        await this.db.collection('conversations').doc(conversationId)
            .collection('messages').add({
                senderId: this.user.uid,
                senderName: this.user.displayName || 'User',
                senderRole: this.user.uid === negotiationData.sellerId ? 'seller' : 'customer',
                text,
                messageType,
                negotiationData,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Singleton pattern for static handlers
    static _instance = null;
    static getInstance() {
        if (!NegotiationManager._instance) {
            NegotiationManager._instance = new NegotiationManager();
        }
        return NegotiationManager._instance;
    }

    cleanup() {
        this.activeListeners.forEach(unsub => unsub());
        this.activeListeners.clear();
    }
}

if (typeof window !== 'undefined') {
    window.NegotiationManager = NegotiationManager;
}
