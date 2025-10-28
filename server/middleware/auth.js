// ==============================
// 🔐 Authentication Middleware
// ==============================

// In-memory session storage (use Redis in production)
const sessions = new Map();

// Authentication middleware
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const session = sessions.get(token);
        
        if (!session || session.expiresAt < Date.now()) {
            sessions.delete(token);
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.'
            });
        }

        // Extend session
        session.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        sessions.set(token, session);

        req.admin = session.admin;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Owner-only middleware
const requireOwner = (req, res, next) => {
    if (req.admin.role !== 'OWNER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Owner privileges required.'
        });
    }
    next();
};

module.exports = {
    sessions,
    requireAuth,
    requireOwner
};
