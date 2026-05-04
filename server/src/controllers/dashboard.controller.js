const dashboardService = require('../services/dashboard.service');

/**
 * GET /api/dashboard/teacher
 * Returns aggregated dashboard data for the authenticated teacher.
 */
async function getTeacherDashboard(req, res, next) {
  try {
    const data = await dashboardService.getTeacherDashboard(req.user.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTeacherDashboard };
