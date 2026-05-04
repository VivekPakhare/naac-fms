const express = require('express');
const router = express.Router();

// ── Upload Routes (to be implemented) ────────────────────
// POST   /api/upload           — Upload a file
// GET    /api/upload/:id       — Download / view a file
// DELETE /api/upload/:id       — Delete a file

router.post('/', (_req, res) => {
  res.status(501).json({ message: 'Upload file — not implemented yet' });
});

router.get('/:id', (_req, res) => {
  res.status(501).json({ message: 'Get file — not implemented yet' });
});

router.delete('/:id', (_req, res) => {
  res.status(501).json({ message: 'Delete file — not implemented yet' });
});

module.exports = router;
