const errorHandler = (err, req, res, next) => {
    console.error("🔥 Global Error Handler:", err);

    const statusCode = err.statusCode || 500;
    const message = err.statusCode ? err.message : "Internal Server Error";

    res.status(statusCode).json({
        message: message,
        // Optional: Include stack trace in development mode only
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
