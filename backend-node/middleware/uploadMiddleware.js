const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Allowed MIME types for property photos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Allowed MIME types for conversation chat attachments
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Creates a configured multer instance with memory storage, size limits, and MIME filtering.
 */
const createUploader = ({ allowedMimes, maxFileSize, maxFiles }) => {
    return multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: maxFileSize, // In bytes
            files: maxFiles,
        },
        fileFilter: (req, file, cb) => {
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                const err = new Error(`Invalid file type (${file.mimetype}). Allowed types: ${allowedMimes.join(', ')}`);
                err.code = 'INVALID_FILE_TYPE';
                cb(err, false);
            }
        },
    });
};

// 1. Property Images Uploader: max 5MB each, max 10 images
const propertyImageUpload = createUploader({
    allowedMimes: ALLOWED_IMAGE_TYPES,
    maxFileSize: 5 * 1024 * 1024, // 5 MB per image
    maxFiles: 10,
});

// 2. Chat Attachment Uploader: max 10MB, max 1 file (Image or PDF)
const chatAttachmentUpload = createUploader({
    allowedMimes: ALLOWED_ATTACHMENT_TYPES,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 1,
});

/**
 * Generates a collision-resistant, sanitized storage filename.
 */
const generateSafeFileName = (originalName) => {
    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const randomHex = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${randomHex}${ext}`;
};

module.exports = {
    propertyImageUpload,
    chatAttachmentUpload,
    generateSafeFileName,
};
