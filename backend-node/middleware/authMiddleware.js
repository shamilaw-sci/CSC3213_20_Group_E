const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to protect routes by verifying JWT token
const protect = async (req, res, next) => {
    let token = req.cookies?.token; // Extract token from HttpOnly cookie

    // Fallback: Extract token from Authorization header (Bearer token format)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized. No token provided." });
    }

    try {
        // Verify token with secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch fresh user from DB to avoid stale roles in JWT
        const { data: user, error } = await supabase
            .from('users')
            .select('id, role, name, email')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: "User not found or session invalid." });
        }

        req.user = user; // Attach fresh user data to request
        next(); // Allow request to proceed
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = { protect };