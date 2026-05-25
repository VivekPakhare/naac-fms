const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// ── Public Routes ────────────────────────────────────────────

// POST /api/auth/register — Register a new teacher
router.post('/register', authController.register);

// POST /api/auth/login — Login (rate-limited: 5 attempts / 15 min)
router.post('/login', loginLimiter, authController.login);

// POST /api/auth/verify-otp — Verify email with 6-digit OTP
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/resend-otp — Resend verification OTP
router.post('/resend-otp', authController.resendOtp);

// POST /api/auth/forgot-password — Request password reset OTP
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password — Reset password with OTP
router.post('/reset-password', authController.resetPassword);

// ── Protected Routes ─────────────────────────────────────────

// GET /api/auth/me — Get current user profile
router.get('/me', authenticateToken, authController.getMe);

// PUT /api/auth/profile — Update own profile
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
