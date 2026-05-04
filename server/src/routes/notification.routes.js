const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const notifCtrl = require('../controllers/notification.controller');

router.use(authenticateToken);

// Teacher + HOD
router.get('/my', notifCtrl.getMyNotifications);
router.get('/unread-count', notifCtrl.getUnreadCount);
router.put('/read-all', notifCtrl.markAllAsRead);
router.put('/:id/read', notifCtrl.markAsRead);

// HOD only
router.post('/send', requireRole('hod'), notifCtrl.sendNotification);

module.exports = router;
