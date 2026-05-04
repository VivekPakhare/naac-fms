require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { connectDB } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody } = require('./middleware/security.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const criteriaRoutes = require('./routes/criteria.routes');
const uploadRoutes = require('./routes/upload.routes');
const exportRoutes = require('./routes/export.routes');
const formsRoutes = require('./routes/forms.routes');
const validateRoutes = require('./routes/validate.routes');
const hodRoutes = require('./routes/hod.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Allow inline styles for PDF generation
}));

// ── Core Middleware ───────────────────────────────────────
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(sanitizeBody); // XSS protection on all request bodies
app.use('/api', apiLimiter); // Global: 100 requests per 15 min per IP

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ─────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

// ── Start Server ─────────────────────────────────────────
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 NAAC Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer();
