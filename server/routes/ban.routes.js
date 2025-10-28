// ==============================
// 👤 User Ban Management Routes
// ==============================

const express = require('express');
const router = express.Router();
const { UserBan, ReactionLog, CommentLog, Order } = require('../models');
const { logActivity, triggerWebhook } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

// Ban user
router.post('/ban-user', requireAuth, async (req, res) => {
    try {
        const { user_id, user_name, ban_type, reason, banned_by } = req.body;
        
        if (!user_id || !ban_type || !banned_by) {
            return res.status(400).json({
                success: false,
                message: 'user_id, ban_type, and banned_by are required'
            });
        }

        const existingBan = await UserBan.findOne({
            user_id: user_id,
            isActive: true
        });

        if (existingBan) {
            return res.status(409).json({
                success: false,
                message: 'This user is already banned',
                existing_ban: {
                    ban_id: existingBan._id,
                    ban_type: existingBan.ban_type,
                    reason: existingBan.reason,
                    banned_by: existingBan.banned_by,
                    banned_at: existingBan.createdAt
                },
                can_remove_data: true
            });
        }

        const userBan = new UserBan({
            user_id,
            user_name,
            ban_type,
            reason,
            banned_by
        });

        const savedBan = await userBan.save();
        
        console.log(`🚫 User ${user_id} banned successfully`);
        
        await logActivity(req.admin.username, 'USER_BANNED', {
            user_id,
            user_name,
            ban_type,
            reason
        }, req);
        
        // Trigger webhook for user ban
        await triggerWebhook('USER_BAN', {
            action_type: 'BAN',
            webhook_type: 'USER_BANNED',
            action: 'USER_BANNED',
            user_id,
            user_name,
            ban_type,
            reason,
            banned_by,
            ban_id: savedBan._id,
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('user_banned', savedBan);
        }
        
        res.status(201).json({
            success: true,
            message: 'User banned successfully',
            data: savedBan
        });
    } catch (error) {
        console.error('❌ Error banning user:', error);
        res.status(500).json({
            success: false,
            message: 'Error banning user',
            error: error.message
        });
    }
});

// Get banned users
router.get('/banned-users', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const filterType = req.query.filterType || 'ALL';
        
        const skip = (page - 1) * limit;
        
        let filter = { isActive: true };
        if (filterType !== 'ALL') {
            filter.ban_type = filterType;
        }
        
        const bannedUsers = await UserBan.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await UserBan.countDocuments(filter);
        const pages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: bannedUsers,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching banned users',
            error: error.message
        });
    }
});

// Remove all data for a user
router.delete('/remove-user-data/:user_id', requireAuth, async (req, res) => {
    try {
        const { user_id } = req.params;
        const { remove_reason, removed_by } = req.body;

        console.log(`🗑️ Removing all data for user: ${user_id}`);

        const deletedReactions = await ReactionLog.deleteMany({ user_id: user_id });
        const deletedComments = await CommentLog.deleteMany({ user_id: user_id });
        const deletedOrders = await Order.deleteMany({
            $or: [
                { sender_id: user_id },
                { recipient_id: user_id }
            ]
        });

        console.log(`🗑️ Removed data for user ${user_id}:`, {
            reactions: deletedReactions.deletedCount,
            comments: deletedComments.deletedCount,
            orders: deletedOrders.deletedCount
        });

        await logActivity(req.admin.username, 'USER_DATA_REMOVED', {
            user_id,
            removed_reason: remove_reason,
            deleted_counts: {
                reactions: deletedReactions.deletedCount,
                comments: deletedComments.deletedCount,
                orders: deletedOrders.deletedCount
            }
        }, req);

        // Trigger webhook for user data removal
        await triggerWebhook('USER_BAN', {
            action_type: 'REMOVE_ALL_DATA',
            webhook_type: 'USER_DATA_REMOVED',
            action: 'REMOVE_ALL_DATA',
            user_id: user_id,
            removed_by: removed_by || req.admin?.username || 'admin',
            remove_reason: remove_reason || 'User data cleanup',
            deleted_counts: {
                reactions: deletedReactions.deletedCount,
                comments: deletedComments.deletedCount,
                orders: deletedOrders.deletedCount
            },
            total_removed: deletedReactions.deletedCount + deletedComments.deletedCount + deletedOrders.deletedCount,
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('user_data_removed', {
                user_id: user_id,
                deleted_counts: {
                    reactions: deletedReactions.deletedCount,
                    comments: deletedComments.deletedCount,
                    orders: deletedOrders.deletedCount
                }
            });
        }

        res.json({
            success: true,
            message: `All data removed for user ${user_id}`,
            deleted_counts: {
                reactions: deletedReactions.deletedCount,
                comments: deletedComments.deletedCount,
                orders: deletedOrders.deletedCount
            },
            total_removed: deletedReactions.deletedCount + deletedComments.deletedCount + deletedOrders.deletedCount
        });
    } catch (error) {
        console.error('❌ Error removing user data:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing user data',
            error: error.message
        });
    }
});

