const { generateTeacherExcel, generateConsolidatedExcel } = require('../services/export.service');
const { generateTeacherPdf } = require('../services/pdf.service');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /api/export/pdf — Teacher's own PDF report
 */
async function exportPdf(req, res, next) {
  try {
    const teacherId = req.user.id;

    const pdfBuffer = await generateTeacherPdf(teacherId);

    await logActivity({
      userId: teacherId,
      action: 'PDF_EXPORTED',
      targetType: 'user',
      targetId: teacherId,
      description: 'Exported personal NAAC PDF report',
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="NAAC_Report_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next(error);
  }
}

/**
 * GET /api/export/excel — Teacher's own Excel report
 */
async function exportExcel(req, res, next) {
  try {
    const teacherId = req.user.id;

    const wb = await generateTeacherExcel(teacherId);

    await logActivity({
      userId: teacherId,
      action: 'EXCEL_EXPORTED',
      targetType: 'user',
      targetId: teacherId,
      description: 'Exported personal NAAC Excel report',
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="NAAC_Report_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next(error);
  }
}

/**
 * GET /api/export/consolidated — HOD consolidated Excel (all teachers)
 */
async function exportConsolidated(req, res, next) {
  try {
    const wb = await generateConsolidatedExcel();

    await logActivity({
      userId: req.user.id,
      action: 'CONSOLIDATED_EXPORTED',
      targetType: 'user',
      description: 'Exported consolidated NAAC Excel report',
      ipAddress: req.ip,
    });

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="NAAC_Consolidated_${dateStr}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

module.exports = { exportPdf, exportExcel, exportConsolidated };
