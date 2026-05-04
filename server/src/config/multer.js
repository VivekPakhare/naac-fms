const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types for NAAC documents — validated against BOTH mime and extension
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.docx']);

/**
 * Build per-teacher/criteria directory path.
 * Format: /uploads/{teacher_id}/{criteria_code}/{sub_criteria_code}/
 */
function getUploadDir(teacherId, subCriteriaCode) {
  const criteriaCode = subCriteriaCode.split('.')[0];
  const dir = path.join(UPLOAD_DIR, teacherId, `C${criteriaCode}`, subCriteriaCode);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Use a temporary upload dir first, we'll move it in the controller
    const tmpDir = path.join(UPLOAD_DIR, '_tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Store as UUID.extension — never expose original filename
    cb(null, `${uuidv4()}${ext}`);
  },
});

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

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = { upload, UPLOAD_DIR, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, getUploadDir, MAX_FILE_SIZE };
