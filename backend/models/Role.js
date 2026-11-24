const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    description: { type: String, default: '' },
    permissions: [
      {
        module: { type: String, required: true },
        actions: [{ type: String }]
      }
    ],
    isSystemRole: { type: Boolean, default: false }
  },
  { timestamps: true }
);

roleSchema.index({ organizationId: 1, code: 1 });

module.exports = mongoose.model('Role', roleSchema);
