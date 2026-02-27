/**
 * Admin role routes (admin panel).
 * Mounted at /api/admin in server.js
 */
const express = require('express');
const router = express.Router();

const adminWasteRoutes = require('./adminWaste');
const adminDataAnalyticsRoutes = require('./adminDataAnalytics');
const adminRecordedItemsRoutes = require('./adminRecordedItems');
const adminWasteDistributionRoutes = require('./adminWasteDistribution');
const adminCollectorsRoutes = require('./adminCollectors');

router.use('/waste-categories', adminWasteRoutes);
router.use('/data-analytics', adminDataAnalyticsRoutes);
router.use('/recorded-items', adminRecordedItemsRoutes);
router.use('/waste-distribution', adminWasteDistributionRoutes);
router.use('/', adminCollectorsRoutes);

module.exports = router;
