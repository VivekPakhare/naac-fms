const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All export routes require authentication
router.use(authenticateToken);

// Teacher exports
router.get('/pdf', exportController.exportPdf);
router.get('/excel', exportController.exportExcel);

// HOD consolidated export
router.get('/consolidated', requireRole('hod'), exportController.exportConsolidated);

module.exports = router;
