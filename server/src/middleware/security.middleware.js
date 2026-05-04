const xssFilters = require('xss-filters');

// ── Blocked file extensions ──────────────────────────────
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.sh', '.bat', '.cmd', '.com', '.msi', '.dll',
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.py', '.rb',
  '.pl', '.ps1', '.vbs', '.wsf', '.scr', '.pif', '.hta',
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Sanitize all string values in request body to prevent XSS.
 */
function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    deepSanitize(req.body);
  }
  next();
}

function deepSanitize(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Strip HTML tags and XSS payloads
      obj[key] = xssFilters.inHTMLData(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      deepSanitize(obj[key]);
    }
  }
}

/**
 * Validate uploaded file — check extension, MIME type, size, and path traversal.
 */
function validateUploadedFile(req, res, next) {
  if (!req.file) return next();

  const file = req.file;

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    });
  }

  // Extension check
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return res.status(400).json({
      success: false,
      message: `File type "${ext}" is not allowed.`,
    });
  }

  // MIME type check
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: `MIME type "${file.mimetype}" is not allowed.`,
    });
  }

  // Path traversal prevention
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid filename.',
    });
  }

  next();
}

/**
 * Validate required fields in request body.
 * Usage: validateFields(['email', 'password'])
 */
function validateFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.body[f] && req.body[f] !== 0 && req.body[f] !== false);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Validate email format.
 */
function validateEmail(req, res, next) {
  const { email } = req.body;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.',
    });
  }
  next();
}

module.exports = {
  sanitizeBody,
  validateUploadedFile,
  validateFields,
  validateEmail,
  BLOCKED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
