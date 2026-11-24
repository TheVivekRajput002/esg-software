const mongoose = require('mongoose');

const esgReportSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    periodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReportingPeriod',
      required: true
    },
    reportName: { type: String, required: true },
    reportType: {
      type: String,
      enum: ['Comprehensive ESG', 'Environmental Focus', 'Social Responsibility', 'Corporate Governance', 'Executive Summary'],
      default: 'Comprehensive ESG'
    },
    format: { type: String, enum: ['json', 'pdf', 'csv', 'markdown', 'txt'], default: 'markdown' },
    sections: [{ type: String }],
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'completed'
    },
    fileUrl: { type: String, default: '' },
    summaryData: { type: Object, default: {} },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

esgReportSchema.index({ organizationId: 1, periodId: 1 });

module.exports = mongoose.model('EsgReport', esgReportSchema);
