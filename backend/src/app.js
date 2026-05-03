const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const songRoutes = require('./routes/song.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsOrigins = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const corsOptions = corsOrigins.length ? { origin: corsOrigins } : {};
app.use(cors(corsOptions));

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── Request logging ─────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiters ───────────────────────────────────────────────────────────
// Global limiter — 200 requests per 15 min per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limiter for uploads — 20 per 15 min per IP
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Upload limit reached. Please try again later.' },
});

app.use(globalLimiter);
app.use('/api/v1/songs', uploadLimiter); // applied only to the songs endpoint

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1', songRoutes);

// ─── Centralized error handler ────────────────────────────────────────────────
// Must be mounted AFTER all routes
app.use(errorMiddleware);

module.exports = app;