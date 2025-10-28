// ==============================
// 📦 Order Routes
// ==============================

const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const { generateOrderId, triggerWebhook } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

// Create new order
router.post('/create-order', async (req, res) => {
    try {
        const orderData = req.body;

        // Debug log to check what data is received
        console.log('📩 Received order data:', orderData);

        // Check if required fields are present
        const requiredFields = ['name', 'number', 'address', 'product_name', 'total_product', 'total_price', 'sender_id', 'recipient_id'];
        const missingFields = requiredFields.filter(field => !orderData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate numeric fields
        const totalProduct = parseInt(orderData.total_product);
        const totalPrice = parseFloat(orderData.total_price);

        if (isNaN(totalProduct) || totalProduct < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid total_product value. Must be a valid number greater than 0',
                error: 'VALIDATION_ERROR',
                details: {
                    field: 'total_product',
                    received: orderData.total_product,
                    expected: 'A valid positive number (e.g., 1, 2, 3)'
                }
            });
        }

        if (isNaN(totalPrice) || totalPrice < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid total_price value. Must be a valid number',
                error: 'VALIDATION_ERROR',
                details: {
                    field: 'total_price',
                    received: orderData.total_price,
                    expected: 'A valid number (e.g., 100, 250.50)'
                }
            });
        }

        // Generate unique order ID
        const orderId = generateOrderId();
        
        // Prepare order data
        const orderPayload = {
            order_id: orderId,
            name: orderData.name.toString().trim(),
            number: orderData.number.toString().trim(),
            address: orderData.address.toString().trim(),
            product_name: orderData.product_name.toString().trim(),
            total_product: totalProduct,
            total_price: totalPrice,
            sender_id: orderData.sender_id.toString(),
            recipient_id: orderData.recipient_id.toString(),
            status: 'PENDING'
        };

        // Add text field if provided
        if (orderData.text) {
            orderPayload.text = orderData.text.toString().trim();
        }

        // Save to MongoDB
        const newOrder = new Order(orderPayload);
        const savedOrder = await newOrder.save();

        // Enhanced debug information
        console.log(`✅ New order created with ID: ${savedOrder.order_id}`);
        console.log(`📊 Order details:`, {
            order_id: savedOrder.order_id,
            name: savedOrder.name,
            product_name: savedOrder.product_name,
            total_product: savedOrder.total_product,
            total_price: savedOrder.total_price,
            status: savedOrder.status,
            sender_id: savedOrder.sender_id,
            recipient_id: savedOrder.recipient_id,
            createdAt: savedOrder.createdAt
        });

        // Trigger webhook
        await triggerWebhook('ORDER', {
            ...savedOrder.toObject(),
            webhook_type: 'ORDER_CREATED'
        });

        // Emit socket event if io is available
        if (req.app.get('io')) {
            req.app.get('io').emit('new_order', savedOrder);
        }

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: savedOrder
        });
    } catch (error) {
        console.error('❌ Error while creating order:', error.message);
        if (error.name === 'ValidationError') {
            console.error('🧩 Validation details:', error.errors);
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error: error.message
        });
    }
});

// Get all orders
router.get('/all-orders', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        let query = {};
        if (status && status !== 'ALL') {
            query.status = status.toUpperCase();
        }

        const allOrders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Order.countDocuments(query);
        
        console.log(`📊 Total orders in DB: ${total}`);
        
        return res.json({
            success: true,
            count: total,
            data: allOrders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching all orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

// Get order statistics
router.get('/order-stats', requireAuth, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'PENDING' });
        const confirmedOrders = await Order.countDocuments({ status: 'CONFIRMED' });
        const deliveredOrders = await Order.countDocuments({ status: 'DELIVERED' });
        const cancelledOrders = await Order.countDocuments({ status: 'CANCELLED' });
        
        const stats = {
            totalOrders,
            pendingOrders,
            confirmedOrders,
            deliveredOrders,
            cancelledOrders
        };
        
        console.log('📊 Order stats calculated:', stats);
        
        return res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('❌ Error fetching order statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching order statistics',
            error: error.message
        });
    }
});

