const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../utils/emailService');

const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
};

// Initialize Supabase client for database operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. User Registration - Create new user account
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user with this email already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Hash password for security
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Security Fix: Prevent Role Spoofing
        // Only allow BUYER or SELLER. Default to BUYER if invalid or maliciously trying to send ADMIN.
        const safeRole = (role === 'SELLER') ? 'SELLER' : 'BUYER';

        // Insert new user into database
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{ name, email, password_hash, role: safeRole }])
            .select();

        if (error) throw error;

        const token = jwt.sign(
            { id: newUser[0].id, role: newUser[0].role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
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
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user in database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Security best practice: Don't reveal if email exists
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Token expires in 1 day
        );

        setTokenCookie(res, token);

        res.status(200).json({
            message: "Login successful.",
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        next(error);
    }
};

// Check if email exists for two-step login process
const checkEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        // Query database to check if user exists
        const { data, error } = await supabase
            .from('users')
            .select('id,name')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(404).json({ exists: false, message: "User not found" });
        }

        res.status(200).json({ exists: true, name: data.name });

    } catch (error) {
        next(error);
    }
};

// Handle forgot password requests
const nodemailer = require('nodemailer');

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        // 1. Check if email exists in database
        const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: "If that email exists, a reset link will be sent." }); // Security best practice
        }

        // 2. Generate Reset Token
        const resetToken = jwt.sign({ id: data.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        // 3. Send actual email with reset link using NodeMailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - Thirasara Property',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${data.name},</p>
                    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #006aff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                    <p>This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset link sent to: ${email}`);

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

const getMe = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Not authenticated" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', decoded.id)
            .single();

        if (error || !user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, password } = req.body;
        
        // 1. Find user to update
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone; // Assuming we want to support phone numbers
        
        if (password) {
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select('id, name, email, role')
            .single();

        if (updateError) {
             // Fallback if 'phone' column doesn't exist yet, try updating without it
             if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
                 delete updates.phone;
                 const { data: fallbackUser, error: fallbackError } = await supabase
                    .from('users')
                    .update(updates)
                    .eq('id', req.user.id)
                    .select('id, name, email, role')
                    .single();
                    
                 if (fallbackError) throw fallbackError;
                 return res.status(200).json({ message: "Profile updated (without phone)", user: fallbackUser });
             }
             throw updateError;
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });

    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser, checkEmail, forgotPassword, logoutUser, getMe, updateProfile };
