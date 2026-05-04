const { prisma } = require('../config/db');

/**
 * Log a user activity to the activity_logs table.
 *
 * @param {Object} params
 * @param {string} params.userId    - UUID of the user performing the action
 * @param {string} params.action    - Action code, e.g. 'USER_REGISTERED', 'USER_LOGIN'
 * @param {string} [params.targetType] - Entity type, e.g. 'user', 'form_submission'
 * @param {string} [params.targetId]   - UUID of the target entity
 * @param {string} [params.description]- Human-readable description
 * @param {string} [params.ipAddress]  - Client IP address
 */
async function logActivity({ userId, action, targetType, targetId, description, ipAddress }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        description: description || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    // Activity logging should never crash the request
    console.error('⚠️  Activity log failed:', error.message);
  }
}

module.exports = { logActivity };
