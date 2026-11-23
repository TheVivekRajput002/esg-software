const mongoose = require('mongoose');

const targetProgressSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgTarget',
      required: true
    },
    recordedValue: { type: Number, required: true },
    progressPercentage: { type: Number, required: true },
    note: { type: String, default: '' },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recordedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

targetProgressSchema.index({ targetId: 1, recordedAt: -1 });

module.exports = mongoose.model('TargetProgress', targetProgressSchema);
