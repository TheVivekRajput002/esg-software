const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scope: {
      type: String,
      enum: ['organization', 'user', 'platform'],
      required: true
    },
    settings: {
      theme: { type: String, default: 'emerald' }, // 'emerald' | 'red_pulse' | 'slate'
      fiscalYearStartMonth: { type: Number, default: 4 }, // April
      defaultCurrency: { type: String, default: 'USD' },
      emailAlerts: { type: Boolean, default: true },
      validationStrictness: { type: String, enum: ['strict', 'lenient'], default: 'strict' },
      customMeta: { type: Object, default: {} }
    }
  },
  { timestamps: true }
);

settingSchema.index({ organizationId: 1, scope: 1 });
settingSchema.index({ userId: 1, scope: 1 });

module.exports = mongoose.model('Setting', settingSchema);
