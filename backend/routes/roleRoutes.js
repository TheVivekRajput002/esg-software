const express = require('express');
const router = express.Router();
const {
  listRoles,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', listRoles);
router.post('/', authorize('platform_admin', 'org_admin'), createRole);
router.patch('/:id', authorize('platform_admin', 'org_admin'), updateRole);
router.delete('/:id', authorize('platform_admin', 'org_admin'), deleteRole);

module.exports = router;
