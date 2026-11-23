const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  getEnvironmentalAnalytics,
  getSocialAnalytics,
  getGovernanceAnalytics,
  getMetricTrends,
  exportAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

router.get('/overview', getAnalyticsOverview);
router.get('/environmental', getEnvironmentalAnalytics);
router.get('/social', getSocialAnalytics);
router.get('/governance', getGovernanceAnalytics);
router.get('/metrics/:id/trends', getMetricTrends);
router.post('/export', exportAnalytics);

module.exports = router;
