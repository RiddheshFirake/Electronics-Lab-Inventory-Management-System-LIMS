const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes.js');
const componentRoutes = require('./routes/componentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

// Import utilities
const { startNotificationScheduler } = require('./utils/notificationUtils');

const app = express();

// Connect to MongoDB
connectDB();

// SECURITY HEADERS
app.use(helmet());

// DISABLE HTTP CACHING FOR API RESPONSES (no 304 headaches)
app.disable('etag'); // Remove ETag headers, always send fresh body
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store');
  next();
});

// RATE LIMITING
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS CONFIG
const devOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const prodOrigins = ['https://lims-backend-api.onrender.com'];
// This handles both arrays and strings
// In server.js (around line 43)
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://lims-backend-api.onrender.com'] // Replace with your actual Vercel domain later
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
}));

// BODY PARSING
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Personal Assistant routes (must come before other /api routes to avoid conflicts)
app.use('/api', assistantRoutes);

const ordersRoutes = require('./routes/ordersRoutes');
app.use('/api/orders', ordersRoutes);

// Gemini API integration (for dashboard assessment)
app.use('/api', geminiRoutes);

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Electronics Lab Inventory Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// DEBUGGING: Log every 404
app.use((req, res, next) => {
  console.log(`404 Handler hit for path: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found for: ${req.originalUrl}`
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  // Start notification scheduler
  startNotificationScheduler();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