// Get order by ID
router.get('/order/:order_id', requireAuth, async (req, res) => {
    try {
        const { order_id } = req.params;
        
        const order = await Order.findOne({ order_id });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        return res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('❌ Error fetching order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

// Update order status
router.put('/update-order-status/:order_id', requireAuth, async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status, reason, message } = req.body;

        if (!status || !['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'].includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required (PENDING, CONFIRMED, DELIVERED, CANCELLED)'
            });
        }

        const updateData = {
            status: status.toUpperCase(),
            updatedAt: new Date()
        };

        if (status.toUpperCase() === 'CANCELLED') {
            if (reason) updateData.cancel_reason = reason;
            if (message) updateData.cancel_message = message;
        }

        const oldOrder = await Order.findOne({ order_id });
        const previousStatus = oldOrder?.status || 'UNKNOWN';

        const updatedOrder = await Order.findOneAndUpdate(
            { order_id },
            updateData,
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log(`✅ Order ${order_id} status updated from ${previousStatus} to: ${updatedOrder.status}`);

        // Trigger webhook for order status update
        await triggerWebhook('ORDER', {
            ...updatedOrder.toObject(),
            webhook_type: 'ORDER_STATUS_UPDATED',
            action: 'STATUS_UPDATE',
            status_change: {
                from: previousStatus,
                to: status.toUpperCase(),
                reason,
                message
            },
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('order_updated', updatedOrder);
        }

        return res.json({
            success: true,
            message: `Order status updated to ${updatedOrder.status}`,
            data: updatedOrder
        });
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

// Get orders by sender ID
router.get('/sender-orders/:sender_id', requireAuth, async (req, res) => {
    try {
        const { sender_id } = req.params;
        
        const senderOrders = await Order.find({ sender_id }).sort({ createdAt: -1 });
        
        console.log(`📦 Found ${senderOrders.length} orders for sender: ${sender_id}`);
        
        return res.json({
            success: true,
            count: senderOrders.length,
            data: senderOrders
        });
    } catch (error) {
        console.error('❌ Error fetching sender orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sender orders',
            error: error.message
        });
    }
});

// Get orders by recipient ID
router.get('/recipient-orders/:recipient_id', requireAuth, async (req, res) => {
    try {
        const { recipient_id } = req.params;
        
        const recipientOrders = await Order.find({ recipient_id }).sort({ createdAt: -1 });
        
        console.log(`📦 Found ${recipientOrders.length} orders for recipient: ${recipient_id}`);
        
        return res.json({
            success: true,
            count: recipientOrders.length,
            data: recipientOrders
        });
    } catch (error) {
        console.error('❌ Error fetching recipient orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching recipient orders',
            error: error.message
        });
    }
});

// Get orders by status
router.get('/orders-by-status/:status', requireAuth, async (req, res) => {
    try {
        const { status } = req.params;
        
        if (!['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'].includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required (PENDING, CONFIRMED, DELIVERED, CANCELLED)'
            });
        }

        const orders = await Order.find({ status: status.toUpperCase() }).sort({ createdAt: -1 });
        
        console.log(`📦 Found ${orders.length} orders with status: ${status}`);
        
        return res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('❌ Error fetching orders by status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching orders by status',
            error: error.message
        });
    }
});

// Get orders with filtering
router.get('/orders', requireAuth, async (req, res) => {
    try {
        const { status, sender_id, order_id } = req.query;
        
        let query = {};
        if (status) query.status = status.toUpperCase();
        if (sender_id) query.sender_id = sender_id;
        if (order_id) query.order_id = order_id;
        
        const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50);
        
        console.log(`📊 Found ${orders.length} orders with filters:`, query);
        
        return res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

module.exports = router;
