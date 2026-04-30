const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Supabase client for database operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. User Registration - Create new user account
const registerUser = async (req, res) => {
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

        // Insert new user into database
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{ name, email, password_hash, role: role || 'BUYER' }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: "User registered successfully.", user: newUser[0] });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. User Login - Authenticate existing user
const loginUser = async (req, res) => {
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

        res.status(200).json({
            message: "Login successful.",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check if email exists for two-step login process
const checkEmail = async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
};

// Handle forgot password requests
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // 1. Check if email exists in database
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: "If that email exists, a reset link will be sent." }); // Security best practice
        }

        // 2. TODO: Send actual email with reset link using NodeMailer
        console.log(`Password reset link requested for: ${email}`);

        // 3. Return success response
        res.status(200).json({ message: "Password reset link sent to your email!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { registerUser, loginUser, checkEmail, forgotPassword };
