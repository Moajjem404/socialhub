// ==============================
// 🔗 MongoDB Database Configuration
// ==============================

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://username:password@cluster.mongodb.net/socialhub?retryWrites=true&w=majority';

const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

const connectDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI, connectionOptions);
        console.log('✅ Successfully connected to MongoDB');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 Connection State: ${mongoose.connection.readyState}`);
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        console.error('❌ Connection String:', MONGO_URI.replace(/\/\/.*@/, '//***:***@'));
        process.exit(1);
    }
};

// Handle runtime MongoDB errors
mongoose.connection.on('error', err => {
    console.error('⚠️ MongoDB Run-time Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

module.exports = { connectDatabase, mongoose };
