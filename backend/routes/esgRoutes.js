const express = require('express');
const router = express.Router();
const {
  listCategories,
  createCategory,
  listMetrics,
  getMetricById,
  createMetric,
  updateMetric
} = require('../controllers/esgController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/categories', listCategories);
router.post('/categories', authorize('platform_admin'), createCategory);

router.get('/metrics', listMetrics);
router.get('/metrics/:id', getMetricById);
router.post('/metrics', authorize('platform_admin', 'org_admin'), createMetric);
router.patch('/metrics/:id', authorize('platform_admin', 'org_admin'), updateMetric);

module.exports = router;
