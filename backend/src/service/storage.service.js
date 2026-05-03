const imagekit = require('../config/imagekit.config');

// Stricter than multer's audio/* prefix check — rejects uncommon/unknown audio subtypes
// that browsers might fabricate before they reach ImageKit.
const ALLOWED_AUDIO_MIME_TYPES = new Set([
    'audio/mpeg',   // .mp3
    'audio/wav',    // .wav
    'audio/ogg',    // .ogg
    'audio/mp4',    // .m4a / .mp4 audio
    'audio/aac',    // .aac
    'audio/flac',   // .flac
    'audio/x-flac',
    'audio/webm',   // .webm audio
]);

const UPLOAD_TIMEOUT_MS = Number(process.env.UPLOAD_TIMEOUT_MS) || 20_000;

/**
 * Uploads an audio file to ImageKit.
 * @param {Express.Multer.File} file - file object from multer memoryStorage
 * @returns {Promise<object>} ImageKit upload result (contains .url)
 */
async function uploadFile(file) {
    if (!file || !file.buffer) {
        throw new Error('File object must contain a buffer property');
    }

    if (!ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype)) {
        const err = new Error(
            `Invalid file type "${file.mimetype}". Allowed types: ${[...ALLOWED_AUDIO_MIME_TYPES].join(', ')}`
        );
        err.status = 415;
        throw err;
    }

    const uploadPromise = imagekit.files.upload({
        file: file.buffer.toString('base64'),
        fileName: file.originalname || 'unnamed-upload',
        folder: '/songs',
        useUniqueFileName: true,
    });

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            const err = new Error(`File upload timed out after ${UPLOAD_TIMEOUT_MS / 1000} seconds`);
            err.status = 504;
            reject(err);
        }, UPLOAD_TIMEOUT_MS);
    });

    return Promise.race([uploadPromise, timeoutPromise]);
}

module.exports = uploadFile;