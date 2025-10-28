// ==============================
// 📦 Product Management Routes
// ==============================

const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { requireAuth, requireOwner } = require('../middleware/auth');

// ==============================
// 🌐 PUBLIC ROUTES (No Auth Required)
// ==============================

// Get all products (Public API for n8n)
router.get('/public/products', async (req, res) => {
    try {
        const { status, page = 1, limit = 100 } = req.query;
        
        const filter = {};
        if (status && status !== 'ALL') {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// ==============================
// 🔐 PROTECTED ROUTES (Auth Required)
// ==============================

// Get all products (Admin)
router.get('/products', requireAuth, async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;
        
        const filter = {};
        if (status && status !== 'ALL') {
            filter.status = status;
        }
        
        if (search) {
            filter.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { brandName: { $regex: search, $options: 'i' } },
                { productCode: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// Get product statistics
router.get('/product-stats', requireAuth, async (req, res) => {
    try {
        const [
            totalProducts,
            activeProducts,
            inactiveProducts,
            outOfStockProducts,
            totalStockValue
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ status: 'ACTIVE' }),
            Product.countDocuments({ status: 'INACTIVE' }),
            Product.countDocuments({ status: 'OUT_OF_STOCK' }),
            Product.aggregate([
                { $match: { status: 'ACTIVE' } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$finalPrice', '$stockQuantity'] } } } }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                totalProducts,
                activeProducts,
                inactiveProducts,
                outOfStockProducts,
                totalStockValue: totalStockValue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product statistics',
            error: error.message
        });
    }
});

// Create product
router.post('/products', requireAuth, async (req, res) => {
    try {
        const { 
            productName, 
            brandName, 
            shortDescription, 
            price, 
            discount, 
            stockQuantity, 
            productCode, 
            status 
        } = req.body;

        // Validate required fields
        if (!productName || !price || !productCode || stockQuantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Product name, price, product code, and stock quantity are required'
            });
        }

        // Check if product code already exists
        const existingProduct = await Product.findOne({ productCode });
        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: 'Product code already exists. Please use a unique product code.'
            });
        }

        // Calculate final price
        const discountValue = discount || 0;
        const finalPrice = price - (price * discountValue / 100);

        const product = new Product({
            productName,
            brandName,
            shortDescription,
            price,
            discount: discountValue,
            finalPrice,
            stockQuantity,
            productCode,
            status: status || 'ACTIVE'
        });

        const savedProduct = await product.save();

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('product_created', savedProduct);
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: savedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

// Update product
router.put('/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Recalculate final price if price or discount is updated
        if (updateData.price !== undefined || updateData.discount !== undefined) {
            const currentProduct = await Product.findById(id);
            if (!currentProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const price = updateData.price !== undefined ? updateData.price : currentProduct.price;
            const discount = updateData.discount !== undefined ? updateData.discount : currentProduct.discount;
            updateData.finalPrice = price - (price * discount / 100);
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('product_updated', product);
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// Delete product
router.delete('/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('product_deleted', { id });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

// Get single product by ID
router.get('/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

module.exports = router;
