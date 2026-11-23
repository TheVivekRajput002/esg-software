const express = require('express');
const router = express.Router();
const {
  listReports,
  generateReport,
  getReportById,
  downloadReport
} = require('../controllers/reportingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

router.get('/', listReports);
router.post('/generate', authorize('platform_admin', 'org_admin', 'esg_manager'), generateReport);
router.get('/:id', getReportById);
router.get('/:id/download', downloadReport);

module.exports = router;
