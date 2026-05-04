const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');

// ===================================================================
// GET /api/hod/dashboard-stats
// ===================================================================
async function getDashboardStats(req, res, next) {
  try {
    const totalTeachers = await prisma.user.count({ where: { role: 'teacher' } });

    const teachersWithEntries = await prisma.formSubmission.findMany({
      where: { teacher: { role: 'teacher' } },
      select: { teacherId: true },
      distinct: ['teacherId'],
    });

    const totalDocs = await prisma.uploadedDocument.count();

    const submissions = await prisma.formSubmission.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusCounts = { draft: 0, submitted: 0, verified: 0, needs_revision: 0 };
    submissions.forEach((s) => { statusCounts[s.status] = s._count.id; });

    // Overall department completion
    const allCriteria = await prisma.criterion.findMany({
      include: { subCriteria: { select: { id: true } } },
    });
    const totalSubCriteria = allCriteria.reduce((sum, c) => sum + c.subCriteria.length, 0);

    const allTeachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: { id: true },
    });

    let totalCompletion = 0;
    if (allTeachers.length > 0 && totalSubCriteria > 0) {
      for (const t of allTeachers) {
        const submittedCount = await prisma.formSubmission.count({
          where: {
            teacherId: t.id,
            status: { in: ['submitted', 'verified'] },
          },
        });
        totalCompletion += (submittedCount / totalSubCriteria) * 100;
      }
      totalCompletion = Math.round(totalCompletion / allTeachers.length);
    }

    res.json({
      success: true,
      data: {
        total_teachers: totalTeachers,
        teachers_started: teachersWithEntries.length,
        overall_completion: totalCompletion,
        total_documents: totalDocs,
        pending_review: statusCounts.submitted,
        verified: statusCounts.verified,
        needs_revision: statusCounts.needs_revision,
        drafts: statusCounts.draft,
      },
    });
  } catch (error) { next(error); }
}

// ===================================================================
// GET /api/hod/teachers-progress
// ===================================================================
async function getTeachersProgress(req, res, next) {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: { id: true, fullName: true, email: true, department: true, isActive: true, lastLoginAt: true },
      orderBy: { fullName: 'asc' },
    });

    const criteria = await prisma.criterion.findMany({
      orderBy: { id: 'asc' },
      include: { subCriteria: { select: { id: true, code: true } } },
    });

    const allSubmissions = await prisma.formSubmission.findMany({
      select: { teacherId: true, subCriteriaId: true, status: true, formData: true },
    });

    // Build lookup: teacherId -> subCriteriaId -> submission
    const subMap = {};
    allSubmissions.forEach((s) => {
      if (!subMap[s.teacherId]) subMap[s.teacherId] = {};
      subMap[s.teacherId][s.subCriteriaId] = s;
    });

    const result = teachers.map((teacher) => {
      const teacherSubs = subMap[teacher.id] || {};

      const criteriaProgress = criteria.map((c) => {
        const subIds = c.subCriteria.map((sc) => sc.id);
        let submitted = 0;
        let verified = 0;
        let needsRevision = 0;
        let hasData = 0;

        subIds.forEach((scId) => {
          const sub = teacherSubs[scId];
          if (sub) {
            const entries = sub.formData?.entries || [];
            if (entries.length > 0) hasData++;
            if (sub.status === 'submitted') submitted++;
            if (sub.status === 'verified') verified++;
            if (sub.status === 'needs_revision') needsRevision++;
          }
        });

        const total = subIds.length;
        const completed = submitted + verified;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        let status = 'not_started';
        if (needsRevision > 0) status = 'needs_revision';
        else if (verified === total && total > 0) status = 'verified';
        else if (completed > 0) status = 'submitted';
        else if (hasData > 0) status = 'in_progress';

        return {
          criteria_code: c.code,
          criteria_id: c.id,
          percentage: pct,
          status,
          submitted,
          verified,
          needs_revision: needsRevision,
          total: total,
        };
      });

      const totalSubs = criteria.reduce((s, c) => s + c.subCriteria.length, 0);
      const totalCompleted = criteriaProgress.reduce((s, cp) => s + cp.submitted + cp.verified, 0);
      const overallPct = totalSubs > 0 ? Math.round((totalCompleted / totalSubs) * 100) : 0;

      return {
        id: teacher.id,
        name: teacher.fullName,
        email: teacher.email,
        department: teacher.department,
        is_active: teacher.isActive,
        last_active: teacher.lastLoginAt,
        criteria: criteriaProgress,
        overall_percentage: overallPct,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

// ===================================================================
// GET /api/hod/teacher/:teacherId/data/:criteriaCode
// ===================================================================
async function getTeacherData(req, res, next) {
  try {
    const { teacherId, criteriaCode } = req.params;
    const criteriaId = parseInt(criteriaCode.replace('C', ''), 10);

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, fullName: true, email: true, department: true },
    });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    const criterion = await prisma.criterion.findUnique({
      where: { id: criteriaId },
      include: { subCriteria: { orderBy: { code: 'asc' } } },
    });
    if (!criterion) return res.status(404).json({ success: false, message: 'Criterion not found.' });

    const submissions = await prisma.formSubmission.findMany({
      where: {
        teacherId,
        subCriteriaId: { in: criterion.subCriteria.map((sc) => sc.id) },
      },
      include: {
        subCriterion: { select: { code: true, name: true } },
        documents: {
          select: { id: true, originalFilename: true, fileType: true, fileSize: true, uploadStatus: true, uploadedAt: true },
        },
      },
    });

    const subData = criterion.subCriteria.map((sc) => {
      const sub = submissions.find((s) => s.subCriteriaId === sc.id);
      return {
        code: sc.code,
        name: sc.name,
        submission: sub ? {
          id: sub.id,
          status: sub.status,
          form_data: sub.formData,
          hod_comment: sub.hodComment,
          submitted_at: sub.submittedAt,
          documents: sub.documents,
        } : null,
      };
    });

    res.json({
      success: true,
      data: {
        teacher,
        criterion: { id: criterion.id, code: criterion.code, name: criterion.name },
        sub_criteria: subData,
      },
    });
  } catch (error) { next(error); }
}

