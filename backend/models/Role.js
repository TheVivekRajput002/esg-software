const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['Platform Admin', 'Organization Admin', 'ESG Manager', 'Auditor']
    },
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['platform_admin', 'org_admin', 'esg_manager', 'auditor']
    },
    description: { type: String },
    permissions: [
      {
        module: { type: String, required: true },
        actions: [{ type: String }]
      }
    ],
    isSystemRole: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
