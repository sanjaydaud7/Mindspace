const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables ASAP (before requiring any routes/controllers)
dotenv.config();

// Require routes AFTER env vars are loaded
const authRoutes = require('./routes/authRoutes');
const moodRoutes = require('./routes/moodRoutes');
const profileRoutes = require('./routes/profileRoutes');
const specialistRoutes = require('./routes/specialistRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes'); // Add appointment routes
const adminRoutes = require('./routes/adminRoutes');


// Clear require cache in development to prevent model overwrite errors
if (process.env.NODE_ENV !== 'production') {
    Object.keys(require.cache).forEach(key => {
        if (key.includes('models')) {
            delete require.cache[key];
        }
    });
}

// Initialize express app
const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501'], // Allow frontend origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Add PATCH method
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    credentials: true // Allow cookies if needed
}));

// Handle CORS preflight requests explicitly
app.options('*', cors());

app.use(express.json());

// Configure MongoDB connection options
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    tlsAllowInvalidCertificates: false,
    retryWrites: true,
    w: 'majority',
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        console.error('Connection details:', {
            uri: process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
            options: mongoOptions
        });
        console.error('Server will continue running, but MongoDB operations will fail');
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', moodRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', specialistRoutes);
app.use('/api/admin', adminRoutes); // This handles /api/admin/users
app.use('/api/appointments', appointmentRoutes); // Add appointment routes


// Health check route
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        database: dbStatus,
        port: process.env.PORT || 5000
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Something went wrong on the server'
    });
});

// Start server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments`);
});