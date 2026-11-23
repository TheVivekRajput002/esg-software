const express = require('express');
const router = express.Router();
const {
  getValidationQueue,
  getSubmissionForValidation,
  confirmSubmissionValidation,
  flagSubmissionCorrection,
  toggleItemValidation,
  runValidation,
  getValidationResults,
  listValidationRules,
  createValidationRule,
  updateValidationRule
} = require('../controllers/validationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { enforceOrganization } = require('../middleware/organizationMiddleware');

router.use(protect);
router.use(enforceOrganization);

// Manual Validation Queue & Verification
router.get('/queue', getValidationQueue);
router.get('/submission/:id', getSubmissionForValidation);
router.post('/submission/:id/confirm', authorize('platform_admin', 'org_admin', 'esg_manager'), confirmSubmissionValidation);
router.post('/submission/:id/flag', authorize('platform_admin', 'org_admin', 'esg_manager'), flagSubmissionCorrection);
router.post('/item/:dataId/toggle', authorize('platform_admin', 'org_admin', 'esg_manager'), toggleItemValidation);

// Automated Rule compatibility endpoints
router.post('/run', runValidation);
router.get('/results/:id', getValidationResults);
router.get('/rules', listValidationRules);
router.post('/rules', authorize('platform_admin', 'org_admin'), createValidationRule);
router.patch('/rules/:id', authorize('platform_admin', 'org_admin'), updateValidationRule);

module.exports = router;
