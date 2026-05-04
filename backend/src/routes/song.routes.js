const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const Song = require('../models/song.model');
const uploadFile = require('../service/storage.service');
const authMiddleware = require('../middleware/auth.middleware');
const { validateSongBody } = require('../middleware/validate.middleware');
const { ALLOWED_MOODS } = require('../constants/moods');

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_MB || 20) * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('audio/')) {
            return cb(
                Object.assign(new Error('Only audio files are allowed'), { status: 415 }),
                false
            );
        }
        cb(null, true);
    },
});

// Strict limiter for uploads only — 20 POSTs per 15 min per IP
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Upload limit reached. Please try again later.' },
});

// ─── POST /api/v1/songs ──────────────────────────────────────────────────────
router.post(
    '/songs',
    uploadLimiter,
    authMiddleware,
    upload.single('audio'),
    validateSongBody,
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                    error: 'FILE_REQUIRED',
                    hint: 'Send multipart/form-data with an audio file field named "audio".',
                });
            }

            const { title, artist, mood } = req.body;

            const fileData = await uploadFile(req.file);

            const song = await Song.create({
                title,
                artist,
                audio: fileData.url,
                mood,
            });

            res.status(201).json({
                success: true,
                message: 'Song created successfully',
                song,
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET /api/v1/songs ───────────────────────────────────────────────────────
router.get('/songs', async (req, res, next) => {
    try {
        const { mood } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (mood) {
            if (!ALLOWED_MOODS.includes(mood.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid mood filter. Allowed values: ${ALLOWED_MOODS.join(', ')}`,
                });
            }
            filter.mood = mood.toLowerCase();
        }

        const [songs, total] = await Promise.all([
            Song.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Song.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            message: 'Songs retrieved successfully',
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            songs,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;