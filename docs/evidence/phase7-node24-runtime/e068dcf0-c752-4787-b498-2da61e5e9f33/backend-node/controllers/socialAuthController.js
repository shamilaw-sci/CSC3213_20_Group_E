const axios = require('axios');
const { issueSessionToken } = require('../utils/sessionToken');
const appleSignin = require('../utils/appleTokenVerifier');
const supabase = require('../config/supabase');
const { setTokenCookie } = require('./authController');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * Provider subject identifies an account. Email is checked only for signup
 * collisions; linking requires a separately authenticated ownership flow.
 */
const findOrCreateSocialUser = async ({ email, name, provider, provider_id, avatar_url }) => {
    if (typeof provider_id !== 'string' || !provider_id.trim()
        || typeof email !== 'string' || !email.trim()) {
        throw new Error('Missing social identity.');
    }

    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('provider', provider)
        .eq('provider_id', provider_id)
        .maybeSingle();
    if (findError) throw findError;

    if (existingUser) {
        // Enforce account ban check (H7 fix)
        if (existingUser.role === 'BANNED') {
            const err = new Error("Your account has been banned. Please contact support.");
            err.statusCode = 403;
            throw err;
        }

        // Update avatar_url if provided by social login and different
        if (avatar_url && existingUser.avatar_url !== avatar_url) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url })
                .eq('id', existingUser.id);
            if (updateError) throw updateError;
            existingUser.avatar_url = avatar_url;
        }
        return existingUser;
    }

    const { data: emailOwner, error: emailError } = await supabase
        .from('users').select('id').eq('email', email).maybeSingle();
    if (emailError) throw emailError;
    if (emailOwner) {
        const error = new Error('Social sign-in cannot link this account. Please use your original sign-in method.');
        error.statusCode = 403;
        throw error;
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
        .select('id, name, email, role, phone, avatar_url, theme_preference, email_notifications, created_at, password_hash');

    if (insertError) {
        throw new Error(insertError.message);
    }

    // Send welcome email asynchronously for new social signups
    sendWelcomeEmail(email, name || email.split('@')[0]).catch((e) => {
        console.error("Welcome email failed:", e.message || e);
    });

    return newUser[0];
};

/**
 * Signs a JWT, sets the auth cookie, and sends the standard login response.
 */
const sendAuthResponse = (res, user) => {
    if (user.role === 'ADMIN') {
        return res.status(403).json({
            message: "Administrator account detected. For security, please sign in via the official Admin Command Center.",
            is_admin: true,
            admin_login_url: "/admin/login"
        });
    }

    const token = issueSessionToken(user);

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
const googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body || {};
        if (typeof credential !== 'string' || !credential.trim() || credential.length > 8192) {
            return res.status(400).json({ message: "Invalid Google credential." });
        }

        // A missing audience configuration must never accept tokens for arbitrary apps.
        const expectedClientId = process.env.GOOGLE_CLIENT_ID?.trim()
            || process.env.VITE_GOOGLE_CLIENT_ID?.trim();
        if (!expectedClientId) {
            return res.status(503).json({ message: "Google login is temporarily unavailable." });
        }

        // Keep verification server-side; bound the external request and encode its parameter.
        const { data: payload } = await axios.get(
            'https://oauth2.googleapis.com/tokeninfo',
            { params: { id_token: credential }, timeout: 5000 }
        );

        // tokeninfo may return exp/email_verified as strings. Reject malformed claims
        // before an account lookup, write or session can occur.
        const expiry = payload && (typeof payload.exp === 'string' || typeof payload.exp === 'number')
            ? Number(payload.exp) : NaN;
        if (!payload || payload.aud !== expectedClientId
            || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)
            || !Number.isFinite(expiry) || expiry <= Date.now() / 1000
            || typeof payload.sub !== 'string' || !payload.sub.trim()
            || typeof payload.email !== 'string' || !payload.email.trim()
            || (payload.email_verified !== true && payload.email_verified !== 'true')) {
            return res.status(401).json({ message: "Invalid Google identity token." });
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
        if (error.statusCode === 403) {
            return res.status(403).json({ message: error.message });
        }
        // Provider errors can contain request URLs/tokens or identity claims.
        console.error("Google login verification failed.");
        res.status(401).json({ message: "Google login failed. Please try again." });
    }
};

