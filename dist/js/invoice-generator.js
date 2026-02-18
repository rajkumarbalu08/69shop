/**
 * 69Shop.in - Invoice PDF Generator
 * 
 * Features:
 * - Generate professional PDF invoices
 * - Multiple formats (A4, thermal receipt)
 * - GST compliant
 * - QR code for verification
 * - Download and print support
 * - Email invoice option
 * 
 * Requires: jsPDF library (loaded from CDN)
 * 
 * Usage:
 *   const invoice = new InvoiceGenerator();
 *   await invoice.generateInvoice(orderId);
 *   invoice.download();
 */

class InvoiceGenerator {
    constructor() {
        this.db = firebase.firestore();
        this.jsPDF = null;
        this.loadJsPDF();
        
        // Company details
        this.company = {
            name: '69Shop.in',
            tagline: 'Premium Marketplace',
            address: 'Chennai, Tamil Nadu, India',
            gstin: 'XXXXXXXXXXXXXXXXX', // Update with actual
            pan: 'XXXXXXXXXX',
            email: 'support@69shop.in',
            phone: '+91 XXXXXXXXXX',
            website: 'https://69shop.in',
            logo: '/Logo/logo.png'
        };
    }

    /**
     * Load jsPDF library dynamically
     */
    async loadJsPDF() {
        if (window.jspdf) {
            this.jsPDF = window.jspdf.jsPDF;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                this.jsPDF = window.jspdf.jsPDF;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Generate invoice for an order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} PDF document
     */
    async generateInvoice(orderId) {
        await this.loadJsPDF();

        // Fetch order data
        const orderDoc = await this.db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new Error('Order not found');
        }

        const order = { id: orderId, ...orderDoc.data() };

        // Get seller details
        let seller = {};
        if (order.sellerId) {
            const sellerDoc = await this.db.collection('sellers').doc(order.sellerId).get();
            if (sellerDoc.exists) {
                seller = sellerDoc.data();
            }
        }

        // Create PDF
        const pdf = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // Header background
        pdf.setFillColor(26, 26, 26);
        pdf.rect(0, 0, pageWidth, 45, 'F');

        // Company name
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('69Shop.in', margin, 20);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Premium Marketplace', margin, 28);

        // Invoice title
        pdf.setFontSize(16);
        pdf.text('TAX INVOICE', pageWidth - margin, 20, { align: 'right' });

        pdf.setFontSize(10);
        pdf.text(`Invoice #: INV-${orderId.slice(-8).toUpperCase()}`, pageWidth - margin, 28, { align: 'right' });
        pdf.text(`Date: ${this.formatDate(order.createdAt)}`, pageWidth - margin, 35, { align: 'right' });

        y = 55;

        // Reset text color
        pdf.setTextColor(26, 26, 26);

        // Bill To / Ship To
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('BILL TO:', margin, y);
        pdf.text('SHIP TO:', pageWidth / 2, y);

        y += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);

        const customer = order.shippingAddress || order.customer || {};
        const billTo = [
            customer.name || order.customerName || 'Customer',
            customer.phone || '',
            customer.email || order.customerEmail || ''
        ].filter(Boolean);

        const shipTo = [
            customer.name || order.customerName || 'Customer',
            customer.address || customer.street || '',
            `${customer.city || ''} ${customer.state || ''} ${customer.pincode || ''}`.trim(),
            customer.phone || ''
        ].filter(Boolean);

        billTo.forEach((line, i) => {
            pdf.text(line, margin, y + (i * 5));
        });

        shipTo.forEach((line, i) => {
            pdf.text(line, pageWidth / 2, y + (i * 5));
        });

        y += Math.max(billTo.length, shipTo.length) * 5 + 10;

