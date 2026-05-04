const { prisma } = require('../config/db');

/**
 * Get a teacher's form submission for a specific sub-criterion.
 */
async function getFormBySubCriteria(teacherId, subCriteriaCode) {
  const subCriterion = await prisma.subCriterion.findUnique({
    where: { code: subCriteriaCode },
    include: { criterion: { select: { id: true, code: true, name: true } } },
  });

  if (!subCriterion) {
    throw Object.assign(new Error('Sub-criterion not found.'), { status: 404 });
  }

  const submission = await prisma.formSubmission.findFirst({
    where: { teacherId, subCriteriaId: subCriterion.id },
    include: {
      documents: {
        select: {
          id: true,
          originalFilename: true,
          fileType: true,
          fileSize: true,
          uploadStatus: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  return {
    sub_criterion: {
      id: subCriterion.id,
      code: subCriterion.code,
      name: subCriterion.name,
      description: subCriterion.description,
      criterion: subCriterion.criterion,
    },
    submission: submission
      ? {
          id: submission.id,
          form_data: submission.formData,
          status: submission.status,
          hod_comment: submission.hodComment,
          submitted_at: submission.submittedAt,
          updated_at: submission.updatedAt,
          documents: submission.documents,
        }
      : null,
  };
}

/**
 * Save or update a form submission (draft or submit).
 */
async function saveForm(teacherId, subCriteriaCode, formData, action = 'draft') {
  const subCriterion = await prisma.subCriterion.findUnique({
    where: { code: subCriteriaCode },
  });

  if (!subCriterion) {
    throw Object.assign(new Error('Sub-criterion not found.'), { status: 404 });
  }

  // Check if submission already exists
  const existing = await prisma.formSubmission.findFirst({
    where: { teacherId, subCriteriaId: subCriterion.id },
  });

  // Don't allow editing submitted/verified forms
  if (existing && (existing.status === 'submitted' || existing.status === 'verified')) {
    throw Object.assign(
      new Error(`Form is already ${existing.status}. Cannot edit.`),
      { status: 400 }
    );
  }

  const status = action === 'submit' ? 'submitted' : 'draft';
  const submittedAt = action === 'submit' ? new Date() : null;

  let submission;

  if (existing) {
    submission = await prisma.formSubmission.update({
      where: { id: existing.id },
      data: {
        formData,
        status,
        submittedAt: submittedAt || existing.submittedAt,
        hodComment: status === 'draft' ? existing.hodComment : null,
      },
    });
  } else {
    submission = await prisma.formSubmission.create({
      data: {
        teacherId,
        subCriteriaId: subCriterion.id,
        formData,
        status,
        submittedAt,
      },
    });
  }

  // Log activity
  const actionLabel = action === 'submit' ? 'SUBMITTED_FORM' : 'SAVED_DRAFT';
  await prisma.activityLog.create({
    data: {
      userId: teacherId,
      action: actionLabel,
      targetType: 'form_submission',
      targetId: submission.id,
      description: `${actionLabel === 'SUBMITTED_FORM' ? 'Submitted' : 'Saved draft for'} sub-criterion ${subCriteriaCode}`,
    },
  });

  return {
    id: submission.id,
    form_data: submission.formData,
    status: submission.status,
    submitted_at: submission.submittedAt,
    updated_at: submission.updatedAt,
  };
}

/**
 * Update an existing form submission by ID.
 */
async function updateForm(teacherId, submissionId, formData, action = 'draft') {
  const existing = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: { subCriterion: { select: { code: true } } },
  });

  if (!existing) {
    throw Object.assign(new Error('Submission not found.'), { status: 404 });
  }

  if (existing.teacherId !== teacherId) {
    throw Object.assign(new Error('You can only edit your own submissions.'), { status: 403 });
  }

  if (existing.status === 'submitted' || existing.status === 'verified') {
    throw Object.assign(
      new Error(`Form is already ${existing.status}. Cannot edit.`),
      { status: 400 }
    );
  }

  const status = action === 'submit' ? 'submitted' : 'draft';

  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      formData,
      status,
      submittedAt: action === 'submit' ? new Date() : existing.submittedAt,
    },
  });

  return {
    id: submission.id,
    form_data: submission.formData,
    status: submission.status,
    submitted_at: submission.submittedAt,
    updated_at: submission.updatedAt,
  };
}

module.exports = { getFormBySubCriteria, saveForm, updateForm };
