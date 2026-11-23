const ReportingPeriod = require('../models/ReportingPeriod');

// @route   GET /api/v1/reporting-periods
const listReportingPeriods = async (req, res, next) => {
  try {
    const query = {
      $or: [{ organizationId: req.organizationId }, { organizationId: null }]
    };

    const periods = await ReportingPeriod.find(query).sort({ startDate: -1 });
    res.json({ success: true, data: periods });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/reporting-periods
const createReportingPeriod = async (req, res, next) => {
  try {
    const { periodName, startDate, endDate, isCurrent, status } = req.body;

    if (!periodName || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'periodName, startDate, and endDate are required' });
    }

    if (isCurrent) {
      // Clear previous current
      await ReportingPeriod.updateMany(
        { $or: [{ organizationId: req.organizationId }, { organizationId: null }] },
        { isCurrent: false }
      );
    }

    const period = await ReportingPeriod.create({
      organizationId: req.organizationId || null,
      periodName: periodName.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: Boolean(isCurrent),
      status: status || 'active'
    });

    res.status(201).json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReportingPeriods,
  createReportingPeriod
};
