const errorHandler = (err, req, res, next) => {
    console.error("🔥 Global Error Handler:", err.message || err);

    let statusCode = err.statusCode || 500;
    let message = err.statusCode ? err.message : "Internal Server Error";

    // Handle Multer upload errors gracefully with 400 Bad Request
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Uploaded file is too large. Max allowed size exceeded.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files uploaded at once.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = `Unexpected upload field: ${err.field}`;
        } else {
            message = `Upload error: ${err.message}`;
        }
    } else if (err.code === 'INVALID_FILE_TYPE') {
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).json({
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
