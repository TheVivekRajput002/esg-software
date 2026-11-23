const express = require('express');
const router = express.Router();
const {
  listTargets,
  getTargetById,
  createTarget,
  updateTarget,
  recordTargetProgress
} = require('../controllers/targetController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

router.get('/', listTargets);
router.get('/:id', getTargetById);
router.post('/', authorize('platform_admin', 'org_admin', 'esg_manager'), createTarget);
router.patch('/:id', authorize('platform_admin', 'org_admin'), updateTarget);
router.post('/:id/progress', authorize('platform_admin', 'org_admin', 'esg_manager'), recordTargetProgress);

module.exports = router;
