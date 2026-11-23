const mongoose = require('mongoose');

const esgTargetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    metricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgMetric',
      required: true
    },
    targetName: { type: String, required: true },
    baselineValue: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: null },
    progressPercentage: { type: Number, default: 0 },
    unit: { type: String, required: true },
    direction: {
      type: String,
      enum: ['higher_is_better', 'lower_is_better'],
      default: 'lower_is_better'
    },
    startDate: { type: Date, required: true },
    targetDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Not Started', 'On Track', 'At Risk', 'Achieved', 'Overdue'],
      default: 'Not Started'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

esgTargetSchema.index({ organizationId: 1, metricId: 1 });

module.exports = mongoose.model('EsgTarget', esgTargetSchema);
