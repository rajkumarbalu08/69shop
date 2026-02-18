/**
 * 69Shop.in - Multi-Vendor Shipping Integration
 * Version: 1.0.0
 * 
 * Supports:
 * - Shiprocket API for automated shipping
 * - Delhivery API for logistics
 * - Manual shipping with label generation
 * 
 * Features:
 * - Calculate shipping rates from multiple providers
 * - Generate shipping labels (AWB)
 * - Track shipments in real-time
 * - Handle multi-seller orders (split shipments)
 */

(function(global) {
    'use strict';

    // Shipping provider configurations
    const PROVIDERS = {
        shiprocket: {
            name: 'Shiprocket',
            logo: '/Logo/shiprocket.png',
            apiBase: 'https://apiv2.shiprocket.in/v1/external',
            supportsCOD: true,
            supportsPickup: true
        },
        delhivery: {
            name: 'Delhivery',
            logo: '/Logo/delhivery.png',
            apiBase: 'https://track.delhivery.com/api',
            supportsCOD: true,
            supportsPickup: true
        },
        manual: {
            name: 'Self-Ship',
            logo: '/Logo/self-ship.png',
            apiBase: null,
            supportsCOD: true,
            supportsPickup: false
        }
    };

    // Default shipping rates by zone (in INR)
    const ZONE_RATES = {
        local: { base: 40, perKg: 15 },      // Same city
        regional: { base: 60, perKg: 25 },   // Same state
        national: { base: 80, perKg: 35 },   // Different state
        remote: { base: 120, perKg: 50 }     // Remote areas
    };

    // Pincode to zone mapping (simplified)
    const ZONE_MAP = {
        // Metro cities - Local zone
        metros: ['110', '400', '560', '600', '700', '500'],
        // Remote areas prefix
        remote: ['193', '194', '795', '796', '797', '798', '799']
    };

    let db = null;
    let currentUser = null;
    let authToken = null;

    /**
     * Initialize shipping module
     */
    function init(firestore, user) {
        db = firestore;
        currentUser = user;
        console.log('Shipping module initialized');
    }

    /**
     * Set authentication token for API calls
     */
    function setAuthToken(token) {
        authToken = token;
    }

    /**
     * Calculate shipping zone based on pincodes
     */
    function getShippingZone(originPincode, destPincode) {
        if (!originPincode || !destPincode) return 'national';
        
        const origin = originPincode.toString().substring(0, 3);
        const dest = destPincode.toString().substring(0, 3);
        
        // Check if remote area
        if (ZONE_MAP.remote.includes(dest)) {
            return 'remote';
        }
        
        // Same pincode prefix = local
        if (origin === dest) {
            return 'local';
        }
        
        // Same state (first 2 digits match roughly)
        if (origin.substring(0, 2) === dest.substring(0, 2)) {
            return 'regional';
        }
        
        return 'national';
    }

    /**
     * Calculate shipping cost for an order
     */
    function calculateShippingCost(order, sellerPincode, buyerPincode) {
        const zone = getShippingZone(sellerPincode, buyerPincode);
        const rates = ZONE_RATES[zone];
        
        // Calculate total weight (assume 0.5kg per item if not specified)
        const totalWeight = order.items.reduce((sum, item) => {
            const itemWeight = item.weight || 0.5;
            return sum + (itemWeight * item.quantity);
        }, 0);
        
        const weightCharge = Math.ceil(totalWeight) * rates.perKg;
        const totalCost = rates.base + weightCharge;
        
        // Free shipping for orders above threshold
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (subtotal >= 2000) {
            return {
                cost: 0,
                originalCost: totalCost,
                zone,
                weight: totalWeight,
                freeShipping: true,
                message: 'Free shipping on orders ₹2000+'
            };
        }
        
        return {
            cost: totalCost,
            originalCost: totalCost,
            zone,
            weight: totalWeight,
            freeShipping: false,
            message: `Add ₹${2000 - subtotal} more for free shipping`
        };
    }

    /**
     * Get shipping rates from multiple providers
     */
    async function getShippingRates(orderDetails) {
        const rates = [];
        
        // Calculate our default rate
        const defaultRate = calculateShippingCost(
            orderDetails,
            orderDetails.sellerPincode,
            orderDetails.buyerPincode
        );
        
        rates.push({
            provider: 'standard',
            name: 'Standard Delivery',
            cost: defaultRate.cost,
            estimatedDays: defaultRate.zone === 'local' ? '2-3' : 
                           defaultRate.zone === 'regional' ? '3-5' : 
                           defaultRate.zone === 'national' ? '5-7' : '7-10',
            zone: defaultRate.zone
        });
        
        // Express delivery option
        if (defaultRate.zone !== 'remote') {
            rates.push({
                provider: 'express',
                name: 'Express Delivery',
                cost: Math.round(defaultRate.cost * 1.5) + 50,
                estimatedDays: defaultRate.zone === 'local' ? '1' : 
                               defaultRate.zone === 'regional' ? '2-3' : '3-4',
                zone: defaultRate.zone
            });
        }
        
        // If Shiprocket is configured, get their rates
        if (authToken && PROVIDERS.shiprocket.apiBase) {
            try {
                const shiprocketRates = await fetchShiprocketRates(orderDetails);
                rates.push(...shiprocketRates);
            } catch (e) {
                console.warn('Could not fetch Shiprocket rates:', e);
            }
        }
        
        return rates;
    }

    /**
     * Fetch rates from Shiprocket API
     */
    async function fetchShiprocketRates(orderDetails) {
        // This would make actual API call in production
        // For now, return mock rates
        return [
            {
                provider: 'shiprocket',
                name: 'Shiprocket Express',
                cost: 65,
                estimatedDays: '3-4',
                courier: 'Delhivery',
                zone: orderDetails.zone
            },
            {
                provider: 'shiprocket',
                name: 'Shiprocket Surface',
                cost: 45,
                estimatedDays: '5-7',
                courier: 'XpressBees',
                zone: orderDetails.zone
            }
        ];
    }

    /**
     * Create shipment with provider
     */
    async function createShipment(orderId, provider = 'manual') {
        if (!db || !orderId) {
            throw new Error('Database or order ID missing');
        }
        
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new Error('Order not found');
        }
        
        const order = orderDoc.data();
        
        const shipment = {
            orderId,
            sellerId: order.sellerId,
            buyerId: order.buyerId || order.customerId,
            provider,
            status: 'created',
            awbNumber: generateAWB(),
            labelUrl: null,
            trackingUrl: null,
            pickupScheduled: false,
            shippingAddress: order.shippingAddress,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Save shipment to Firestore
        const shipmentRef = await db.collection('shipments').add(shipment);
        
        // Update order with shipment ID
        await db.collection('orders').doc(orderId).update({
            shipmentId: shipmentRef.id,
            status: 'processing',
            updatedAt: new Date()
        });
        
        return {
            id: shipmentRef.id,
            ...shipment
        };
    }

    /**
     * Generate AWB (Air Waybill) number
     */
    function generateAWB() {
        const prefix = '69S';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Generate shipping label HTML
     */
    function generateShippingLabel(shipment, order) {
        return `
            <div class="shipping-label" style="width: 4in; height: 6in; border: 2px solid #000; padding: 10px; font-family: Arial, sans-serif;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">
                    <h2 style="margin: 0;">69SHOP.IN</h2>
                    <p style="margin: 5px 0; font-size: 12px;">Premium Marketplace</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #000;">
                    <div>
                        <strong>AWB:</strong> ${shipment.awbNumber}
                    </div>
                    <div>
                        <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}
                    </div>
                </div>
                
                <div style="padding: 15px 0; border-bottom: 1px solid #000;">
                    <strong>SHIP TO:</strong>
                    <p style="margin: 5px 0; font-size: 14px;">
                        ${order.shippingAddress.name}<br>
                        ${order.shippingAddress.address || order.shippingAddress.line1}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                        <strong style="font-size: 18px;">PIN: ${order.shippingAddress.pincode}</strong><br>
                        Phone: ${order.shippingAddress.phone}
                    </p>
                </div>
                
                <div style="padding: 15px 0; border-bottom: 1px solid #000;">
                    <strong>ORDER DETAILS:</strong>
                    <p style="margin: 5px 0;">
                        Order ID: ${order.orderId || shipment.orderId}<br>
                        Items: ${order.items?.length || 1}<br>
                        Payment: ${order.paymentMethod === 'cod' ? 'COD - ₹' + order.total : 'PREPAID'}
                    </p>
                </div>
                
                <div style="text-align: center; padding: 15px 0;">
                    <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                        ${order.shippingAddress.pincode}
                    </div>
                    <div style="margin-top: 10px;">
                        <!-- Barcode would go here -->
                        <div style="height: 50px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);"></div>
                        <div style="font-size: 10px; margin-top: 5px;">${shipment.awbNumber}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Print shipping label
     */
    function printLabel(shipment, order) {
        const labelHtml = generateShippingLabel(shipment, order);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Shipping Label - ${shipment.awbNumber}</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${labelHtml}
                    <button class="no-print" onclick="window.print()">Print Label</button>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    /**
     * Update shipment status
     */
    async function updateShipmentStatus(shipmentId, status, trackingInfo = {}) {
        if (!db) throw new Error('Database not initialized');
        
        const update = {
            status,
            updatedAt: new Date(),
            ...trackingInfo
        };
        
        if (status === 'shipped') {
            update.shippedAt = new Date();
        } else if (status === 'delivered') {
            update.deliveredAt = new Date();
        }
        
        await db.collection('shipments').doc(shipmentId).update(update);
        
        // Also update the linked order
        const shipmentDoc = await db.collection('shipments').doc(shipmentId).get();
        const shipment = shipmentDoc.data();
        
        if (shipment.orderId) {
            await db.collection('orders').doc(shipment.orderId).update({
                status: status === 'delivered' ? 'delivered' : status === 'shipped' ? 'shipped' : 'processing',
                updatedAt: new Date()
            });
        }
        
        return update;
    }

    /**
     * Track shipment
     */
    async function trackShipment(awbNumber) {
        if (!db) throw new Error('Database not initialized');
        
        // Find shipment by AWB
        const snapshot = await db.collection('shipments')
            .where('awbNumber', '==', awbNumber)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            throw new Error('Shipment not found');
        }
        
        const shipment = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        
        // Generate tracking timeline
        const timeline = [
            {
                status: 'Order Placed',
                timestamp: shipment.createdAt,
                description: 'Order has been placed successfully'
            }
        ];
        
        if (shipment.pickupScheduled) {
            timeline.push({
                status: 'Pickup Scheduled',
                timestamp: shipment.pickupScheduledAt,
                description: 'Pickup has been scheduled with courier'
            });
        }
        
        if (shipment.shippedAt) {
            timeline.push({
                status: 'Shipped',
                timestamp: shipment.shippedAt,
                description: 'Package has been handed to courier'
            });
        }
        
        if (shipment.inTransitAt) {
            timeline.push({
                status: 'In Transit',
                timestamp: shipment.inTransitAt,
                description: `Package is in transit - ${shipment.lastLocation || 'En route'}`
            });
        }
        
        if (shipment.outForDeliveryAt) {
            timeline.push({
                status: 'Out for Delivery',
                timestamp: shipment.outForDeliveryAt,
                description: 'Package is out for delivery'
            });
        }
        
        if (shipment.deliveredAt) {
            timeline.push({
                status: 'Delivered',
                timestamp: shipment.deliveredAt,
                description: 'Package has been delivered'
            });
        }
        
        return {
            shipment,
            timeline,
            currentStatus: shipment.status,
            estimatedDelivery: shipment.estimatedDelivery
        };
    }

    /**
     * Split order by seller (for multi-vendor orders)
     */
    async function splitOrderBySeller(orderId) {
        if (!db) throw new Error('Database not initialized');
        
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new Error('Order not found');
        }
        
        const order = orderDoc.data();
        
        // Group items by seller
        const sellerOrders = {};
        for (const item of order.items) {
            const sellerId = item.sellerId || 'platform';
            if (!sellerOrders[sellerId]) {
                sellerOrders[sellerId] = {
                    items: [],
                    subtotal: 0
                };
            }
            sellerOrders[sellerId].items.push(item);
            sellerOrders[sellerId].subtotal += item.price * item.quantity;
        }
        
        // If only one seller, no split needed
        if (Object.keys(sellerOrders).length === 1) {
            return [{ ...order, id: orderId }];
        }
        
        // Create sub-orders for each seller
        const subOrders = [];
        for (const [sellerId, sellerOrder] of Object.entries(sellerOrders)) {
            const subOrder = {
                parentOrderId: orderId,
                sellerId,
                buyerId: order.buyerId || order.customerId,
                items: sellerOrder.items,
                subtotal: sellerOrder.subtotal,
                // Proportional shipping
                shipping: Math.round((sellerOrder.subtotal / order.subtotal) * (order.shipping || 0)),
                total: sellerOrder.subtotal + Math.round((sellerOrder.subtotal / order.subtotal) * (order.shipping || 0)),
                status: 'pending',
                shippingAddress: order.shippingAddress,
                paymentStatus: order.paymentStatus,
                createdAt: new Date()
            };
            
            const subOrderRef = await db.collection('orders').add(subOrder);
            subOrders.push({ id: subOrderRef.id, ...subOrder });
        }
        
        // Mark parent order as split
        await db.collection('orders').doc(orderId).update({
            isSplit: true,
            subOrderIds: subOrders.map(o => o.id),
            updatedAt: new Date()
        });
        
        return subOrders;
    }

    // Public API
    global.ShippingManager = {
        init,
        setAuthToken,
        getShippingZone,
        calculateShippingCost,
        getShippingRates,
        createShipment,
        generateShippingLabel,
        printLabel,
        updateShipmentStatus,
        trackShipment,
        splitOrderBySeller,
        PROVIDERS,
        ZONE_RATES
    };

})(window);
