module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  req.tenantId = req.user.tenantId;
  next();
};