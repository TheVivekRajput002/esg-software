const enforceOrganization = (req, res, next) => {
  if (!req.body) req.body = {};
  if (!req.query) req.query = {};

  // If user is Platform Admin, allow them to view all or specify an organization via header/query
  if (req.role === 'platform_admin') {
    const requestedOrgId = req.headers['x-organization-id'] || req.query?.organizationId || req.body?.organizationId;
    if (requestedOrgId && requestedOrgId !== 'all') {
      req.organizationId = requestedOrgId;
    } else {
      req.organizationId = null; // null means platform-wide
    }
    return next();
  }

  // For Org Admin, ESG Manager, Auditor: strictly enforce their own organization
  if (!req.organizationId) {
    return res.status(403).json({
      success: false,
      message: 'User does not belong to any active organization'
    });
  }

  // Override any manual organizationId in body/query to guarantee tenant isolation
  if (!req.body) req.body = {};
  req.body.organizationId = req.organizationId;
  next();
};

module.exports = { enforceOrganization };
