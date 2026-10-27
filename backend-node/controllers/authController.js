const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHmac } = require('node:crypto');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const userRepository = require('../repositories/userRepository');
const passwordResetVersion = (passwordHash) => createHmac('sha256', process.env.JWT_SECRET)
    .update(passwordHash || '').digest('hex');

const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
};

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

        // Security Fix: Prevent Role Spoofing (Admin cannot be self-assigned)
        let safeRole = 'BUYER';
        if (role === 'SELLER') safeRole = 'SELLER';
        if (role === 'AGENT') safeRole = 'PENDING_AGENT';

        // Insert new user into database
        const newUser = await userRepository.createUser({ name, email, password_hash, role: safeRole });

        // If registering as an agent, create an initial agent_profiles record
        if (safeRole === 'PENDING_AGENT' && newUser && newUser[0]) {
            const { agency_name, license_number } = req.body;
            await userRepository.createAgentProfile({
                agent_id: newUser[0].id,
                agency_name: agency_name || 'Independent Agent',
                license_number: license_number || null,
                bio: `Hello, I am ${name}.`,
            });
        }

        const registeredUser = newUser[0];
        const token = jwt.sign({ id: registeredUser.id, role: registeredUser.role },
            process.env.JWT_SECRET, { expiresIn: '1d' }
        );

        setTokenCookie(res, token);

        // Send welcome email asynchronously (non-blocking)
        sendWelcomeEmail(email, name).catch((e) => {
            console.error("Welcome email failed:", e.message || e);
        });

        res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: registeredUser.id,
                name: registeredUser.name,
                email: registeredUser.email,
                role: registeredUser.role,
                created_at: registeredUser.created_at
            }
        });

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

        if (!user) {
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

        // Strict Separation: Prevent Administrative logins on public consumer portal
        if (user.role === 'ADMIN') {
            return res.status(403).json({
                message: "Administrator account detected. For security, please sign in via the official Admin Command Center.",
                is_admin: true,
                admin_login_url: "/admin/login"
            });
        }

        // Generate JWT token
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

    } catch (error) {
        next(error);
    }
};

// 3. Check if email exists (Safe - does NOT leak names or PII)
const checkEmail = async(req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await userRepository.findByEmail(email);

        if (!user) {
            return res.status(200).json({ exists: false });
        }

        // Return boolean exists only, without leaking user name or personal details
        res.status(200).json({ exists: true });
    } catch (error) {
        next(error);
    }
};

// 4. Handle forgot password requests
const forgotPassword = async(req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await userRepository.findByEmail(email);

        // Security best practice: Always return same message regardless of whether email exists
        if (user && user.role !== 'BANNED') {
            const resetToken = jwt.sign({ id: user.id, type: 'password_reset', version: passwordResetVersion(user.password_hash) },
                process.env.JWT_SECRET, { expiresIn: '15m' }
            );
            const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

            sendPasswordResetEmail(email, user.name, resetLink).catch((e) => {
                console.error("Password reset email failed:", e.message || e);
            });
        }

        res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });

    } catch (error) {
        next(error);
    }
};

// 5. Complete Password Reset (C6 Fix)
const resetPassword = async(req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Reset token and new password are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id || decoded.type !== 'password_reset') {
            return res.status(400).json({ message: "Invalid or expired password reset token." });
        }

        const user = await userRepository.findFullUserById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User account not found." });
        }
        if (user.role === 'BANNED' || !user.password_hash || decoded.version !== passwordResetVersion(user.password_hash)) {
            return res.status(400).json({ message: "Invalid or expired password reset token. Please request a new link." });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const updated = await userRepository.resetPasswordOnce(user.id, user.password_hash, password_hash);
        if (!updated) {
            return res.status(400).json({ message: "This reset link has already been used. Please request a new link." });
        }

        res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Invalid or expired password reset token." });
        }
        next(error);
    }
};

// 6. User Logout (M8 Fix - clear cookies with matching attributes)
const logoutUser = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });
    res.status(200).json({ message: "Logged out successfully" });
};

// 7. Get Current User Profile
const getMe = async(req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) return res.status(401).json({ message: "Not authenticated" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userRepository.findById(decoded.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

// 8. Update User Profile
const updateProfile = async(req, res, next) => {
    try {
        const { name, email, phone, password, avatar_url, theme_preference, email_notifications } = req.body;

        const user = await userRepository.findFullUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const updates = {};
        if (name) updates.name = name;

        if (email && email.toLowerCase().trim() !== user.email ?.toLowerCase().trim()) {
            const cleanEmail = email.toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                return res.status(400).json({ message: "Please provide a valid email address." });
            }

            const existingUser = await userRepository.findByEmail(cleanEmail);
            if (existingUser && existingUser.id !== user.id) {
                return res.status(409).json({ message: "This email address is already in use by another account." });
            }
            updates.email = cleanEmail;
        }

        if (phone !== undefined) updates.phone = phone;
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
            const { currentPassword } = req.body;
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to change your password." });
            }

            if (user.password_hash) {
                const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
                if (!isCurrentValid) {
                    return res.status(400).json({ message: "Incorrect current password." });
                }
            }

            if (password.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters long." });
            }

            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        const { data: updatedUser, error: updateError } = await userRepository.updateProfile(req.user.id, updates);

        if (updateError) {
            if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
                delete updates.phone;
                delete updates.avatar_url;
                delete updates.theme_preference;
                delete updates.email_notifications;

                const { data: fallbackUser, error: fallbackError } = await userRepository.updateProfile(req.user.id, updates);
                if (fallbackError) throw fallbackError;
                return res.status(200).json({ message: "Profile updated", user: fallbackUser });
            }
            throw updateError;
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });

    } catch (error) {
        next(error);
    }
};

// 9. Buyer requests role upgrade to Seller
const requestRoleUpgrade = async(req, res, next) => {
    try {
        const user = await userRepository.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role !== 'BUYER') {
            return res.status(400).json({ message: 'Only BUYER accounts can request an upgrade to Seller.' });
        }

        const adminRepository = require('../repositories/adminRepository');
        await adminRepository.createRoleRequest(user.id, 'SELLER');

        res.status(201).json({ message: 'Your request to become a Seller has been submitted. An admin will review it shortly.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    checkEmail,
    forgotPassword,
    resetPassword,
    logoutUser,
    getMe,
    updateProfile,
    requestRoleUpgrade,
    setTokenCookie
};
