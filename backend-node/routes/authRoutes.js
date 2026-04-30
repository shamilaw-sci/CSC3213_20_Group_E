const express = require('express');
const router = express.Router();

// Import controller functions
const { registerUser, loginUser, checkEmail, forgotPassword } = require('../controllers/authController');

// 1. User Registration Route
// POST /api/auth/register - Creates new user account
router.post('/register', registerUser);

// 2. User Login Route
// POST /api/auth/login - Authenticates user credentials
router.post('/login', loginUser);

// 3. Email Check Route
// POST /api/auth/check-email - Validates if email exists for two-step login
router.post('/check-email', checkEmail);

// 4. Forgot Password Route
// POST /api/auth/forgot-password - Initiates password reset process
router.post('/forgot-password', forgotPassword);



module.exports = router;