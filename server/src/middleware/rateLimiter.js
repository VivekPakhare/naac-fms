const rateLimit = require('express-rate-limit');

// Disable all validations for express-rate-limit v7+
const VALIDATE_OFF = {
  default: false,
  ip: false,
  trustProxy: false,
  xForwardedForHeader: false,
  positiveHits: false,
  singleCount: false,
  limit: false,
  draftPolliHeaders: false,
  onLimitReached: false,
  headersResetTime: false,
  creationStack: false,
};

/**
 * Rate limiter for login endpoint.
 * Dev: 500 attempts / 15 min. Production: lower to 10-15.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: VALIDATE_OFF,
});

/**
 * General API rate limiter.
 * Dev: 2000 requests / 15 min. Production: lower to 200.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: VALIDATE_OFF,
});

module.exports = { loginLimiter, apiLimiter };

