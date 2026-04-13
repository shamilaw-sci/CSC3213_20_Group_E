const jwt = require('jsonwebtoken');

// Middleware to protect routes by verifying JWT token
const protect = (req, res, next) => {
    let token;

    // Extract token from Authorization header (Bearer token format)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized. No token provided." });
    }

    try {
        // Verify token with secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user data { id, role } to request
        next(); // Allow request to proceed
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = { protect };