const express = require('express');
const router = express.Router();

// Import controller functions
const { protect } = require('../middleware/authMiddleware');
const { registerUser, loginUser, checkEmail, forgotPassword, getMe, logoutUser, updateProfile } = require('../controllers/authController');

// Import validation
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, checkEmailSchema } = require('../validators/authValidator');

// 1. User Registration Route
// POST /api/auth/register - Creates new user account
router.post('/register', validate(registerSchema), registerUser);

// 2. User Login Route
// POST /api/auth/login - Authenticates user credentials
router.post('/login', validate(loginSchema), loginUser);

// 3. Email Check Route
// POST /api/auth/check-email - Validates if email exists for two-step login
router.post('/check-email', validate(checkEmailSchema), checkEmail);

// 4. Forgot Password Route
// POST /api/auth/forgot-password - Initiates password reset process
router.post('/forgot-password', forgotPassword);

// 5. Get Current User Route
// GET /api/auth/me - Returns current authenticated user based on HttpOnly cookie
router.get('/me', protect, getMe);

// 6. Logout User Route
// POST /api/auth/logout - Clears the HttpOnly cookie
router.post('/logout', logoutUser);

// 7. Update Profile Route
// PUT /api/auth/profile - Updates current authenticated user profile
router.put('/profile', protect, updateProfile);

module.exports = router;