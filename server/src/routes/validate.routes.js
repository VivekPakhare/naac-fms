const express = require('express');
const router = express.Router();
const validateController = require('../controllers/validate.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// POST /api/validate/submission/:criteriaId
router.post('/submission/:criteriaId', authenticateToken, validateController.validateSubmission);

module.exports = router;