// ===================================================================
// PUT /api/hod/review/:submissionId
// ===================================================================
async function reviewSubmission(req, res, next) {
  try {
    const { submissionId } = req.params;
    const { status, comment } = req.body;

    if (!['verified', 'needs_revision'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or needs_revision.' });
    }

    const submission = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: { subCriterion: { select: { code: true, name: true } } },
    });

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    const updated = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        hodComment: comment || null,
        verifiedAt: status === 'verified' ? new Date() : null,
        verifiedBy: status === 'verified' ? req.user.id : null,
      },
    });

    // Update linked documents status if verified
    if (status === 'verified') {
      await prisma.uploadedDocument.updateMany({
        where: { formSubmissionId: submissionId },
        data: { uploadStatus: 'verified' },
      });
    }

    // Send notification to teacher (non-blocking)
    const notifMessage = status === 'verified'
      ? `Your submission for ${submission.subCriterion.code} - ${submission.subCriterion.name} has been verified by HOD.`
      : `Your submission for ${submission.subCriterion.code} - ${submission.subCriterion.name} needs revision. Comment: "${comment || ''}"`;

    try {
      await prisma.notification.create({
        data: {
          recipientId: submission.teacherId,
          senderId: req.user.id,
          message: notifMessage,
          type: status === 'verified' ? 'verified' : 'revision_request',
          isRead: false,
        },
      });
    } catch (notifErr) {
      console.error('Warning: notification creation failed:', notifErr.message);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: status === 'verified' ? 'SUBMISSION_VERIFIED' : 'REVISION_REQUESTED',
        targetType: 'form_submission',
        targetId: submissionId,
        description: `${status === 'verified' ? 'Verified' : 'Requested revision for'} ${submission.subCriterion.code}`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

// ===================================================================
// POST /api/hod/remind/:teacherId
// ===================================================================
async function remindTeacher(req, res, next) {
  try {
    const { teacherId } = req.params;
    const { message } = req.body;

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    await prisma.notification.create({
      data: {
        recipientId: teacherId,
        senderId: req.user.id,
        message: message || 'Reminder: Please complete your pending NAAC submissions.',
        type: 'reminder',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'REMINDER_SENT',
        targetType: 'user',
        targetId: teacherId,
        description: `Sent reminder to ${teacher.fullName}`,
      },
    });

    res.json({ success: true, message: `Reminder sent to ${teacher.fullName}.` });
  } catch (error) { next(error); }
}

// ===================================================================
// POST /api/hod/remind/all
// ===================================================================
async function remindAllTeachers(req, res, next) {
  try {
    const { message } = req.body;
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher', isActive: true },
      select: { id: true, fullName: true },
    });

    const notifications = teachers.map((t) => ({
      recipientId: t.id,
      senderId: req.user.id,
      message: message || 'Reminder: Please complete your pending NAAC submissions before the deadline.',
      type: 'reminder',
    }));

    await prisma.notification.createMany({ data: notifications });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'BULK_REMINDER_SENT',
        targetType: 'user',
        description: `Sent bulk reminder to ${teachers.length} teachers`,
      },
    });

    res.json({ success: true, message: `Reminder sent to ${teachers.length} teachers.` });
  } catch (error) { next(error); }
}

