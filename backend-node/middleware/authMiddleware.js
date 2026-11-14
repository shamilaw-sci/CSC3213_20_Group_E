const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { hasSessionClaims, matchesSessionCredential } = require('../utils/sessionToken');
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

        // Existing login tokens have no type; purpose-specific tokens are not sessions.
        if (!hasSessionClaims(decoded)) {
            return res.status(401).json({ message: "Invalid authentication token." });
        }
        
        // Fetch fresh user from DB to avoid stale roles in JWT
        const { data: user, error } = await supabase
            .from('users')
            .select('id, role, name, email, password_hash')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: "User not found or session invalid." });
        }

        if (user.role === 'BANNED') {
            return res.status(403).json({ message: "This account has been banned." });
        }

        if (!matchesSessionCredential(decoded, user)) {
            return res.status(401).json({ message: 'Session expired. Please sign in again.' });
        }
        if (user.role === 'ADMIN' && process.env.ADMIN_MFA_ENABLED === 'true' && decoded.admin_mfa !== true) {
            return res.status(401).json({ message: 'Sign in through Admin with multi-factor authentication.' });
        }
        const { password_hash, ...publicUser } = user;
        req.user = publicUser;
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!hasSessionClaims(decoded)) return next();

        const { data: user, error } = await supabase
            .from('users')
            .select('id, role, name, email, password_hash')
            .eq('id', decoded.id)
            .single();

        if (!error && user && user.role !== 'BANNED' && matchesSessionCredential(decoded, user)
            && !(user.role === 'ADMIN' && process.env.ADMIN_MFA_ENABLED === 'true' && decoded.admin_mfa !== true)) {
            const { password_hash, ...publicUser } = user;
            req.user = publicUser;
        }
    } catch (error) {
        // Ignore token errors for optional auth
    }
    next();
};

module.exports = { protect, optionalAuth };
