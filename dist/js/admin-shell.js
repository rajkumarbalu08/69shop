(function(window) {
    'use strict';

    const LEAD_ADMIN_EMAIL = 'rajkumarbalu81@gmail.com';

    const isHttpUrl = (value) => /^https?:\/\//i.test(value);
    const isGsUrl = (value) => /^gs:\/\//i.test(value);

    async function syncNavBadges(db) {
        if (!db) return;
        const pendingSellersEl = document.getElementById('pendingSellersBadge');
        const pendingProductsEl = document.getElementById('pendingProductsBadge');
        if (!pendingSellersEl && !pendingProductsEl) {
            return;
        }
        try {
            const queries = [];
            if (pendingSellersEl) {
                queries.push(
                    db.collection('sellerVerification').where('status', '==', 'pending').get()
                );
            } else {
                queries.push(Promise.resolve(null));
            }
            if (pendingProductsEl) {
                queries.push(
                    db.collection('products').where('approvalStatus', '==', 'pending').get()
                );
            } else {
                queries.push(Promise.resolve(null));
            }
            const [pendingSellersSnap, pendingProductsSnap] = await Promise.all(queries);
            if (pendingSellersEl && pendingSellersSnap) {
                pendingSellersEl.textContent = pendingSellersSnap.size;
                pendingSellersEl.hidden = pendingSellersSnap.size === 0;
            }
            if (pendingProductsEl && pendingProductsSnap) {
                pendingProductsEl.textContent = pendingProductsSnap.size;
                pendingProductsEl.hidden = pendingProductsSnap.size === 0;
            }
        } catch (error) {
            console.error('Nav badge sync failed', error);
        }
    }

    async function resolveDocumentLinks(documents, storageInstance) {
        if (!Array.isArray(documents)) return [];
        return Promise.all(documents.map(async (docRef) => {
            if (!docRef) return null;
            if (isHttpUrl(docRef)) {
                return docRef;
            }
            try {
                if (!storageInstance) return null;
                if (isGsUrl(docRef)) {
                    return await storageInstance.refFromURL(docRef).getDownloadURL();
                }
                return await storageInstance.ref(docRef).getDownloadURL();
            } catch (error) {
                console.warn('Failed to resolve document link', docRef, error);
                return null;
            }
        })).then((links) => links.filter(Boolean));
    }

    function init(config) {
        const db = config?.db;
        if (!db) return null;
        syncNavBadges(db);
        return {
            refresh() {
                syncNavBadges(db);
            }
        };
    }

    window.AdminShell = {
        init,
        resolveDocumentLinks,
        constants: {
            LEAD_ADMIN_EMAIL
        }
    };
})(window);
