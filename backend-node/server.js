require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// --- Authentication Routes ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes);
// Routes: /api/auth/register, /api/auth/login, /api/auth/check-email, /api/auth/forgot-password
// ----------------------------------------

// --- Property Management Routes ---
const propertyRoutes = require('./routes/propertyRoutes');
app.use('/api/properties', propertyRoutes);
// Routes: /api/properties (GET all, POST add), /api/properties/search
// ----------------------------------------

// --- Admin Routes ---
const adminRoutes = require('./routes/adminRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes'); // Added favorites route
app.use('/api/admin', adminRoutes);
// Routes: /api/admin/login, /api/admin/dashboard/stats, etc.
// ----------------------------------------

// --- Conversation & Messaging Routes ---
const conversationRoutes = require('./routes/conversationRoutes');
app.use('/api/conversations', conversationRoutes);
// Routes: /api/conversations, /api/conversations/:id/messages, etc.
// ----------------------------------------

// --- Favorites Routes ---
app.use('/api/favorites', favoritesRoutes);
// Routes: /api/favorites
// ----------------------------------------

// --- Payment Routes ---
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);
// Routes: /api/payment/generate-hash, /api/payment/notify
// ----------------------------------------

// --- Feasibility Engine Routes ---
const feasibilityRoutes = require('./routes/feasibilityRoutes');
app.use('/api/feasibility', feasibilityRoutes);
// Routes: /api/feasibility/calculate
// ----------------------------------------



app.get('/', (req, res) => {
    res.json({ message: "Thirasara Property API is running!" });
});

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