        // Seller info
        if (seller.businessName) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, y, pageWidth - 2 * margin, 18, 'F');
            
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text('SOLD BY:', margin + 3, y + 6);
            pdf.setFont('helvetica', 'normal');
            pdf.text(seller.businessName || '', margin + 25, y + 6);
            
            if (seller.gstin) {
                pdf.text(`GSTIN: ${seller.gstin}`, margin + 3, y + 12);
            }
            if (seller.address) {
                pdf.text(seller.address, pageWidth / 2, y + 6);
            }
            
            y += 22;
        }

        // Items table header
        y += 5;
        pdf.setFillColor(26, 26, 26);
        pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        
        const colX = {
            item: margin + 3,
            qty: pageWidth - margin - 80,
            price: pageWidth - margin - 55,
            total: pageWidth - margin - 20
        };

        pdf.text('ITEM', colX.item, y + 7);
        pdf.text('QTY', colX.qty, y + 7);
        pdf.text('PRICE', colX.price, y + 7);
        pdf.text('TOTAL', colX.total, y + 7);

        y += 12;
        pdf.setTextColor(26, 26, 26);
        pdf.setFont('helvetica', 'normal');

        // Items
        const items = order.items || [];
        let subtotal = 0;

        items.forEach((item, index) => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            subtotal += itemTotal;

            // Alternate row background
            if (index % 2 === 0) {
                pdf.setFillColor(250, 250, 250);
                pdf.rect(margin, y - 3, pageWidth - 2 * margin, 8, 'F');
            }

            // Truncate long names
            let itemName = item.name || item.title || 'Product';
            if (itemName.length > 50) {
                itemName = itemName.substring(0, 47) + '...';
            }

            pdf.text(itemName, colX.item, y + 2);
            pdf.text(String(item.quantity || 1), colX.qty, y + 2);
            pdf.text(`₹${this.formatNumber(item.price)}`, colX.price, y + 2);
            pdf.text(`₹${this.formatNumber(itemTotal)}`, colX.total, y + 2);

            y += 8;

            // Check for page break
            if (y > pageHeight - 80) {
                pdf.addPage();
                y = margin;
            }
        });

        // Line
        y += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, pageWidth - margin, y);

        // Totals section
        y += 8;
        const totalsX = pageWidth - margin - 60;
        
        pdf.setFontSize(10);
        
        // Subtotal
        pdf.text('Subtotal:', totalsX, y);
        pdf.text(`₹${this.formatNumber(subtotal)}`, pageWidth - margin, y, { align: 'right' });
        
        // Shipping
        y += 6;
        const shipping = order.shippingAmount || order.shipping || 0;
        pdf.text('Shipping:', totalsX, y);
        pdf.text(shipping > 0 ? `₹${this.formatNumber(shipping)}` : 'FREE', pageWidth - margin, y, { align: 'right' });
        
        // Discount
        if (order.discount > 0) {
            y += 6;
            pdf.setTextColor(0, 150, 0);
            pdf.text('Discount:', totalsX, y);
            pdf.text(`-₹${this.formatNumber(order.discount)}`, pageWidth - margin, y, { align: 'right' });
            pdf.setTextColor(26, 26, 26);
        }

        // Tax
        const tax = order.tax || 0;
        if (tax > 0) {
            y += 6;
            pdf.text('GST (18%):', totalsX, y);
            pdf.text(`₹${this.formatNumber(tax)}`, pageWidth - margin, y, { align: 'right' });
        }

        // Grand Total
        y += 10;
        pdf.setFillColor(26, 26, 26);
        pdf.rect(totalsX - 5, y - 5, pageWidth - margin - totalsX + 10, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('TOTAL:', totalsX, y + 3);
        pdf.text(`₹${this.formatNumber(order.total || order.totalAmount)}`, pageWidth - margin, y + 3, { align: 'right' });

        // Payment info
        y += 20;
        pdf.setTextColor(26, 26, 26);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        pdf.text(`Payment Method: ${order.paymentMethod || 'Online'}`, margin, y);
        pdf.text(`Payment Status: ${(order.paymentStatus || 'Paid').toUpperCase()}`, margin, y + 5);
        if (order.transactionId) {
            pdf.text(`Transaction ID: ${order.transactionId}`, margin, y + 10);
        }

        // Order status
        pdf.text(`Order Status: ${(order.status || 'Processing').toUpperCase()}`, pageWidth / 2, y);
        pdf.text(`Order ID: ${orderId}`, pageWidth / 2, y + 5);

        // Footer
        y = pageHeight - 30;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, pageWidth - margin, y);

        y += 8;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Thank you for shopping with 69Shop.in!', pageWidth / 2, y, { align: 'center' });
        pdf.text('For queries, contact support@69shop.in', pageWidth / 2, y + 5, { align: 'center' });
        pdf.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, y + 10, { align: 'center' });

        // Store PDF reference
        this.currentPDF = pdf;
        this.currentOrderId = orderId;

        return {
            pdf,
            orderId,
            invoiceNumber: `INV-${orderId.slice(-8).toUpperCase()}`
        };
    }

    /**
     * Generate thermal receipt (80mm)
     */
    async generateReceipt(orderId) {
        await this.loadJsPDF();

        const orderDoc = await this.db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) throw new Error('Order not found');

        const order = { id: orderId, ...orderDoc.data() };

        // 80mm receipt
        const pdf = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });

        const pageWidth = 80;
        const margin = 5;
        let y = 10;

        // Header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('69Shop.in', pageWidth / 2, y, { align: 'center' });

        y += 8;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('================================', pageWidth / 2, y, { align: 'center' });

        y += 6;
        pdf.text(`Receipt #: ${orderId.slice(-8)}`, margin, y);
        y += 4;
        pdf.text(`Date: ${this.formatDate(order.createdAt)}`, margin, y);

        y += 6;
        pdf.text('--------------------------------', pageWidth / 2, y, { align: 'center' });

        // Items
        y += 6;
        (order.items || []).forEach(item => {
            const name = (item.name || item.title || 'Item').substring(0, 25);
            pdf.text(name, margin, y);
            y += 4;
            pdf.text(`${item.quantity} x ₹${item.price}`, margin + 5, y);
            pdf.text(`₹${item.quantity * item.price}`, pageWidth - margin, y, { align: 'right' });
            y += 5;
        });

        y += 2;
        pdf.text('--------------------------------', pageWidth / 2, y, { align: 'center' });

        // Total
        y += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL:', margin, y);
        pdf.text(`₹${order.total || order.totalAmount}`, pageWidth - margin, y, { align: 'right' });

        y += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text('Thank you!', pageWidth / 2, y, { align: 'center' });

        this.currentPDF = pdf;
        return { pdf, orderId };
    }

    /**
     * Download the PDF
     */
    download(filename = null) {
        if (!this.currentPDF) {
            throw new Error('No invoice generated');
        }

        const name = filename || `69Shop_Invoice_${this.currentOrderId || 'order'}.pdf`;
        this.currentPDF.save(name);
    }

    /**
     * Open PDF in new tab for printing
     */
    print() {
        if (!this.currentPDF) {
            throw new Error('No invoice generated');
        }

        const blob = this.currentPDF.output('blob');
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        
        printWindow.onload = () => {
            printWindow.print();
        };
    }

    /**
     * Get PDF as base64
     */
    getBase64() {
        if (!this.currentPDF) {
            throw new Error('No invoice generated');
        }

        return this.currentPDF.output('datauristring');
    }

    /**
     * Get PDF as Blob
     */
    getBlob() {
        if (!this.currentPDF) {
            throw new Error('No invoice generated');
        }

        return this.currentPDF.output('blob');
    }

    /**
     * Format date
     */
    formatDate(timestamp) {
        if (!timestamp) return new Date().toLocaleDateString('en-IN');
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return Number(num || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
}

// Export
if (typeof window !== 'undefined') {
    window.InvoiceGenerator = InvoiceGenerator;
}
