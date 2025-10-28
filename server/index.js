// ==============================
// 📦 Reaction, Comment & Order Tracking API
// ==============================
// Modular version - Better organized and maintainable

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');

// Import configurations
const { connectDatabase, mongoose } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const webhookRoutes = require('./routes/webhook.routes');
const reactionRoutes = require('./routes/reaction.routes');
const commentRoutes = require('./routes/comment.routes');
const orderRoutes = require('./routes/order.routes');
const banRoutes = require('./routes/ban.routes');
const statsRoutes = require('./routes/stats.routes');
const productRoutes = require('./routes/product.routes');

// ==============================
// ⚙️ Server Configuration
// ==============================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0';

// Make io accessible to routes
app.set('io', io);

// ==============================
// 🧩 Middleware
// ==============================
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==============================
// 🔗 Connect to MongoDB
// ==============================
connectDatabase();

// ==============================
// 🚀 API Routes
// ==============================

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '✅ SocialHub Management API is running.',
        version: '2.0.0',
        documentation: {
            auth: '/api/auth/*',
            admin: '/api/admins/*',
            webhooks: '/api/webhooks/*',
            reactions: '/api/reactions/*',
            comments: '/api/comments/*',
            orders: '/api/orders/*',
            bans: '/api/ban/*',
            stats: '/api/stats/*'
        }
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin management routes (Owner only)
app.use('/api/admins', adminRoutes);
app.use('/api/admin-activities', adminRoutes);

// Webhook management routes
app.use('/api/webhooks', webhookRoutes);

// Reaction routes
app.use('/api', reactionRoutes);

// Comment routes
app.use('/api', commentRoutes);

// Order routes
app.use('/api', orderRoutes);

// User ban management routes
app.use('/api', banRoutes);

// General statistics routes
app.use('/api', statsRoutes);

// Product routes
app.use('/api', productRoutes);

// ==============================
// 🔌 Socket.IO Connection Handling
// ==============================
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });

    socket.on('join_dashboard', () => {
        socket.join('dashboard');
        console.log('📊 User joined dashboard room');
    });
});

// ==============================
// 🖥️ Start Server
// ==============================
mongoose.connection.once('open', () => {
    console.log('\n✅ MongoDB connection established!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`📁 Collections: reaction, comment, order, webhookconfigs, userbans, admins`);
    
    server.listen(PORT, HOST, () => {
        console.log('\n' + '='.repeat(70));
        console.log(`🌍 Server is running at: http://${HOST}:${PORT}`);
        console.log(`🔌 Socket.IO server is ready for real-time updates`);
        console.log('='.repeat(70));
        
        console.log('\n📚 API ROUTES OVERVIEW:');
        console.log('\n🔐 AUTHENTICATION:');
        console.log('   POST   /api/auth/setup-owner           - Initial owner setup');
        console.log('   POST   /api/auth/login                 - Admin login');
        console.log('   POST   /api/auth/logout                - Admin logout');
        console.log('   GET    /api/auth/verify                - Verify session');
        console.log('   GET    /api/auth/me                    - Get current admin info');
        console.log('   PUT    /api/auth/change-password       - Change password');
        
        console.log('\n👥 ADMIN MANAGEMENT (Owner Only):');
        console.log('   GET    /api/admins                     - Get all admins');
        console.log('   POST   /api/admins                     - Create new admin');
        console.log('   DELETE /api/admins/:username           - Delete admin');
        console.log('   PUT    /api/admins/:username/toggle    - Toggle admin status');
        console.log('   GET    /api/admins/activities          - Get all activities');
        
        console.log('\n🔗 WEBHOOK MANAGEMENT:');
        console.log('   GET    /api/webhooks                   - Get all webhooks');
        console.log('   POST   /api/webhooks                   - Create webhook');
        console.log('   PUT    /api/webhooks/:id               - Update webhook');
        console.log('   DELETE /api/webhooks/:id               - Delete webhook');
        
        console.log('\n🔥 REACTIONS:');
        console.log('   POST   /api/save-reaction              - Save reaction');
        console.log('   GET    /api/all-reactions              - Get all reactions');
        console.log('   GET    /api/reaction-stats             - Get reaction stats');
        console.log('   GET    /api/find-reactions             - Find reactions');
        console.log('   GET    /api/user-reactions/:user_id    - Get user reactions');
        
        console.log('\n💬 COMMENTS:');
        console.log('   POST   /api/save-comment               - Save comment');
        console.log('   POST   /api/reply-comment              - Reply to comment');
        console.log('   GET    /api/all-comments               - Get all comments');
        console.log('   GET    /api/comment-stats              - Get comment stats');
        console.log('   DELETE /api/delete-comment/:id         - Delete comment');
        console.log('   GET    /api/find-comments              - Find comments');
        
        console.log('\n📦 ORDERS:');
        console.log('   POST   /api/create-order               - Create order');
        console.log('   GET    /api/all-orders                 - Get all orders');
        console.log('   GET    /api/order-stats                - Get order statistics');
        console.log('   PUT    /api/update-order-status/:id    - Update order status');
        console.log('   GET    /api/orders                     - Get orders (filtered)');
        
        console.log('\n🚫 USER BAN MANAGEMENT:');
        console.log('   POST   /api/ban-user                   - Ban user');
        console.log('   GET    /api/banned-users               - Get banned users');
        console.log('   PUT    /api/unban-user/:user_id        - Unban user');
        console.log('   DELETE /api/remove-user-data/:user_id  - Remove all user data');
        console.log('   GET    /api/ban-stats                  - Get ban statistics');
        console.log('   DELETE /api/cleanup-old-data           - Clean old data');
        
        console.log('\n📊 STATISTICS:');
        console.log('   GET    /api/stats                      - Get database stats');
        console.log('   GET    /api/dashboard-stats            - Get dashboard stats');
        console.log('   GET    /api/action-types               - Get action types');
        console.log('   GET    /api/health                     - Health check');
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ Server ready to accept connections!');
        console.log('='.repeat(70) + '\n');
    });
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
});

module.exports = { app, server, io };
