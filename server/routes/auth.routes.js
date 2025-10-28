// ==============================
// 🔐 Authentication Routes
// ==============================

const express = require('express');
const router = express.Router();
const { Admin } = require('../models');
const { hashPassword, verifyPassword, generateSessionToken, logActivity } = require('../utils/helpers');
const { sessions, requireAuth } = require('../middleware/auth');

// Check if any admin exists
router.get('/check-setup', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        const ownerExists = await Admin.findOne({ role: 'OWNER' });
        
        res.json({
            success: true,
            needsSetup: adminCount === 0,
            ownerExists: !!ownerExists
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking setup status',
            error: error.message
        });
    }
});

// Initial setup - Create owner account
router.post('/setup-owner', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(403).json({
                success: false,
                message: 'Setup already completed. Login instead.'
            });
        }

        const hashedPassword = hashPassword(password);
        const owner = await Admin.create({
            username,
            password: hashedPassword,
            role: 'OWNER',
            isActive: true
        });

        await logActivity(username, 'OWNER_ACCOUNT_CREATED', { isInitialSetup: true }, req);

        console.log(`✅ Owner account created: ${username}`);

        res.status(201).json({
            success: true,
            message: 'Owner account created successfully. Please login.'
        });
    } catch (error) {
        console.error('❌ Error creating owner account:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating owner account',
            error: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const admin = await Admin.findOne({ username, isActive: true });
        
        if (!admin) {
            await logActivity(username, 'LOGIN_FAILED', { reason: 'User not found' }, req);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        if (!verifyPassword(password, admin.password)) {
            await logActivity(username, 'LOGIN_FAILED', { reason: 'Invalid password' }, req);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const token = generateSessionToken();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
        
        sessions.set(token, {
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role
            },
            expiresAt
        });

        admin.lastLogin = new Date();
        await admin.save();

        await logActivity(username, 'LOGIN_SUCCESS', { role: admin.role }, req);

        console.log(`✅ Login successful: ${username} (${admin.role})`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '');
        sessions.delete(token);
        
        await logActivity(req.admin.username, 'LOGOUT', {}, req);
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});

// Verify session
router.get('/verify', requireAuth, (req, res) => {
    res.json({
        success: true,
        admin: {
            username: req.admin.username,
            role: req.admin.role
        }
    });
});

// Get current admin info
router.get('/me', requireAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        
        res.json({
            success: true,
            admin: {
                username: admin.username,
                role: admin.role,
                createdAt: admin.createdAt,
                lastLogin: admin.lastLogin
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching admin info',
            error: error.message
        });
    }
});

// Change password
router.put('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const admin = await Admin.findById(req.admin.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (!verifyPassword(currentPassword, admin.password)) {
            await logActivity(req.admin.username, 'PASSWORD_CHANGE_FAILED', { reason: 'Invalid current password' }, req);
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        admin.password = hashPassword(newPassword);
        await admin.save();

        await logActivity(req.admin.username, 'PASSWORD_CHANGED', {}, req);

        // Invalidate all sessions for this admin
        for (const [token, session] of sessions.entries()) {
            if (session.admin.id === admin._id.toString()) {
                sessions.delete(token);
            }
        }

        res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });
    } catch (error) {
        console.error('❌ Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});

module.exports = router;
