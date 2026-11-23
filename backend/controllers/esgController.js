const EsgCategory = require('../models/EsgCategory');
const EsgMetric = require('../models/EsgMetric');
const EsgData = require('../models/EsgData');

// @route   GET /api/v1/esg/categories
const listCategories = async (req, res, next) => {
  try {
    const categories = await EsgCategory.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/esg/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, code, description, color, icon } = req.body;
    const category = await EsgCategory.create({ name, code, description, color, icon });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/esg/metrics
const listMetrics = async (req, res, next) => {
  try {
    const { categoryId, isKPI, status = 'active' } = req.query;
    const query = {};

    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }

    if (isKPI !== undefined && isKPI !== '') {
      query.isKPI = isKPI === 'true';
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const metrics = await EsgMetric.find(query)
      .populate('categoryId', 'name code color icon')
      .sort({ name: 1 });

    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/esg/metrics/:id
const getMetricById = async (req, res, next) => {
  try {
    const metric = await EsgMetric.findById(req.params.id).populate('categoryId');
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Metric not found' });
    }
    res.json({ success: true, data: metric });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/esg/metrics
const createMetric = async (req, res, next) => {
  try {
    const { categoryId, name, code, description, unit, isKPI, calculationMethod, preferredDirection } = req.body;

    if (!categoryId || !name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Category, Metric Name, and Unit are mandatory'
      });
    }

    const metric = await EsgMetric.create({
      categoryId,
      name: name.trim(),
      code: code ? code.trim() : name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      description: description || '',
      unit: unit.trim(),
      isKPI: Boolean(isKPI),
      calculationMethod: calculationMethod || 'sum',
      preferredDirection: preferredDirection || 'lower'
    });

    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/esg/metrics/:id
const updateMetric = async (req, res, next) => {
  try {
    const metric = await EsgMetric.findById(req.params.id);
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Metric not found' });
    }

    const allowed = ['name', 'description', 'unit', 'isKPI', 'calculationMethod', 'preferredDirection', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        metric[field] = req.body[field];
      }
    });

    await metric.save();
    res.json({ success: true, data: metric });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCategories,
  createCategory,
  listMetrics,
  getMetricById,
  createMetric,
  updateMetric
};