// --- Facebook Login ---
const facebookLogin = async (req, res, next) => {
    try {
        const { accessToken } = req.body || {};
        if (typeof accessToken !== 'string' || !accessToken.trim() || accessToken.length > 8192) {
            return res.status(400).json({ message: "Invalid Facebook access token." });
        }

        const appId = process.env.FACEBOOK_APP_ID?.trim();
        const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
        if (!appId || !/^\d{1,32}$/.test(appId) || !appSecret || appSecret.length > 1024) {
            return res.status(503).json({ message: 'Facebook login is temporarily unavailable.' });
        }
        const { data: inspection } = await axios.get('https://graph.facebook.com/debug_token', {
            params: { input_token: accessToken, access_token: `${appId}|${appSecret}` },
            timeout: 5000, maxRedirects: 0
        });
        const metadata = inspection?.data;
        const future = value => typeof value === 'number' && Number.isFinite(value) && value > Date.now() / 1000;
        if (!metadata || Array.isArray(metadata) || metadata.is_valid !== true || metadata.app_id !== appId
            || metadata.type !== 'USER' || typeof metadata.user_id !== 'string' || !metadata.user_id.trim()
            || !future(metadata.expires_at)
            || (metadata.data_access_expires_at !== undefined && !future(metadata.data_access_expires_at))) {
            return res.status(401).json({ message: 'Facebook login failed. Please try again.' });
        }
        // Profile identity must belong to the inspected app-scoped subject.
        const { data: profile } = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token: accessToken
            },
            timeout: 5000, maxRedirects: 0
        });

        if (!profile || profile.id !== metadata.user_id || typeof profile.email !== 'string' || !profile.email.trim()) {
            return res.status(401).json({ message: 'Facebook login failed. Please try again.' });
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
        if (error.statusCode === 403) {
            return res.status(403).json({ message: error.message });
        }
        console.error("Facebook login verification failed.");
        res.status(401).json({ message: "Facebook login failed. Please try again." });
    }
};

// --- Apple Login ---
const appleLogin = async (req, res, next) => {
    try {
        const { id_token, name } = req.body || {};
        if (typeof id_token !== 'string' || !id_token.trim() || id_token.length > 8192) {
            return res.status(400).json({ message: "Invalid Apple id_token." });
        }

        const audience = process.env.APPLE_SERVICES_ID?.trim();
        if (!audience) return res.status(503).json({ message: "Apple login is temporarily unavailable." });

        const payload = await appleSignin.verifyIdToken(id_token, {
            audience,
            ignoreExpiration: false
        });

        const expiry = payload && (typeof payload.exp === 'string' || typeof payload.exp === 'number')
            ? Number(payload.exp) : NaN;
        if (!payload || payload.aud !== audience || payload.iss !== 'https://appleid.apple.com'
            || !Number.isFinite(expiry) || expiry <= Date.now() / 1000
            || typeof payload.sub !== 'string' || !payload.sub.trim()
            || typeof payload.email !== 'string' || !payload.email.trim()
            || (payload.email_verified !== true && payload.email_verified !== 'true')) {
            return res.status(401).json({ message: "Invalid Apple identity token." });
        }

        const user = await findOrCreateSocialUser({
            email: payload.email,
            name: name || payload.email.split('@')[0],
            provider: 'apple',
            provider_id: payload.sub
        });

        sendAuthResponse(res, user);
    } catch (error) {
        if (error.statusCode === 403) {
            return res.status(403).json({ message: error.message });
        }
        console.error("Apple login verification failed.");
        res.status(401).json({ message: "Apple login failed. Please try again." });
    }
};

module.exports = { googleLogin, facebookLogin, appleLogin };
