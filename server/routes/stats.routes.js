// ==============================
// 📊 General Statistics Routes
// ==============================

const express = require('express');
const router = express.Router();
const { mongoose } = require('../config/database');
const { ReactionLog, CommentLog, Order, WebhookConfig, UserBan } = require('../models');
const { requireAuth } = require('../middleware/auth');

// Get database stats
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const totalReactions = await ReactionLog.countDocuments();
        const totalComments = await CommentLog.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        const reactionsByType = await ReactionLog.aggregate([
            { $group: { _id: '$reaction_type', count: { $sum: 1 } } }
        ]);
        
        const reactionActionsByType = await ReactionLog.aggregate([
            { $group: { _id: '$action_type', count: { $sum: 1 } } }
        ]);
        
        const commentActionsByType = await CommentLog.aggregate([
            { $group: { _id: '$action_type', count: { $sum: 1 } } }
        ]);
        
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const latestReaction = await ReactionLog.findOne().sort({ createdAt: -1 });
        const latestComment = await CommentLog.findOne().sort({ createdAt: -1 });
        const latestOrder = await Order.findOne().sort({ createdAt: -1 });
        
        const uniqueReactionActions = await ReactionLog.distinct('custom_action', { custom_action: { $ne: null, $ne: '' } });
        const uniqueCommentActions = await CommentLog.distinct('custom_action', { custom_action: { $ne: null, $ne: '' } });
        
        return res.json({
            success: true,
            stats: {
                totalReactions,
                totalComments,
                totalOrders,
                reactionsByType,
                reactionActionsByType,
                commentActionsByType,
                ordersByStatus,
                uniqueReactionActions,
                uniqueCommentActions,
                latestReaction: latestReaction ? {
                    id: latestReaction._id,
                    user_id: latestReaction.user_id,
                    reaction_type: latestReaction.reaction_type,
                    action_type: latestReaction.action_type,
                    createdAt: latestReaction.createdAt
                } : null,
                latestComment: latestComment ? {
                    id: latestComment._id,
                    user_id: latestComment.user_id,
                    comment_id: latestComment.comment_id,
                    action_type: latestComment.action_type,
                    createdAt: latestComment.createdAt
                } : null,
                latestOrder: latestOrder ? {
                    id: latestOrder._id,
                    order_id: latestOrder.order_id,
                    name: latestOrder.name,
                    product_name: latestOrder.product_name,
                    status: latestOrder.status,
                    createdAt: latestOrder.createdAt
                } : null,
                database: mongoose.connection.db.databaseName
            }
        });
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting stats',
            error: error.message
        });
    }
});

// Get all unique action types
router.get('/action-types', async (req, res) => {
    try {
        const reactionActions = await ReactionLog.distinct('action_type');
        const commentActions = await CommentLog.distinct('action_type');
        const uniqueReactionCustomActions = await ReactionLog.distinct('custom_action', { custom_action: { $ne: null, $ne: '' } });
        const uniqueCommentCustomActions = await CommentLog.distinct('custom_action', { custom_action: { $ne: null, $ne: '' } });
        
        return res.json({
            success: true,
            reaction_actions: reactionActions,
            comment_actions: commentActions,
            reaction_custom_actions: uniqueReactionCustomActions,
            comment_custom_actions: uniqueCommentCustomActions
        });
    } catch (error) {
        console.error('❌ Error fetching action types:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching action types',
            error: error.message
        });
    }
});

// Dashboard stats route
router.get('/dashboard-stats', requireAuth, async (req, res) => {
    try {
        console.log('📊 Fetching dashboard stats...');
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                message: 'Database not connected',
                mongodb_state: mongoose.connection.readyState
            });
        }

        const [
            totalReactions,
            totalComments,
            totalOrders,
            pendingOrders,
            webhookCount,
            bannedUsersCount
        ] = await Promise.all([
            ReactionLog.countDocuments(),
            CommentLog.countDocuments(),
            Order.countDocuments(),
            Order.countDocuments({ status: 'PENDING' }),
            WebhookConfig.countDocuments({ isActive: true }),
            UserBan.countDocuments({ isActive: true })
        ]);

        const recentReactions = await ReactionLog.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        const recentComments = await CommentLog.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalReactions,
                totalComments,
                totalOrders,
                pendingOrders,
                webhookCount,
                bannedUsersCount,
                recentReactions,
                recentComments,
                recentOrders
            }
        });
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message,
            mongodb_state: mongoose.connection.readyState
        });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '✅ Enhanced Dashboard API is running.',
        timestamp: new Date().toISOString(),
        mongodb: {
            connected: mongoose.connection.readyState === 1,
            state: mongoose.connection.readyState,
            database: mongoose.connection.db?.databaseName || 'Not connected'
        }
    });
});

module.exports = router;

