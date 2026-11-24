const Role = require('../models/Role');
const User = require('../models/User');
const { logAuditAction } = require('../utils/auditLogger');

// @route   GET /api/v1/roles
const listRoles = async (req, res, next) => {
  try {
    const query = {
      $or: [{ organizationId: null }, { isSystemRole: true }]
    };

    if (req.organizationId) {
      query.$or.push({ organizationId: req.organizationId });
    }

    const roles = await Role.find(query).sort({ isSystemRole: -1, createdAt: 1 });
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/roles
const createRole = async (req, res, next) => {
  try {
    const { name, code, description, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const formattedCode = (code || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');

    // Check if role code exists within the organization or system roles
    const existing = await Role.findOne({
      code: formattedCode,
      $or: [{ organizationId: null }, { organizationId: req.organizationId }]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A role with this identifier already exists' });
    }

    const targetOrgId = req.role === 'platform_admin' ? (req.body.organizationId || null) : req.organizationId;

    const role = await Role.create({
      organizationId: targetOrgId,
      name: name.trim(),
      code: formattedCode,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
      isSystemRole: false
    });

    await logAuditAction({
      organizationId: targetOrgId || req.organizationId,
      actorId: req.user._id,
      resourceType: 'Role',
      resourceId: role._id,
      action: 'CREATE',
      newValue: { name: role.name, code: role.code, permissionsCount: role.permissions.length },
      reason: `Custom role ${role.name} created`
    });

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/roles/:id
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const { name, description, permissions } = req.body;
    if (name) role.name = name.trim();
    if (description !== undefined) role.description = description;
    if (permissions !== undefined && Array.isArray(permissions)) {
      role.permissions = permissions;
    }

    await role.save();

    res.json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/roles/:id
const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, message: 'System standard roles cannot be deleted' });
    }

    // Check if any user is assigned to this role
    const assignedUsers = await User.countDocuments({ roleId: role._id });
    if (assignedUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role: Assigned to ${assignedUsers} active user(s). Reassign them first.`
      });
    }

    await Role.findByIdAndDelete(role._id);

    res.json({ success: true, message: 'Role removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole
};
