const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    dataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgData',
      required: true
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgSubmission',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    comments: { type: String, default: '' },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Verification', verificationSchema);
