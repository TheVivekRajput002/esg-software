const express = require('express');
const router = express.Router();
const { listReportingPeriods, createReportingPeriod } = require('../controllers/reportingPeriodController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', listReportingPeriods);
router.post('/', authorize('platform_admin', 'org_admin'), createReportingPeriod);

module.exports = router;
