const mongoose = require('mongoose');

const esgMetricSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgCategory',
      required: true
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, default: '' },
    unit: { type: String, required: true, trim: true }, // e.g. MWh, MT CO2e, %, Hours, Count
    isKPI: { type: Boolean, default: false },
    calculationMethod: {
      type: String,
      enum: ['sum', 'average', 'percentage', 'count', 'latest'],
      default: 'sum'
    },
    // Direction for targets: whether a lower value is better (e.g. emissions) or higher is better (e.g. training hours, diversity)
    preferredDirection: {
      type: String,
      enum: ['lower', 'higher'],
      default: 'lower'
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

esgMetricSchema.index({ categoryId: 1, name: 1 });

module.exports = mongoose.model('EsgMetric', esgMetricSchema);
