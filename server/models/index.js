// ==============================
// 📦 Database Models
// ==============================

const mongoose = require('mongoose');

// Webhook Configuration Schema
const webhookSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['REACTION', 'COMMENT', 'ORDER', 'USER_BAN', 'DATA_CLEANUP'] 
    },
    isActive: { type: Boolean, default: true },
    headers: { type: Object, default: {} },
    description: { type: String, trim: true }
}, {
    timestamps: true
});

// User Ban Schema
const userBanSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },
    user_name: { type: String, trim: true },
    ban_type: { 
        type: String, 
        required: true, 
        enum: ['REACTION', 'COMMENT', 'ALL'] 
    },
    reason: { type: String, trim: true },
    banned_by: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Admin Schema
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['OWNER', 'ADMIN'],
        default: 'ADMIN'
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
    lastLogin: { type: Date }
}, {
    timestamps: true
});

// Admin Activity Log Schema
const adminActivitySchema = new mongoose.Schema({
    adminUsername: { type: String, required: true, index: true },
    action: { type: String, required: true },
    details: { type: Object },
    ipAddress: { type: String },
    userAgent: { type: String }
}, {
    timestamps: true
});

// Reaction Schema
const reactionSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    user_id: { type: String, required: true, index: true },
    reaction_type: { 
        type: String, 
        required: true, 
        enum: ['LIKE', 'LOVE', 'ANGRY', 'HAHA', 'SAD', 'WOW'] 
    },
    post_url: { type: String, trim: true },
    post_id: { type: String, index: true },
    action_type: {
        type: String,
        required: true,
        default: 'ADDED'
    },
    previous_reaction: {
        type: String
    },
    custom_action: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    strict: false
});

// Comment Schema
const commentSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    user_id: { type: String, required: true, index: true },
    comment: { type: String, required: true, trim: true },
    comment_id: { type: String, required: true, index: true },
    post_id: { type: String, required: true, index: true },
    post_link: { type: String, trim: true },
    action_type: {
        type: String,
        required: true,
        default: 'ADDED'
    },
    parent_comment_id: {
        type: String,
        index: true
    },
    reply_to: {
        type: String,
        trim: true
    },
    custom_action: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    strict: false
});

// Order Schema
const orderSchema = new mongoose.Schema({
    order_id: { 
        type: String, 
        unique: true, 
        index: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    number: { 
        type: String, 
        required: true, 
        trim: true 
    },
    address: { 
        type: String, 
        required: true, 
        trim: true 
    },
    product_name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    total_product: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    total_price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    text: { 
        type: String, 
        trim: true 
    },
    sender_id: { 
        type: String, 
        required: true, 
        index: true 
    },
    recipient_id: { 
        type: String, 
        required: true, 
        index: true 
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    cancel_reason: { type: String, trim: true },
    cancel_message: { type: String, trim: true }
}, {
    timestamps: true,
    strict: false
});

// Product Schema
const productSchema = new mongoose.Schema({
    productName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    brandName: { 
        type: String, 
        trim: true 
    },
    shortDescription: { 
        type: String, 
        trim: true 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    discount: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100 
    },
    finalPrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    stockQuantity: { 
        type: Number, 
        required: true, 
        default: 0, 
        min: 0 
    },
    productCode: { 
        type: String, 
        unique: true, 
        required: true, 
        trim: true,
        index: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Auto-calculate final price before saving
productSchema.pre('save', function(next) {
    if (this.price && this.discount >= 0) {
        this.finalPrice = this.price - (this.price * this.discount / 100);
    }
    next();
});

// Create and export models
const WebhookConfig = mongoose.model('WebhookConfig', webhookSchema);
const UserBan = mongoose.model('UserBan', userBanSchema);
const Admin = mongoose.model('Admin', adminSchema);
const AdminActivity = mongoose.model('AdminActivity', adminActivitySchema);
const ReactionLog = mongoose.model('ReactionLog', reactionSchema, 'reaction');
const CommentLog = mongoose.model('CommentLog', commentSchema, 'comment');
const Order = mongoose.model('Order', orderSchema, 'order');
const Product = mongoose.model('Product', productSchema, 'products');

module.exports = {
    WebhookConfig,
    UserBan,
    Admin,
    AdminActivity,
    ReactionLog,
    CommentLog,
    Order,
    Product
};
