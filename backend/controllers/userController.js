const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const { logAuditAction } = require('../utils/auditLogger');

// @route   GET /api/v1/users
const listUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.role !== 'platform_admin') {
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId && req.query.organizationId !== 'all') {
      query.organizationId = req.query.organizationId;
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const users = await User.find(query)
      .populate('roleId', 'name code')
      .populate('organizationId', 'name')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, roleCode, organizationId, title, department } = req.body;

    if (!name || !email || !password || !roleCode) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const role = await Role.findOne({ code: roleCode });
    if (!role) {
      return res.status(400).json({ success: false, message: 'Invalid role code' });
    }

    const targetOrgId = req.role === 'platform_admin' ? organizationId : req.organizationId;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      organizationId: targetOrgId || null,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      roleId: role._id,
      title: title || '',
      department: department || '',
      status: 'active'
    });

    const populated = await User.findById(user._id).populate('roleId', 'name code').select('-passwordHash');

    await logAuditAction({
      organizationId: targetOrgId || req.organizationId,
      actorId: req.user._id,
      resourceType: 'User',
      resourceId: user._id,
      action: 'CREATE',
      newValue: { email: user.email, role: role.code },
      reason: `User account created for ${user.name}`
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('roleId', 'name code')
      .populate('organizationId', 'name')
      .select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, title, department, roleCode, password } = req.body;
    if (name) user.name = name.trim();
    if (title !== undefined) user.title = title;
    if (department !== undefined) user.department = department;

    if (roleCode && req.role === 'platform_admin') {
      const role = await Role.findOne({ code: roleCode });
      if (role) user.roleId = role._id;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();
    const updated = await User.findById(user._id).populate('roleId', 'name code').select('-passwordHash');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, message: `User status changed to ${status}`, data: { id: user._id, status } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus
};
