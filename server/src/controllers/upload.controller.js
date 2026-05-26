const { prisma } = require('../config/db');
const { upload, getCloudinaryFolder, isCloudinaryEnabled } = require('../config/multer');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const MIME_TO_CONTENT_TYPE = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Upload a buffer to Cloudinary.
 * Returns { public_id, secure_url, bytes }.
 */
async function uploadToCloudinary(buffer, folder, originalname) {
  const cloudinary = require('../config/cloudinary');
  const ext = path.extname(originalname).toLowerCase().replace('.', '');
  const publicId = `${folder}/${uuidv4()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'raw',
        format: ext,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * POST /api/upload/:subCriteriaCode
 * Upload a file for a sub-criterion.
 * - Cloudinary: buffer is uploaded via upload_stream.
 * - Disk: file is in temp dir, moved to structured path.
 */
async function uploadFile(req, res, next) {
  try {
    const subCriteriaCode = req.params.subCriteriaCode;

    const subCriterion = await prisma.subCriterion.findUnique({
      where: { code: subCriteriaCode },
      include: { criterion: { select: { code: true } } },
    });

    if (!subCriterion) {
      return res.status(404).json({ success: false, message: 'Sub-criterion not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    let storedFilename, filePath, fileSize;

    if (isCloudinaryEnabled()) {
      // Cloudinary: upload buffer from memory storage
      const folder = getCloudinaryFolder(req.user.id, subCriteriaCode);
      const result = await uploadToCloudinary(req.file.buffer, folder, req.file.originalname);
      storedFilename = result.public_id;   // Full Cloudinary public_id (includes folder)
      filePath = result.secure_url;         // Cloudinary HTTPS URL
      fileSize = result.bytes || req.file.size;
    } else {
      // Disk: move file from temp dir to structured path
      const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
      const criteriaCode = subCriteriaCode.split('.')[0];
      const destDir = path.join(UPLOAD_DIR, req.user.id, `C${criteriaCode}`, subCriteriaCode);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const destPath = path.join(destDir, req.file.filename);
      fs.renameSync(req.file.path, destPath);
      storedFilename = req.file.filename;
      filePath = destPath;
      fileSize = req.file.size;
    }

    // Find existing form submission to link
    const submission = await prisma.formSubmission.findFirst({
      where: { teacherId: req.user.id, subCriteriaId: subCriterion.id },
    });

    const document = await prisma.uploadedDocument.create({
      data: {
        teacherId: req.user.id,
        subCriteriaId: subCriterion.id,
        formSubmissionId: submission?.id || null,
        originalFilename: req.file.originalname,
        storedFilename,
        filePath,
        fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
        fileSize,
        uploadStatus: 'uploaded',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DOCUMENT_UPLOADED',
        targetType: 'uploaded_document',
        targetId: document.id,
        description: `Uploaded ${req.file.originalname} for ${subCriterion.criterion.code}/${subCriteriaCode}`,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        original_filename: document.originalFilename,
        file_type: document.fileType,
        file_size: document.fileSize,
        upload_status: document.uploadStatus,
        uploaded_at: document.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload/:id/download
 * Download file as attachment.
 * - Cloudinary: redirect to Cloudinary URL with fl_attachment flag.
 * - Disk: stream file from disk.
 */
async function downloadFile(req, res, next) {
  try {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Auth: teacher can only access own files, HOD can access any
    if (req.user.role === 'teacher' && document.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Log download
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DOCUMENT_DOWNLOADED',
        targetType: 'uploaded_document',
        targetId: document.id,
        description: `Downloaded ${document.originalFilename}`,
      },
    });

    if (isCloudinaryEnabled()) {
      // Redirect to Cloudinary URL with attachment flag for download
      const downloadUrl = document.filePath.replace('/upload/', '/upload/fl_attachment/');
      return res.redirect(downloadUrl);
    }

    // Disk: stream file
    const filePath = path.resolve(document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalFilename)}"`);
    const contentType = MIME_TO_CONTENT_TYPE[document.fileType] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload/:id/view
 * View file inline (for in-browser PDF/image viewing).
 * - Cloudinary: redirect to Cloudinary URL.
 * - Disk: stream file inline.
 */
