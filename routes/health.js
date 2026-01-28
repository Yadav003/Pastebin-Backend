
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/healthz', async (req, res) => {
  try {
    const dbConnected = await db.checkConnection();
    if (!dbConnected) {
      return res.status(503).json({ ok: false, error: 'Database unavailable' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(503).json({ ok: false, error: 'Health check failed' });
  }
});

module.exports = router;
