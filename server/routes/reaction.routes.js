// ==============================
// 🔥 Reaction Routes
// ==============================

const express = require('express');
const router = express.Router();
const { ReactionLog } = require('../models');
const { triggerWebhook } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

// Save reaction data
router.post('/save-reaction', async (req, res) => {
    try {
        const reactionData = req.body;

        console.log('📩 Received reaction data:', reactionData);

        if (!reactionData.user_id || !reactionData.reaction_type) {
            return res.status(400).json({
                success: false,
                message: 'user_id and reaction_type are mandatory fields. Data is incomplete.'
            });
        }

        reactionData.reaction_type = reactionData.reaction_type.toUpperCase();
        reactionData.action_type = reactionData.action_type?.toUpperCase() || 'ADDED';
        
        if (reactionData.custom_action) {
            reactionData.custom_action = reactionData.custom_action.toString().trim();
        }
        
        if (reactionData.previous_reaction) {
            reactionData.previous_reaction = reactionData.previous_reaction.toString().toUpperCase();
        }

        if (reactionData.action_type && reactionData.action_type.match(/REMOVE|DELETE|REMOVED/i)) {
            let verb = 'REMOVED';
            if (reactionData.action_type.match(/DELETE/i)) {
                verb = 'DELETED';
            } else if (reactionData.action_type.match(/REMOVE/i)) {
                verb = 'REMOVED';
            }
            
            const deleteResult = await ReactionLog.deleteMany({
                user_id: reactionData.user_id,
                post_id: reactionData.post_id,
                reaction_type: reactionData.reaction_type
            });
            
            console.log(`🗑️ ${verb} ${deleteResult.deletedCount} reaction(s) from database - NO HISTORY KEPT`);
            
            // Trigger webhook for reaction removal
            await triggerWebhook('REACTION', {
                ...reactionData,
                verb: verb,
                action: `${verb}_FROM_DATABASE`,
                webhook_type: 'REACTION_REMOVED',
                deleted_count: deleteResult.deletedCount,
                timestamp: new Date().toISOString()
            });
            
            if (req.app.get('io')) {
                req.app.get('io').emit('reaction_removed', {
                    user_id: reactionData.user_id,
                    post_id: reactionData.post_id,
                    reaction_type: reactionData.reaction_type,
                    verb: verb,
                    deleted_count: deleteResult.deletedCount
                });
            }
            
            return res.status(201).json({
                success: true,
                message: `Reaction ${verb.toLowerCase()} from database - no history kept`,
                verb: verb,
                deleted_count: deleteResult.deletedCount,
                removed_data: {
                    user_id: reactionData.user_id,
                    post_id: reactionData.post_id,
                    reaction_type: reactionData.reaction_type
                },
                note: deleteResult.deletedCount === 0 ? 'No existing reaction found to remove' : 'Reaction successfully removed'
            });
        }

        const newLog = new ReactionLog(reactionData);
        const savedLog = await newLog.save();

        console.log(`✅ New reaction action: ${savedLog.action_type} with ID: ${savedLog._id}`);

        // Trigger webhook for new reaction
        await triggerWebhook('REACTION', {
            ...savedLog.toObject(),
            webhook_type: 'REACTION_ADDED',
            action: savedLog.action_type,
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('new_reaction', savedLog);
        }

        return res.status(201).json({
            success: true,
            message: `Reaction data saved successfully. Action: ${savedLog.action_type}`,
            data: savedLog
        });
    } catch (error) {
        console.error('❌ Error while saving reaction data:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error: error.message
        });
    }
});

// Get all reactions
router.get('/all-reactions', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const allReactions = await ReactionLog.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await ReactionLog.countDocuments();
        
        console.log(`📊 Total reactions in DB: ${total}`);
        
        return res.json({
            success: true,
            count: total,
            data: allReactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching all reactions:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching reactions',
            error: error.message
        });
    }
});

// Get reaction statistics
router.get('/reaction-stats', requireAuth, async (req, res) => {
    try {
        const totalReactions = await ReactionLog.countDocuments();
        
        const reactionsByType = await ReactionLog.aggregate([
            { $group: { _id: '$reaction_type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const reactionsByUser = await ReactionLog.aggregate([
            { $group: { _id: '$user_id', count: { $sum: 1 }, name: { $first: '$name' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const reactionsByPost = await ReactionLog.aggregate([
            { $group: { _id: '$post_id', count: { $sum: 1 }, post_url: { $first: '$post_url' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            stats: {
                totalReactions,
                reactionsByType,
                topUsers: reactionsByUser,
                topPosts: reactionsByPost
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reaction statistics',
            error: error.message
        });
    }
});

// Find reactions by query
router.get('/find-reactions', requireAuth, async (req, res) => {
    try {
        const { user_id, reaction_type, action_type, post_id, custom_action } = req.query;
        
        let query = {};
        if (user_id) query.user_id = user_id;
        if (reaction_type) query.reaction_type = reaction_type.toUpperCase();
        if (action_type) query.action_type = new RegExp(action_type, 'i');
        if (post_id) query.post_id = post_id;
        if (custom_action) query.custom_action = new RegExp(custom_action, 'i');

        const reactions = await ReactionLog.find(query).sort({ createdAt: -1 });
        
        console.log(`🔍 Found ${reactions.length} reactions with query:`, query);
        
        return res.json({
            success: true,
            count: reactions.length,
            data: reactions
        });
    } catch (error) {
        console.error('❌ Error finding reactions:', error);
        return res.status(500).json({
            success: false,
            message: 'Error finding reactions',
            error: error.message
        });
    }
});

// Get user's reaction history
router.get('/user-reactions/:user_id', requireAuth, async (req, res) => {
    try {
        const { user_id } = req.params;
        
        const userReactions = await ReactionLog.find({ user_id }).sort({ createdAt: -1 });
        
        console.log(`👤 Found ${userReactions.length} reactions for user: ${user_id}`);
        
        return res.json({
            success: true,
            count: userReactions.length,
            data: userReactions
        });
    } catch (error) {
        console.error('❌ Error fetching user reactions:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user reactions',
            error: error.message
        });
    }
});

// Get current active reactions for a user-post combination
router.get('/current-reaction/:user_id/:post_id', requireAuth, async (req, res) => {
    try {
        const { user_id, post_id } = req.params;
        
        const currentReaction = await ReactionLog.findOne({ user_id, post_id }).sort({ createdAt: -1 });
        
        if (!currentReaction) {
            return res.json({
                success: true,
                has_reaction: false,
                message: 'No reaction found for this user and post'
            });
        }
        
        const has_active_reaction = !currentReaction.action_type.match(/REMOVE|DELETE|REMOVED/i);
        
        return res.json({
            success: true,
            has_reaction: has_active_reaction,
            current_reaction: has_active_reaction ? currentReaction.reaction_type : null,
            last_action: currentReaction.action_type,
            custom_action: currentReaction.custom_action,
            last_updated: currentReaction.createdAt,
            data: currentReaction
        });
    } catch (error) {
        console.error('❌ Error fetching current reaction:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching current reaction',
            error: error.message
        });
    }
});

module.exports = router;
