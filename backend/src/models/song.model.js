const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    audio: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        required: true,
        trim: true
    }
});

const songModel = mongoose.model('Song', songSchema);

module.exports = songModel;