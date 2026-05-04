const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// GET /api/dashboard/teacher — Teacher dashboard data
router.get(
  '/teacher',
  authenticateToken,
  requireRole('teacher'),
  dashboardController.getTeacherDashboard
);

module.exports = router;
