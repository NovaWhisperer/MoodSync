const authMiddleware = (req, res, next) => {
    if (!process.env.API_KEY) {
        return res.status(500).json({
            success: false,
            message: 'Server misconfiguration: API_KEY environment variable is not set',
        });
    }

    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized — valid x-api-key header is required',
        });
    }

    next();
};

module.exports = authMiddleware;