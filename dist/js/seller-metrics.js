(function (global) {
    const LOW_STOCK_THRESHOLD = 5;
    const PLATFORM_FEE = 0.1;
    const NET_FACTOR = 1 - PLATFORM_FEE;
    const TRANSACTION_LIMIT = 20;
    const WITHDRAWAL_LIMIT = 10;

    function assertPrerequisites(db, sellerId) {
        if (!db) {
            throw new Error('SellerMetrics requires an initialized Firestore instance.');
        }
        if (!sellerId) {
            throw new Error('SellerMetrics requires a sellerId to aggregate metrics.');
        }
    }

    function safeNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    function ensureDate(value) {
        if (!value) return null;
        if (typeof value.toDate === 'function') {
            return value.toDate();
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function dateKey(date) {
        return date.toISOString().slice(0, 10);
    }

    function sum(values) {
        return values.reduce((total, value) => total + value, 0);
    }

    async function runQuery(ref, options = {}) {
        const { orderBy, direction = 'asc', limit } = options;
        let query = ref;
        if (orderBy) {
            query = query.orderBy(orderBy, direction);
        }
        if (limit) {
            query = query.limit(limit);
        }
        try {
            return await query.get();
        } catch (error) {
            if (error.code === 'failed-precondition' && orderBy) {
                console.warn('[SellerMetrics] Missing index for query on', orderBy, '- using unsorted fallback.');
                let fallback = ref;
                if (limit) fallback = fallback.limit(limit);
                return await fallback.get();
            }
            console.error('[SellerMetrics] Query failed', error);
            return { empty: true, docs: [] };
        }
    }

    function buildSeries(map, days) {
        const labels = [];
        const values = [];
        const raw = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i -= 1) {
            const cursor = new Date(today);
            cursor.setDate(today.getDate() - i);
            const key = dateKey(cursor);
            const value = map.get(key) || 0;
            labels.push(cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
            values.push(value);
            raw.push({ date: new Date(cursor), key, value });
        }

        return { labels, values, raw };
    }

    function calculateTrend(values) {
        if (!values || values.length < 2) return null;
        const midpoint = Math.floor(values.length / 2);
        const previous = sum(values.slice(0, midpoint));
        const current = sum(values.slice(midpoint));
        if (previous === 0) {
            return current === 0 ? 0 : 100;
        }
        return ((current - previous) / previous) * 100;
    }

    function formatHour(hour) {
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const normalized = hour % 12 === 0 ? 12 : hour % 12;
        return `${normalized}${suffix}`;
    }

    function formatHourRange(hour) {
        const next = (hour + 1) % 24;
        return `${formatHour(hour)} - ${formatHour(next)}`;
    }

    function computeProducts(products) {
        const summary = {
            total: products.length,
            active: 0,
            lowStock: 0,
            totalViews: 0,
            lowStockItems: []
        };
        const productMap = new Map();

        products.forEach((product) => {
            const stock = safeNumber(product.stock ?? product.quantity);
            const status = (product.status || 'active').toLowerCase();
            const isActive = status === 'active' && stock > 0;
            if (isActive) {
                summary.active += 1;
            }
            if (stock > 0 && stock <= LOW_STOCK_THRESHOLD) {
                summary.lowStock += 1;
                summary.lowStockItems.push({
                    id: product.id,
                    name: product.name || product.title || 'Unnamed Product',
                    stock
                });
            }
            summary.totalViews += safeNumber(product.views);
            productMap.set(product.id, {
                id: product.id,
                name: product.name || product.title || 'Unnamed Product',
                stock,
                views: safeNumber(product.views),
                price: safeNumber(product.price)
            });
        });

        summary.lowStockItems.sort((a, b) => a.stock - b.stock);
        return { summary, productMap };
    }

    function computeOrderAnalytics(orders, productMap) {
        const counts = {
            total: orders.length,
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            returned: 0
        };
        let grossRevenue = 0;
        let deliveredGross = 0;
        const hourlyBuckets = new Array(24).fill(0);
        const revenueByDay = new Map();
        const ordersByDay = new Map();
        const productSales = new Map();
        let ratingSum = 0;
        let ratingCount = 0;

        orders.forEach((order) => {
            const status = (order.status || 'pending').toLowerCase();
            const amount = safeNumber(order.total ?? order.amount);
            if (!counts[status]) {
                counts[status] = 0;
            }
            counts[status] += 1;
            if (!['cancelled', 'returned'].includes(status)) {
                grossRevenue += amount;
            }
            if (status === 'delivered') {
                deliveredGross += amount;
            }

            const createdAt = ensureDate(order.createdAt) || new Date();
            const key = dateKey(createdAt);
            revenueByDay.set(key, (revenueByDay.get(key) || 0) + amount);
            ordersByDay.set(key, (ordersByDay.get(key) || 0) + 1);
            hourlyBuckets[createdAt.getHours()] += 1;

            const rating = safeNumber(order.rating || order.reviewRating || order?.feedback?.rating);
            if (rating > 0) {
                ratingSum += rating;
                ratingCount += 1;
            }

            (order.items || []).forEach((item) => {
                const productId = item.productId || item.id || item.sku;
                if (!productId) return;
                const qty = safeNumber(item.quantity) || 1;
                const price = safeNumber(item.price);
                const existing = productSales.get(productId) || {
                    id: productId,
                    name: item.name || 'Unnamed Product',
                    sales: 0,
                    revenue: 0
                };
                existing.sales += qty;
                existing.revenue += price * qty;
                productSales.set(productId, existing);
            });
        });

        const revenueSeries7 = buildSeries(revenueByDay, 7);
        const revenueSeries30 = buildSeries(revenueByDay, 30);
        const revenueSeries14 = buildSeries(revenueByDay, 14);
        const ordersSeries14 = buildSeries(ordersByDay, 14);

        const topProducts = Array.from(productSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((entry) => ({
                ...entry,
                views: productMap.get(entry.id)?.views || 0
            }));

        const performance = Array.from(productMap.values()).map((product) => {
            const sale = productSales.get(product.id) || { sales: 0, revenue: 0 };
            const conversion = product.views > 0 ? ((sale.sales / product.views) * 100) : 0;
            return {
                id: product.id,
                name: product.name,
                views: product.views,
                orders: sale.sales,
                revenue: sale.revenue,
                conversion
            };
        }).sort((a, b) => b.revenue - a.revenue);

        const bestHourIndex = hourlyBuckets.reduce((best, value, index, arr) => (
            value > arr[best] ? index : best
        ), 0);

        return {
            counts,
            grossRevenue,
            deliveredGross,
            averageOrderValue: counts.total ? grossRevenue / counts.total : 0,
            revenueSeries: {
                last7Days: revenueSeries7,
                last30Days: revenueSeries30
            },
            trends: {
                revenue: calculateTrend(revenueSeries14.values),
                orders: calculateTrend(ordersSeries14.values)
            },
            hourlyHotspot: hourlyBuckets[bestHourIndex] ? formatHourRange(bestHourIndex) : 'N/A',
            returnRate: counts.total ? (counts.returned / counts.total) * 100 : 0,
            avgRating: ratingCount ? ratingSum / ratingCount : null,
            topProducts,
            performance
        };
    }

    function computeTransactions(snapshot) {
        const docs = snapshot?.docs || [];
        let credits = 0;
        let debits = 0;
        const recent = docs.map((doc) => {
            const data = doc.data();
            const amount = safeNumber(data.amount);
            const type = (data.type || 'credit').toLowerCase();
            const isCredit = !['debit', 'withdrawal', 'payout'].includes(type);
            if (isCredit) {
                credits += amount;
            } else {
                debits += amount;
            }
            return {
                id: doc.id,
                amount,
                type: isCredit ? 'credit' : 'debit',
                status: (data.status || 'completed').toLowerCase(),
                description: data.description || (isCredit ? 'Sale credit' : 'Withdrawal'),
                reference: data.reference || doc.id.slice(0, 8),
                createdAt: ensureDate(data.createdAt)?.toISOString() || null
            };
        });
        return { credits, debits, recent };
    }

    function computeWithdrawals(snapshot) {
        const docs = snapshot?.docs || [];
        let pendingAmount = 0;
        let pendingCount = 0;
        let lastCompleted = null;
        docs.forEach((doc) => {
            const data = doc.data();
            const status = (data.status || 'pending').toLowerCase();
            const amount = safeNumber(data.amount);
            if (status === 'pending') {
                pendingAmount += amount;
                pendingCount += 1;
            }
            if (['completed', 'paid', 'approved'].includes(status)) {
                const completedAt = ensureDate(data.completedAt || data.processedAt || data.requestedAt);
                if (completedAt && (!lastCompleted || completedAt > lastCompleted)) {
                    lastCompleted = completedAt;
                }
            }
        });

        const nextPayoutDate = (() => {
            const today = new Date();
            const result = new Date(today);
            const day = today.getDay();
            const offset = (8 - day) % 7 || 7; // next Monday
            result.setDate(today.getDate() + offset);
            return result.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        })();

        return {
            pendingAmount,
            pendingCount,
            lastCompletedDate: lastCompleted?.toISOString() || null,
            nextPayoutDate
        };
    }

    function computePayouts(orderAnalytics, transactions, withdrawals) {
        const totalEarned = orderAnalytics.grossRevenue * NET_FACTOR;
        const deliveredNet = orderAnalytics.deliveredGross * NET_FACTOR;
        const reservedForWithdrawals = withdrawals.pendingAmount;
        const available = Math.max(deliveredNet - transactions.debits - reservedForWithdrawals, 0);
        const pending = Math.max((totalEarned - deliveredNet) + reservedForWithdrawals, 0);

        return {
            totalEarned,
            available,
            pending,
            estimatedPayout: available,
            pendingWithdrawalAmount: reservedForWithdrawals,
            pendingWithdrawalCount: withdrawals.pendingCount,
            lastPayoutDate: withdrawals.lastCompletedDate,
            nextPayoutDate: withdrawals.nextPayoutDate,
            debitedAmount: transactions.debits
        };
    }

    async function fetchMetrics(db, sellerId) {
        assertPrerequisites(db, sellerId);

        const productsPromise = db.collection('products').where('sellerId', '==', sellerId).get();
        const ordersPromise = db.collection('orders').where('sellerId', '==', sellerId).get();
        const transactionsPromise = runQuery(
            db.collection('transactions').where('sellerId', '==', sellerId),
            { orderBy: 'createdAt', direction: 'desc', limit: TRANSACTION_LIMIT }
        );
        const withdrawalsPromise = runQuery(
            db.collection('withdrawals').where('sellerId', '==', sellerId),
            { orderBy: 'requestedAt', direction: 'desc', limit: WITHDRAWAL_LIMIT }
        );

        const [productsSnap, ordersSnap, transactionsSnap, withdrawalsSnap] = await Promise.all([
            productsPromise,
            ordersPromise,
            transactionsPromise,
            withdrawalsPromise
        ]);

        const products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const { summary: productSummary, productMap } = computeProducts(products);
        const orderAnalytics = computeOrderAnalytics(orders, productMap);
        const transactions = computeTransactions(transactionsSnap);
        const withdrawals = computeWithdrawals(withdrawalsSnap);
        const payouts = computePayouts(orderAnalytics, transactions, withdrawals);

        orderAnalytics.conversionRate = productSummary.totalViews
            ? (orderAnalytics.counts.total / productSummary.totalViews) * 100
            : 0;

        return {
            updatedAt: new Date().toISOString(),
            products: productSummary,
            orders: {
                ...orderAnalytics.counts,
                revenueGross: orderAnalytics.grossRevenue,
                revenueNet: orderAnalytics.grossRevenue * NET_FACTOR,
                deliveredGross: orderAnalytics.deliveredGross,
                deliveredNet: orderAnalytics.deliveredGross * NET_FACTOR,
                averageOrderValue: orderAnalytics.averageOrderValue,
                revenueSeries: orderAnalytics.revenueSeries,
                trends: orderAnalytics.trends,
                bestTime: orderAnalytics.hourlyHotspot,
                returnRate: orderAnalytics.returnRate,
                avgRating: orderAnalytics.avgRating,
                conversionRate: orderAnalytics.conversionRate,
                topProducts: orderAnalytics.topProducts,
                performance: orderAnalytics.performance
            },
            payouts,
            transactions,
            withdrawals: {
                pendingAmount: withdrawals.pendingAmount,
                pendingCount: withdrawals.pendingCount,
                nextPayoutDate: withdrawals.nextPayoutDate,
                lastPayoutDate: withdrawals.lastCompletedDate
            }
        };
    }

    global.SellerMetrics = {
        fetch: fetchMetrics
    };
})(window);
