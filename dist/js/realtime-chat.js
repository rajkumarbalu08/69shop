/**
 * 69Shop.in - Real-Time Chat System
 * 
 * Features:
 * - Customer-seller messaging
 * - Real-time updates with Firestore listeners
 * - Typing indicators
 * - Read receipts
 * - Image sharing
 * - Chat history
 * - Unread count badges
 * 
 * Usage:
 *   const chat = new RealtimeChat();
 *   await chat.startConversation(sellerId, productId);
 *   await chat.sendMessage(conversationId, 'Hello!');
 */

class RealtimeChat {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage ? firebase.storage() : null;
        this.activeListeners = new Map();
        this.typingTimeouts = new Map();
    }

    /**
     * Start or get existing conversation with a seller
     * @param {string} sellerId - Seller's user ID
     * @param {string} productId - Optional product context
     * @returns {Promise<Object>} Conversation object
     */
    async startConversation(sellerId, productId = null) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in to start a conversation');
        }

        // Check for existing conversation
        const existingQuery = await this.db.collection('conversations')
            .where('customerId', '==', user.uid)
            .where('sellerId', '==', sellerId)
            .limit(1)
            .get();

        if (!existingQuery.empty) {
            const conv = existingQuery.docs[0];
            return { id: conv.id, ...conv.data() };
        }

        // Get seller info
        const sellerDoc = await this.db.collection('sellers').doc(sellerId).get();
        const sellerData = sellerDoc.exists ? sellerDoc.data() : {};

        // Get product info if provided
        let productData = null;
        if (productId) {
            const productDoc = await this.db.collection('products').doc(productId).get();
            if (productDoc.exists) {
                const p = productDoc.data();
                productData = {
                    id: productId,
                    name: p.name || p.title,
                    image: p.images?.[0] || p.image,
                    price: p.price
                };
            }
        }

        // Create new conversation
        const conversationData = {
            customerId: user.uid,
            customerName: user.displayName || 'Customer',
            customerPhoto: user.photoURL || null,
            sellerId,
            sellerName: sellerData.businessName || sellerData.name || 'Seller',
            sellerPhoto: sellerData.logo || sellerData.profileImage || null,
            product: productData,
            lastMessage: null,
            lastMessageAt: null,
            customerUnread: 0,
            sellerUnread: 0,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const convRef = await this.db.collection('conversations').add(conversationData);

        return { id: convRef.id, ...conversationData };
    }

    /**
     * Send a message in a conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} text - Message text
     * @param {Object} attachment - Optional attachment
     */
    async sendMessage(conversationId, text, attachment = null) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        // Get conversation to determine sender role
        const convDoc = await this.db.collection('conversations').doc(conversationId).get();
        if (!convDoc.exists) {
            throw new Error('Conversation not found');
        }

        const conv = convDoc.data();
        const isSeller = user.uid === conv.sellerId;
        const isCustomer = user.uid === conv.customerId;

        if (!isSeller && !isCustomer) {
            throw new Error('Not authorized to send messages in this conversation');
        }

        const messageData = {
            conversationId,
            senderId: user.uid,
            senderName: user.displayName || (isSeller ? 'Seller' : 'Customer'),
            senderRole: isSeller ? 'seller' : 'customer',
            text: text.trim(),
            attachment,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add message
        const msgRef = await this.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .add(messageData);

        // Update conversation
        const updateData = {
            lastMessage: text.substring(0, 100),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Increment unread for the other party
        if (isSeller) {
            updateData.customerUnread = firebase.firestore.FieldValue.increment(1);
        } else {
            updateData.sellerUnread = firebase.firestore.FieldValue.increment(1);
        }

        await this.db.collection('conversations').doc(conversationId).update(updateData);

        // Clear typing indicator
        this.stopTyping(conversationId);

        return { id: msgRef.id, ...messageData };
    }

    /**
     * Send an image in a conversation
     */
    async sendImage(conversationId, file) {
        if (!this.storage) {
            throw new Error('Storage not available');
        }

        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        // Upload image
        const fileName = `chat/${conversationId}/${Date.now()}_${file.name}`;
        const storageRef = this.storage.ref(fileName);
        await storageRef.put(file);
        const imageUrl = await storageRef.getDownloadURL();

        // Send as message with attachment
        return this.sendMessage(conversationId, '📷 Image', {
            type: 'image',
            url: imageUrl,
            name: file.name,
            size: file.size
        });
    }

    /**
     * Get messages in a conversation
     * @param {string} conversationId - Conversation ID
     * @param {number} limit - Max messages to fetch
     */
    async getMessages(conversationId, limit = 50) {
        const snapshot = await this.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        return messages.reverse();
    }

    /**
     * Subscribe to real-time messages
     * @param {string} conversationId - Conversation ID
     * @param {Function} callback - Callback for new messages
     * @returns {Function} Unsubscribe function
     */
    subscribeToMessages(conversationId, callback) {
        const unsubscribe = this.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });
                callback(messages);
            });

        this.activeListeners.set(`messages_${conversationId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Mark messages as read
     */
    async markAsRead(conversationId) {
        const user = this.auth.currentUser;
        if (!user) return;

        const convDoc = await this.db.collection('conversations').doc(conversationId).get();
        if (!convDoc.exists) return;

        const conv = convDoc.data();
        const isSeller = user.uid === conv.sellerId;

        // Reset unread count for current user
        const updateField = isSeller ? 'sellerUnread' : 'customerUnread';
        await this.db.collection('conversations').doc(conversationId).update({
            [updateField]: 0
        });

        // Mark messages as read
        const unreadMessages = await this.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .where('senderId', '!=', user.uid)
            .where('read', '==', false)
            .get();

        const batch = this.db.batch();
        unreadMessages.forEach(doc => {
            batch.update(doc.ref, { read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() });
        });
        await batch.commit();
    }

    /**
     * Get user's conversations
     * @param {string} role - 'customer' or 'seller'
     */
    async getConversations(role = 'customer') {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        const field = role === 'seller' ? 'sellerId' : 'customerId';
        const snapshot = await this.db.collection('conversations')
            .where(field, '==', user.uid)
            .orderBy('updatedAt', 'desc')
            .get();

        const conversations = [];
        snapshot.forEach(doc => {
            conversations.push({ id: doc.id, ...doc.data() });
        });

        return conversations;
    }

    /**
     * Subscribe to conversations list
     */
    subscribeToConversations(role, callback) {
        const user = this.auth.currentUser;
        if (!user) return () => {};

        const field = role === 'seller' ? 'sellerId' : 'customerId';
        const unsubscribe = this.db.collection('conversations')
            .where(field, '==', user.uid)
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snapshot => {
                const conversations = [];
                snapshot.forEach(doc => {
                    conversations.push({ id: doc.id, ...doc.data() });
                });
                callback(conversations);
            });

        this.activeListeners.set('conversations', unsubscribe);
        return unsubscribe;
    }

    /**
     * Get total unread count
     */
    async getUnreadCount(role = 'customer') {
        const user = this.auth.currentUser;
        if (!user) return 0;

        const field = role === 'seller' ? 'sellerId' : 'customerId';
        const unreadField = role === 'seller' ? 'sellerUnread' : 'customerUnread';

        const snapshot = await this.db.collection('conversations')
            .where(field, '==', user.uid)
            .where(unreadField, '>', 0)
            .get();

        let total = 0;
        snapshot.forEach(doc => {
            total += doc.data()[unreadField] || 0;
        });

        return total;
    }

    /**
     * Set typing indicator
     */
    async setTyping(conversationId) {
        const user = this.auth.currentUser;
        if (!user) return;

        const typingRef = this.db.collection('conversations')
            .doc(conversationId)
            .collection('typing')
            .doc(user.uid);

        await typingRef.set({
            name: user.displayName || 'User',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear after 3 seconds
        if (this.typingTimeouts.has(conversationId)) {
            clearTimeout(this.typingTimeouts.get(conversationId));
        }

        const timeout = setTimeout(() => {
            this.stopTyping(conversationId);
        }, 3000);

        this.typingTimeouts.set(conversationId, timeout);
    }

    /**
     * Stop typing indicator
     */
    async stopTyping(conversationId) {
        const user = this.auth.currentUser;
        if (!user) return;

        await this.db.collection('conversations')
            .doc(conversationId)
            .collection('typing')
            .doc(user.uid)
            .delete()
            .catch(() => {});

        if (this.typingTimeouts.has(conversationId)) {
            clearTimeout(this.typingTimeouts.get(conversationId));
            this.typingTimeouts.delete(conversationId);
        }
    }

    /**
     * Subscribe to typing indicators
     */
    subscribeToTyping(conversationId, callback) {
        const user = this.auth.currentUser;

        const unsubscribe = this.db.collection('conversations')
            .doc(conversationId)
            .collection('typing')
            .onSnapshot(snapshot => {
                const typing = [];
                snapshot.forEach(doc => {
                    if (doc.id !== user?.uid) {
                        typing.push({ id: doc.id, ...doc.data() });
                    }
                });
                callback(typing);
            });

        this.activeListeners.set(`typing_${conversationId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Archive a conversation
     */
    async archiveConversation(conversationId) {
        await this.db.collection('conversations').doc(conversationId).update({
            status: 'archived',
            archivedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Delete a conversation (admin/seller only)
     */
    async deleteConversation(conversationId) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const convDoc = await this.db.collection('conversations').doc(conversationId).get();
        if (!convDoc.exists) throw new Error('Conversation not found');

        const conv = convDoc.data();
        if (user.uid !== conv.sellerId) {
            throw new Error('Only sellers can delete conversations');
        }

        // Delete messages
        const messagesSnapshot = await this.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .get();

        const batch = this.db.batch();
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        batch.delete(this.db.collection('conversations').doc(conversationId));

        await batch.commit();
    }

    /**
     * Clean up all listeners
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
        this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.typingTimeouts.clear();
    }

    /**
     * Send a structured message (for negotiations, order updates, etc.)
     */
    async sendStructuredMessage(conversationId, { text, messageType, negotiationData }) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        const convDoc = await this.db.collection('conversations').doc(conversationId).get();
        if (!convDoc.exists) throw new Error('Conversation not found');
        const convData = convDoc.data();

        const isSeller = convData.sellerId === user.uid;
        const senderRole = isSeller ? 'seller' : 'customer';
        const senderName = user.displayName || (isSeller ? 'Seller' : 'Customer');

        const messageDoc = {
            conversationId,
            senderId: user.uid,
            senderName,
            senderRole,
            text: text || '',
            messageType: messageType || 'text',
            negotiationData: negotiationData || null,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const ref = await this.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .add(messageDoc);

        // Update conversation last message
        const updateData = {
            lastMessage: text ? text.substring(0, 100) : (messageType || 'Message'),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isSeller) {
            updateData.customerUnread = firebase.firestore.FieldValue.increment(1);
        } else {
            updateData.sellerUnread = firebase.firestore.FieldValue.increment(1);
        }

        await this.db.collection('conversations').doc(conversationId).update(updateData);

        return { id: ref.id, ...messageDoc };
    }

    /**
     * Start a conversation specifically for a negotiation
     */
    async startNegotiationConversation({ sellerId, sellerName, productId, productName, productImage, negotiationId }) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        // Check for existing negotiation conversation
        const existing = await this.db.collection('conversations')
            .where('customerId', '==', user.uid)
            .where('sellerId', '==', sellerId)
            .where('negotiationId', '==', negotiationId)
            .limit(1)
            .get();

        if (!existing.empty) {
            const doc = existing.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        const conversationData = {
            customerId: user.uid,
            customerName: user.displayName || user.email?.split('@')[0] || 'Customer',
            customerEmail: user.email,
            sellerId,
            sellerName: sellerName || 'Seller',
            type: 'negotiation',
            negotiationId,
            productId,
            productName: productName || null,
            productImage: productImage || null,
            lastMessage: 'Negotiation started',
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            customerUnread: 0,
            sellerUnread: 0,
            unreadCustomer: 0,
            unreadSeller: 0,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const ref = await this.db.collection('conversations').add(conversationData);
        return { id: ref.id, ...conversationData };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.RealtimeChat = RealtimeChat;
}
