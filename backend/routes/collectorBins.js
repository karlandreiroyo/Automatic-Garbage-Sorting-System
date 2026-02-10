const express = require('express');
const router = express.Router();
const { getBinsState, setBinsState } = require('../utils/collectorBinStore');
router.get('/', (req, res) => { try { res.json({ bins: getBinsState() || [] }); } catch (err) { res.status(500).json({ error: err.message }); } });
router.post('/', (req, res) => {
  try {
    const bins = req.body?.bins;
    if (!Array.isArray(bins)) return res.status(400).json({ error: 'bins must be an array' });
    setBinsState(bins);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
