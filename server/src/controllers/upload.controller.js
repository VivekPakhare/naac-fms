const { prisma } = require('../config/db');
const { upload, UPLOAD_DIR, getUploadDir } = require('../config/multer');
const path = require('path');
const fs = require('fs');

const MIME_TO_CONTENT_TYPE = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * POST /api/upload/:subCriteriaCode
 * Upload a file for a sub-criterion. Moves from temp dir to structured path.
 */
async function uploadFile(req, res, next) {
  try {
    const subCriteriaCode = req.params.subCriteriaCode;

    const subCriterion = await prisma.subCriterion.findUnique({
      where: { code: subCriteriaCode },
      include: { criterion: { select: { code: true } } },
    });

    if (!subCriterion) {
      // Clean up temp file
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Sub-criterion not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Move file from temp dir to structured path: /uploads/{teacher_id}/{C1}/{1.1}/
    const destDir = getUploadDir(req.user.id, subCriteriaCode);
    const destPath = path.join(destDir, req.file.filename);
    fs.renameSync(req.file.path, destPath);

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
        storedFilename: req.file.filename,
        filePath: destPath,
        fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
        fileSize: req.file.size,
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
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    next(error);
  }
}

/**
 * GET /api/upload/:id/download
 * Securely stream file as attachment. Teacher=own files, HOD=any.
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

    const filePath = path.resolve(document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk.' });
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
 * Securely stream file inline (for in-browser PDF/image viewing).
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

    // Delete from disk
    const filePath = path.resolve(document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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
