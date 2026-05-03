/**
 * Simple API key guard for write routes (e.g. POST /api/v1/songs).
 * Set API_KEY in your .env — requests must send it in the x-api-key header.
 */
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!process.env.API_KEY) {
        console.warn('[Auth] API_KEY env variable is not set — upload route is unprotected!');
        return next();
    }

    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized — valid x-api-key header is required',
        });
    }

    next();
};

module.exports = authMiddleware;