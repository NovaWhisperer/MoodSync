const express = require('express');
const router = express.Router();
const multer = require('multer');

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
        const isAudio = file.mimetype.startsWith('audio/');
        if (!isAudio) {
            return cb(
                Object.assign(new Error('Only audio files are allowed'), { status: 415 }),
                false
            );
        }
        cb(null, true);
    },
});

// ─── POST /api/v1/songs ──────────────────────────────────────────────────────
// Protected: requires x-api-key header
// Body (multipart/form-data): title, artist, mood + an audio file field
router.post(
    '/songs',
    authMiddleware,
    upload.any(),
    validateSongBody,
    async (req, res, next) => {
        try {
            const uploadedFile =
                req.file || (Array.isArray(req.files) ? req.files[0] : undefined);

            if (!uploadedFile) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                    error: 'FILE_REQUIRED',
                    hint: 'Send multipart/form-data with an audio file field (preferably named "audio").',
                });
            }

            const { title, artist, mood } = req.body; // already sanitized by validateSongBody

            const fileData = await uploadFile(uploadedFile);

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
            next(err); // passes to centralized error handler
        }
    }
);

// ─── GET /api/v1/songs ───────────────────────────────────────────────────────
// Public — optional ?mood= filter, paginated via ?page=&limit=
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