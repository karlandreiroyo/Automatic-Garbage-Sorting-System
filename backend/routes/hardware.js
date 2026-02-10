const express = require('express');
const router = express.Router();
const { getHardwareState } = require('../utils/hardwareStore');
router.get('/status', (req, res) => { try { res.json(getHardwareState()); } catch (err) { res.status(500).json({ error: err.message }); } });
module.exports = router;
