const mongoose = require('mongoose');
const { ALLOWED_MOODS } = require('../constants/moods');

const songSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        artist: {
            type: String,
            required: true,
            trim: true,
        },
        audio: {
            type: String,
            required: true,
        },
        mood: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            enum: {
                values: ALLOWED_MOODS,
                message: `Mood must be one of: ${ALLOWED_MOODS.join(', ')}`,
            },
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

// Index on mood since it's the primary query filter
songSchema.index({ mood: 1 });

const Song = mongoose.model('Song', songSchema);

module.exports = Song;