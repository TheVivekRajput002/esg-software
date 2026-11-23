const express = require('express');
const router = express.Router();
const {
  listAudits,
  getAuditById,
  createAudit,
  updateAudit,
  getAuditFindings,
  createAuditFinding,
  updateAuditFinding,
  correctDataByAuditor,
  getAuditLogs
} = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

router.get('/', listAudits);
router.get('/logs', getAuditLogs);
router.get('/:id', getAuditById);
router.post('/', authorize('platform_admin', 'auditor'), createAudit);
router.patch('/:id', authorize('platform_admin', 'auditor'), updateAudit);

router.get('/:id/findings', getAuditFindings);
router.post('/:id/findings', authorize('platform_admin', 'auditor'), createAuditFinding);
router.patch('/findings/:findingId', authorize('platform_admin', 'auditor', 'org_admin'), updateAuditFinding);

router.post('/correct-data', authorize('platform_admin', 'auditor'), correctDataByAuditor);

module.exports = router;
