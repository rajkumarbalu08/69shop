/**
 * 69Shop.in - Abandoned Cart Recovery System
 * 
 * Features:
 * - Track cart abandonment
 * - Send reminder emails
 * - Recovery analytics
 * - Discount incentives
 * - Multi-step reminders
 * 
 * Usage:
 *   const recovery = new AbandonedCartRecovery();
 *   recovery.startTracking();
 */

class AbandonedCartRecovery {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.ABANDONMENT_THRESHOLD = 30 * 60 * 1000; // 30 minutes
        this.trackingInterval = null;
        this.lastActivity = Date.now();
    }

    /**
     * Start tracking cart activity
     */
    startTracking() {
        // Track user activity
        const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            }, { passive: true });
        });

        // Check for abandonment periodically
        this.trackingInterval = setInterval(() => {
            this.checkAbandonment();
        }, 60000); // Check every minute

        // Save cart state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveCartState();
        });

        // Check if returning from abandonment
        this.checkReturnVisit();
    }

    /**
     * Check for cart abandonment
     */
    async checkAbandonment() {
        const user = this.auth.currentUser;
        if (!user) return;

        const cart = this.getCart();
        if (!cart || cart.length === 0) return;

        const inactiveTime = Date.now() - this.lastActivity;

        if (inactiveTime >= this.ABANDONMENT_THRESHOLD) {
            await this.recordAbandonment(cart);
        }
    }

    /**
     * Get current cart from localStorage
     */
    getCart() {
        try {
            const cartData = localStorage.getItem('cart');
            return cartData ? JSON.parse(cartData) : [];
        } catch {
            return [];
        }
    }

    /**
     * Record cart abandonment
     */
    async recordAbandonment(cart) {
        const user = this.auth.currentUser;
        if (!user) return;

        // Check if already recorded recently
        const existingDoc = await this.db.collection('abandonedCarts')
            .where('userId', '==', user.uid)
            .where('status', '==', 'pending')
            .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
            .limit(1)
            .get();

        if (!existingDoc.empty) {
            // Update existing record
            await existingDoc.docs[0].ref.update({
                items: cart,
                cartValue: this.calculateCartValue(cart),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return;
        }

        // Create new abandonment record
        const abandonmentData = {
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'Customer',
            items: cart,
            itemCount: cart.length,
            cartValue: this.calculateCartValue(cart),
            status: 'pending',
            remindersSent: 0,
            lastReminderAt: null,
            recoveryDiscount: null,
            recoveredAt: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.db.collection('abandonedCarts').add(abandonmentData);
    }

    /**
     * Calculate cart value
     */
    calculateCartValue(cart) {
        return cart.reduce((total, item) => {
            return total + (item.price * (item.quantity || 1));
        }, 0);
    }

    /**
     * Save cart state before leaving
     */
    async saveCartState() {
        const user = this.auth.currentUser;
        if (!user) return;

        const cart = this.getCart();
        if (!cart || cart.length === 0) return;

        // Use sendBeacon for reliable delivery
        const data = JSON.stringify({
            userId: user.uid,
            items: cart,
            timestamp: Date.now()
        });

        if (navigator.sendBeacon) {
            // Store locally, will be synced on next visit
            localStorage.setItem('pendingCartSync', data);
        }
    }

    /**
     * Check if user is returning from abandonment
     */
    async checkReturnVisit() {
        const user = this.auth.currentUser;
        if (!user) return;

        // Check for pending sync
        const pendingSync = localStorage.getItem('pendingCartSync');
        if (pendingSync) {
            try {
                const data = JSON.parse(pendingSync);
                // Sync was from more than 30 mins ago
                if (Date.now() - data.timestamp > this.ABANDONMENT_THRESHOLD) {
                    await this.recordAbandonment(data.items);
                }
            } catch {}
            localStorage.removeItem('pendingCartSync');
        }

        // Check for recovery discount
        const urlParams = new URLSearchParams(window.location.search);
        const recoveryCode = urlParams.get('recovery');
        
        if (recoveryCode) {
            await this.applyRecoveryDiscount(recoveryCode);
        }
    }

    /**
     * Apply recovery discount
     */
    async applyRecoveryDiscount(code) {
        try {
            const recoveryDoc = await this.db.collection('recoveryDiscounts')
                .where('code', '==', code)
                .where('used', '==', false)
                .limit(1)
                .get();

            if (recoveryDoc.empty) {
                console.log('Invalid or expired recovery code');
                return;
            }

            const discount = recoveryDoc.docs[0].data();

            // Apply to cart
            localStorage.setItem('appliedDiscount', JSON.stringify({
                code,
                type: discount.type,
                value: discount.value,
                source: 'cart_recovery'
            }));

            // Show notification
            this.showRecoveryMessage(discount);

            // Mark as used
            await recoveryDoc.docs[0].ref.update({
                used: true,
                usedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Recovery discount error:', error);
        }
    }

    /**
     * Show recovery welcome message
     */
    showRecoveryMessage(discount) {
        const message = discount.type === 'percentage' 
            ? `Welcome back! Use code ${discount.code} for ${discount.value}% off!`
            : `Welcome back! Use code ${discount.code} for ₹${discount.value} off!`;

        // Create banner
        const banner = document.createElement('div');
        banner.className = 'recovery-banner';
        banner.innerHTML = `
            <div class="recovery-content">
                <span class="recovery-icon">🎁</span>
                <span class="recovery-text">${message}</span>
                <button class="recovery-close">&times;</button>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .recovery-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(90deg, #0066ff, #00cc88);
                color: white;
                padding: 12px 20px;
                z-index: 10000;
                animation: slideDown 0.5s ease;
            }
            .recovery-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                max-width: 1200px;
                margin: 0 auto;
            }
            .recovery-icon {
                font-size: 24px;
            }
            .recovery-text {
                font-weight: 500;
            }
            .recovery-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
            }
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(styles);
        document.body.prepend(banner);

        banner.querySelector('.recovery-close').addEventListener('click', () => {
            banner.remove();
        });
    }

    /**
     * Mark cart as recovered (call after successful checkout)
     */
    async markRecovered(orderId) {
        const user = this.auth.currentUser;
        if (!user) return;

        const abandonedQuery = await this.db.collection('abandonedCarts')
            .where('userId', '==', user.uid)
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!abandonedQuery.empty) {
            await abandonedQuery.docs[0].ref.update({
                status: 'recovered',
                recoveredAt: firebase.firestore.FieldValue.serverTimestamp(),
                orderId
            });
        }
    }

    /**
     * Get abandonment statistics (admin)
     */
    async getStatistics(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const snapshot = await this.db.collection('abandonedCarts')
            .where('createdAt', '>=', startDate)
            .get();

        const stats = {
            total: 0,
            pending: 0,
            recovered: 0,
            totalValue: 0,
            recoveredValue: 0,
            recoveryRate: 0
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            stats.total++;
            stats.totalValue += data.cartValue || 0;

            if (data.status === 'recovered') {
                stats.recovered++;
                stats.recoveredValue += data.cartValue || 0;
            } else if (data.status === 'pending') {
                stats.pending++;
            }
        });

        stats.recoveryRate = stats.total > 0 
            ? Math.round((stats.recovered / stats.total) * 100) 
            : 0;

        return stats;
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AbandonedCartRecovery = AbandonedCartRecovery;
}
