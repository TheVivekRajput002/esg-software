const mongoose = require('mongoose');

const validationResultSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgSubmission',
      required: true
    },
    dataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgData'
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ValidationRule'
    },
    validationStatus: {
      type: String,
      enum: ['passed', 'failed', 'warning'],
      required: true
    },
    errors: [{ type: String }],
    warnings: [{ type: String }],
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

validationResultSchema.index({ submissionId: 1 });

module.exports = mongoose.model('ValidationResult', validationResultSchema);
