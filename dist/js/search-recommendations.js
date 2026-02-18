/**
 * 69Shop.in - Advanced Search & Recommendations Engine
 * 
 * Features:
 * - Full-text search with filters
 * - Auto-suggestions
 * - Search analytics
 * - Personalized recommendations
 * - Similar products
 * - Trending products
 * 
 * Usage:
 *   const search = new SearchEngine();
 *   const results = await search.search('phone', { category: 'electronics', priceMax: 20000 });
 *   const recommendations = await search.getRecommendations(userId);
 */

class SearchEngine {
    constructor() {
        this.db = firebase.firestore();
        this.searchIndex = new Map();
        this.suggestionCache = new Map();
        this.analyticsQueue = [];
        this.BATCH_SIZE = 20;
        
        // Search configuration
        this.config = {
            minQueryLength: 2,
            maxSuggestions: 8,
            fuzziness: 0.3,
            boostFactors: {
                titleMatch: 2.0,
                categoryMatch: 1.5,
                brandMatch: 1.3,
                tagMatch: 1.2,
                descriptionMatch: 1.0
            }
        };
    }

    /**
     * Main search function
     * @param {string} query - Search query
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Search results with metadata
     */
    async search(query, filters = {}) {
        const startTime = performance.now();
        
        if (!query || query.length < this.config.minQueryLength) {
            return { results: [], total: 0, query, filters };
        }

        const normalizedQuery = this.normalizeQuery(query);
        const queryTokens = this.tokenize(normalizedQuery);

        // Build Firestore query
        let baseQuery = this.db.collection('products')
            .where('status', '==', 'active');

        // Apply filters
        if (filters.category) {
            baseQuery = baseQuery.where('category', '==', filters.category);
        }
        if (filters.sellerId) {
            baseQuery = baseQuery.where('sellerId', '==', filters.sellerId);
        }
        if (filters.inStock !== undefined) {
            baseQuery = baseQuery.where('inStock', '==', filters.inStock);
        }

        try {
            const snapshot = await baseQuery.limit(100).get();
            let results = [];

            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                const score = this.calculateRelevanceScore(product, queryTokens, normalizedQuery);
                
                if (score > 0) {
                    results.push({ ...product, _score: score });
                }
            });

            // Apply additional filters on results
            results = this.applyFilters(results, filters);

            // Sort by relevance score
            results.sort((a, b) => b._score - a._score);

            // Apply sorting override if specified
            if (filters.sortBy) {
                results = this.applySorting(results, filters.sortBy, filters.sortOrder);
            }

            // Pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || this.BATCH_SIZE;
            const startIndex = (page - 1) * pageSize;
            const paginatedResults = results.slice(startIndex, startIndex + pageSize);

            // Track search
            this.trackSearch(query, filters, results.length);

            const searchTime = Math.round(performance.now() - startTime);

