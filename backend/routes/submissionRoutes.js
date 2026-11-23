const express = require('express');
const router = express.Router();
const {
  listSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  submitForReview,
  approveSubmission,
  rejectSubmission,
  addOrUpdateDataItem,
  deleteDataItem
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

router.get('/', listSubmissions);
router.get('/:id', getSubmissionById);
router.post('/', authorize('platform_admin', 'org_admin', 'esg_manager'), createSubmission);
router.patch('/:id', authorize('platform_admin', 'org_admin', 'esg_manager'), updateSubmission);
router.post('/:id/submit', authorize('platform_admin', 'org_admin', 'esg_manager'), submitForReview);
router.post('/:id/approve', authorize('platform_admin', 'org_admin'), approveSubmission);
router.post('/:id/reject', authorize('platform_admin', 'org_admin', 'auditor'), rejectSubmission);
router.post('/:id/data', authorize('platform_admin', 'org_admin', 'esg_manager'), addOrUpdateDataItem);
router.delete('/:id/data/:dataId', authorize('platform_admin', 'org_admin', 'esg_manager'), deleteDataItem);

module.exports = router;
