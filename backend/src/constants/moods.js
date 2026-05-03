/**
 * Allowed mood values — shared by the Mongoose model enum and request validator.
 * These match the expressions that face-api.js can detect, plus a neutral fallback.
 */
const ALLOWED_MOODS = [
    'happy',
    'sad',
    'angry',
    'fearful',
    'disgusted',
    'surprised',
    'neutral',
];

module.exports = { ALLOWED_MOODS };