// Unban user
router.put('/unban-user/:user_id', requireAuth, async (req, res) => {
    try {
        const { user_id } = req.params;

        const userBan = await UserBan.findOneAndUpdate(
            { user_id: user_id, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!userBan) {
            return res.status(404).json({
                success: false,
                message: 'User not found in banned list'
            });
        }

        await logActivity(req.admin.username, 'USER_UNBANNED', {
            user_id,
            user_name: userBan.user_name,
            ban_type: userBan.ban_type
        }, req);

        console.log(`✅ User ${user_id} unbanned successfully`);

        // Trigger webhook for user unban
        await triggerWebhook('USER_BAN', {
            action_type: 'UNBAN',
            webhook_type: 'USER_UNBANNED',
            action: 'USER_UNBANNED',
            user_id: user_id,
            user_name: userBan.user_name,
            ban_type: userBan.ban_type,
            reason: userBan.reason,
            unbanned_by: req.admin.username,
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('user_unbanned', { user_id, user_name: userBan.user_name });
        }
        
        res.json({
            success: true,
            message: 'User unbanned successfully',
            data: userBan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unbanning user',
            error: error.message
        });
    }
});

// Get ban statistics
router.get('/ban-stats', requireAuth, async (req, res) => {
    try {
        const totalBanned = await UserBan.countDocuments({ isActive: true });
        const reactionBans = await UserBan.countDocuments({ ban_type: 'REACTION', isActive: true });
        const commentBans = await UserBan.countDocuments({ ban_type: 'COMMENT', isActive: true });
        const allBans = await UserBan.countDocuments({ ban_type: 'ALL', isActive: true });
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentBans = await UserBan.countDocuments({ 
            createdAt: { $gte: sevenDaysAgo },
            isActive: true
        });
        
        res.json({
            success: true,
            stats: {
                totalBanned,
                reactionBans,
                commentBans,
                allBans,
                recentBans
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching ban statistics',
            error: error.message
        });
    }
});

// Clean old data (7 days)
router.delete('/cleanup-old-data', requireAuth, async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deletedReactions = await ReactionLog.deleteMany({
            createdAt: { $lt: sevenDaysAgo }
        });

        const deletedComments = await CommentLog.deleteMany({
            createdAt: { $lt: sevenDaysAgo }
        });

        console.log(`🧹 Data cleanup completed: ${deletedReactions.deletedCount} reactions, ${deletedComments.deletedCount} comments`);

        // Trigger webhook for data cleanup
        await triggerWebhook('DATA_CLEANUP', {
            action: 'DATA_CLEANUP',
            webhook_type: 'DATA_CLEANUP',
            deleted_reactions: deletedReactions.deletedCount,
            deleted_comments: deletedComments.deletedCount,
            total_deleted: deletedReactions.deletedCount + deletedComments.deletedCount,
            cleanup_date: sevenDaysAgo,
            triggered_by: req.admin?.username || 'admin',
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('data_cleanup', {
                deleted_reactions: deletedReactions.deletedCount,
                deleted_comments: deletedComments.deletedCount
            });
        }
        
        res.json({
            success: true,
            message: 'Old data cleaned successfully',
            data: {
                deleted_reactions: deletedReactions.deletedCount,
                deleted_comments: deletedComments.deletedCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cleaning old data',
            error: error.message
        });
    }
});

module.exports = router;
