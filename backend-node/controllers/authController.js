
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Always true for cross-domain
        sameSite: 'none', // Must be 'none' for cross-domain
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
};

// Initialize Supabase client for database operations
const userRepository = require('../repositories/userRepository');

// 1. User Registration - Create new user account
const registerUser = async(req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user with this email already exists
        const existingUser = await userRepository.findByEmail(email);

        if (existingUser) {
            if (existingUser.role === 'BANNED') {
                return res.status(403).json({ message: "This email is banned from registration." });
            }
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Hash password for security
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Security Fix: Prevent Role Spoofing
        let safeRole = 'BUYER';
        if (role === 'SELLER') safeRole = 'SELLER';
        if (role === 'AGENT') safeRole = 'PENDING_AGENT';

        // Insert new user into database
        const newUser = await userRepository.createUser({ name, email, password_hash, role: safeRole });

        if (error) {
            return next(error);
        }

        // If registering as an agent, create an initial agent_profiles record
        if (safeRole === 'PENDING_AGENT') {
            const { agency_name, license_number } = req.body;
            await userRepository.createAgentProfile({
                agent_id: newUser[0].id,
                agency_name: agency_name || 'Independent Agent',
                license_number: license_number || null,
                bio: `Hello, I am ${name}.`,
            });
        }

        const token = jwt.sign({ id: newUser[0].id, role: newUser[0].role },
            process.env.JWT_SECRET, { expiresIn: '1d' }
        );

        setTokenCookie(res, token);

        // Send welcome email asynchronously (don't await to avoid blocking)
        sendWelcomeEmail(email, name).catch(console.error);

        res.status(201).json({ message: "User registered successfully.", user: newUser[0] });

    } catch (error) {
        next(error);
    }
};

// 2. User Login - Authenticate existing user
const loginUser = async(req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user in database
        const user = await userRepository.findByEmail(email);
        const error = null;

        if (error || !user) {
            // Security best practice: Don't reveal if email exists
            return res.status(400).json({ message: "Invalid email or password." });
        }

        if (user.role === 'BANNED') {
            return res.status(403).json({ message: "This account has been banned and removed from access." });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '1d' } // Token expires in 1 day
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

    } catch (error) {
        next(error);
    }
};

// Check if email exists for two-step login process
const checkEmail = async(req, res, next) => {
    try {
        const { email } = req.body;

        // Query database to check if user exists
        const data = await userRepository.findByEmail(email);
        const error = null;

        if (error || !data) {
            return res.status(404).json({ exists: false, message: "User not found" });
        }

        res.status(200).json({ exists: true, name: data.name });

    } catch (error) {
        next(error);
    }
};

// Handle forgot password requests

const forgotPassword = async(req, res, next) => {
    try {
        const { email } = req.body;

        // 1. Check if email exists in database
        const data = await userRepository.findByEmail(email);
        const error = null;

        if (error || !data) {
            return res.status(404).json({ message: "If that email exists, a reset link will be sent." }); // Security best practice
        }

        // 2. Generate Reset Token
        const resetToken = jwt.sign({ id: data.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        // 3. Send email using refactored service (non-blocking)
        sendPasswordResetEmail(email, data.name, resetLink).catch(console.error);

        // 4. Return success response
        res.status(200).json({ message: "Password reset link sent to your email!" });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        next(error);
    }
};

const logoutUser = (req, res) => {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: "Logged out successfully" });
};

const getMe = async(req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Not authenticated" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userRepository.findById(decoded.id);
        const error = null;

        if (error || !user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

const updateProfile = async(req, res, next) => {
    try {
        const { name, phone, password, avatar_url, theme_preference, email_notifications } = req.body;

        // 1. Find user to update
        const user = await userRepository.findFullUserById(req.user.id);
        const fetchError = null;

        if (fetchError || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        const updates = {};
        if (name) updates.name = name;
        if (phone !== undefined) updates.phone = phone; // Allow clearing phone
        if (avatar_url !== undefined) {
            if (avatar_url.startsWith('data:image')) {
                try {
                    const parts = avatar_url.split(',');
                    if (parts.length === 2) {
                        const mimeType = parts[0].split(':')[1].split(';')[0];
                        const base64Data = parts[1];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const ext = mimeType.split('/')[1] || 'png';
                        const fileName = `${req.user.id}_${Date.now()}.${ext}`;

                        updates.avatar_url = await userRepository.uploadAvatar(fileName, buffer, mimeType);
                    }
                } catch (err) {
                    console.error("Avatar upload error:", err);
                }
            } else {
                updates.avatar_url = avatar_url;
            }
        }
        if (theme_preference !== undefined) updates.theme_preference = theme_preference;
        if (email_notifications !== undefined) updates.email_notifications = email_notifications;

        if (password) {
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        const { data: updatedUser, error: updateError } = await userRepository.updateProfile(req.user.id, updates);

        if (updateError) {
            // Fallback if 'phone' column doesn't exist yet, try updating without it
            if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
                delete updates.phone;
                delete updates.avatar_url;
                delete updates.theme_preference;
                delete updates.email_notifications;

                const { data: fallbackUser, error: fallbackError } = await userRepository.updateProfile(req.user.id, updates);

                if (fallbackError) throw fallbackError;
                return res.status(200).json({ message: "Profile updated (without new columns, please run SQL script)", user: fallbackUser });
            }
            throw updateError;
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });

    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser, checkEmail, forgotPassword, logoutUser, getMe, updateProfile, setTokenCookie };
