/**
 * 69Shop.in - Loyalty Rewards System
 * Version: 1.0.0
 * 
 * Provides tiered discounts for retained customers based on:
 * - Number of orders placed
 * - Total amount spent
 * - Account age (how long they've been a customer)
 * 
 * Tiers:
 * - Bronze: 0-2 orders or new customers (0% discount)
 * - Silver: 3-5 orders or ₹5,000+ spent (3% discount)
 * - Gold: 6-10 orders or ₹15,000+ spent (5% discount)
 * - Platinum: 11-20 orders or ₹30,000+ spent (8% discount)
 * - Diamond: 21+ orders or ₹50,000+ spent (12% discount)
 */

(function(global) {
    'use strict';

    const TIERS = {
        bronze: {
            name: 'Bronze',
            icon: '🥉',
            minOrders: 0,
            minSpent: 0,
            discount: 0,
            color: '#CD7F32',
            benefits: ['Standard shipping rates', 'Basic customer support']
        },
        silver: {
            name: 'Silver',
            icon: '🥈',
            minOrders: 3,
            minSpent: 5000,
            discount: 3,
            color: '#C0C0C0',
            benefits: ['3% off all orders', 'Priority customer support', 'Early access to sales']
        },
        gold: {
            name: 'Gold',
            icon: '🥇',
            minOrders: 6,
            minSpent: 15000,
            discount: 5,
            color: '#FFD700',
            benefits: ['5% off all orders', 'Free shipping on orders ₹300+', 'Exclusive member deals']
        },
        platinum: {
            name: 'Platinum',
            icon: '💎',
            minOrders: 11,
            minSpent: 30000,
            discount: 8,
            color: '#E5E4E2',
            benefits: ['8% off all orders', 'Free shipping all orders', 'VIP early access', 'Birthday bonus']
        },
        diamond: {
            name: 'Diamond',
            icon: '👑',
            minOrders: 21,
            minSpent: 50000,
            discount: 12,
            color: '#B9F2FF',
            benefits: ['12% off all orders', 'Free express shipping', 'Personal shopper', 'Exclusive previews']
        }
    };

    const STORAGE_KEY = '69shop_loyalty';

    /**
     * Get loyalty data from localStorage
     */
    function getLoyaltyData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Error reading loyalty data:', e);
        }
        return {
            orderCount: 0,
            totalSpent: 0,
            joinDate: new Date().toISOString(),
            lastOrderDate: null,
            tier: 'bronze'
        };
    }

    /**
     * Save loyalty data to localStorage
     */
    function saveLoyaltyData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving loyalty data:', e);
        }
    }

    /**
     * Calculate tier based on order count and total spent
     */
    function calculateTier(orderCount, totalSpent) {
        // Check from highest tier to lowest
        if (orderCount >= TIERS.diamond.minOrders || totalSpent >= TIERS.diamond.minSpent) {
            return 'diamond';
        }
        if (orderCount >= TIERS.platinum.minOrders || totalSpent >= TIERS.platinum.minSpent) {
            return 'platinum';
        }
        if (orderCount >= TIERS.gold.minOrders || totalSpent >= TIERS.gold.minSpent) {
            return 'gold';
        }
        if (orderCount >= TIERS.silver.minOrders || totalSpent >= TIERS.silver.minSpent) {
            return 'silver';
        }
        return 'bronze';
    }

    /**
     * Get current customer tier
     */
    function getCurrentTier() {
        const data = getLoyaltyData();
        const tier = calculateTier(data.orderCount, data.totalSpent);
        return TIERS[tier];
    }

    /**
     * Get discount percentage for current tier
     */
    function getDiscountPercentage() {
        return getCurrentTier().discount;
    }

    /**
     * Calculate discount amount for a given cart total
     */
    function calculateDiscount(cartTotal) {
        const percentage = getDiscountPercentage();
        return Math.round((cartTotal * percentage) / 100);
    }

    /**
     * Record a completed order
     */
    function recordOrder(orderTotal) {
        const data = getLoyaltyData();
        const oldTier = calculateTier(data.orderCount, data.totalSpent);
        
        data.orderCount += 1;
        data.totalSpent += orderTotal;
        data.lastOrderDate = new Date().toISOString();
        data.tier = calculateTier(data.orderCount, data.totalSpent);
        
        saveLoyaltyData(data);
        
        // Check if tier upgraded
        if (data.tier !== oldTier) {
            showTierUpgradeNotification(TIERS[data.tier]);
        }
        
        return data;
    }

    /**
     * Show tier upgrade notification
     */
    function showTierUpgradeNotification(newTier) {
        // Check if showToast exists
        if (typeof global.showToast === 'function') {
            global.showToast(
                `🎉 Congratulations! You've been upgraded to ${newTier.icon} ${newTier.name} tier! Enjoy ${newTier.discount}% off on all orders!`,
                'success',
                5000
            );
        }
        
        // Create a celebration modal
        const modal = document.createElement('div');
        modal.className = 'loyalty-upgrade-modal';
        modal.innerHTML = `
            <div class="loyalty-upgrade-content">
                <button class="loyalty-upgrade-close">&times;</button>
                <div class="loyalty-upgrade-icon">${newTier.icon}</div>
                <h2>Tier Upgrade!</h2>
                <h3 style="color: ${newTier.color};">${newTier.name} Member</h3>
                <p>Thank you for your loyalty! You now enjoy:</p>
                <ul class="loyalty-benefits">
                    ${newTier.benefits.map(b => `<li><i class="fas fa-check"></i> ${b}</li>`).join('')}
                </ul>
                <button class="loyalty-upgrade-btn">Continue Shopping</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.loyalty-upgrade-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.loyalty-upgrade-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => modal.remove(), 10000);
    }

    /**
     * Get progress to next tier
     */
    function getProgressToNextTier() {
        const data = getLoyaltyData();
        const currentTierName = calculateTier(data.orderCount, data.totalSpent);
        
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        const currentIndex = tierOrder.indexOf(currentTierName);
        
        if (currentIndex === tierOrder.length - 1) {
            return {
                current: TIERS.diamond,
                next: null,
                ordersNeeded: 0,
                spentNeeded: 0,
                progress: 100
            };
        }
        
        const nextTierName = tierOrder[currentIndex + 1];
        const nextTier = TIERS[nextTierName];
        const currentTier = TIERS[currentTierName];
        
        const ordersNeeded = Math.max(0, nextTier.minOrders - data.orderCount);
        const spentNeeded = Math.max(0, nextTier.minSpent - data.totalSpent);
        
        // Calculate progress percentage (based on orders or spending, whichever is closer)
        const orderProgress = nextTier.minOrders > 0 
            ? ((data.orderCount - currentTier.minOrders) / (nextTier.minOrders - currentTier.minOrders)) * 100 
            : 100;
        const spentProgress = nextTier.minSpent > 0 
            ? ((data.totalSpent - currentTier.minSpent) / (nextTier.minSpent - currentTier.minSpent)) * 100 
            : 100;
        
        return {
            current: TIERS[currentTierName],
            next: nextTier,
            ordersNeeded,
            spentNeeded,
            progress: Math.max(orderProgress, spentProgress)
        };
    }

    /**
     * Get loyalty status summary
     */
    function getStatus() {
        const data = getLoyaltyData();
        const tier = getCurrentTier();
        const progress = getProgressToNextTier();
        
        return {
            ...data,
            tier,
            progress,
            discount: tier.discount
        };
    }

    /**
     * Render loyalty badge for display
     */
    function renderBadge(size = 'medium') {
        const tier = getCurrentTier();
        const sizes = {
            small: { font: '0.75rem', padding: '4px 8px' },
            medium: { font: '0.85rem', padding: '6px 12px' },
            large: { font: '1rem', padding: '8px 16px' }
        };
        const s = sizes[size] || sizes.medium;
        
        return `
            <span class="loyalty-badge loyalty-badge-${tier.name.toLowerCase()}" 
                  style="background: linear-gradient(135deg, ${tier.color}, ${tier.color}dd); 
                         color: ${tier.name === 'Silver' || tier.name === 'Platinum' || tier.name === 'Diamond' ? '#333' : '#fff'};
                         padding: ${s.padding}; 
                         font-size: ${s.font};
                         font-weight: 600;
                         border-radius: 20px;
                         display: inline-flex;
                         align-items: center;
                         gap: 6px;">
                ${tier.icon} ${tier.name}
                ${tier.discount > 0 ? `<span style="opacity: 0.8; font-size: 0.9em;">(${tier.discount}% off)</span>` : ''}
            </span>
        `;
    }

    /**
     * Render loyalty widget for cart/checkout
     */
    function renderCartWidget() {
        const tier = getCurrentTier();
        const progress = getProgressToNextTier();
        const cartTotal = typeof global.CartDrawer !== 'undefined' ? global.CartDrawer.getTotal() : 0;
        const discount = calculateDiscount(cartTotal);
        
        let progressHTML = '';
        if (progress.next) {
            progressHTML = `
                <div class="loyalty-progress">
                    <div class="loyalty-progress-text">
                        <span>${progress.ordersNeeded} orders or ₹${progress.spentNeeded.toLocaleString('en-IN')} to ${progress.next.icon} ${progress.next.name}</span>
                    </div>
                    <div class="loyalty-progress-bar">
                        <div class="loyalty-progress-fill" style="width: ${Math.min(100, progress.progress)}%;"></div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="loyalty-cart-widget">
                <div class="loyalty-widget-header">
                    ${tier.icon} <span class="loyalty-tier-name">${tier.name} Member</span>
                    ${tier.discount > 0 ? `<span class="loyalty-discount-badge">${tier.discount}% OFF</span>` : ''}
                </div>
                ${tier.discount > 0 && cartTotal > 0 ? `
                    <div class="loyalty-savings">
                        <i class="fas fa-tag"></i>
                        You save <strong>₹${discount.toLocaleString('en-IN')}</strong> with your loyalty discount!
                    </div>
                ` : ''}
                ${progressHTML}
            </div>
        `;
    }

    /**
     * Inject loyalty widget styles
     */
    function injectStyles() {
        if (document.getElementById('loyalty-rewards-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loyalty-rewards-styles';
        style.textContent = `
            /* Loyalty Upgrade Modal */
            .loyalty-upgrade-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .loyalty-upgrade-content {
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                color: white;
                padding: 40px;
                border-radius: 24px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                position: relative;
                animation: scaleIn 0.4s ease;
            }
            
            .loyalty-upgrade-close {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                color: #999;
                font-size: 24px;
                cursor: pointer;
            }
            
            .loyalty-upgrade-close:hover {
                color: white;
            }
            
            .loyalty-upgrade-icon {
                font-size: 64px;
                margin-bottom: 16px;
                animation: bounce 1s ease infinite;
            }
            
            .loyalty-upgrade-content h2 {
                margin: 0 0 8px;
                font-size: 1.75rem;
            }
            
            .loyalty-upgrade-content h3 {
                margin: 0 0 20px;
                font-size: 1.5rem;
            }
            
            .loyalty-benefits {
                list-style: none;
                padding: 0;
                margin: 20px 0;
                text-align: left;
            }
            
            .loyalty-benefits li {
                padding: 8px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .loyalty-benefits i {
                color: #10b981;
            }
            
            .loyalty-upgrade-btn {
                background: linear-gradient(135deg, #0066ff 0%, #00a3ff 100%);
                color: white;
                border: none;
                padding: 14px 32px;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .loyalty-upgrade-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
            }
            
            /* Cart Widget */
            .loyalty-cart-widget {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 1px solid #86efac;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
            }
            
            .loyalty-widget-header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                margin-bottom: 12px;
            }
            
            .loyalty-discount-badge {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.75rem;
                margin-left: auto;
            }
            
            .loyalty-savings {
                background: white;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 0.9rem;
                color: #059669;
                margin-bottom: 12px;
            }
            
            .loyalty-savings i {
                margin-right: 6px;
            }
            
            .loyalty-progress {
                margin-top: 8px;
            }
            
            .loyalty-progress-text {
                font-size: 0.8rem;
                color: #666;
                margin-bottom: 6px;
            }
            
            .loyalty-progress-bar {
                height: 6px;
                background: #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .loyalty-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            
            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Initialize loyalty system
     */
    function init() {
        injectStyles();
        
        // Sync with Firebase if user is logged in
        syncWithFirebase();
        
        // Listen for order completion events
        window.addEventListener('orderCompleted', (e) => {
            if (e.detail && e.detail.total) {
                recordOrder(e.detail.total);
            }
        });
        
        console.log('🎖️ Loyalty Rewards System initialized');
    }

    /**
     * Sync loyalty data with Firebase for logged-in users
     */
    async function syncWithFirebase() {
        if (typeof firebase === 'undefined') return;
        
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;
            
            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Get order history count
                const ordersSnapshot = await db.collection('orders')
                    .where('userId', '==', user.uid)
                    .where('status', 'in', ['delivered', 'completed'])
                    .get();
                
                let totalSpent = 0;
                ordersSnapshot.forEach(doc => {
                    const order = doc.data();
                    totalSpent += order.total || 0;
                });
                
                // Update local loyalty data with Firebase data
                const data = getLoyaltyData();
                data.orderCount = ordersSnapshot.size;
                data.totalSpent = totalSpent;
                data.joinDate = userData.createdAt?.toDate?.()?.toISOString() || data.joinDate;
                data.tier = calculateTier(data.orderCount, data.totalSpent);
                
                saveLoyaltyData(data);
            }
        } catch (error) {
            console.error('Error syncing loyalty data with Firebase:', error);
        }
    }

    // Public API
    const LoyaltyRewards = {
        init,
        getStatus,
        getCurrentTier,
        getDiscountPercentage,
        calculateDiscount,
        recordOrder,
        getProgressToNextTier,
        renderBadge,
        renderCartWidget,
        syncWithFirebase,
        TIERS
    };

    // Export
    global.LoyaltyRewards = LoyaltyRewards;
    
    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
