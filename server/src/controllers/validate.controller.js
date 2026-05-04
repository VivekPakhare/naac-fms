const { prisma } = require('../config/db');

/**
 * POST /api/validate/submission/:criteriaId
 * Validates whether a criteria submission is complete.
 * Returns: is_complete, missing_fields[], warnings[], can_submit
 */
async function validateSubmission(req, res, next) {
  try {
    const criteriaId = parseInt(req.params.criteriaId, 10);
    if (isNaN(criteriaId)) {
      return res.status(400).json({ success: false, message: 'Invalid criteria ID.' });
    }

    const teacherId = req.user.id;

    // Get criterion with sub-criteria
    const criterion = await prisma.criterion.findUnique({
      where: { id: criteriaId },
      include: {
        subCriteria: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!criterion) {
      return res.status(404).json({ success: false, message: 'Criterion not found.' });
    }

    // Get all submissions for this teacher + criterion
    const submissions = await prisma.formSubmission.findMany({
      where: {
        teacherId,
        subCriteriaId: { in: criterion.subCriteria.map((sc) => sc.id) },
      },
      include: {
        subCriterion: { select: { code: true, name: true } },
        documents: { select: { id: true } },
      },
    });

    const submissionMap = {};
    for (const sub of submissions) {
      submissionMap[sub.subCriterion.code] = sub;
    }

    const missing_fields = [];
    const warnings = [];
    let allComplete = true;

    for (const sc of criterion.subCriteria) {
      const sub = submissionMap[sc.code];

      if (!sub) {
        missing_fields.push({
          code: sc.code,
          name: sc.name,
          issue: 'No submission found',
        });
        allComplete = false;
        continue;
      }

      // Check if has entries
      const entries = sub.formData?.entries || [];
      if (entries.length === 0) {
        missing_fields.push({
          code: sc.code,
          name: sc.name,
          issue: 'No entries added',
        });
        allComplete = false;
      }

      // Check status
      if (sub.status === 'draft') {
        warnings.push({
          code: sc.code,
          name: sc.name,
          issue: 'Still in draft — not yet submitted',
        });
        allComplete = false;
      }

      if (sub.status === 'needs_revision') {
        warnings.push({
          code: sc.code,
          name: sc.name,
          issue: `Needs revision: ${sub.hodComment || 'See HOD comments'}`,
        });
        allComplete = false;
      }

      // Special validation: C7.2 requires minimum 2 best practices
      if (sc.code === '7.2' && entries.length < 2) {
        warnings.push({
          code: sc.code,
          name: sc.name,
          issue: `Only ${entries.length}/2 best practices added — minimum 2 required`,
        });
        allComplete = false;
      }

      // Check if documents uploaded (basic check)
      if (sub.documents.length === 0) {
        warnings.push({
          code: sc.code,
          name: sc.name,
          issue: 'No supporting documents uploaded',
        });
      }
    }

    const completed_count = criterion.subCriteria.filter((sc) => {
      const sub = submissionMap[sc.code];
      return sub && sub.status === 'submitted' && (sub.formData?.entries?.length || 0) > 0;
    }).length;

    res.json({
      success: true,
      data: {
        criteria_id: criteriaId,
        criteria_code: criterion.code,
        criteria_name: criterion.name,
        total_sub_criteria: criterion.subCriteria.length,
        completed_sub_criteria: completed_count,
        is_complete: allComplete,
        can_submit: missing_fields.length === 0,
        missing_fields,
        warnings,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { validateSubmission };
