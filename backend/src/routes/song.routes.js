const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadFile = require('../service/storage.service');

const Song = require('../models/song.model');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/songs', upload.any(), async (req, res) => {
    try {
        const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : undefined);

        if (!uploadedFile) {
            return res.status(400).json({
                message: 'No file uploaded',
                error: 'FILE_REQUIRED',
                hint: 'Send multipart/form-data with a File field, preferably named audio.'
            });
        }


        const title = String(req.body.title ?? req.body['title '] ?? '').trim();
        const artist = String(req.body.artist ?? req.body['artist '] ?? '').trim();
        const mood = String(req.body.mood ?? req.body['mood '] ?? '').trim();

        if (!title || !artist) {
            return res.status(400).json({
                message: 'title and artist are required',
                error: 'VALIDATION_ERROR'
            });
        }

        const fileData = await uploadFile(uploadedFile);
        const song = await Song.create({
            title,
            artist,
            audio: fileData.url,
            mood
        });

        res.status(201).json({
            message: 'Song created successfully',
            song
        });
    } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error && error.message ? error.message : 'Unknown upload error';
        const isTimeout = errorMessage.toLowerCase().includes('timed out');
        res.status(isTimeout ? 504 : 500).json({
            message: isTimeout ? 'Upload service is slow. Please retry.' : 'Error uploading file',
            error: errorMessage
        });
    }
});

router.get('/songs', async (req, res) => {
    try {
        const { mood } = req.query;
        const filter = {};

        if (mood) {
            filter.mood = mood;
        }

        const songs = await Song.find(filter);

        res.status(200).json({
            message: 'Songs retrieved successfully',
            songs
        });
    } catch (error) {
        console.error('Fetch songs error:', error);

        res.status(500).json({
            message: 'Error retrieving songs',
            error: error.message
        });
    }
});

module.exports = router;

