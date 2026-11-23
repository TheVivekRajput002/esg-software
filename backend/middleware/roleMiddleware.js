const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role [${req.role}] is not authorized to access this resource`
      });
    }

    next();
  };
};

module.exports = { authorize };
