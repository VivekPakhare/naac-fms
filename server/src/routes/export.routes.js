const express = require('express');
const router = express.Router();

// ── Export Routes (to be implemented) ────────────────────
// GET /api/export/pdf/:criterionId    — Export criterion data as PDF
// GET /api/export/excel/:criterionId  — Export criterion data as Excel

router.get('/pdf/:criterionId', (_req, res) => {
  res.status(501).json({ message: 'Export PDF — not implemented yet' });
});

router.get('/excel/:criterionId', (_req, res) => {
  res.status(501).json({ message: 'Export Excel — not implemented yet' });
});

module.exports = router;
