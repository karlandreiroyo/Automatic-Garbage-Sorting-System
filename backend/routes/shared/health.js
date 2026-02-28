const express = require('express');
const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend login service is running' });
});

module.exports = { path: '/api/health', router };
