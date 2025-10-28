// ==============================
// 🔗 Webhook Management Routes
// ==============================

const express = require('express');
const router = express.Router();
const { WebhookConfig } = require('../models');
const { requireAuth, requireOwner } = require('../middleware/auth');

// Get all webhooks (Owner only)
router.get('/', requireAuth, requireOwner, async (req, res) => {
    try {
        const webhooks = await WebhookConfig.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: webhooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching webhooks',
            error: error.message
        });
    }
});

// Create webhook (Owner only)
router.post('/', requireAuth, requireOwner, async (req, res) => {
    try {
        const { name, url, type, headers, description } = req.body;
        
        if (!name || !url || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name, URL, and type are required'
            });
        }

        const webhook = new WebhookConfig({
            name,
            url,
            type,
            headers: headers || {},
            description
        });

        const savedWebhook = await webhook.save();
        
        // Note: io is passed from main server
        if (req.app.get('io')) {
            req.app.get('io').emit('webhook_created', savedWebhook);
        }
        
        res.status(201).json({
            success: true,
            message: 'Webhook created successfully',
            data: savedWebhook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating webhook',
            error: error.message
        });
    }
});

// Update webhook (Owner only)
router.put('/:id', requireAuth, requireOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const webhook = await WebhookConfig.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        if (req.app.get('io')) {
            req.app.get('io').emit('webhook_updated', webhook);
        }
        
        res.json({
            success: true,
            message: 'Webhook updated successfully',
            data: webhook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating webhook',
            error: error.message
        });
    }
});

// Delete webhook (Owner only)
router.delete('/:id', requireAuth, requireOwner, async (req, res) => {
    try {
        const { id } = req.params;

        const webhook = await WebhookConfig.findByIdAndDelete(id);

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        if (req.app.get('io')) {
            req.app.get('io').emit('webhook_deleted', { id });
        }
        
        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting webhook',
            error: error.message
        });
    }
});

module.exports = router;
