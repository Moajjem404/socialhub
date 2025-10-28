// ==============================
// 🔧 Utility Functions
// ==============================

const crypto = require('crypto');
const axios = require('axios');
const { WebhookConfig, AdminActivity } = require('../models');

// Password hashing
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const verifyPassword = (password, hashedPassword) => {
    return hashPassword(password) === hashedPassword;
};

// Session token generation
const generateSessionToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Generate unique order ID
const generateOrderId = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
};

// Log admin activity
const logActivity = async (adminUsername, action, details = {}, req = null) => {
    try {
        await AdminActivity.create({
            adminUsername,
            action,
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.headers?.['user-agent']
        });
        console.log(`📝 Activity logged: ${adminUsername} - ${action}`);
    } catch (error) {
        console.error('❌ Error logging activity:', error);
    }
};

// Webhook trigger function
const triggerWebhook = async (webhookType, data) => {
    try {
        const webhooks = await WebhookConfig.find({ 
            type: webhookType, 
            isActive: true 
        });
        
        console.log(`🔗 Triggering ${webhookType} webhooks: ${webhooks.length} active webhook(s) found`);
        
        if (webhooks.length === 0) {
            console.log(`⚠️ No active webhooks configured for type: ${webhookType}`);
            console.log(`💡 To receive webhook notifications, create a webhook with type "${webhookType}" in Webhook Management`);
            return;
        }
        
        for (const webhook of webhooks) {
            try {
                console.log(`📤 Sending webhook to: ${webhook.name} (${webhook.url})`);
                console.log(`📊 Webhook payload:`, JSON.stringify(data, null, 2));
                
                const response = await axios.post(webhook.url, {
                    type: webhookType,
                    timestamp: new Date().toISOString(),
                    data: data
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...webhook.headers
                    },
                    timeout: 10000
                });
                
                console.log(`✅ Webhook triggered successfully: ${webhook.name} (${webhookType})`);
                console.log(`📊 Response status: ${response.status} ${response.statusText}`);
            } catch (error) {
                console.error(`❌ Webhook failed: ${webhook.name}`, {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: webhook.url,
                    type: webhookType
                });
                
                if (error.response?.status === 404) {
                    console.error(`🔍 404 Error: Webhook URL not found or incorrect: ${webhook.url}`);
                    console.error(`💡 Please verify the webhook URL is correct and the endpoint is accessible`);
                } else if (error.code === 'ECONNREFUSED') {
                    console.error(`🚫 Connection refused: Cannot connect to ${webhook.url}`);
                    console.error(`💡 Make sure the webhook server is running and accessible`);
                } else if (error.code === 'ETIMEDOUT') {
                    console.error(`⏱️ Timeout: Webhook server took too long to respond`);
                    console.error(`💡 Webhook timeout is set to 10 seconds`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error triggering webhooks:', error.message);
    }
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateSessionToken,
    generateOrderId,
    logActivity,
    triggerWebhook
};
