/**
 * 69Shop.in - Customer Support Ticketing System
 * 
 * Features:
 * - Create support tickets
 * - Category-based routing
 * - Priority levels
 * - File attachments
 * - Ticket history
 * - Status tracking
 * - Agent assignment
 * - Satisfaction rating
 * 
 * Usage:
 *   const support = new CustomerSupport();
 *   await support.createTicket({ subject: 'Order issue', message: '...' });
 */

class CustomerSupport {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage ? firebase.storage() : null;
    }

    // Ticket categories
    static CATEGORIES = {
        ORDER: { id: 'order', label: 'Order Issues', icon: '📦' },
        PAYMENT: { id: 'payment', label: 'Payment & Refunds', icon: '💳' },
        DELIVERY: { id: 'delivery', label: 'Delivery Problems', icon: '🚚' },
        PRODUCT: { id: 'product', label: 'Product Questions', icon: '❓' },
        ACCOUNT: { id: 'account', label: 'Account Help', icon: '👤' },
        SELLER: { id: 'seller', label: 'Seller Complaint', icon: '🏪' },
        TECHNICAL: { id: 'technical', label: 'Technical Issue', icon: '🔧' },
        OTHER: { id: 'other', label: 'Other', icon: '📝' }
    };

    // Priority levels
    static PRIORITIES = {
        LOW: { id: 'low', label: 'Low', color: '#28a745', sla: 72 },
        MEDIUM: { id: 'medium', label: 'Medium', color: '#ffc107', sla: 24 },
        HIGH: { id: 'high', label: 'High', color: '#fd7e14', sla: 8 },
        URGENT: { id: 'urgent', label: 'Urgent', color: '#dc3545', sla: 2 }
    };

    // Status values
    static STATUS = {
        OPEN: 'open',
        IN_PROGRESS: 'in_progress',
        WAITING_CUSTOMER: 'waiting_customer',
        RESOLVED: 'resolved',
        CLOSED: 'closed'
    };

    /**
     * Create a new support ticket
     * @param {Object} ticketData - Ticket details
     */
    async createTicket(ticketData) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in to create a ticket');
        }

        // Validate required fields
        if (!ticketData.subject || !ticketData.message) {
            throw new Error('Subject and message are required');
        }

        // Generate ticket number
        const ticketNumber = await this.generateTicketNumber();

        const ticket = {
            ticketNumber,
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'Customer',
            userPhone: ticketData.phone || null,
            
            subject: ticketData.subject.trim(),
            category: ticketData.category || 'other',
            priority: ticketData.priority || 'medium',
            
            orderId: ticketData.orderId || null,
            productId: ticketData.productId || null,
            sellerId: ticketData.sellerId || null,
            
            status: CustomerSupport.STATUS.OPEN,
            assignedTo: null,
            assignedAt: null,
            
            slaDeadline: this.calculateSLA(ticketData.priority),
            breachedSLA: false,
            
            messageCount: 1,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageBy: 'customer',
            
            satisfactionRating: null,
            satisfactionFeedback: null,
            
            tags: ticketData.tags || [],
            attachments: [],
            
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            resolvedAt: null,
            closedAt: null
        };

        // Create ticket
        const ticketRef = await this.db.collection('customerTickets').add(ticket);

        // Add initial message
        await this.db.collection('customerTickets')
            .doc(ticketRef.id)
            .collection('messages')
            .add({
                senderId: user.uid,
                senderName: user.displayName || 'Customer',
                senderType: 'customer',
                message: ticketData.message.trim(),
                attachments: ticketData.attachments || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Handle attachments
        if (ticketData.files && ticketData.files.length > 0) {
            const attachments = await this.uploadAttachments(ticketRef.id, ticketData.files);
            await ticketRef.update({ attachments });
        }

        return {
            id: ticketRef.id,
            ticketNumber,
            ...ticket
        };
    }

    /**
     * Generate unique ticket number
     */
    async generateTicketNumber() {
        const date = new Date();
        const prefix = 'TKT';
        const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}${datePart}${random}`;
    }

    /**
     * Calculate SLA deadline based on priority
     */
    calculateSLA(priority) {
        const hours = CustomerSupport.PRIORITIES[priority.toUpperCase()]?.sla || 24;
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + hours);
        return deadline;
    }

    /**
     * Upload attachments
     */
    async uploadAttachments(ticketId, files) {
        if (!this.storage) {
            throw new Error('Storage not available');
        }

        const attachments = [];
        
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }

            const fileName = `support/${ticketId}/${Date.now()}_${file.name}`;
            const storageRef = this.storage.ref(fileName);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();

            attachments.push({
                name: file.name,
                url,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString()
            });
        }

        return attachments;
    }

    /**
     * Get user's tickets
     */
    async getMyTickets(filters = {}) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        let query = this.db.collection('customerTickets')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc');

        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const snapshot = await query.get();
        const tickets = [];

        snapshot.forEach(doc => {
            tickets.push({ id: doc.id, ...doc.data() });
        });

        return tickets;
    }

    /**
     * Get ticket details with messages
     */
    async getTicket(ticketId) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const ticketDoc = await this.db.collection('customerTickets').doc(ticketId).get();
        
        if (!ticketDoc.exists) {
            throw new Error('Ticket not found');
        }

        const ticket = { id: ticketDoc.id, ...ticketDoc.data() };

        // Verify ownership
        if (ticket.userId !== user.uid) {
            throw new Error('Not authorized to view this ticket');
        }

        // Get messages
        const messagesSnapshot = await this.db.collection('customerTickets')
            .doc(ticketId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .get();

        ticket.messages = [];
        messagesSnapshot.forEach(doc => {
            ticket.messages.push({ id: doc.id, ...doc.data() });
        });

        return ticket;
    }

    /**
     * Add reply to ticket
     */
    async replyToTicket(ticketId, message, attachments = []) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const ticketRef = this.db.collection('customerTickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists || ticketDoc.data().userId !== user.uid) {
            throw new Error('Not authorized');
        }

        // Add message
        await ticketRef.collection('messages').add({
            senderId: user.uid,
            senderName: user.displayName || 'Customer',
            senderType: 'customer',
            message: message.trim(),
            attachments,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update ticket
        await ticketRef.update({
            messageCount: firebase.firestore.FieldValue.increment(1),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageBy: 'customer',
            status: CustomerSupport.STATUS.OPEN, // Reopen if was waiting
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Close ticket with satisfaction rating
     */
    async closeTicket(ticketId, rating = null, feedback = '') {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const ticketRef = this.db.collection('customerTickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists || ticketDoc.data().userId !== user.uid) {
            throw new Error('Not authorized');
        }

        await ticketRef.update({
            status: CustomerSupport.STATUS.CLOSED,
            satisfactionRating: rating,
            satisfactionFeedback: feedback,
            closedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Reopen a closed ticket
     */
    async reopenTicket(ticketId, reason) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const ticketRef = this.db.collection('customerTickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists || ticketDoc.data().userId !== user.uid) {
            throw new Error('Not authorized');
        }

        // Add reopen message
        await ticketRef.collection('messages').add({
            senderId: user.uid,
            senderName: user.displayName || 'Customer',
            senderType: 'customer',
            message: `[Ticket reopened] ${reason}`,
            isSystemMessage: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await ticketRef.update({
            status: CustomerSupport.STATUS.OPEN,
            resolvedAt: null,
            closedAt: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Subscribe to ticket updates
     */
    subscribeToTicket(ticketId, callback) {
        return this.db.collection('customerTickets')
            .doc(ticketId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });
                callback(messages);
            });
    }

    /**
     * Get ticket statistics for user
     */
    async getMyTicketStats() {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const snapshot = await this.db.collection('customerTickets')
            .where('userId', '==', user.uid)
            .get();

        const stats = {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0
        };

        snapshot.forEach(doc => {
            const ticket = doc.data();
            stats.total++;
            
            switch (ticket.status) {
                case CustomerSupport.STATUS.OPEN:
                case CustomerSupport.STATUS.WAITING_CUSTOMER:
                    stats.open++;
                    break;
                case CustomerSupport.STATUS.IN_PROGRESS:
                    stats.inProgress++;
                    break;
                case CustomerSupport.STATUS.RESOLVED:
                    stats.resolved++;
                    break;
                case CustomerSupport.STATUS.CLOSED:
                    stats.closed++;
                    break;
            }
        });

        return stats;
    }

    /**
     * Render ticket form
     */
    renderTicketForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = Object.values(CustomerSupport.CATEGORIES);

        container.innerHTML = `
            <form id="support-ticket-form" class="support-form">
                <div class="form-group">
                    <label for="ticket-category">Category *</label>
                    <select id="ticket-category" required>
                        <option value="">Select category...</option>
                        ${categories.map(cat => `
                            <option value="${cat.id}">${cat.icon} ${cat.label}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ticket-subject">Subject *</label>
                    <input type="text" id="ticket-subject" placeholder="Brief description of your issue" required maxlength="150">
                </div>
                
                <div class="form-group">
                    <label for="ticket-order">Order ID (if applicable)</label>
                    <input type="text" id="ticket-order" placeholder="e.g., ORD123456">
                </div>
                
                <div class="form-group">
                    <label for="ticket-message">Description *</label>
                    <textarea id="ticket-message" rows="5" placeholder="Please describe your issue in detail..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="ticket-files">Attachments</label>
                    <input type="file" id="ticket-files" multiple accept="image/*,.pdf,.doc,.docx">
                    <small>Max 10MB per file. Images, PDF, Word documents accepted.</small>
                </div>
                
                <button type="submit" class="submit-btn">
                    <span>Submit Ticket</span>
                </button>
            </form>
        `;

        // Add styles
        this.addFormStyles();

        // Handle submission
        container.querySelector('#support-ticket-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = e.target.querySelector('.submit-btn');
            btn.disabled = true;
            btn.innerHTML = '<span>Submitting...</span>';

            try {
                const ticket = await this.createTicket({
                    category: document.getElementById('ticket-category').value,
                    subject: document.getElementById('ticket-subject').value,
                    orderId: document.getElementById('ticket-order').value || null,
                    message: document.getElementById('ticket-message').value,
                    files: document.getElementById('ticket-files').files
                });

                // Show success
                container.innerHTML = `
                    <div class="ticket-success">
                        <div class="success-icon">✅</div>
                        <h3>Ticket Created Successfully!</h3>
                        <p>Your ticket number is: <strong>${ticket.ticketNumber}</strong></p>
                        <p>We'll get back to you within 24 hours.</p>
                        <a href="/support.html" class="btn">View My Tickets</a>
                    </div>
                `;
            } catch (error) {
                btn.disabled = false;
                btn.innerHTML = '<span>Submit Ticket</span>';
                alert('Error: ' + error.message);
            }
        });
    }

    /**
     * Add form styles
     */
    addFormStyles() {
        if (document.getElementById('support-form-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'support-form-styles';
        styles.textContent = `
            .support-form {
                max-width: 600px;
                margin: 0 auto;
            }
            .support-form .form-group {
                margin-bottom: 20px;
            }
            .support-form label {
                display: block;
                font-weight: 600;
                margin-bottom: 8px;
                color: #1a1a1a;
            }
            .support-form input,
            .support-form select,
            .support-form textarea {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 15px;
                transition: border-color 0.2s;
            }
            .support-form input:focus,
            .support-form select:focus,
            .support-form textarea:focus {
                border-color: #0066ff;
                outline: none;
            }
            .support-form small {
                display: block;
                margin-top: 6px;
                color: #666;
                font-size: 13px;
            }
            .support-form .submit-btn {
                width: 100%;
                padding: 14px 24px;
                background: #0066ff;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .support-form .submit-btn:hover {
                background: #0052cc;
            }
            .support-form .submit-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .ticket-success {
                text-align: center;
                padding: 40px;
            }
            .ticket-success .success-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            .ticket-success h3 {
                color: #28a745;
                margin-bottom: 12px;
            }
            .ticket-success .btn {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #0066ff;
                color: white;
                text-decoration: none;
                border-radius: 8px;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.CustomerSupport = CustomerSupport;
}
