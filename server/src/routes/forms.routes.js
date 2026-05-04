const express = require('express');
const router = express.Router();
const formsController = require('../controllers/forms.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All form routes require authentication as teacher
router.use(authenticateToken);
router.use(requireRole('teacher', 'hod'));

// GET /api/forms/:subCriteriaCode — get teacher's saved form data
router.get('/:subCriteriaCode', formsController.getForm);

// POST /api/forms/submit/:subCriteriaCode — save draft or submit
router.post('/submit/:subCriteriaCode', formsController.submitForm);

// PUT /api/forms/:submissionId — update existing submission
router.put('/:submissionId', formsController.updateForm);

module.exports = router;
