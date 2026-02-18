/**
 * 69Shop.in - Bundle Deals Module
 * "Buy Together & Save" — complementary products at a discount
 *
 * Usage:
 * 1. Include this script after Firebase is initialized
 * 2. Call BundleDeals.init({ db, containerId }) on relevant pages
 * 3. Sellers create bundles via seller-products.html
 */

(function(global) {
    'use strict';

    const COLLECTION = 'bundles';
    let db = null;

    /**
     * Render a bundle card for the product page
     */
    function renderBundleCard(bundle, currentProductId) {
        const items = bundle.products || [];
        const totalOriginal = items.reduce((s, p) => s + (p.originalPrice || p.price || 0), 0);
        const bundlePrice = bundle.bundlePrice || totalOriginal;
        const savings = totalOriginal - bundlePrice;
        const savingsPercent = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : 0;

        const itemsHtml = items.map(p => {
            const isCurrent = p.id === currentProductId;
            return `
                <div class="bundle-product ${isCurrent ? 'current' : ''}">
                    <div class="bundle-product-img">
                        <img src="${p.image || 'https://via.placeholder.com/80?text=Product'}"
                             alt="${p.name}" onerror="this.src='https://via.placeholder.com/80?text=Product'">
                        ${isCurrent ? '<span class="bundle-current-badge">This item</span>' : ''}
                    </div>
                    <div class="bundle-product-info">
                        <h5>${p.name}</h5>
                        <p class="bundle-product-price">
                            ${p.originalPrice && p.originalPrice !== p.price
                                ? `<span class="bundle-original">₹${p.originalPrice.toLocaleString('en-IN')}</span>`
                                : ''}
                            ₹${(p.price || 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>`;
        }).join('<div class="bundle-plus"><i class="fas fa-plus"></i></div>');

        return `
            <div class="bundle-deal-card" data-bundle-id="${bundle.id}">
                <div class="bundle-deal-header">
                    <div class="bundle-deal-label">
                        <i class="fas fa-cubes"></i>
                        <span>${bundle.name || 'Frequently Bought Together'}</span>
                    </div>
                    ${savingsPercent > 0 ? `<span class="bundle-savings-badge">Save ${savingsPercent}%</span>` : ''}
                </div>
                <div class="bundle-products-row">
                    ${itemsHtml}
                </div>
                <div class="bundle-deal-footer">
                    <div class="bundle-pricing">
                        <div class="bundle-total-original">
                            <span class="label">Total Price:</span>
                            <span class="price struck">₹${totalOriginal.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="bundle-total-deal">
                            <span class="label">Bundle Price:</span>
                            <span class="price">₹${bundlePrice.toLocaleString('en-IN')}</span>
                        </div>
                        ${savings > 0 ? `<div class="bundle-you-save">You save ₹${savings.toLocaleString('en-IN')}</div>` : ''}
                    </div>
                    <button class="bundle-add-btn" onclick="BundleDeals.addToCart('${bundle.id}')">
                        <i class="fas fa-cart-plus"></i>
                        Add Bundle to Cart
                    </button>
                </div>
            </div>`;
    }

    /**
     * Load bundles that include a specific product
     */
    async function loadBundlesForProduct(productId, containerId) {
        if (!db || !productId) return;
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const snapshot = await db.collection(COLLECTION)
                .where('productIds', 'array-contains', productId)
                .where('active', '==', true)
                .limit(3)
                .get();

            if (snapshot.empty) {
                container.style.display = 'none';
                return;
            }

            const bundles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            container.style.display = 'block';
            container.innerHTML = `
                <div class="bundle-section-header">
                    <h3><i class="fas fa-cubes"></i> Frequently Bought Together</h3>
                    <p>Save more when you buy these items together</p>
                </div>
                <div class="bundle-deals-list">
                    ${bundles.map(b => renderBundleCard(b, productId)).join('')}
                </div>`;
        } catch (error) {
            console.warn('Failed to load bundles:', error);
            container.style.display = 'none';
        }
    }

    /**
     * Load all active bundles for the shop page
     */
    async function loadAllBundles(containerId, limit = 6) {
        if (!db) return;
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const snapshot = await db.collection(COLLECTION)
                .where('active', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            if (snapshot.empty) {
                container.style.display = 'none';
                return;
            }

            const bundles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            container.style.display = 'block';
            container.innerHTML = `
                <div class="bundle-section-header">
                    <h3><i class="fas fa-cubes"></i> Bundle Deals</h3>
                    <p>Buy together and save more</p>
                </div>
                <div class="bundle-deals-grid">
                    ${bundles.map(b => renderBundleCard(b, null)).join('')}
                </div>`;
        } catch (error) {
            console.warn('Failed to load bundles:', error);
            container.style.display = 'none';
        }
    }

    /**
     * Add all items in a bundle to cart at bundle prices
     */
    async function addToCart(bundleId) {
        if (!db) return;

        try {
            const doc = await db.collection(COLLECTION).doc(bundleId).get();
            if (!doc.exists) {
                showToast('Bundle not found', 'error');
                return;
            }

            const bundle = doc.data();
            const items = bundle.products || [];
            const totalOriginal = items.reduce((s, p) => s + (p.originalPrice || p.price || 0), 0);
            const bundlePrice = bundle.bundlePrice || totalOriginal;
            const discountRatio = totalOriginal > 0 ? bundlePrice / totalOriginal : 1;

            items.forEach(product => {
                const itemPrice = Math.round((product.price || 0) * discountRatio);
                const cartItem = {
                    id: product.id,
                    name: product.name,
                    price: itemPrice,
                    originalPrice: product.price,
                    image: product.image,
                    seller: product.seller || 'Unknown',
                    isBundle: true,
                    bundleId: bundleId,
                    bundleName: bundle.name
                };

                if (global.CartDrawer) {
                    global.CartDrawer.addItem(cartItem, 1);
                }
            });

            showToast(`Bundle "${bundle.name}" added to cart!`, 'success');

            // Track bundle purchase for analytics
            try {
                await db.collection(COLLECTION).doc(bundleId).update({
                    addedToCartCount: firebase.firestore.FieldValue.increment(1)
                });
            } catch (e) { /* analytics tracking failure is non-critical */ }

        } catch (error) {
            console.error('Failed to add bundle to cart:', error);
            showToast('Failed to add bundle', 'error');
        }
    }

    /**
     * Seller: Create a new bundle deal
     */
    async function createBundle(bundleData) {
        if (!db) throw new Error('Database not initialized');

        const productIds = (bundleData.products || []).map(p => p.id);
        const doc = {
            name: bundleData.name || 'Bundle Deal',
            description: bundleData.description || '',
            products: bundleData.products || [],
            productIds: productIds,
            bundlePrice: bundleData.bundlePrice || 0,
            discountPercent: bundleData.discountPercent || 0,
            sellerId: bundleData.sellerId,
            sellerName: bundleData.sellerName || '',
            active: true,
            addedToCartCount: 0,
            purchaseCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const ref = await db.collection(COLLECTION).add(doc);
        return ref.id;
    }

    /**
     * Seller: Update an existing bundle
     */
    async function updateBundle(bundleId, updates) {
        if (!db) throw new Error('Database not initialized');

        updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        if (updates.products) {
            updates.productIds = updates.products.map(p => p.id);
        }
        await db.collection(COLLECTION).doc(bundleId).update(updates);
    }

    /**
     * Seller: Delete a bundle
     */
    async function deleteBundle(bundleId) {
        if (!db) throw new Error('Database not initialized');
        await db.collection(COLLECTION).doc(bundleId).delete();
    }

    /**
     * Seller: Load bundles for seller's products
     */
    async function loadSellerBundles(sellerId) {
        if (!db || !sellerId) return [];

        const snapshot = await db.collection(COLLECTION)
            .where('sellerId', '==', sellerId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    function showToast(message, type) {
        if (global.ProductCard) {
            global.ProductCard.showToast(message, type);
        } else {
            // Fallback toast
            const existing = document.querySelector('.bundle-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = `bundle-toast ${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    function init(options = {}) {
        db = options.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        if (!db) {
            console.warn('BundleDeals: Firestore not available');
        }
    }

    global.BundleDeals = {
        init,
        loadBundlesForProduct,
        loadAllBundles,
        addToCart,
        createBundle,
        updateBundle,
        deleteBundle,
        loadSellerBundles,
        renderBundleCard
    };

})(window);
