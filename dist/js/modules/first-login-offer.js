class FirstLoginOffer {
    constructor({ productManager, db }) {
        this.productManager = productManager;
        this.db = db;
        this.modal = document.getElementById('welcomeOfferModal');
        this.overlay = document.getElementById('welcomeOfferOverlay');
        this.closeBtn = document.getElementById('welcomeOfferClose');
        this.claimBtn = document.getElementById('welcomeOfferClaimBtn');
        this.laterBtn = document.getElementById('welcomeOfferLaterBtn');
        this.productNameEl = document.getElementById('welcomeOfferProductName');
        this.productPriceEl = document.getElementById('welcomeOfferProductPrice');
        this.productMetaEl = document.getElementById('welcomeOfferProductMeta');
        this.productImageEl = document.getElementById('welcomeOfferImage');
        this.titleEl = document.getElementById('welcomeOfferTitle');
        this.descriptionEl = document.getElementById('welcomeOfferDescription');
        this.currentProduct = null;
        this.currentUserId = null;
        this.offerMarked = false;
        this.previousBodyOverflow = '';
        this.bindEvents();
    }

    bindEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.dismissOffer());
        }
        if (this.laterBtn) {
            this.laterBtn.addEventListener('click', () => this.dismissOffer());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.dismissOffer());
        }
        if (this.claimBtn) {
            this.claimBtn.addEventListener('click', () => this.claimOffer());
        }
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.dismissOffer();
            }
        });
    }

    async considerForUser(user, userData) {
        if (!user || !this.modal) return;
        const localKey = `welcome_offer_seen_${user.uid}`;
        let hasLocalFlag = false;
        try {
            hasLocalFlag = localStorage.getItem(localKey) === 'true';
        } catch (storageError) {
            console.warn('Local storage unavailable for welcome offer', storageError);
        }
        if (hasLocalFlag) return;
        const sessionKey = `welcome_offer_shown_${user.uid}`;
        try {
            if (sessionStorage.getItem(sessionKey)) return;
            sessionStorage.setItem(sessionKey, 'true');
        } catch (_) { /* ignore */ }
        if (userData?.hasSeenWelcomeOffer) {
            try {
                localStorage.setItem(localKey, 'true');
            } catch (_) {
                /* ignore storage errors */
            }
            return;
        }
        this.currentUserId = user.uid;
        this.offerMarked = false;
        try {
            await this.prepareProduct();
            this.open();
        } catch (error) {
            console.warn('Unable to prepare welcome offer', error);
        }
    }

    async prepareProduct() {
        if (!this.productManager) return;
        if (this.productManager.readyPromise) {
            try {
                await this.productManager.readyPromise;
            } catch (error) {
                console.warn('Product data not ready for offer', error);
            }
        }
        const products = this.productManager.products || [];
        if (!products.length) return;
        const sorted = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        this.currentProduct = sorted[0] || products[0];
        this.setProductContent(this.currentProduct);
    }

    setProductContent(product) {
        if (!product) return;
        if (this.productNameEl) this.productNameEl.textContent = product.name;
        if (this.productPriceEl) {
            const priceValue = Number(product.price);
            if (Number.isFinite(priceValue)) {
                this.productPriceEl.textContent = `₹${priceValue.toLocaleString()}`;
            }
        }
        if (this.productMetaEl) {
            const meta = product.category ? `${product.category} • curated for you` : 'Limited launch bonus';
            this.productMetaEl.textContent = meta;
        }
        if (this.productImageEl && product.image) {
            this.productImageEl.src = product.image;
            this.productImageEl.alt = product.name;
        }
        if (this.titleEl) {
            this.titleEl.textContent = `Exclusive welcome pick: ${product.name}`;
        }
        if (this.descriptionEl) {
            this.descriptionEl.textContent = 'Add it to your cart now and your launch credit auto-applies at checkout.';
        }
    }

    open() {
        if (!this.modal || this.modal.classList.contains('active')) return;
        this.previousBodyOverflow = document.body.style.overflow;
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
        
        // Auto-dismiss after 30 seconds with countdown
        this.autoDismissSeconds = 30;
        this.startCountdown();
    }
    
    startCountdown() {
        // Add countdown timer display if not exists
        if (!document.getElementById('welcomeCountdown')) {
            const countdownEl = document.createElement('div');
            countdownEl.id = 'welcomeCountdown';
            countdownEl.style.cssText = 'text-align: center; margin-top: 16px; font-size: 0.85rem; color: rgba(255,255,255,0.7);';
            countdownEl.innerHTML = `<i class="fas fa-clock"></i> Closing in <span id="countdownSeconds">${this.autoDismissSeconds}</span>s`;
            const actionsEl = this.modal.querySelector('.welcome-offer-actions');
            if (actionsEl) {
                actionsEl.parentNode.insertBefore(countdownEl, actionsEl.nextSibling);
            }
        }
        
        // Clear any existing timer
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        const countdownSecondsEl = document.getElementById('countdownSeconds');
        this.countdownTimer = setInterval(() => {
            this.autoDismissSeconds--;
            if (countdownSecondsEl) {
                countdownSecondsEl.textContent = this.autoDismissSeconds;
            }
            if (this.autoDismissSeconds <= 0) {
                clearInterval(this.countdownTimer);
                this.dismissOffer();
            }
        }, 1000);
    }
    
    stopCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    close() {
        if (!this.modal) return;
        this.stopCountdown();
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        document.body.style.overflow = this.previousBodyOverflow || '';
    }

    async claimOffer() {
        if (this.currentProduct && this.productManager) {
            this.productManager.addToCart(this.currentProduct.id);
        }
        await this.markOfferSeen();
        this.close();
    }

    async dismissOffer() {
        await this.markOfferSeen();
        this.close();
    }

    async markOfferSeen() {
        if (!this.currentUserId || this.offerMarked) return;
        const localKey = `welcome_offer_seen_${this.currentUserId}`;
        this.offerMarked = true;
        try {
            localStorage.setItem(localKey, 'true');
        } catch (_) {
            /* ignore storage errors */
        }
        if (!this.db) return;
        try {
            await this.db.collection('users').doc(this.currentUserId).set({
                hasSeenWelcomeOffer: true
            }, { merge: true });
        } catch (error) {
            console.warn('Unable to persist welcome offer flag', error);
        }
    }
}
