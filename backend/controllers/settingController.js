const Setting = require('../models/Setting');
const Organization = require('../models/Organization');

// @route   GET /api/v1/settings
const getSettings = async (req, res, next) => {
  try {
    let orgSettings = null;
    if (req.organizationId) {
      orgSettings = await Setting.findOne({ organizationId: req.organizationId, scope: 'organization' });
    }

    let userSettings = await Setting.findOne({ userId: req.user._id, scope: 'user' });

    res.json({
      success: true,
      data: {
        organization: orgSettings ? orgSettings.settings : { theme: 'emerald', validationStrictness: 'strict' },
        user: userSettings ? userSettings.settings : { theme: 'emerald', emailAlerts: true }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/settings
const updateSettings = async (req, res, next) => {
  try {
    const { scope = 'user', settings } = req.body;

    if (scope === 'organization') {
      if (req.role !== 'platform_admin' && req.role !== 'org_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      let orgSetting = await Setting.findOne({ organizationId: req.organizationId, scope: 'organization' });
      if (!orgSetting) {
        orgSetting = new Setting({ organizationId: req.organizationId, scope: 'organization', settings: {} });
      }
      orgSetting.settings = { ...orgSetting.settings, ...settings };
      await orgSetting.save();
      return res.json({ success: true, data: orgSetting.settings });
    }

    // User scope
    let userSetting = await Setting.findOne({ userId: req.user._id, scope: 'user' });
    if (!userSetting) {
      userSetting = new Setting({ userId: req.user._id, scope: 'user', settings: {} });
    }
    userSetting.settings = { ...userSetting.settings, ...settings };
    await userSetting.save();

    res.json({ success: true, data: userSetting.settings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
