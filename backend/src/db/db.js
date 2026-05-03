const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10,      // max connections in pool
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('[DB] MongoDB connected successfully');
    } catch (err) {
        console.error('[DB] Initial connection failed:', err.message);
        throw err;
    }
};

// Reconnection listeners — mongoose will auto-reconnect but these log the events
mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected — attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB error:', err.message);
});

module.exports = connectDB;