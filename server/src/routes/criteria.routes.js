const express = require('express');
const router = express.Router();

// ── Criteria Routes (to be implemented) ──────────────────
// GET  /api/criteria           — List all 7 criteria
// GET  /api/criteria/:id       — Get criterion with sub-criteria
// GET  /api/criteria/:id/sub   — Get sub-criteria for a criterion

router.get('/', (_req, res) => {
  res.status(501).json({ message: 'List criteria — not implemented yet' });
});

router.get('/:id', (_req, res) => {
  res.status(501).json({ message: 'Get criterion — not implemented yet' });
});

router.get('/:id/sub', (_req, res) => {
  res.status(501).json({ message: 'Get sub-criteria — not implemented yet' });
});

module.exports = router;