            return {
                results: paginatedResults,
                total: results.length,
                page,
                pageSize,
                totalPages: Math.ceil(results.length / pageSize),
                query,
                filters,
                searchTime
            };

        } catch (error) {
            console.error('Search error:', error);
            return { results: [], total: 0, query, filters, error: error.message };
        }
    }

    /**
     * Calculate relevance score for a product
     */
    calculateRelevanceScore(product, queryTokens, fullQuery) {
        let score = 0;
        const boost = this.config.boostFactors;

        // Title matching
        const title = (product.name || product.title || '').toLowerCase();
        if (title.includes(fullQuery)) {
            score += boost.titleMatch * 10; // Exact phrase match
        }
        queryTokens.forEach(token => {
            if (title.includes(token)) {
                score += boost.titleMatch;
            }
        });

        // Category matching
        const category = (product.category || '').toLowerCase();
        queryTokens.forEach(token => {
            if (category.includes(token)) {
                score += boost.categoryMatch;
            }
        });

        // Brand matching
        const brand = (product.brand || '').toLowerCase();
        queryTokens.forEach(token => {
            if (brand.includes(token)) {
                score += boost.brandMatch;
            }
        });

        // Tags matching
        const tags = product.tags || [];
        tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            queryTokens.forEach(token => {
                if (normalizedTag.includes(token)) {
                    score += boost.tagMatch;
                }
            });
        });

        // Description matching
        const description = (product.description || '').toLowerCase();
        queryTokens.forEach(token => {
            if (description.includes(token)) {
                score += boost.descriptionMatch;
            }
        });

        // Boost for products with images
        if (product.images && product.images.length > 0) {
            score *= 1.1;
        }

        // Boost for products with reviews
        if (product.reviewCount > 0) {
            score *= 1 + (Math.min(product.reviewCount, 50) / 100);
        }

        // Boost for higher rated products
        if (product.rating) {
            score *= 1 + (product.rating / 10);
        }

        return score;
    }

    /**
     * Apply filters to results
     */
    applyFilters(results, filters) {
        return results.filter(product => {
            // Price filter
            if (filters.priceMin !== undefined && product.price < filters.priceMin) {
                return false;
            }
            if (filters.priceMax !== undefined && product.price > filters.priceMax) {
                return false;
            }

            // Rating filter
            if (filters.minRating !== undefined && (product.rating || 0) < filters.minRating) {
                return false;
            }

            // Brand filter
            if (filters.brand && product.brand !== filters.brand) {
                return false;
            }

            // Discount filter
            if (filters.hasDiscount && !(product.discount && product.discount > 0)) {
                return false;
            }

            // Free shipping filter
            if (filters.freeShipping && !product.freeShipping) {
                return false;
            }

            return true;
        });
    }

    /**
     * Apply sorting to results
     */
    applySorting(results, sortBy, order = 'desc') {
        const sortMap = {
            'price': 'price',
            'rating': 'rating',
            'reviews': 'reviewCount',
            'date': 'createdAt',
            'popularity': 'viewCount',
            'relevance': '_score'
        };

        const field = sortMap[sortBy] || '_score';
        const multiplier = order === 'asc' ? 1 : -1;

        return results.sort((a, b) => {
            const aVal = a[field] || 0;
            const bVal = b[field] || 0;
            return (aVal - bVal) * multiplier;
        });
    }

    /**
     * Get search suggestions (autocomplete)
     */
    async getSuggestions(query) {
        if (!query || query.length < 2) {
            return [];
        }

        const normalizedQuery = this.normalizeQuery(query);

        // Check cache
        if (this.suggestionCache.has(normalizedQuery)) {
            return this.suggestionCache.get(normalizedQuery);
        }

        try {
            // Get popular searches matching query
            const popularSearches = await this.db.collection('searchAnalytics')
                .where('query', '>=', normalizedQuery)
                .where('query', '<=', normalizedQuery + '\uf8ff')
                .orderBy('count', 'desc')
                .limit(this.config.maxSuggestions)
                .get();

            const suggestions = [];
            
            // Add popular searches
            popularSearches.forEach(doc => {
                suggestions.push({
                    text: doc.data().query,
                    type: 'popular',
                    count: doc.data().count
                });
            });

            // If not enough suggestions, add product name suggestions
            if (suggestions.length < this.config.maxSuggestions) {
                const productSuggestions = await this.db.collection('products')
                    .where('status', '==', 'active')
                    .where('searchKeywords', 'array-contains', normalizedQuery)
                    .limit(this.config.maxSuggestions - suggestions.length)
                    .get();

                productSuggestions.forEach(doc => {
                    const product = doc.data();
                    suggestions.push({
                        text: product.name || product.title,
                        type: 'product',
                        productId: doc.id
                    });
                });
            }

            // Cache results for 5 minutes
            this.suggestionCache.set(normalizedQuery, suggestions);
            setTimeout(() => this.suggestionCache.delete(normalizedQuery), 5 * 60 * 1000);

            return suggestions;

        } catch (error) {
            console.error('Suggestions error:', error);
            return [];
        }
    }

    /**
     * Get personalized recommendations for a user
     */
    async getRecommendations(userId, options = {}) {
        const limit = options.limit || 12;
        const recommendations = [];

        try {
            // Get user's browsing history and purchases
            const [viewsSnapshot, purchasesSnapshot] = await Promise.all([
                this.db.collection('productViews')
                    .where('userId', '==', userId)
                    .orderBy('viewedAt', 'desc')
                    .limit(20)
                    .get(),
                this.db.collection('orders')
                    .where('customerId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .limit(10)
                    .get()
            ]);

            // Extract categories and products from history
            const viewedCategories = new Map();
            const viewedProducts = new Set();
            const purchasedCategories = new Map();

            viewsSnapshot.forEach(doc => {
                const view = doc.data();
                viewedProducts.add(view.productId);
                if (view.category) {
                    viewedCategories.set(view.category, (viewedCategories.get(view.category) || 0) + 1);
                }
            });

            purchasesSnapshot.forEach(doc => {
                const order = doc.data();
                (order.items || []).forEach(item => {
                    if (item.category) {
                        purchasedCategories.set(item.category, (purchasedCategories.get(item.category) || 0) + 2);
                    }
                });
            });

            // Merge and rank categories
            const categoryScores = new Map();
            viewedCategories.forEach((count, cat) => {
                categoryScores.set(cat, count);
            });
            purchasedCategories.forEach((count, cat) => {
                categoryScores.set(cat, (categoryScores.get(cat) || 0) + count);
            });

            // Sort categories by score
            const topCategories = [...categoryScores.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat]) => cat);

            // Get recommendations from top categories
            for (const category of topCategories) {
                const catProducts = await this.db.collection('products')
                    .where('status', '==', 'active')
                    .where('category', '==', category)
                    .orderBy('rating', 'desc')
                    .limit(Math.ceil(limit / topCategories.length))
                    .get();

                catProducts.forEach(doc => {
                    if (!viewedProducts.has(doc.id) && recommendations.length < limit) {
                        recommendations.push({
                            id: doc.id,
                            ...doc.data(),
                            _recommendationType: 'category'
                        });
                    }
                });
            }

            // Fill remaining spots with trending products
            if (recommendations.length < limit) {
                const trending = await this.getTrendingProducts(limit - recommendations.length);
                const existingIds = new Set(recommendations.map(r => r.id));
                
                trending.forEach(product => {
                    if (!existingIds.has(product.id) && !viewedProducts.has(product.id)) {
                        recommendations.push({
                            ...product,
                            _recommendationType: 'trending'
                        });
                    }
                });
            }

            return recommendations;

        } catch (error) {
            console.error('Recommendations error:', error);
            // Fallback to trending products
            return await this.getTrendingProducts(limit);
        }
    }

    /**
     * Get similar products
     */
    async getSimilarProducts(productId, limit = 6) {
        try {
            const productDoc = await this.db.collection('products').doc(productId).get();
            
            if (!productDoc.exists) {
                return [];
            }

            const product = productDoc.data();
            const similarProducts = [];

            // Get products from same category
            const categoryProducts = await this.db.collection('products')
                .where('status', '==', 'active')
                .where('category', '==', product.category)
                .limit(limit + 5)
                .get();

            categoryProducts.forEach(doc => {
                if (doc.id !== productId && similarProducts.length < limit) {
                    const p = doc.data();
                    const similarity = this.calculateSimilarity(product, p);
                    similarProducts.push({
                        id: doc.id,
                        ...p,
                        _similarity: similarity
                    });
                }
            });

            // Sort by similarity
            similarProducts.sort((a, b) => b._similarity - a._similarity);

            return similarProducts.slice(0, limit);

        } catch (error) {
            console.error('Similar products error:', error);
            return [];
        }
    }

    /**
     * Calculate similarity between two products
     */
    calculateSimilarity(product1, product2) {
        let score = 0;

        // Same category
        if (product1.category === product2.category) score += 3;

        // Same brand
        if (product1.brand && product1.brand === product2.brand) score += 2;

        // Similar price range (within 30%)
        const priceDiff = Math.abs(product1.price - product2.price) / product1.price;
        if (priceDiff < 0.3) score += 2;
        if (priceDiff < 0.1) score += 1;

        // Matching tags
        const tags1 = new Set(product1.tags || []);
        const tags2 = product2.tags || [];
        const matchingTags = tags2.filter(t => tags1.has(t)).length;
        score += matchingTags;

        return score;
    }

    /**
     * Get trending products
     */
    async getTrendingProducts(limit = 12) {
        try {
            // Get products with most views in last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const trendingQuery = await this.db.collection('products')
                .where('status', '==', 'active')
                .orderBy('viewCount', 'desc')
                .limit(limit)
                .get();

            const trending = [];
            trendingQuery.forEach(doc => {
                trending.push({
                    id: doc.id,
                    ...doc.data(),
                    _trendingScore: doc.data().viewCount || 0
                });
            });

            return trending;

        } catch (error) {
            console.error('Trending products error:', error);
            return [];
        }
    }

    /**
     * Get products on sale / deals
     */
    async getDeals(limit = 20) {
        try {
            const dealsQuery = await this.db.collection('products')
                .where('status', '==', 'active')
                .where('discount', '>', 0)
                .orderBy('discount', 'desc')
                .limit(limit)
                .get();

            const deals = [];
            dealsQuery.forEach(doc => {
                deals.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return deals;

        } catch (error) {
            console.error('Deals error:', error);
            return [];
        }
    }

    /**
     * Get newly added products
     */
    async getNewArrivals(limit = 12) {
        try {
            const newQuery = await this.db.collection('products')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const newProducts = [];
            newQuery.forEach(doc => {
                newProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return newProducts;

        } catch (error) {
            console.error('New arrivals error:', error);
            return [];
        }
    }

    /**
     * Track product view
     */
    async trackProductView(productId, userId = null) {
        try {
            // Increment product view count
            await this.db.collection('products').doc(productId).update({
                viewCount: firebase.firestore.FieldValue.increment(1)
            });

            // Log view if user is logged in
            if (userId) {
                const productDoc = await this.db.collection('products').doc(productId).get();
                const product = productDoc.data();

                await this.db.collection('productViews').add({
                    productId,
                    userId,
                    category: product?.category,
                    viewedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

        } catch (error) {
            console.error('Track view error:', error);
        }
    }

    /**
     * Track search for analytics
     */
    async trackSearch(query, filters, resultCount) {
        const normalizedQuery = this.normalizeQuery(query);
        
        this.analyticsQueue.push({
            query: normalizedQuery,
            filters,
            resultCount,
            timestamp: new Date()
        });

        // Batch process analytics
        if (this.analyticsQueue.length >= 5) {
            this.processAnalyticsQueue();
        }
    }

    /**
     * Process analytics queue
     */
    async processAnalyticsQueue() {
        const batch = this.db.batch();
        const toProcess = [...this.analyticsQueue];
        this.analyticsQueue = [];

        for (const item of toProcess) {
            // Update search count
            const searchRef = this.db.collection('searchAnalytics').doc(item.query);
            batch.set(searchRef, {
                query: item.query,
                count: firebase.firestore.FieldValue.increment(1),
                lastSearched: firebase.firestore.FieldValue.serverTimestamp(),
                avgResults: item.resultCount
            }, { merge: true });
        }

        try {
            await batch.commit();
        } catch (error) {
            console.error('Analytics batch error:', error);
        }
    }

    /**
     * Normalize query for consistent matching
     */
    normalizeQuery(query) {
        return query
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ');
    }

    /**
     * Tokenize query into search terms
     */
    tokenize(query) {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        return query
            .split(' ')
            .filter(token => token.length >= 2 && !stopWords.has(token));
    }

    /**
     * Get search filters for a category
     */
    async getCategoryFilters(category) {
        try {
            const products = await this.db.collection('products')
                .where('status', '==', 'active')
                .where('category', '==', category)
                .limit(100)
                .get();

            const brands = new Set();
            const priceRange = { min: Infinity, max: 0 };
            const ratings = new Set();

            products.forEach(doc => {
                const product = doc.data();
                if (product.brand) brands.add(product.brand);
                if (product.price < priceRange.min) priceRange.min = product.price;
                if (product.price > priceRange.max) priceRange.max = product.price;
                if (product.rating) ratings.add(Math.floor(product.rating));
            });

            return {
                brands: [...brands].sort(),
                priceRange: {
                    min: priceRange.min === Infinity ? 0 : priceRange.min,
                    max: priceRange.max
                },
                ratings: [...ratings].sort((a, b) => b - a)
            };

        } catch (error) {
            console.error('Get filters error:', error);
            return { brands: [], priceRange: { min: 0, max: 0 }, ratings: [] };
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SearchEngine = SearchEngine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchEngine;
}
