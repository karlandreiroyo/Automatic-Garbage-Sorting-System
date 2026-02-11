'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const requireAuth = require('../../middleware/requireAuth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'Access denied' });
    const role = (userRow.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') return res.status(403).json({ success: false, message: 'Admin access required' });

    const binId = req.query.bin_id;
    if (binId == null || binId === '') return res.status(400).json({ success: false, message: 'bin_id is required' });

    const binIdVal = typeof binId === 'number' ? binId : (/^\d+$/.test(String(binId).trim()) ? parseInt(binId, 10) : binId);
    const category = req.query.category;

    let query = supabase
      .from('waste_items')
      .select('id, category, processing_time, created_at')
      .eq('bin_id', binIdVal)
      .order('created_at', { ascending: false })
      .limit(100);
    if (category && String(category).trim()) {
      const cat = String(category).trim();
      if (cat === 'Non Biodegradable' || cat === 'Non-Bio') query = query.or('category.eq.Non Biodegradable,category.eq.Non-Bio');
      else if (cat === 'Recycle' || cat === 'Recyclable') query = query.or('category.eq.Recyclable,category.eq.Recycle');
      else query = query.eq('category', cat);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('admin recorded-items route error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
