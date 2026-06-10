require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Authentication Routes ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
// Routes: /api/auth/register, /api/auth/login, /api/auth/check-email, /api/auth/forgot-password
// ----------------------------------------

// --- Property Management Routes ---
const propertyRoutes = require('./routes/propertyRoutes');
app.use('/api/properties', propertyRoutes);
// Routes: /api/properties (GET all, POST add), /api/properties/search
// ----------------------------------------

// --- Admin Routes ---
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
// Routes: /api/admin/login, /api/admin/dashboard/stats, etc.
// ----------------------------------------

// --- Conversation & Messaging Routes ---
const conversationRoutes = require('./routes/conversationRoutes');
app.use('/api/conversations', conversationRoutes);
// Routes: /api/conversations, /api/conversations/:id/messages, etc.
// ----------------------------------------

// --- Payment Routes ---
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);
// Routes: /api/payment/generate-hash, /api/payment/notify
// ----------------------------------------



app.get('/', (req, res) => {
    res.json({ message: "Thirasara Property API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


