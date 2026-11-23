const mongoose = require('mongoose');

const validationRuleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null // null means platform-wide default rule
    },
    metricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgMetric',
      required: true
    },
    name: { type: String, required: true },
    ruleType: {
      type: String,
      enum: ['min_value', 'max_value', 'range', 'integer_only', 'positive_only', 'non_zero'],
      required: true
    },
    condition: {
      operator: { type: String, enum: ['gte', 'lte', 'between', 'integer', 'gt', 'ne'] },
      value: { type: Number },
      minValue: { type: Number },
      maxValue: { type: Number }
    },
    severity: {
      type: String,
      enum: ['error', 'warning'],
      default: 'error'
    },
    errorMessage: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

validationRuleSchema.index({ metricId: 1, isActive: 1 });

module.exports = mongoose.model('ValidationRule', validationRuleSchema);
