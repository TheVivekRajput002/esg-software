const express = require('express');
const router = express.Router();
const {
  listOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  archiveOrganization
} = require('../controllers/organizationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', listOrganizations);
router.get('/:id', getOrganizationById);
router.post('/', authorize('platform_admin'), createOrganization);
router.patch('/:id', authorize('platform_admin', 'org_admin'), updateOrganization);
router.delete('/:id', authorize('platform_admin'), archiveOrganization);

module.exports = router;
