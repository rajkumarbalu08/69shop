/**
 * 69Shop.in - Wishlist Sharing System
 * 
 * Features:
 * - Create shareable wishlist links
 * - View shared wishlists without login
 * - Copy link to clipboard
 * - Social sharing (WhatsApp, Facebook, Twitter)
 * - Gift registry mode
 * - Track wishlist views
 * 
 * Usage:
 *   const wishlist = new WishlistSharing();
 *   const shareUrl = await wishlist.createShareableLink(userId);
 *   await wishlist.viewSharedWishlist(shareId);
 */

class WishlistSharing {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.SHARE_BASE_URL = `${window.location.origin}/shared-wishlist.html`;
    }

    /**
     * Create a shareable link for user's wishlist
     * @param {Object} options - Sharing options
     * @returns {Promise<Object>} Share details with URL
     */
    async createShareableLink(options = {}) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in to share wishlist');
        }

        // Get user's wishlist items
        const wishlistSnapshot = await this.db.collection('wishlists')
            .doc(user.uid)
            .get();

        if (!wishlistSnapshot.exists) {
            throw new Error('Wishlist is empty');
        }

        const wishlistData = wishlistSnapshot.data();
        const items = wishlistData.items || [];

        if (items.length === 0) {
            throw new Error('Wishlist is empty');
        }

        // Generate unique share ID
        const shareId = this.generateShareId();

        // Create share record
        const shareDoc = {
            shareId,
            userId: user.uid,
            userName: user.displayName || 'Someone',
            userPhoto: user.photoURL || null,
            title: options.title || `${user.displayName || 'My'}'s Wishlist`,
            message: options.message || '',
            items: items,
            isGiftRegistry: options.isGiftRegistry || false,
            expiresAt: options.expiresAt || null,
            isPublic: options.isPublic !== false,
            allowPurchase: options.allowPurchase !== false,
            viewCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.db.collection('sharedWishlists').doc(shareId).set(shareDoc);

        // Update user's share history
        await this.db.collection('users').doc(user.uid).update({
            sharedWishlists: firebase.firestore.FieldValue.arrayUnion(shareId)
        }).catch(() => {
            // Field might not exist, create it
            return this.db.collection('users').doc(user.uid).set({
                sharedWishlists: [shareId]
            }, { merge: true });
        });

        const shareUrl = `${this.SHARE_BASE_URL}?id=${shareId}`;

        return {
            shareId,
            shareUrl,
            itemCount: items.length,
            title: shareDoc.title,
            expiresAt: shareDoc.expiresAt
        };
    }

    /**
     * Generate unique share ID
     */
    generateShareId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * View a shared wishlist
     * @param {string} shareId - The share ID
     * @returns {Promise<Object>} Wishlist data
     */
    async viewSharedWishlist(shareId) {
        const shareDoc = await this.db.collection('sharedWishlists').doc(shareId).get();

        if (!shareDoc.exists) {
            throw new Error('Wishlist not found or has been removed');
        }

        const data = shareDoc.data();

        // Check if expired
        if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
            throw new Error('This wishlist link has expired');
        }

        // Check if public
        if (!data.isPublic) {
            const user = this.auth.currentUser;
            if (!user || user.uid !== data.userId) {
                throw new Error('This wishlist is private');
            }
        }

        // Increment view count
        await this.db.collection('sharedWishlists').doc(shareId).update({
            viewCount: firebase.firestore.FieldValue.increment(1),
            lastViewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Get product details for each item
        const itemsWithDetails = await this.enrichItemDetails(data.items);

        return {
            ...data,
            items: itemsWithDetails
        };
    }

    /**
     * Enrich wishlist items with current product details
     */
    async enrichItemDetails(items) {
        const enrichedItems = [];

        for (const item of items) {
            try {
                const productDoc = await this.db.collection('products')
                    .doc(item.productId)
                    .get();

                if (productDoc.exists) {
                    const product = productDoc.data();
                    enrichedItems.push({
                        ...item,
                        name: product.name || product.title,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        discount: product.discount,
                        image: product.images?.[0] || product.image,
                        inStock: product.inStock !== false && (product.stock > 0 || product.stock === undefined),
                        sellerId: product.sellerId
                    });
                }
            } catch (error) {
                console.warn('Could not fetch product:', item.productId);
            }
        }

        return enrichedItems;
    }

    /**
     * Copy share link to clipboard
     */
    async copyToClipboard(shareUrl) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

    /**
     * Share via WhatsApp
     */
    shareViaWhatsApp(shareUrl, title) {
        const text = encodeURIComponent(`Check out my wishlist: ${title}\n${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    /**
     * Share via Facebook
     */
    shareViaFacebook(shareUrl) {
        const url = encodeURIComponent(shareUrl);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    }

    /**
     * Share via Twitter
     */
    shareViaTwitter(shareUrl, title) {
        const text = encodeURIComponent(`Check out my wishlist: ${title}`);
        const url = encodeURIComponent(shareUrl);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    }

    /**
     * Share via Email
     */
    shareViaEmail(shareUrl, title, message = '') {
        const subject = encodeURIComponent(`Check out my wishlist: ${title}`);
        const body = encodeURIComponent(`${message}\n\nView my wishlist here: ${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    /**
     * Mark item as purchased (for gift registry)
     */
    async markItemPurchased(shareId, productId, purchasedBy) {
        const shareRef = this.db.collection('sharedWishlists').doc(shareId);
        const shareDoc = await shareRef.get();

        if (!shareDoc.exists) {
            throw new Error('Wishlist not found');
        }

        const data = shareDoc.data();
        
        if (!data.isGiftRegistry) {
            throw new Error('This is not a gift registry');
        }

        // Update the item as purchased
        const updatedItems = data.items.map(item => {
            if (item.productId === productId && !item.purchased) {
                return {
                    ...item,
                    purchased: true,
                    purchasedBy: purchasedBy || 'Anonymous',
                    purchasedAt: new Date().toISOString()
                };
            }
            return item;
        });

        await shareRef.update({
            items: updatedItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Get user's shared wishlists
     */
    async getMySharedWishlists() {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        const snapshot = await this.db.collection('sharedWishlists')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const wishlists = [];
        snapshot.forEach(doc => {
            wishlists.push({ id: doc.id, ...doc.data() });
        });

        return wishlists;
    }

    /**
     * Delete a shared wishlist
     */
    async deleteSharedWishlist(shareId) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        const shareDoc = await this.db.collection('sharedWishlists').doc(shareId).get();
        
        if (!shareDoc.exists) {
            throw new Error('Wishlist not found');
        }

        if (shareDoc.data().userId !== user.uid) {
            throw new Error('Not authorized to delete this wishlist');
        }

        await this.db.collection('sharedWishlists').doc(shareId).delete();

        // Remove from user's list
        await this.db.collection('users').doc(user.uid).update({
            sharedWishlists: firebase.firestore.FieldValue.arrayRemove(shareId)
        });

        return { success: true };
    }

    /**
     * Update shared wishlist settings
     */
    async updateSharedWishlist(shareId, updates) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        const shareRef = this.db.collection('sharedWishlists').doc(shareId);
        const shareDoc = await shareRef.get();

        if (!shareDoc.exists || shareDoc.data().userId !== user.uid) {
            throw new Error('Not authorized');
        }

        const allowedUpdates = ['title', 'message', 'isPublic', 'isGiftRegistry', 'allowPurchase', 'expiresAt'];
        const filteredUpdates = {};
        
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        filteredUpdates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        await shareRef.update(filteredUpdates);

        return { success: true };
    }

    /**
     * Sync current wishlist to shared version
     */
    async syncSharedWishlist(shareId) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        // Get current wishlist
        const wishlistDoc = await this.db.collection('wishlists').doc(user.uid).get();
        if (!wishlistDoc.exists) {
            throw new Error('Wishlist not found');
        }

        const shareRef = this.db.collection('sharedWishlists').doc(shareId);
        const shareDoc = await shareRef.get();

        if (!shareDoc.exists || shareDoc.data().userId !== user.uid) {
            throw new Error('Not authorized');
        }

        await shareRef.update({
            items: wishlistDoc.data().items || [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.WishlistSharing = WishlistSharing;
}
