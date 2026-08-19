const axios = require('axios');
const jwt = require('jsonwebtoken');
const appleSignin = require('apple-signin-auth');
const { setTokenCookie } = require('./authController');
const { sendWelcomeEmail } = require('../utils/emailService');

// Initialize Supabase client for database operations
const userRepository = require('../repositories/userRepository');
/**
 * Finds an existing user by email, or creates a new one for a social login.
 * If a user already registered with email/password and then signs in with
 * a social provider using the same email, we just link the provider onto
 * the existing account (login), instead of creating a duplicate.
 */
const findOrCreateSocialUser = async({ email, name, provider, provider_id, avatar_url }) => {
    // 1. Check if user already exists
    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUser) {
        const updates = {};
        let needsUpdate = false;

        // Link provider info if not already set
        if (!existingUser.provider) {
            updates.provider = provider;
            updates.provider_id = provider_id;
            needsUpdate = true;
        }

        // Always update avatar_url if provided by social login and different
        if (avatar_url && existingUser.avatar_url !== avatar_url) {
            updates.avatar_url = avatar_url;
            needsUpdate = true;
            existingUser.avatar_url = avatar_url; // Update local object for response
        }

        if (needsUpdate) {
            await supabase
                .from('users')
                .update(updates)
                .eq('id', existingUser.id);
        }
        return existingUser;
    }

    // 2. Create a new user (no password_hash needed for social accounts)
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
            name: name || email.split('@')[0],
            email,
            role: 'BUYER',
            provider,
            provider_id,
            avatar_url: avatar_url || null
        }])
        .select();

    if (insertError) {
        throw new Error(insertError.message);
    }

    // Send welcome email asynchronously for new social signups
    sendWelcomeEmail(email, name || email.split('@')[0]).catch(console.error);

    return newUser[0];
};

/**
 * Signs a JWT, sets the auth cookie, and sends the standard login response.
 * Mirrors the response shape used by loginUser() in authController.js.
 */
const sendAuthResponse = (res, user) => {
    const token = jwt.sign({ id: user.id, role: user.role },
        process.env.JWT_SECRET, { expiresIn: '1d' }
    );

    setTokenCookie(res, token);

    res.status(200).json({
        message: "Login successful.",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            avatar_url: user.avatar_url,
            theme_preference: user.theme_preference,
            email_notifications: user.email_notifications
        }
    });
};

// --- Google Login ---
// Expects: { credential } -> the Google ID token (JWT) from Google Identity Services
const googleLogin = async(req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Missing Google credential." });
        }

        // Verify the ID token with Google (no client secret needed for this check)
        const { data: payload } = await axios.get(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );

        if (process.env.VITE_GOOGLE_CLIENT_ID && payload.aud !== process.env.VITE_GOOGLE_CLIENT_ID) {
            return res.status(401).json({ message: "Invalid Google token audience." });
        }

        const user = await findOrCreateSocialUser({
            email: payload.email,
            name: payload.name,
            provider: 'google',
            provider_id: payload.sub,
            avatar_url: payload.picture
        });

        sendAuthResponse(res, user);
    } catch (error) {
        console.error("Google login error:", error.response?.data || error.message);
        res.status(401).json({ message: "Google login failed. Please try again." });
    }
};

// --- Facebook Login ---
// Expects: { accessToken } -> the access token from the FB JS SDK's FB.login()
const facebookLogin = async(req, res, next) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ message: "Missing Facebook access token." });
        }

        // Verify the token and fetch profile info directly from Facebook's Graph API
        const { data: profile } = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token: accessToken
            }
        });

        if (!profile.email) {
            return res.status(400).json({ message: "Facebook account has no email associated. Please use another login method." });
        }

        const user = await findOrCreateSocialUser({
            email: profile.email,
            name: profile.name,
            provider: 'facebook',
            provider_id: profile.id,
            avatar_url: profile.picture?.data?.url
        });

        sendAuthResponse(res, user);
    } catch (error) {
        console.error("Facebook login error:", error.response?.data || error.message);
        res.status(401).json({ message: "Facebook login failed. Please try again." });
    }
};

// --- Apple Login ---
// Expects: { id_token, name? } -> id_token from AppleID.auth.signIn(); Apple only
// sends the user's name on the very first authorization, so the frontend
// forwards it separately if present.
const appleLogin = async(req, res, next) => {
    try {
        const { id_token, name } = req.body;
        if (!id_token) {
            return res.status(400).json({ message: "Missing Apple id_token." });
        }

        const payload = await appleSignin.verifyIdToken(id_token, {
            audience: process.env.APPLE_SERVICES_ID,
            ignoreExpiration: false
        });

        const user = await findOrCreateSocialUser({
            email: payload.email,
            name: name || payload.email.split('@')[0],
            provider: 'apple',
            provider_id: payload.sub
        });

        sendAuthResponse(res, user);
    } catch (error) {
        console.error("Apple login error:", error.message);
        res.status(401).json({ message: "Apple login failed. Please try again." });
    }
};

module.exports = { googleLogin, facebookLogin, appleLogin };
