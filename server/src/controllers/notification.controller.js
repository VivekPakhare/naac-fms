const { prisma } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * POST /api/notifications/send — HOD sends reminder to a teacher
 */
async function sendNotification(req, res, next) {
  try {
    const { recipient_id, message, type = 'reminder' } = req.body;
    if (!recipient_id || !message) {
      return res.status(400).json({ success: false, message: 'recipient_id and message are required.' });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipient_id } });
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found.' });

    const notif = await prisma.notification.create({
      data: {
        recipientId: recipient_id,
        senderId: req.user.id,
        type,
        message,
        isRead: false,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'REMINDER_SENT',
      targetType: 'user',
      targetId: recipient_id,
      description: `Sent ${type} notification to ${recipient.fullName}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: notif });
  } catch (error) { next(error); }
}

/**
 * GET /api/notifications/my — get logged-in user's notifications
 */
async function getMyNotifications(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const typeFilter = req.query.type;

    const where = { recipientId: req.user.id };
    if (typeFilter) where.type = typeFilter;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { sender: { select: { fullName: true, role: true } } },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { recipientId: req.user.id, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
}

/**
 * GET /api/notifications/unread-count — quick badge count
 */
async function getUnreadCount(req, res, next) {
  try {
    const count = await prisma.notification.count({
      where: { recipientId: req.user.id, isRead: false },
    });
    res.json({ success: true, count });
  } catch (error) { next(error); }
}

/**
 * PUT /api/notifications/:id/read — mark one as read
 */
async function markAsRead(req, res, next) {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    if (notif.recipientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your notification.' });
    }

    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (error) { next(error); }
}

/**
 * PUT /api/notifications/read-all — mark all as read
 */
async function markAllAsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) { next(error); }
}

/**
 * Helper: create a notification programmatically (used by other controllers)
 */
async function createNotification({ recipientId, senderId, type, message }) {
  try {
    return await prisma.notification.create({
      data: { recipientId, senderId, type, message, isRead: false },
    });
  } catch (err) {
    console.error('⚠️  Notification creation failed:', err.message);
  }
}

/**
 * Helper: check deadline-based notifications on login
 */
async function checkDeadlineNotifications(userId) {
  try {
    const DEADLINE = new Date('2026-07-31T23:59:59');
    const now = new Date();
    const daysLeft = Math.floor((DEADLINE - now) / (1000 * 60 * 60 * 24));
    const milestones = [30, 14, 7, 3, 1];

    if (!milestones.includes(daysLeft)) return;

    // Check if already sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.notification.findFirst({
      where: {
        recipientId: userId,
        type: 'deadline',
        createdAt: { gte: today },
      },
    });
    if (existing) return;

    // Count pending criteria
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== 'teacher') return;

    const totalSubs = await prisma.subCriterion.count();
    const completed = await prisma.formSubmission.count({
      where: { teacherId: userId, status: { in: ['submitted', 'verified'] } },
    });
    const pending = totalSubs - completed;

    if (pending > 0) {
      await createNotification({
        recipientId: userId,
        senderId: null,
        type: 'deadline',
        message: `NAAC submission deadline in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. You have ${pending} pending criteria.`,
      });
    }
  } catch (err) {
    console.error('⚠️  Deadline notification check failed:', err.message);
  }
}

module.exports = {
  sendNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  checkDeadlineNotifications,
};