async function viewFile(req, res, next) {
  try {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (req.user.role === 'teacher' && document.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (isCloudinaryEnabled()) {
      // Redirect to Cloudinary URL for inline viewing
      return res.redirect(document.filePath);
    }

    // Disk: stream file inline
    const filePath = path.resolve(document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk.' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalFilename)}"`);
    const contentType = MIME_TO_CONTENT_TYPE[document.fileType] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/upload/:id
 * Delete file. Teacher=own only, cannot delete if verified.
 * - Cloudinary: destroy asset via Cloudinary API.
 * - Disk: unlink from filesystem.
 */
async function deleteFile(req, res, next) {
  try {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id: req.params.id },
      include: {
        formSubmission: { select: { status: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (req.user.role === 'teacher' && document.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Cannot delete if linked submission is verified
    if (document.formSubmission?.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete document — the associated submission has been verified.',
      });
    }

    // Delete the actual file
    if (isCloudinaryEnabled()) {
      const cloudinary = require('../config/cloudinary');
      try {
        await cloudinary.uploader.destroy(document.storedFilename, { resource_type: 'raw' });
      } catch (cloudErr) {
        console.error('Warning: Cloudinary delete failed:', cloudErr.message);
      }
    } else {
      const filePath = path.resolve(document.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from DB
    await prisma.uploadedDocument.delete({ where: { id: req.params.id } });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DOCUMENT_DELETED',
        targetType: 'uploaded_document',
        targetId: document.id,
        description: `Deleted ${document.originalFilename}`,
      },
    });

    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload/list/:subCriteriaCode
 * List all documents for a sub-criterion by the current teacher.
 */
async function listFiles(req, res, next) {
  try {
    const subCriterion = await prisma.subCriterion.findUnique({
      where: { code: req.params.subCriteriaCode },
    });

    if (!subCriterion) {
      return res.status(404).json({ success: false, message: 'Sub-criterion not found.' });
    }

    const documents = await prisma.uploadedDocument.findMany({
      where: {
        teacherId: req.user.id,
        subCriteriaId: subCriterion.id,
      },
      select: {
        id: true,
        originalFilename: true,
        fileType: true,
        fileSize: true,
        uploadStatus: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload/all
 * List ALL documents for the current teacher, grouped by criterion/sub-criterion.
 */
async function listAllFiles(req, res, next) {
  try {
    const documents = await prisma.uploadedDocument.findMany({
      where: { teacherId: req.user.id },
      include: {
        subCriterion: {
          select: {
            id: true,
            code: true,
            name: true,
            criterion: { select: { id: true, code: true, name: true } },
          },
        },
        formSubmission: { select: { status: true } },
      },
      orderBy: [
        { subCriterion: { code: 'asc' } },
        { uploadedAt: 'desc' },
      ],
    });

    // Group by criterion > sub-criterion
    const grouped = {};
    for (const doc of documents) {
      const cCode = doc.subCriterion.criterion.code;
      const scCode = doc.subCriterion.code;

      if (!grouped[cCode]) {
        grouped[cCode] = {
          criteria_code: cCode,
          criteria_name: doc.subCriterion.criterion.name,
          sub_criteria: {},
        };
      }

      if (!grouped[cCode].sub_criteria[scCode]) {
        grouped[cCode].sub_criteria[scCode] = {
          code: scCode,
          name: doc.subCriterion.name,
          documents: [],
        };
      }

      grouped[cCode].sub_criteria[scCode].documents.push({
        id: doc.id,
        original_filename: doc.originalFilename,
        file_type: doc.fileType,
        file_size: doc.fileSize,
        upload_status: doc.uploadStatus,
        uploaded_at: doc.uploadedAt,
        submission_status: doc.formSubmission?.status || null,
      });
    }

    // Convert to array
    const result = Object.values(grouped).map((c) => ({
      ...c,
      sub_criteria: Object.values(c.sub_criteria),
    }));

    res.json({ success: true, data: result, total: documents.length });
  } catch (error) {
    next(error);
  }
}

// Multer middleware
const uploadMiddleware = upload.single('document');

// Wrap multer to handle errors gracefully
function handleMulterError(req, res, next) {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}

module.exports = {
  uploadFile,
  downloadFile,
  viewFile,
  deleteFile,
  listFiles,
  listAllFiles,
  handleMulterError,
};
