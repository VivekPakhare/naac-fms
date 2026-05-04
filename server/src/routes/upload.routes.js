const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All upload routes require authentication
router.use(authenticateToken);

// GET /api/upload/all — list ALL documents grouped by criterion (must be before :id routes)
router.get('/all', uploadController.listAllFiles);

// GET /api/upload/list/:subCriteriaCode — list files for a sub-criterion
router.get('/list/:subCriteriaCode', uploadController.listFiles);

// POST /api/upload/:subCriteriaCode — upload a file (with multer error handling)
router.post('/:subCriteriaCode', uploadController.handleMulterError, uploadController.uploadFile);

// GET /api/upload/:id/download — download a file (attachment)
router.get('/:id/download', uploadController.downloadFile);

// GET /api/upload/:id/view — view a file inline (PDF/images in browser)
router.get('/:id/view', uploadController.viewFile);

// DELETE /api/upload/:id — delete a file
router.delete('/:id', uploadController.deleteFile);

module.exports = router;
