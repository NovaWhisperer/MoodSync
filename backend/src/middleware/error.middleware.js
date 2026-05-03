/**
 * Centralized error handler — mount this last in app.js after all routes.
 * Catches any error passed via next(err) and returns a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl} —`, err.message || err);

    const status = err.status || err.statusCode || 500;

    const isTimeout =
        typeof err.message === 'string' && err.message.toLowerCase().includes('timed out');

    res.status(isTimeout ? 504 : status).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorMiddleware;