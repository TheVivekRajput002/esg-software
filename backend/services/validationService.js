const ValidationRule = require('../models/ValidationRule');
const ValidationResult = require('../models/ValidationResult');
const EsgData = require('../models/EsgData');
const EsgSubmission = require('../models/EsgSubmission');
const { logAuditAction } = require('../utils/auditLogger');

/**
 * Evaluates a single record against an active rule without arbitrary code execution
 */
const evaluateRule = (value, rule) => {
  const { ruleType, condition } = rule;
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { passed: false, message: `Value must be a valid number` };
  }

  switch (ruleType) {
    case 'positive_only':
      if (numValue <= 0) {
        return { passed: false, message: rule.errorMessage || 'Value must be strictly positive (> 0)' };
      }
      break;

    case 'integer_only':
      if (!Number.isInteger(numValue)) {
        return { passed: false, message: rule.errorMessage || 'Value must be a whole integer' };
      }
      break;

    case 'min_value':
      if (condition && condition.value !== undefined && numValue < condition.value) {
        return { passed: false, message: rule.errorMessage || `Value cannot be lower than ${condition.value}` };
      }
      break;

    case 'max_value':
      if (condition && condition.value !== undefined && numValue > condition.value) {
        return { passed: false, message: rule.errorMessage || `Value cannot exceed ${condition.value}` };
      }
      break;

    case 'range':
      if (condition) {
        if (condition.minValue !== undefined && numValue < condition.minValue) {
          return { passed: false, message: rule.errorMessage || `Value cannot be lower than ${condition.minValue}` };
        }
        if (condition.maxValue !== undefined && numValue > condition.maxValue) {
          return { passed: false, message: rule.errorMessage || `Value cannot exceed ${condition.maxValue}` };
        }
      }
      break;

    case 'non_zero':
      if (numValue === 0) {
        return { passed: false, message: rule.errorMessage || 'Value cannot be zero' };
      }
      break;

    default:
      break;
  }

  return { passed: true };
};

/**
 * Validates all data items in an ESG submission
 */
const runValidationForSubmission = async (submissionId, userId, organizationId) => {
  const submission = await EsgSubmission.findById(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  const dataItems = await EsgData.find({ submissionId }).populate('metricId');

  // Clear previous validation results for this submission
  await ValidationResult.deleteMany({ submissionId });

  let hasErrors = false;
  let hasWarnings = false;
  const generatedResults = [];

  for (const item of dataItems) {
    // Find active validation rules applicable to this metric (org-scoped or global)
    const rules = await ValidationRule.find({
      metricId: item.metricId._id,
      isActive: true,
      $or: [{ organizationId: item.organizationId }, { organizationId: null }]
    });

    const itemErrors = [];
    const itemWarnings = [];

    // Built-in Level 1 basic check
    if (item.value === undefined || item.value === null || isNaN(item.value)) {
      itemErrors.push(`Metric "${item.metricId.name}" has invalid or missing numeric value`);
    }

    // Level 2 Business Rules evaluation
    for (const rule of rules) {
      const evalRes = evaluateRule(item.value, rule);
      if (!evalRes.passed) {
        if (rule.severity === 'warning') {
          itemWarnings.push(`[${rule.name}] ${evalRes.message}`);
          hasWarnings = true;
        } else {
          itemErrors.push(`[${rule.name}] ${evalRes.message}`);
          hasErrors = true;
        }
      }
    }

    const itemStatus = itemErrors.length > 0 ? 'failed' : itemWarnings.length > 0 ? 'warning' : 'passed';

    const resultDoc = await ValidationResult.create({
      submissionId,
      dataId: item._id,
      validationStatus: itemStatus,
      errors: itemErrors,
      warnings: itemWarnings,
      validatedBy: userId,
      validatedAt: new Date()
    });

    generatedResults.push(resultDoc);

    // Update item status
    item.status = itemErrors.length > 0 ? 'requires_correction' : 'validated';
    await item.save();
  }

  const prevSubStatus = submission.status;
  if (hasErrors) {
    submission.status = 'requires_correction';
    submission.validationStatus = 'failed';
  } else {
    submission.status = 'validated';
    submission.validationStatus = hasWarnings ? 'warnings' : 'passed';
  }

  await submission.save();

  // Non-destructive audit log
  await logAuditAction({
    organizationId,
    actorId: userId,
    resourceType: 'EsgSubmission',
    resourceId: submission._id,
    action: 'VALIDATE',
    previousValue: { status: prevSubStatus },
    newValue: { status: submission.status, validationStatus: submission.validationStatus },
    reason: `Automated validation run completed with ${hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'no issues'}`
  });

  return {
    success: true,
    hasErrors,
    hasWarnings,
    submissionStatus: submission.status,
    validationStatus: submission.validationStatus,
    results: generatedResults
  };
};

module.exports = {
  evaluateRule,
  runValidationForSubmission
};
