const mongoose = require('mongoose');

const esgCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['Environmental', 'Social', 'Governance']
    },
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['environmental', 'social', 'governance']
    },
    description: { type: String, default: '' },
    color: { type: String, default: '#10b981' },
    icon: { type: String, default: 'leaf' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EsgCategory', esgCategorySchema);
