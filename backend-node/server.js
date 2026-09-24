require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const supabase = require('./config/supabase');

const app = express();

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    hidePoweredBy: true
}));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight production request logger with execution latency
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path === '/health' || req.path === '/health/ready') {
            if (res.statusCode >= 400) {
                console.warn(`[HEALTH-WARN] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
            }
            return;
        }
        const logMethod = res.statusCode >= 500 ? console.error : (res.statusCode >= 400 ? console.warn : console.log);
        logMethod(`[HTTP] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Rate Limiting for AI Chat (protect Gemini API quotas and resource abuse)
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // max 20 requests per minute per IP
    message: { message: 'Too many AI chat requests. Please wait a minute before sending another message.' }
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
// --- Agent Routes ---
const agentRoutes = require('./routes/agentRoutes');
app.use('/api/agents', agentRoutes);
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

// --- AI Chat Routes ---
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiLimiter, aiRoutes);
// Routes: /api/ai/chat
// ----------------------------------------

// --- Favorites Routes ---
app.use('/api/favorites', favoritesRoutes);
// Routes: /api/favorites
// ----------------------------------------

// --- Saved Searches Routes ---
const savedSearchRoutes = require('./routes/savedSearchRoutes');
app.use('/api/saved-searches', savedSearchRoutes);
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

// --- Analytics Routes ---
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);
// Routes: /api/analytics/history, /api/analytics/valuation
// ----------------------------------------



app.get('/', (req, res) => {
    res.json({ message: "Thirasara Property API is running!" });
});

// 1. Health Liveness Probe (Uptime, Memory, Timestamp)
app.get('/health', (req, res) => {
    const memory = process.memoryUsage();
    res.status(200).json({
        status: "healthy",
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage_mb: Math.round(memory.heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
    });
});

// 2. Health Readiness Probe (Deep database connectivity ping)
app.get('/health/ready', async (req, res) => {
    try {
        const startTime = Date.now();
        const { error } = await supabase.from('settings').select('count', { count: 'exact', head: true });
        const dbLatency = Date.now() - startTime;

        if (error) {
            return res.status(503).json({
                status: "unready",
                database: "disconnected",
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            status: "ready",
            database: "connected",
            db_latency_ms: dbLatency,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: "unready",
            database: "error",
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL) {
    // Export for Vercel serverless deployment
    module.exports = app;
} else if (process.env.NODE_ENV !== 'test') {
    // Normal local deployment
    app.listen(PORT, (err) => {
        if (err) {
            console.error(`Failed to start server on port ${PORT}:`, err.message);
            process.exit(1);
        }
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
