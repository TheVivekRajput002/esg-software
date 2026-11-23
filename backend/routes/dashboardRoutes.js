const express = require('express');
const router = express.Router();
const { getDashboardOverview, getDashboardTrends } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

router.get('/overview', getDashboardOverview);
router.get('/trends', getDashboardTrends);

module.exports = router;