// ===================================================================
// GET /api/hod/audit-logs
// ===================================================================
async function getAuditLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.action) where.action = req.query.action;
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to) where.createdAt.lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { fullName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
}

// ===================================================================
// GET /api/hod/teachers
// ===================================================================
async function listTeachers(req, res, next) {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true, fullName: true, email: true, department: true,
        designation: true, isActive: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
    res.json({ success: true, data: teachers });
  } catch (error) { next(error); }
}

// ===================================================================
// PUT /api/hod/teachers/:id/status
// ===================================================================
async function updateTeacherStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const teacher = await prisma.user.findUnique({ where: { id } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    await prisma.user.update({ where: { id }, data: { isActive: is_active } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: is_active ? 'TEACHER_ACTIVATED' : 'TEACHER_DEACTIVATED',
        targetType: 'user',
        targetId: id,
        description: `${is_active ? 'Activated' : 'Deactivated'} ${teacher.fullName}`,
      },
    });

    res.json({ success: true, message: `Teacher ${is_active ? 'activated' : 'deactivated'}.` });
  } catch (error) { next(error); }
}

// ===================================================================
// POST /api/hod/teachers
// ===================================================================
async function createTeacher(req, res, next) {
  try {
    const { full_name, email, password, department, designation } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: full_name,
        email,
        passwordHash: hashedPassword,
        role: 'teacher',
        department: department || null,
        designation: designation || null,
      },
      select: { id: true, fullName: true, email: true, department: true, createdAt: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'TEACHER_CREATED',
        targetType: 'user',
        targetId: user.id,
        description: `Created teacher account for ${full_name}`,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
}

// ===================================================================
// GET /api/hod/export/progress-csv
// ===================================================================
async function exportProgressCsv(req, res, next) {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: { id: true, fullName: true, email: true, department: true },
      orderBy: { fullName: 'asc' },
    });

    const criteria = await prisma.criterion.findMany({
      orderBy: { id: 'asc' },
      include: { subCriteria: { select: { id: true } } },
    });

    const allSubmissions = await prisma.formSubmission.findMany({
      select: { teacherId: true, subCriteriaId: true, status: true },
    });

    const subMap = {};
    allSubmissions.forEach((s) => {
      if (!subMap[s.teacherId]) subMap[s.teacherId] = {};
      subMap[s.teacherId][s.subCriteriaId] = s;
    });

    // Build CSV
    const headers = ['Teacher Name', 'Email', 'Department',
      ...criteria.map((c) => c.code), 'Overall %'];

    const rows = teachers.map((teacher) => {
      const teacherSubs = subMap[teacher.id] || {};
      const critPcts = criteria.map((c) => {
        const subIds = c.subCriteria.map((sc) => sc.id);
        const completed = subIds.filter((scId) => {
          const sub = teacherSubs[scId];
          return sub && ['submitted', 'verified'].includes(sub.status);
        }).length;
        return subIds.length > 0 ? Math.round((completed / subIds.length) * 100) : 0;
      });
      const totalSubs = criteria.reduce((s, c) => s + c.subCriteria.length, 0);
      const totalCompleted = criteria.reduce((s, c) => {
        const subIds = c.subCriteria.map((sc) => sc.id);
        return s + subIds.filter((scId) => {
          const sub = teacherSubs[scId];
          return sub && ['submitted', 'verified'].includes(sub.status);
        }).length;
      }, 0);
      const overall = totalSubs > 0 ? Math.round((totalCompleted / totalSubs) * 100) : 0;

      return [teacher.fullName, teacher.email, teacher.department || '',
        ...critPcts.map((p) => `${p}%`), `${overall}%`];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="naac-progress.csv"');
    res.send(csv);
  } catch (error) { next(error); }
}

module.exports = {
  getDashboardStats,
  getTeachersProgress,
  getTeacherData,
  reviewSubmission,
  remindTeacher,
  remindAllTeachers,
  getAuditLogs,
  listTeachers,
  updateTeacherStatus,
  createTeacher,
  exportProgressCsv,
};
