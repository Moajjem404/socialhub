// ==============================
// 💬 Comment Routes
// ==============================

const express = require('express');
const router = express.Router();
const { CommentLog } = require('../models');
const { triggerWebhook } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

// Save comment data
router.post('/save-comment', async (req, res) => {
    try {
        const commentData = req.body;

        console.log('📩 Received comment data:', commentData);

        if (!commentData.user_id || !commentData.comment || !commentData.comment_id || !commentData.post_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id, comment, comment_id and post_id are mandatory fields.'
            });
        }

        commentData.action_type = commentData.action_type?.toUpperCase() || 'ADDED';
        
        if (commentData.custom_action) {
            commentData.custom_action = commentData.custom_action.toString().trim();
        }
        
        if (commentData.parent_comment_id) {
            commentData.parent_comment_id = commentData.parent_comment_id.toString();
        }
        
        if (commentData.reply_to) {
            commentData.reply_to = commentData.reply_to.toString().trim();
        }

        if (commentData.action_type && commentData.action_type.match(/REMOVE|DELETE|REMOVED/i)) {
            let verb = 'REMOVED';
            if (commentData.action_type.match(/DELETE/i)) {
                verb = 'DELETED';
            } else if (commentData.action_type.match(/REMOVE/i)) {
                verb = 'REMOVED';
            }
            
            const deleteResult = await CommentLog.deleteMany({
                user_id: commentData.user_id,
                comment_id: commentData.comment_id,
                post_id: commentData.post_id
            });
            
            console.log(`🗑️ ${verb} ${deleteResult.deletedCount} comment(s) from database - NO HISTORY KEPT`);
            
            // Trigger webhook for comment removal
            await triggerWebhook('COMMENT', {
                ...commentData,
                verb: verb,
                action: `${verb}_FROM_DATABASE`,
                webhook_type: 'COMMENT_REMOVED',
                deleted_count: deleteResult.deletedCount,
                timestamp: new Date().toISOString()
            });
            
            if (req.app.get('io')) {
                req.app.get('io').emit('comment_removed', {
                    user_id: commentData.user_id,
                    comment_id: commentData.comment_id,
                    post_id: commentData.post_id,
                    verb: verb,
                    deleted_count: deleteResult.deletedCount
                });
            }
            
            return res.status(201).json({
                success: true,
                message: `Comment ${verb.toLowerCase()} from database - no history kept`,
                verb: verb,
                deleted_count: deleteResult.deletedCount,
                removed_data: {
                    user_id: commentData.user_id,
                    comment_id: commentData.comment_id,
                    post_id: commentData.post_id
                },
                note: deleteResult.deletedCount === 0 ? 'No existing comment found to remove' : 'Comment successfully removed'
            });
        }

        const newComment = new CommentLog(commentData);
        const savedComment = await newComment.save();

        console.log(`✅ New comment action: ${savedComment.action_type} with ID: ${savedComment._id}`);

        // Trigger webhook for new comment
        await triggerWebhook('COMMENT', {
            ...savedComment.toObject(),
            webhook_type: 'COMMENT_ADDED',
            action: savedComment.action_type,
            timestamp: new Date().toISOString()
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('new_comment', savedComment);
        }

        return res.status(201).json({
            success: true,
            message: `Comment data saved successfully. Action: ${savedComment.action_type}`,
            data: savedComment
        });
    } catch (error) {
        console.error('❌ Error while saving comment data:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error: error.message
        });
    }
});

// Reply to comment
router.post('/reply-comment', requireAuth, async (req, res) => {
    try {
        const { parent_comment_id, reply_text, user_id, user_name, post_id, delete_after_reply } = req.body;
        
        if (!parent_comment_id || !reply_text || !user_id || !post_id) {
            return res.status(400).json({
                success: false,
                message: 'parent_comment_id, reply_text, user_id, and post_id are required'
            });
        }

        const replyData = {
            user_id,
            name: user_name,
            comment: reply_text,
            comment_id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            post_id,
            action_type: 'REPLY',
            parent_comment_id,
            reply_to: parent_comment_id
        };

        const newReply = new CommentLog(replyData);
        const savedReply = await newReply.save();

        console.log(`✅ Reply posted to comment ${parent_comment_id}`);

        // Trigger webhook for reply
        await triggerWebhook('COMMENT', {
            ...savedReply.toObject(),
            webhook_type: 'COMMENT_REPLY',
            action: 'REPLY',
            parent_comment_id,
            delete_after_reply: delete_after_reply || false,
            timestamp: new Date().toISOString()
        });

        // If delete_after_reply is true, delete the parent comment
        if (delete_after_reply) {
            const deletedComment = await CommentLog.findOneAndDelete({ comment_id: parent_comment_id });
            
            console.log(`🗑️ Deleted parent comment ${parent_comment_id} after reply`);
            
            // Trigger webhook for comment deletion after reply
            await triggerWebhook('COMMENT', {
                action: 'DELETE_AFTER_REPLY',
                webhook_type: 'COMMENT_DELETED',
                comment_id: parent_comment_id,
                deleted_comment: deletedComment?.toObject(),
                reason: 'Deleted after admin reply',
                deleted_by: 'admin',
                reply_id: savedReply.comment_id,
                timestamp: new Date().toISOString()
            });
        }

        if (req.app.get('io')) {
            req.app.get('io').emit('new_reply', savedReply);
        }

        res.status(201).json({
            success: true,
            message: 'Reply posted successfully',
            data: savedReply
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error posting reply',
            error: error.message
        });
    }
});

