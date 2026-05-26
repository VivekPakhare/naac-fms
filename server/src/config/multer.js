const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

// Allowed MIME types for NAAC documents — validated against BOTH mime and extension
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.docx']);

/**
 * Build Cloudinary folder path per teacher/criteria.
 * Format: naac-fms/{teacher_id}/{criteria_code}/{sub_criteria_code}
 */
function getCloudinaryFolder(teacherId, subCriteriaCode) {
  const criteriaCode = subCriteriaCode.split('.')[0];
  return `naac-fms/${teacherId}/C${criteriaCode}/${subCriteriaCode}`;
}

/**
 * File filter: validates BOTH MIME type AND file extension.
 */
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  // Check extension is allowed
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File extension not allowed: ${ext}. Accepted: PDF, DOCX, JPG, JPEG, PNG`), false);
  }

  // Check MIME type is allowed
  const allowedExtsForMime = ALLOWED_MIME_TYPES[mime];
  if (!allowedExtsForMime) {
    return cb(new Error(`File MIME type not allowed: ${mime}`), false);
  }

  // Cross-validate: extension must match MIME type
  if (!allowedExtsForMime.includes(ext)) {
    return cb(new Error(`File extension ${ext} does not match MIME type ${mime}`), false);
  }

  cb(null, true);
};

// ── Storage Strategy ─────────────────────────────────────────
// Use memory storage on Vercel (files are uploaded to Cloudinary in the controller).
// Use disk storage for local development.

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // ── Memory Storage (Vercel/Cloudinary) ───────────────────
  // Files are buffered in memory and then uploaded to Cloudinary
  // in the upload controller. This avoids the multer-storage-cloudinary
  // peer dependency conflict with cloudinary v2.
  storage = multer.memoryStorage();
} else {
  // ── Disk Storage (local dev fallback) ────────────────────
  const fs = require('fs');

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tmpDir = path.join(UPLOAD_DIR, '_tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      cb(null, tmpDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Check if Cloudinary is being used for storage.
 */
function isCloudinaryEnabled() {
  return !!process.env.CLOUDINARY_CLOUD_NAME;
}

module.exports = {
  upload,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  getCloudinaryFolder,
  MAX_FILE_SIZE,
  isCloudinaryEnabled,
};
