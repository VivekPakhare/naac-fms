const express = require('express');
const router = express.Router();
const hod = require('../controllers/hod.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All HOD routes require authentication + HOD role
router.use(authenticateToken, requireRole('hod'));

// Dashboard stats
router.get('/dashboard-stats', hod.getDashboardStats);

// Teacher progress matrix
router.get('/teachers-progress', hod.getTeachersProgress);

// Teacher data (read-only view)
router.get('/teacher/:teacherId/data/:criteriaCode', hod.getTeacherData);

// Review/verify submission
router.put('/review/:submissionId', hod.reviewSubmission);

// Reminders
router.post('/remind/all', hod.remindAllTeachers);
router.post('/remind/:teacherId', hod.remindTeacher);

// Audit logs
router.get('/audit-logs', hod.getAuditLogs);

// Teacher account management
router.get('/teachers', hod.listTeachers);
router.put('/teachers/:id/status', hod.updateTeacherStatus);
router.post('/teachers', hod.createTeacher);

// Export
router.get('/export/progress-csv', hod.exportProgressCsv);

module.exports = router;
