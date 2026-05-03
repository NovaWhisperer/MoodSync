const Joi = require('joi');
const { ALLOWED_MOODS } = require('../constants/moods');

/**
 * Joi schema for the song upload body fields.
 */
const songBodySchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'title is required',
        'any.required': 'title is required',
    }),
    artist: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'artist is required',
        'any.required': 'artist is required',
    }),
    mood: Joi.string()
        .trim()
        .lowercase()
        .valid(...ALLOWED_MOODS)
        .required()
        .messages({
            'any.only': `mood must be one of: ${ALLOWED_MOODS.join(', ')}`,
            'any.required': 'mood is required',
        }),
}).options({ allowUnknown: true }); // multer body may have extra fields

/**
 * Middleware — validates req.body against the song schema.
 * Calls next() on success, returns 400 with error details on failure.
 */
const validateSongBody = (req, res, next) => {
    const { error, value } = songBodySchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map((d) => d.message),
        });
    }

    // Replace body with sanitized/coerced values (trimmed, lowercased)
    req.body = { ...req.body, ...value };
    next();
};

module.exports = { validateSongBody };