const express = require('express');
const router = express.Router();
const criteriaController = require('../controllers/criteria.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// GET /api/criteria — List all 7 criteria with sub-criteria
router.get('/', authenticateToken, criteriaController.listCriteria);

// GET /api/criteria/:id — Get single criterion with sub-criteria
router.get('/:id', authenticateToken, criteriaController.getCriterion);

module.exports = router;