// Get all comments
router.get('/all-comments', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const allComments = await CommentLog.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await CommentLog.countDocuments();
        
        console.log(`📊 Total comments in DB: ${total}`);
        
        return res.json({
            success: true,
            count: total,
            data: allComments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching all comments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching comments',
            error: error.message
        });
    }
});

// Get comment statistics
router.get('/comment-stats', requireAuth, async (req, res) => {
    try {
        const totalComments = await CommentLog.countDocuments();
        
        const commentsByUser = await CommentLog.aggregate([
            { $group: { _id: '$user_id', count: { $sum: 1 }, name: { $first: '$name' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const commentsByPost = await CommentLog.aggregate([
            { $group: { _id: '$post_id', count: { $sum: 1 }, post_link: { $first: '$post_link' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const repliesCount = await CommentLog.countDocuments({ 
            parent_comment_id: { $exists: true, $ne: null } 
        });

        res.json({
            success: true,
            stats: {
                totalComments,
                totalReplies: repliesCount,
                topUsers: commentsByUser,
                topPosts: commentsByPost
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching comment statistics',
            error: error.message
        });
    }
});

// Delete comment
router.delete('/delete-comment/:comment_id', requireAuth, async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { deleteOption } = req.body;

        if (!comment_id || !deleteOption) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const comment = await CommentLog.findOne({ comment_id: comment_id });
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        console.log(`🗑️ Deleting comment ${comment_id} with option: ${deleteOption}`);

        // Trigger webhook for comment deletion BEFORE actual deletion
        await triggerWebhook('COMMENT', {
            action: 'DELETE',
            webhook_type: 'COMMENT_DELETED',
            comment_id: comment_id,
            delete_option: deleteOption,
            comment_data: comment.toObject(),
            deleted_by: 'admin',
            timestamp: new Date().toISOString()
        });

        // Delete from database if requested
        if (deleteOption === 'database' || deleteOption === 'both') {
            await CommentLog.findOneAndDelete({ comment_id: comment_id });
            console.log(`✅ Comment ${comment_id} deleted from database`);
        }

        if (req.app.get('io')) {
            req.app.get('io').emit('comment_deleted', { comment_id, deleteOption });
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully',
            deleteOption: deleteOption
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting comment',
            error: error.message
        });
    }
});

// Find comments by query
router.get('/find-comments', requireAuth, async (req, res) => {
    try {
        const { user_id, post_id, comment_id, action_type, custom_action, parent_comment_id } = req.query;
        
        let query = {};
        if (user_id) query.user_id = user_id;
        if (post_id) query.post_id = post_id;
        if (comment_id) query.comment_id = comment_id;
        if (action_type) query.action_type = new RegExp(action_type, 'i');
        if (custom_action) query.custom_action = new RegExp(custom_action, 'i');
        if (parent_comment_id) query.parent_comment_id = parent_comment_id;

        const comments = await CommentLog.find(query).sort({ createdAt: -1 });
        
        console.log(`🔍 Found ${comments.length} comments with query:`, query);
        
        return res.json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        console.error('❌ Error finding comments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error finding comments',
            error: error.message
        });
    }
});

// Get user's comment history
router.get('/user-comments/:user_id', requireAuth, async (req, res) => {
    try {
        const { user_id } = req.params;
        
        const userComments = await CommentLog.find({ user_id }).sort({ createdAt: -1 });
        
        console.log(`👤 Found ${userComments.length} comments for user: ${user_id}`);
        
        return res.json({
            success: true,
            count: userComments.length,
            data: userComments
        });
    } catch (error) {
        console.error('❌ Error fetching user comments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user comments',
            error: error.message
        });
    }
});

// Get post's comments
router.get('/post-comments/:post_id', requireAuth, async (req, res) => {
    try {
        const { post_id } = req.params;
        
        const postComments = await CommentLog.find({ post_id }).sort({ createdAt: -1 });
        
        console.log(`📝 Found ${postComments.length} comments for post: ${post_id}`);
        
        return res.json({
            success: true,
            count: postComments.length,
            data: postComments
        });
    } catch (error) {
        console.error('❌ Error fetching post comments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching post comments',
            error: error.message
        });
    }
});

// Get comment replies
router.get('/comment-replies/:parent_comment_id', requireAuth, async (req, res) => {
    try {
        const { parent_comment_id } = req.params;
        
        const replies = await CommentLog.find({ parent_comment_id }).sort({ createdAt: -1 });
        
        console.log(`🔄 Found ${replies.length} replies for comment: ${parent_comment_id}`);
        
        return res.json({
            success: true,
            count: replies.length,
            data: replies
        });
    } catch (error) {
        console.error('❌ Error fetching comment replies:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching comment replies',
            error: error.message
        });
    }
});

module.exports = router;
