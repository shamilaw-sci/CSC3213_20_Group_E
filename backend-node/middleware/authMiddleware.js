const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
// Middleware to protect routes by verifying JWT token
const protect = async (req, res, next) => {
    let token = req.cookies?.token; // Extract token from HttpOnly cookie

    // An explicit API credential takes precedence over an ambient browser cookie.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized. No token provided." });
    }

    try {
        // Verify token with secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Existing login tokens have no type; purpose-specific tokens are not sessions.
        if (decoded.type !== undefined) {
            return res.status(401).json({ message: "Invalid authentication token." });
        }
        
        // Fetch fresh user from DB to avoid stale roles in JWT
        const { data: user, error } = await supabase
            .from('users')
            .select('id, role, name, email')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: "User not found or session invalid." });
        }

        if (user.role === 'BANNED') {
            return res.status(403).json({ message: "This account has been banned." });
        }

        req.user = user; // Attach fresh user data to request
        next(); // Allow request to proceed
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

const optionalAuth = async (req, res, next) => {
    let token = req.cookies?.token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== undefined) return next();

        const { data: user, error } = await supabase
            .from('users')
            .select('id, role, name, email')
            .eq('id', decoded.id)
            .single();

        if (!error && user && user.role !== 'BANNED') {
            req.user = user;
        }
    } catch (error) {
        // Ignore token errors for optional auth
    }
    next();
};

module.exports = { protect, optionalAuth };
