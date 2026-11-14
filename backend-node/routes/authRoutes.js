const express = require('express');
const router = express.Router();
const emailVerification = require('../utils/emailVerification');
const userRepository = require('../repositories/userRepository');

// Import controller functions
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    loginUser,
    checkEmail,
    forgotPassword,
    resetPassword,
    getMe,
    logoutUser,
    updateProfile,
    requestRoleUpgrade
} = require('../controllers/authController');
const { googleLogin, facebookLogin, appleLogin } = require('../controllers/socialAuthController');

// Import validation
const validate = require('../middleware/validate');
const {
    registerSchema,
    loginSchema,
    checkEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} = require('../validators/authValidator');

// 1. User Registration Route
router.post('/register', validate(registerSchema), registerUser);

router.post('/verify-email', async (req, res, next) => {
    try {
        if (!emailVerification.enabled() || !await emailVerification.confirmChallenge(req.body?.token)) {
            return res.status(400).json({ message: 'The verification link is invalid or expired.' });
        }
        return res.json({ message: 'Email verified.' });
    } catch (error) {
        return next(error);
    }
});

router.post('/resend-verification', validate(checkEmailSchema), async (req, res, next) => {
    try {
        if (emailVerification.enabled()) {
            const user = await userRepository.findByEmail(req.body.email);
            if (user?.email_verification_required && !user.email_verified_at) {
                await emailVerification.sendChallenge(user, 'signup').catch(() => {
                    console.error('verification_email_failed');
                });
            }
        }
        return res.json({ message: 'If verification is pending, check your inbox for a link.' });
    } catch (error) {
        return next(error);
    }
});

// 2. User Login Route
router.post('/login', validate(loginSchema), loginUser);

// 3. Email Check Route (Safe - boolean only)
router.post('/check-email', validate(checkEmailSchema), checkEmail);

// 4. Forgot Password Route
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// 5. Complete Password Reset Route (C6 Fix)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// 6. Get Current User Route
router.get('/me', protect, getMe);

// 7. Logout User Route
router.post('/logout', logoutUser);

// 8. Update Profile Route
router.put('/profile', protect, updateProfile);

// 9. Social Login Routes (Google / Facebook / Apple)
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/apple', appleLogin);

// 10. Role Upgrade Request (Buyer → Seller)
router.post('/request-role-upgrade', protect, requestRoleUpgrade);
router.get('/request-role-upgrade', protect, require('../controllers/roleUpgradeStatusController').getRoleUpgradeStatus);

module.exports = router;
