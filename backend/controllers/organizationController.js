const Organization = require('../models/Organization');
const { logAuditAction } = require('../utils/auditLogger');

// @route   GET /api/v1/organizations
const listOrganizations = async (req, res, next) => {
  try {
    const query = {};
    if (req.role !== 'platform_admin') {
      query._id = req.organizationId;
    }

    const organizations = await Organization.find(query).sort({ name: 1 });
    res.json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/organizations/:id
const getOrganizationById = async (req, res, next) => {
  try {
    if (req.role !== 'platform_admin' && req.organizationId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/organizations
const createOrganization = async (req, res, next) => {
  try {
    const { name, industry, country, email, contactNumber, address, code } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Organization name is required' });
    }

    const org = await Organization.create({
      name: name.trim(),
      industry: industry || 'Manufacturing & Services',
      country: country || 'United States',
      email: email ? email.trim() : undefined,
      contactNumber,
      address,
      code: code ? code.trim().toUpperCase() : name.substring(0, 4).toUpperCase()
    });

    await logAuditAction({
      organizationId: org._id,
      actorId: req.user._id,
      resourceType: 'Organization',
      resourceId: org._id,
      action: 'CREATE',
      newValue: org.toObject(),
      reason: `Organization ${org.name} created`
    });

    res.status(201).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/organizations/:id
const updateOrganization = async (req, res, next) => {
  try {
    if (req.role !== 'platform_admin' && req.organizationId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const allowed = ['name', 'industry', 'country', 'email', 'contactNumber', 'address', 'status'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) org[f] = req.body[f];
    });

    await org.save();
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/organizations/:id (Controlled Soft Deletion / Archival)
const archiveOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    org.status = 'archived';
    await org.save();

    await logAuditAction({
      organizationId: org._id,
      actorId: req.user._id,
      resourceType: 'Organization',
      resourceId: org._id,
      action: 'STATUS_CHANGE',
      newValue: { status: 'archived' },
      reason: 'Organization archived'
    });

    res.json({ success: true, message: 'Organization safely archived' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  archiveOrganization
};
