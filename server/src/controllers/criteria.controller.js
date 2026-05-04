const { prisma } = require('../config/db');

/**
 * GET /api/criteria
 * List all 7 NAAC criteria with sub-criteria counts.
 */
async function listCriteria(req, res, next) {
  try {
    const criteria = await prisma.criterion.findMany({
      orderBy: { id: 'asc' },
      include: {
        subCriteria: {
          select: { id: true, code: true, name: true },
          orderBy: { code: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: criteria.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        max_marks: c.maxMarks,
        sub_criteria: c.subCriteria,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/criteria/:id
 * Get a single criterion with its sub-criteria.
 */
async function getCriterion(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid criterion ID.' });
    }

    const criterion = await prisma.criterion.findUnique({
      where: { id },
      include: {
        subCriteria: {
          select: { id: true, code: true, name: true, description: true },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!criterion) {
      return res.status(404).json({ success: false, message: 'Criterion not found.' });
    }

    res.json({
      success: true,
      data: {
        id: criterion.id,
        code: criterion.code,
        name: criterion.name,
        max_marks: criterion.maxMarks,
        sub_criteria: criterion.subCriteria,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCriteria, getCriterion };
