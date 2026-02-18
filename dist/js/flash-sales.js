/**
 * 69Shop.in - Flash Sales Timer System
 * 
 * Features:
 * - Create time-limited deals
 * - Countdown timers
 * - Stock quantity limits
 * - Early access for members
 * - Sale analytics
 * - Automatic price reversion
 * 
 * Usage:
 *   const flashSale = new FlashSalesManager();
 *   await flashSale.createSale(saleData);
 *   flashSale.renderTimer(containerId, saleId);
 */

class FlashSalesManager {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.activeTimers = new Map();
    }

    /**
     * Create a new flash sale
     * @param {Object} saleData - Sale configuration
     */
    async createSale(saleData) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const sale = {
            title: saleData.title || 'Flash Sale',
            description: saleData.description || '',
            products: saleData.products || [], // Array of { productId, salePrice, quantity }
            startTime: saleData.startTime,
            endTime: saleData.endTime,
            sellerId: saleData.sellerId || user.uid,
            earlyAccessMinutes: saleData.earlyAccessMinutes || 0,
            maxPerCustomer: saleData.maxPerCustomer || 1,
            requiresLogin: saleData.requiresLogin !== false,
            status: 'scheduled',
            totalSold: 0,
            totalRevenue: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Validate times
        if (new Date(sale.endTime) <= new Date(sale.startTime)) {
            throw new Error('End time must be after start time');
        }

        const saleRef = await this.db.collection('flashSales').add(sale);

        // Create product snapshots
        for (const product of sale.products) {
            await this.db.collection('flashSales')
                .doc(saleRef.id)
                .collection('saleProducts')
                .doc(product.productId)
                .set({
                    productId: product.productId,
                    salePrice: product.salePrice,
                    originalPrice: product.originalPrice,
                    quantity: product.quantity,
                    sold: 0,
                    reserved: 0
                });
        }

        return { id: saleRef.id, ...sale };
    }

    /**
     * Get active flash sales
     */
    async getActiveSales() {
        const now = new Date();

        const snapshot = await this.db.collection('flashSales')
            .where('status', 'in', ['scheduled', 'active'])
            .where('endTime', '>', now)
            .orderBy('endTime')
            .limit(20)
            .get();

        const sales = [];
        for (const doc of snapshot.docs) {
            const sale = { id: doc.id, ...doc.data() };
            
            // Get products
            const productsSnapshot = await doc.ref.collection('saleProducts').get();
            sale.products = [];
            productsSnapshot.forEach(pDoc => {
                sale.products.push({ id: pDoc.id, ...pDoc.data() });
            });

            sales.push(sale);
        }

        return sales;
    }

    /**
     * Get a specific flash sale
     */
    async getSale(saleId) {
        const doc = await this.db.collection('flashSales').doc(saleId).get();
        if (!doc.exists) throw new Error('Sale not found');

        const sale = { id: doc.id, ...doc.data() };

        // Get products
        const productsSnapshot = await doc.ref.collection('saleProducts').get();
        sale.products = [];
        productsSnapshot.forEach(pDoc => {
            sale.products.push({ id: pDoc.id, ...pDoc.data() });
        });

        return sale;
    }

    /**
     * Check if sale is currently active
     */
    isSaleActive(sale) {
        const now = new Date();
        const start = sale.startTime.toDate ? sale.startTime.toDate() : new Date(sale.startTime);
        const end = sale.endTime.toDate ? sale.endTime.toDate() : new Date(sale.endTime);

        return now >= start && now <= end;
    }

    /**
     * Check if user has early access
     */
    async hasEarlyAccess(saleId) {
        const user = this.auth.currentUser;
        if (!user) return false;

        // Check if user is a premium member or on early access list
        const accessDoc = await this.db.collection('flashSales')
            .doc(saleId)
            .collection('earlyAccess')
            .doc(user.uid)
            .get();

        return accessDoc.exists;
    }

    /**
     * Get time remaining for a sale
     */
    getTimeRemaining(endTime) {
        const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
        const now = new Date();
        const diff = end - now;

        if (diff <= 0) {
            return { expired: true, hours: 0, minutes: 0, seconds: 0, total: 0 };
        }

        return {
            expired: false,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            total: diff
        };
    }

    /**
     * Get time until sale starts
     */
    getTimeUntilStart(startTime) {
        const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
        const now = new Date();
        const diff = start - now;

        if (diff <= 0) {
            return { started: true };
        }

        return {
            started: false,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            total: diff
        };
    }

    /**
     * Render countdown timer
     * @param {string} containerId - Container element ID
     * @param {Object} sale - Sale object or end time
     */
    renderTimer(containerId, sale) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const endTime = sale.endTime || sale;
        const startTime = sale.startTime;

        // Check if sale hasn't started yet
        if (startTime) {
            const startCheck = this.getTimeUntilStart(startTime);
            if (!startCheck.started) {
                container.innerHTML = this.createTimerHTML(startCheck, true);
                container.classList.add('flash-timer', 'flash-timer-upcoming');
            }
        }

        const updateTimer = () => {
            // First check if sale has started
            if (startTime) {
                const startCheck = this.getTimeUntilStart(startTime);
                if (!startCheck.started) {
                    container.innerHTML = this.createTimerHTML(startCheck, true);
                    return;
                }
            }

            const time = this.getTimeRemaining(endTime);
            
            if (time.expired) {
                container.innerHTML = '<div class="flash-expired">SALE ENDED</div>';
                container.classList.add('expired');
                this.stopTimer(containerId);
                return;
            }

            container.innerHTML = this.createTimerHTML(time, false);
            container.classList.add('flash-timer', 'flash-timer-active');
        };

        // Initial render
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);
        this.activeTimers.set(containerId, interval);

        // Add styles if not present
        this.addTimerStyles();

        return () => this.stopTimer(containerId);
    }

    /**
     * Create timer HTML
     */
    createTimerHTML(time, isUpcoming = false) {
        const label = isUpcoming ? 'STARTS IN' : 'ENDS IN';
        const urgencyClass = time.total < 3600000 ? 'urgent' : ''; // Less than 1 hour

        return `
            <div class="flash-timer-label">${label}</div>
            <div class="flash-timer-digits ${urgencyClass}">
                ${time.days > 0 ? `
                    <div class="flash-timer-unit">
                        <span class="flash-timer-value">${String(time.days).padStart(2, '0')}</span>
                        <span class="flash-timer-text">DAYS</span>
                    </div>
                    <span class="flash-timer-sep">:</span>
                ` : ''}
                <div class="flash-timer-unit">
                    <span class="flash-timer-value">${String(time.hours).padStart(2, '0')}</span>
                    <span class="flash-timer-text">HRS</span>
                </div>
                <span class="flash-timer-sep">:</span>
                <div class="flash-timer-unit">
                    <span class="flash-timer-value">${String(time.minutes).padStart(2, '0')}</span>
                    <span class="flash-timer-text">MIN</span>
                </div>
                <span class="flash-timer-sep">:</span>
                <div class="flash-timer-unit">
                    <span class="flash-timer-value">${String(time.seconds).padStart(2, '0')}</span>
                    <span class="flash-timer-text">SEC</span>
                </div>
            </div>
        `;
    }

    /**
     * Add timer styles
     */
    addTimerStyles() {
        if (document.getElementById('flash-timer-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'flash-timer-styles';
        styles.textContent = `
            .flash-timer {
                text-align: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #ff4444, #ff6b6b);
                border-radius: 12px;
                color: white;
            }
            .flash-timer-upcoming {
                background: linear-gradient(135deg, #0066ff, #00aaff);
            }
            .flash-timer-label {
                font-size: 11px;
                letter-spacing: 2px;
                margin-bottom: 8px;
                opacity: 0.9;
            }
            .flash-timer-digits {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 4px;
            }
            .flash-timer-digits.urgent {
                animation: pulse 1s infinite;
            }
            .flash-timer-unit {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 45px;
            }
            .flash-timer-value {
                font-size: 28px;
                font-weight: 700;
                line-height: 1;
                font-family: 'Courier New', monospace;
            }
            .flash-timer-text {
                font-size: 9px;
                letter-spacing: 1px;
                opacity: 0.8;
                margin-top: 4px;
            }
            .flash-timer-sep {
                font-size: 24px;
                font-weight: 700;
                opacity: 0.6;
                margin-top: -12px;
            }
            .flash-expired {
                font-size: 18px;
                font-weight: 700;
                padding: 20px;
                background: #666;
                border-radius: 12px;
                color: white;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Stop a timer
     */
    stopTimer(containerId) {
        const interval = this.activeTimers.get(containerId);
        if (interval) {
            clearInterval(interval);
            this.activeTimers.delete(containerId);
        }
    }

    /**
     * Stop all timers
     */
    stopAllTimers() {
        this.activeTimers.forEach((interval, id) => {
            clearInterval(interval);
        });
        this.activeTimers.clear();
    }

    /**
     * Reserve product during flash sale
     */
    async reserveProduct(saleId, productId, quantity = 1) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const sale = await this.getSale(saleId);
        
        if (!this.isSaleActive(sale)) {
            throw new Error('Sale is not currently active');
        }

        const productRef = this.db.collection('flashSales')
            .doc(saleId)
            .collection('saleProducts')
            .doc(productId);

        return this.db.runTransaction(async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists) throw new Error('Product not found');

            const product = productDoc.data();
            const available = product.quantity - product.sold - product.reserved;

            if (available < quantity) {
                throw new Error('Not enough stock available');
            }

            // Check max per customer
            const purchaseQuery = await this.db.collection('flashSales')
                .doc(saleId)
                .collection('purchases')
                .where('userId', '==', user.uid)
                .where('productId', '==', productId)
                .get();

            let customerPurchased = 0;
            purchaseQuery.forEach(doc => {
                customerPurchased += doc.data().quantity;
            });

            if (customerPurchased + quantity > sale.maxPerCustomer) {
                throw new Error(`Maximum ${sale.maxPerCustomer} per customer`);
            }

            // Reserve the product
            transaction.update(productRef, {
                reserved: firebase.firestore.FieldValue.increment(quantity)
            });

            return {
                success: true,
                reserved: quantity,
                salePrice: product.salePrice
            };
        });
    }

    /**
     * Complete flash sale purchase
     */
    async completePurchase(saleId, productId, orderId, quantity = 1) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        const saleRef = this.db.collection('flashSales').doc(saleId);
        const productRef = saleRef.collection('saleProducts').doc(productId);

        const productDoc = await productRef.get();
        if (!productDoc.exists) throw new Error('Product not found');

        const product = productDoc.data();

        // Record purchase
        await saleRef.collection('purchases').add({
            userId: user.uid,
            productId,
            quantity,
            price: product.salePrice,
            orderId,
            purchasedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update product counts
        await productRef.update({
            sold: firebase.firestore.FieldValue.increment(quantity),
            reserved: firebase.firestore.FieldValue.increment(-quantity)
        });

        // Update sale totals
        await saleRef.update({
            totalSold: firebase.firestore.FieldValue.increment(quantity),
            totalRevenue: firebase.firestore.FieldValue.increment(quantity * product.salePrice)
        });

        return { success: true };
    }

    /**
     * Get flash sale analytics
     */
    async getSaleAnalytics(saleId) {
        const sale = await this.getSale(saleId);

        const purchasesSnapshot = await this.db.collection('flashSales')
            .doc(saleId)
            .collection('purchases')
            .get();

        const hourlyPurchases = {};
        let uniqueCustomers = new Set();

        purchasesSnapshot.forEach(doc => {
            const purchase = doc.data();
            uniqueCustomers.add(purchase.userId);

            if (purchase.purchasedAt) {
                const hour = purchase.purchasedAt.toDate().getHours();
                hourlyPurchases[hour] = (hourlyPurchases[hour] || 0) + purchase.quantity;
            }
        });

        return {
            ...sale,
            uniqueCustomers: uniqueCustomers.size,
            hourlyPurchases,
            averageOrderValue: sale.totalSold > 0 ? sale.totalRevenue / purchasesSnapshot.size : 0
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.FlashSalesManager = FlashSalesManager;
}
