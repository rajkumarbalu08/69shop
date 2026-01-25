/**
 * Review System Module for 69Shop.in
 * Provides review submission and display functionality
 */

const ReviewSystem = (function() {
    'use strict';

    let db = null;
    let currentUser = null;
    let modalElement = null;
    let currentReviewData = null;

    // Review categories for structured feedback
    const CATEGORIES = ['communication', 'quality', 'delivery', 'pricing'];

    /**
     * Initialize the review system
     * @param {Object} config - Configuration object with db and auth
     */
    function init(config = {}) {
        db = config.db || window.db;
        currentUser = config.user || null;
        
        // Inject modal HTML if not already present
        if (!document.getElementById('reviewModal')) {
            injectModalHTML();
        }
        
        modalElement = document.getElementById('reviewModal');
        setupEventListeners();
    }

    /**
     * Inject the review modal HTML into the page
     */
    function injectModalHTML() {
        const modalHTML = `
            <div class="review-modal-overlay" id="reviewModal">
                <div class="review-modal">
                    <div class="review-modal-header">
                        <h2>Rate Your Experience</h2>
                        <button class="review-modal-close" id="reviewModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="review-modal-body">
                        <div class="review-product-info" id="reviewProductInfo">
                            <div class="review-product-image">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="review-product-details">
                                <h3 id="reviewProductName">Product Name</h3>
                                <p id="reviewSellerName">Seller Name</p>
                            </div>
                        </div>
                        
                        <div class="review-rating-section">
                            <label>Overall Rating</label>
                            <div class="star-rating" id="starRating">
                                <span class="star" data-value="1"><i class="fas fa-star"></i></span>
                                <span class="star" data-value="2"><i class="fas fa-star"></i></span>
                                <span class="star" data-value="3"><i class="fas fa-star"></i></span>
                                <span class="star" data-value="4"><i class="fas fa-star"></i></span>
                                <span class="star" data-value="5"><i class="fas fa-star"></i></span>
                            </div>
                            <span class="rating-text" id="ratingText">Select a rating</span>
                        </div>
                        
                        <div class="review-categories">
                            <label>Rate specific aspects (optional)</label>
                            <div class="category-ratings" id="categoryRatings">
                                <div class="category-item">
                                    <span><i class="fas fa-comments"></i> Communication</span>
                                    <div class="mini-stars" data-category="communication">
                                        <span class="mini-star" data-value="1"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="2"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="3"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="4"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="5"><i class="fas fa-star"></i></span>
                                    </div>
                                </div>
                                <div class="category-item">
                                    <span><i class="fas fa-gem"></i> Quality</span>
                                    <div class="mini-stars" data-category="quality">
                                        <span class="mini-star" data-value="1"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="2"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="3"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="4"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="5"><i class="fas fa-star"></i></span>
                                    </div>
                                </div>
                                <div class="category-item">
                                    <span><i class="fas fa-truck"></i> Delivery</span>
                                    <div class="mini-stars" data-category="delivery">
                                        <span class="mini-star" data-value="1"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="2"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="3"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="4"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="5"><i class="fas fa-star"></i></span>
                                    </div>
                                </div>
                                <div class="category-item">
                                    <span><i class="fas fa-tag"></i> Value for Money</span>
                                    <div class="mini-stars" data-category="pricing">
                                        <span class="mini-star" data-value="1"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="2"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="3"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="4"><i class="fas fa-star"></i></span>
                                        <span class="mini-star" data-value="5"><i class="fas fa-star"></i></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="review-comment-section">
                            <label for="reviewComment">Your Review</label>
                            <textarea id="reviewComment" placeholder="Share your experience with this product or service..." rows="4"></textarea>
                            <span class="char-count"><span id="charCount">0</span>/500</span>
                        </div>
                    </div>
                    <div class="review-modal-footer">
                        <button class="btn-review-cancel" id="reviewCancel">Cancel</button>
                        <button class="btn-review-submit" id="reviewSubmit" disabled>Submit Review</button>
                    </div>
                </div>
            </div>
        `;
        
        // Inject CSS
        const styleSheet = document.createElement('style');
        styleSheet.textContent = getModalStyles();
        document.head.appendChild(styleSheet);
        
        // Inject HTML
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Get CSS styles for the review modal
     */
    function getModalStyles() {
        return `
            .review-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }
            .review-modal-overlay.show { display: flex; }
            
            .review-modal {
                background: #fff;
                border-radius: 16px;
                width: 100%;
                max-width: 520px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            
            .review-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #E2E8F0;
            }
            
            .review-modal-header h2 {
                font-family: 'Poppins', sans-serif;
                font-size: 1.2rem;
                color: #1A1A1A;
                margin: 0;
            }
            
            .review-modal-close {
                width: 36px;
                height: 36px;
                border: none;
                background: #F1F5F9;
                border-radius: 50%;
                cursor: pointer;
                color: #64748B;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .review-modal-close:hover { background: #E2E8F0; color: #1A1A1A; }
            
            .review-modal-body { padding: 24px; }
            
            .review-product-info {
                display: flex;
                gap: 16px;
                padding: 16px;
                background: #F8FAFC;
                border-radius: 12px;
                margin-bottom: 24px;
            }
            
            .review-product-image {
                width: 60px;
                height: 60px;
                background: #E2E8F0;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #94A3B8;
                font-size: 1.5rem;
            }
            
            .review-product-details h3 {
                font-size: 1rem;
                color: #1A1A1A;
                margin: 0 0 4px;
            }
            
            .review-product-details p {
                font-size: 0.85rem;
                color: #64748B;
                margin: 0;
            }
            
            .review-rating-section {
                text-align: center;
                margin-bottom: 24px;
            }
            
            .review-rating-section label {
                display: block;
                font-weight: 600;
                color: #1A1A1A;
                margin-bottom: 12px;
            }
            
            .star-rating {
                display: flex;
                justify-content: center;
                gap: 8px;
            }
            
            .star-rating .star {
                font-size: 2rem;
                color: #E2E8F0;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .star-rating .star:hover,
            .star-rating .star.active { color: #FBBF24; }
            
            .star-rating .star.hover { color: #FCD34D; }
            
            .rating-text {
                display: block;
                margin-top: 8px;
                font-size: 0.9rem;
                color: #64748B;
            }
            
            .review-categories {
                margin-bottom: 24px;
            }
            
            .review-categories > label {
                display: block;
                font-weight: 600;
                color: #1A1A1A;
                margin-bottom: 12px;
                font-size: 0.9rem;
            }
            
            .category-ratings {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            @media (max-width: 500px) {
                .category-ratings { grid-template-columns: 1fr; }
            }
            
            .category-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                background: #F8FAFC;
                border-radius: 8px;
            }
            
            .category-item span {
                font-size: 0.85rem;
                color: #475569;
            }
            
            .category-item span i {
                margin-right: 6px;
                color: #7C3AED;
            }
            
            .mini-stars { display: flex; gap: 2px; }
            
            .mini-star {
                font-size: 0.9rem;
                color: #E2E8F0;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mini-star:hover,
            .mini-star.active { color: #FBBF24; }
            
            .review-comment-section { position: relative; }
            
            .review-comment-section label {
                display: block;
                font-weight: 600;
                color: #1A1A1A;
                margin-bottom: 8px;
            }
            
            .review-comment-section textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                font-family: inherit;
                font-size: 0.9rem;
                resize: none;
                transition: border-color 0.2s;
            }
            
            .review-comment-section textarea:focus {
                outline: none;
                border-color: #7C3AED;
            }
            
            .char-count {
                position: absolute;
                bottom: 8px;
                right: 12px;
                font-size: 0.75rem;
                color: #94A3B8;
            }
            
            .review-modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 16px 24px;
                border-top: 1px solid #E2E8F0;
            }
            
            .btn-review-cancel {
                padding: 10px 20px;
                border: 1px solid #E2E8F0;
                background: #fff;
                border-radius: 8px;
                font-weight: 500;
                color: #64748B;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-review-cancel:hover { background: #F8FAFC; }
            
            .btn-review-submit {
                padding: 10px 24px;
                border: none;
                background: #7C3AED;
                color: #fff;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-review-submit:hover:not(:disabled) { background: #6D28D9; }
            .btn-review-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        `;
    }

    /**
     * Setup event listeners for the modal
     */
    function setupEventListeners() {
        const modal = document.getElementById('reviewModal');
        const closeBtn = document.getElementById('reviewModalClose');
        const cancelBtn = document.getElementById('reviewCancel');
        const submitBtn = document.getElementById('reviewSubmit');
        const commentInput = document.getElementById('reviewComment');
        const starRating = document.getElementById('starRating');

        // Close modal
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Star rating
        const stars = starRating?.querySelectorAll('.star');
        stars?.forEach(star => {
            star.addEventListener('click', () => selectRating(parseInt(star.dataset.value)));
            star.addEventListener('mouseenter', () => hoverRating(parseInt(star.dataset.value)));
            star.addEventListener('mouseleave', () => clearHover());
        });

        // Category ratings
        document.querySelectorAll('.mini-stars').forEach(container => {
            const miniStars = container.querySelectorAll('.mini-star');
            miniStars.forEach(star => {
                star.addEventListener('click', () => {
                    selectCategoryRating(container.dataset.category, parseInt(star.dataset.value));
                });
            });
        });

        // Comment input
        commentInput?.addEventListener('input', () => {
            const charCount = document.getElementById('charCount');
            if (charCount) {
                const length = commentInput.value.length;
                charCount.textContent = length;
                if (length > 500) {
                    commentInput.value = commentInput.value.slice(0, 500);
                    charCount.textContent = 500;
                }
            }
        });

        // Submit
        submitBtn?.addEventListener('click', submitReview);

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.classList.contains('show')) {
                closeModal();
            }
        });
    }

    /**
     * Open review modal for a specific order/product
     * @param {Object} data - Review data containing sellerId, productId, orderId, productName, sellerName
     */
    function openModal(data) {
        if (!modalElement) {
            console.error('Review modal not initialized');
            return;
        }

        currentReviewData = data;

        // Update product info
        document.getElementById('reviewProductName').textContent = data.productName || 'Product';
        document.getElementById('reviewSellerName').textContent = `Sold by: ${data.sellerName || 'Seller'}`;

        // Reset form
        resetForm();

        // Show modal
        modalElement.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the review modal
     */
    function closeModal() {
        if (modalElement) {
            modalElement.classList.remove('show');
            document.body.style.overflow = '';
            currentReviewData = null;
        }
    }

    /**
     * Reset the form to initial state
     */
    function resetForm() {
        // Clear stars
        document.querySelectorAll('#starRating .star').forEach(star => {
            star.classList.remove('active', 'hover');
        });
        document.getElementById('ratingText').textContent = 'Select a rating';

        // Clear category ratings
        document.querySelectorAll('.mini-star').forEach(star => {
            star.classList.remove('active');
        });

        // Clear comment
        const commentInput = document.getElementById('reviewComment');
        if (commentInput) commentInput.value = '';
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0';

        // Disable submit
        const submitBtn = document.getElementById('reviewSubmit');
        if (submitBtn) submitBtn.disabled = true;
    }

    /**
     * Select overall rating
     */
    function selectRating(value) {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < value);
        });

        const ratingTexts = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        document.getElementById('ratingText').textContent = ratingTexts[value - 1] || 'Select a rating';

        // Enable submit if rating is selected
        const submitBtn = document.getElementById('reviewSubmit');
        if (submitBtn) submitBtn.disabled = false;
    }

    /**
     * Hover effect for rating
     */
    function hoverRating(value) {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach((star, index) => {
            star.classList.toggle('hover', index < value);
        });
    }

    /**
     * Clear hover effect
     */
    function clearHover() {
        document.querySelectorAll('#starRating .star').forEach(star => {
            star.classList.remove('hover');
        });
    }

    /**
     * Select category rating
     */
    function selectCategoryRating(category, value) {
        const container = document.querySelector(`.mini-stars[data-category="${category}"]`);
        if (!container) return;

        container.querySelectorAll('.mini-star').forEach((star, index) => {
            star.classList.toggle('active', index < value);
        });
    }

    /**
     * Get current form data
     */
    function getFormData() {
        const rating = document.querySelectorAll('#starRating .star.active').length;
        const comment = document.getElementById('reviewComment')?.value?.trim() || '';

        const categories = {};
        CATEGORIES.forEach(cat => {
            const container = document.querySelector(`.mini-stars[data-category="${cat}"]`);
            if (container) {
                categories[cat] = container.querySelectorAll('.mini-star.active').length;
            }
        });

        return { rating, comment, categories };
    }

    /**
     * Submit the review
     */
    async function submitReview() {
        if (!db || !currentUser || !currentReviewData) {
            console.error('Missing required data for review submission');
            alert('Unable to submit review. Please try again.');
            return;
        }

        const formData = getFormData();
        if (formData.rating === 0) {
            alert('Please select a rating');
            return;
        }

        const submitBtn = document.getElementById('reviewSubmit');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        try {
            const reviewData = {
                sellerId: currentReviewData.sellerId,
                productId: currentReviewData.productId || null,
                orderId: currentReviewData.orderId || null,
                productName: currentReviewData.productName || '',
                reviewerId: currentUser.uid,
                reviewerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Customer',
                reviewerEmail: currentUser.email || '',
                rating: formData.rating,
                categories: formData.categories,
                comment: formData.comment,
                text: formData.comment, // Alias for compatibility
                flagged: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('reviews').add(reviewData);

            // Mark order as reviewed if orderId provided
            if (currentReviewData.orderId) {
                await db.collection('orders').doc(currentReviewData.orderId).update({
                    reviewed: true,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            closeModal();
            alert('Thank you for your review!');

            // Trigger callback if provided
            if (typeof currentReviewData.onSuccess === 'function') {
                currentReviewData.onSuccess();
            }

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    /**
     * Set the current user
     */
    function setUser(user) {
        currentUser = user;
    }

    /**
     * Set the database reference
     */
    function setDatabase(database) {
        db = database;
    }

    // Public API
    return {
        init,
        openModal,
        closeModal,
        setUser,
        setDatabase
    };
})();

// Make it available globally
if (typeof window !== 'undefined') {
    window.ReviewSystem = ReviewSystem;
}
