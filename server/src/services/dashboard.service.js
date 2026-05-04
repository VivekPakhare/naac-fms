const { prisma } = require('../config/db');

/**
 * Get teacher dashboard data — aggregates progress, activity, and pending items.
 */
async function getTeacherDashboard(teacherId) {
  // Fetch all criteria with sub-criteria counts
  const criteria = await prisma.criterion.findMany({
    orderBy: { id: 'asc' },
    include: {
      subCriteria: {
        select: { id: true, code: true, name: true },
      },
    },
  });

  // Fetch teacher's form submissions
  const submissions = await prisma.formSubmission.findMany({
    where: { teacherId },
    select: {
      id: true,
      subCriteriaId: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      hodComment: true,
      subCriterion: {
        select: {
          code: true,
          name: true,
          criteriaId: true,
        },
      },
    },
  });

  // Fetch uploaded document count per sub-criterion
  const docCounts = await prisma.uploadedDocument.groupBy({
    by: ['subCriteriaId'],
    where: { teacherId },
    _count: { id: true },
  });

  const docCountMap = {};
  docCounts.forEach((d) => {
    docCountMap[d.subCriteriaId] = d._count.id;
  });

  // Build submission lookup: subCriteriaId -> submission
  const submissionMap = {};
  submissions.forEach((s) => {
    submissionMap[s.subCriteriaId] = s;
  });

  // Build criteria progress
  const criteriaProgress = criteria.map((c) => {
    const subCriteriaIds = c.subCriteria.map((sc) => sc.id);
    const totalSub = subCriteriaIds.length;

    let completedSub = 0;
    let hasAnySubmission = false;
    let hasNeedsRevision = false;
    let allVerified = true;
    let allSubmitted = true;

    subCriteriaIds.forEach((scId) => {
      const sub = submissionMap[scId];
      if (sub) {
        hasAnySubmission = true;
        if (sub.status === 'verified') {
          completedSub++;
        } else if (sub.status === 'submitted') {
          completedSub += 0.75; // partial credit
        } else if (sub.status === 'needs_revision') {
          hasNeedsRevision = true;
          completedSub += 0.25;
        } else if (sub.status === 'draft') {
          completedSub += 0.25;
        }

        if (sub.status !== 'verified') allVerified = false;
        if (sub.status !== 'submitted' && sub.status !== 'verified') allSubmitted = false;
      } else {
        allVerified = false;
        allSubmitted = false;
      }
    });

    const completionPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

    // Determine status
    let status = 'not_started';
    if (hasNeedsRevision) status = 'needs_revision';
    else if (allVerified && totalSub > 0 && hasAnySubmission) status = 'verified';
    else if (allSubmitted && totalSub > 0 && hasAnySubmission) status = 'submitted';
    else if (hasAnySubmission) status = 'in_progress';

    return {
      criteria_id: c.id,
      code: c.code,
      name: c.name,
      max_marks: c.maxMarks,
      completion_pct: completionPct,
      status,
      sub_criteria_count: totalSub,
      completed_sub_criteria: Math.floor(completedSub),
    };
  });

  // Overall progress
  const totalPossible = criteriaProgress.reduce((sum, c) => sum + c.sub_criteria_count, 0);
  const totalCompleted = criteriaProgress.reduce((sum, c) => sum + c.completed_sub_criteria, 0);
  const overallProgress = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Total files
  const totalFiles = await prisma.uploadedDocument.count({ where: { teacherId } });

  // Recent activity (last 5)
  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: teacherId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      action: true,
      targetType: true,
      description: true,
      createdAt: true,
    },
  });

  // Pending items — sub-criteria without submissions + needs_revision
  const pendingItems = [];

  criteria.forEach((c) => {
    c.subCriteria.forEach((sc) => {
      const sub = submissionMap[sc.id];
      if (!sub) {
        pendingItems.push({
          type: 'missing',
          criteria_code: c.code,
          sub_criteria_code: sc.code,
          sub_criteria_name: sc.name,
          message: 'No submission yet',
        });
      } else if (sub.status === 'needs_revision') {
        pendingItems.push({
          type: 'revision',
          criteria_code: c.code,
          sub_criteria_code: sc.code,
          sub_criteria_name: sc.name,
          message: sub.hodComment || 'Revision requested by HOD',
        });
      }
    });
  });

  // Unread notifications count
  const unreadNotifications = await prisma.notification.count({
    where: { recipientId: teacherId, isRead: false },
  });

  return {
    overall_progress: overallProgress,
    total_files_uploaded: totalFiles,
    total_files_required: totalPossible, // 1 per sub-criterion minimum
    criteria_progress: criteriaProgress,
    recent_activity: recentActivity,
    pending_items: pendingItems,
    unread_notifications: unreadNotifications,
  };
}

module.exports = { getTeacherDashboard };
