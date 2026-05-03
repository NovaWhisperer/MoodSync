require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            console.log(`[Server] Running on http://localhost:${PORT}`);
        });

        const shutdown = (signal) => {
            console.log(`[Server] ${signal} received — shutting down gracefully...`);

            server.close(async () => {
                console.log('[Server] HTTP server closed');

                try {
                    await mongoose.connection.close();
                    console.log('[DB] MongoDB connection closed');
                } catch (err) {
                    console.error('[DB] Error closing MongoDB connection:', err.message);
                }

                process.exit(0);
            });

            setTimeout(() => {
                console.error('[Server] Graceful shutdown timed out — forcing exit');
                process.exit(1);
            }, 10_000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        console.error('[Server] Failed to start:', error.message);
        process.exit(1);
    }
};

startServer();