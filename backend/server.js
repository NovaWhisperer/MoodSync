require('dotenv').config();

const app = require('./src/app');
const PORT = process.env.PORT || 3000;
const connectDB = require('./src/db/db');

app.get('/', (req, res) => {
    res.json({
        message: 'MoodSync API is running',
        health: 'ok'
    });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();