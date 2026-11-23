const express = require('express');
const router = express.Router();
const {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', authorize('platform_admin', 'org_admin'), listUsers);
router.post('/', authorize('platform_admin', 'org_admin'), createUser);
router.get('/:id', getUserById);
router.patch('/:id', authorize('platform_admin', 'org_admin'), updateUser);
router.patch('/:id/status', authorize('platform_admin', 'org_admin'), updateUserStatus);

module.exports = router;
