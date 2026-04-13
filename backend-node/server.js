require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
    res.json({ message: "Thirasara Property API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});