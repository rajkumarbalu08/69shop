/* ===================================================
   69SHOP.IN — Price Drop Alerts Module
   Lets customers set target prices and get notified
   when a product's price drops to or below their target.
   =================================================== */

(function () {
    'use strict';

    let _db = null;

    function init({ db }) {
        if (db) _db = db;
    }

    /**
     * Create a new price alert for a product.
     */
    async function createAlert({
        userId, userEmail, userName,
        productId, productName, productImage,
        sellerId, sellerName,
        targetPrice, originalPrice
    }) {
        if (!_db) throw new Error('PriceAlerts not initialized');
        if (!userId || !productId || !targetPrice) throw new Error('Missing required fields');

        // Check for existing alert
        const existing = await checkExistingAlert(userId, productId);
        if (existing) {
            throw new Error('Alert already exists for this product');
        }

        const docRef = await _db.collection('priceAlerts').add({
            userId,
            userEmail: userEmail || '',
            userName: userName || '',
            productId,
            productName: productName || '',
            productImage: productImage || '',
            sellerId: sellerId || '',
            sellerName: sellerName || '',
            targetPrice: Number(targetPrice),
            originalPrice: Number(originalPrice) || 0,
            currentPrice: Number(originalPrice) || 0,
            status: 'active',
            triggered: false,
            triggeredAt: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return docRef.id;
    }

    /**
     * Delete a price alert by ID.
     */
    async function deleteAlert(alertId) {
        if (!_db) throw new Error('PriceAlerts not initialized');
        await _db.collection('priceAlerts').doc(alertId).delete();
    }

    /**
     * Update the target price for an existing alert.
     */
    async function updateTargetPrice(alertId, newTarget) {
        if (!_db) throw new Error('PriceAlerts not initialized');
        await _db.collection('priceAlerts').doc(alertId).update({
            targetPrice: Number(newTarget),
            status: 'active',
            triggered: false,
            triggeredAt: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Dismiss a triggered alert (mark as dismissed).
     */
    async function dismissAlert(alertId) {
        if (!_db) throw new Error('PriceAlerts not initialized');
        await _db.collection('priceAlerts').doc(alertId).update({
            status: 'dismissed',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Load all price alerts for a user.
     * Returns array sorted by createdAt desc.
     */
    async function loadUserAlerts(userId) {
        if (!_db) throw new Error('PriceAlerts not initialized');

        const snapshot = await _db.collection('priceAlerts')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Check if a user already has an active alert for a product.
     * Returns the alert object or null.
     */
    async function checkExistingAlert(userId, productId) {
        if (!_db) return null;

        const snapshot = await _db.collection('priceAlerts')
            .where('userId', '==', userId)
            .where('productId', '==', productId)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    /**
     * Render an alert card for profile page.
     */
    function renderAlertCard(alert) {
        const statusClass = alert.status === 'triggered' ? 'triggered-status'
            : alert.status === 'dismissed' ? 'dismissed-status'
            : 'active-status';

        const statusIcon = alert.status === 'triggered' ? 'fa-arrow-down'
            : alert.status === 'dismissed' ? 'fa-check'
            : 'fa-bell';

        const statusLabel = alert.status === 'triggered' ? 'Price Dropped!'
            : alert.status === 'dismissed' ? 'Dismissed'
            : 'Monitoring';

        const cardClass = alert.status === 'triggered' ? 'price-alert-card triggered' : 'price-alert-card';

        const img = alert.productImage || '/Logo/placeholder.svg';
        const currentPrice = alert.currentPrice || alert.originalPrice || 0;
        const targetPrice = alert.targetPrice || 0;

        return `
            <div class="${cardClass}" data-alert-id="${alert.id}">
                <div class="price-alert-card-image">
                    <img src="${img}" alt="${alert.productName || 'Product'}" onerror="this.src='/Logo/placeholder.svg'">
                </div>
                <div class="price-alert-card-info">
                    <h4>${alert.productName || 'Product'}</h4>
                    <div class="alert-prices">
                        <span class="current-label">Current:</span>
                        <span class="current-value">\u20B9${currentPrice.toLocaleString('en-IN')}</span>
                        <span class="target-label">Target:</span>
                        <span class="target-value">\u20B9${targetPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <span class="alert-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusLabel}
                    </span>
                </div>
                <div class="price-alert-card-actions">
                    <a href="/product.html?id=${alert.productId}" class="btn-view-product">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <button class="btn-delete-alert" onclick="PriceAlerts._handleDelete('${alert.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Internal handler for delete from card button.
     */
    async function _handleDelete(alertId) {
        if (!confirm('Remove this price alert?')) return;
        try {
            await deleteAlert(alertId);
            const card = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(20px)';
                setTimeout(() => card.remove(), 300);
            }
            // Update count if available
            const countEl = document.getElementById('cardAlertsCount');
            if (countEl) {
                const c = parseInt(countEl.textContent) || 0;
                countEl.textContent = Math.max(0, c - 1);
            }
        } catch (err) {
            console.error('Failed to delete alert:', err);
        }
    }

    // Expose module
    window.PriceAlerts = {
        init,
        createAlert,
        deleteAlert,
        updateTargetPrice,
        dismissAlert,
        loadUserAlerts,
        checkExistingAlert,
        renderAlertCard,
        _handleDelete
    };
})();
