const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config/env');
const { logAuditAction } = require('../utils/auditLogger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

// @route   POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('roleId')
      .populate('organizationId');

    // Safe error message to avoid account harvesting
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your organization administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roleId.code,
          roleName: user.roleId.name,
          organization: user.organizationId
            ? {
                id: user.organizationId._id,
                name: user.organizationId.name,
                industry: user.organizationId.industry,
                country: user.organizationId.country
              }
            : null,
          title: user.title,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).populate('roleId').populate('organizationId');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const tokens = generateTokens(user._id);
    res.json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// @route   GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('roleId').populate('organizationId');
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleId.code,
        roleName: user.roleId.name,
        organization: user.organizationId
          ? {
              id: user.organizationId._id,
              name: user.organizationId.name,
              industry: user.organizationId.industry,
              country: user.organizationId.country
            }
          : null,
        title: user.title,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/logout
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  login,
  refresh,
  getMe,
  logout
};
