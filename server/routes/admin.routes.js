// ==============================
// 👥 Admin Management Routes
// ==============================

const express = require('express');
const router = express.Router();
const { Admin, AdminActivity } = require('../models');
const { hashPassword, logActivity } = require('../utils/helpers');
const { sessions, requireAuth, requireOwner } = require('../middleware/auth');

// Get all admins (owner only)
router.get('/', requireAuth, requireOwner, async (req, res) => {
    try {
        const admins = await Admin.find({ role: 'ADMIN' })
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching admins',
            error: error.message
        });
    }
});

// Create admin (owner only)
router.post('/', requireAuth, requireOwner, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const existing = await Admin.findOne({ username });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const hashedPassword = hashPassword(password);
        const admin = await Admin.create({
            username,
            password: hashedPassword,
            role: 'ADMIN',
            createdBy: req.admin.username,
            isActive: true
        });

        await logActivity(req.admin.username, 'ADMIN_CREATED', { newAdmin: username }, req);

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                username: admin.username,
                role: admin.role,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating admin',
            error: error.message
        });
    }
});

// Delete admin (owner only)
router.delete('/:username', requireAuth, requireOwner, async (req, res) => {
    try {
        const { username } = req.params;
        
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (admin.role === 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete owner account'
            });
        }

        await Admin.deleteOne({ username });
        
        // Delete all sessions for this admin
        for (const [token, session] of sessions.entries()) {
            if (session.admin.username === username) {
                sessions.delete(token);
            }
        }

        await logActivity(req.admin.username, 'ADMIN_DELETED', { deletedAdmin: username }, req);

        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting admin',
            error: error.message
        });
    }
});

// Toggle admin status (owner only)
router.put('/:username/toggle', requireAuth, requireOwner, async (req, res) => {
    try {
        const { username } = req.params;
        
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (admin.role === 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify owner account'
            });
        }

        admin.isActive = !admin.isActive;
        await admin.save();

        // If deactivated, remove all sessions
        if (!admin.isActive) {
            for (const [token, session] of sessions.entries()) {
                if (session.admin.username === username) {
                    sessions.delete(token);
                }
            }
        }

        await logActivity(req.admin.username, 'ADMIN_STATUS_TOGGLED', { 
            targetAdmin: username, 
            newStatus: admin.isActive ? 'active' : 'inactive' 
        }, req);

        res.json({
            success: true,
            message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: admin.isActive
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling admin status',
            error: error.message
        });
    }
});

// Get admin activities (owner only)
router.get('/activities', requireAuth, requireOwner, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const activities = await AdminActivity.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AdminActivity.countDocuments();

        res.json({
            success: true,
            data: activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activities',
            error: error.message
        });
    }
});

// Get specific admin activities (owner only)
router.get('/activities/:username', requireAuth, requireOwner, async (req, res) => {
    try {
        const { username } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const activities = await AdminActivity.find({ adminUsername: username })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AdminActivity.countDocuments({ adminUsername: username });

        res.json({
            success: true,
            data: activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activities',
            error: error.message
        });
    }
});

module.exports = router;
