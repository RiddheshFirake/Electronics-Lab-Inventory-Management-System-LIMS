// Role-based access control middleware

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

// Check if user can manage components (add, edit, delete)
const canManageComponents = (req, res, next) => {
  const allowedRoles = ['Admin', 'Lab Technician'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to manage components. Required roles: ${allowedRoles.join(', ')}`
    });
  }

  next();
};

// Check if user can perform inward operations
const canInward = (req, res, next) => {
  const allowedRoles = ['Admin', 'Lab Technician'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to perform inward operations. Required roles: ${allowedRoles.join(', ')}`
    });
  }

  next();
};

// Check if user can perform outward operations
const canOutward = (req, res, next) => {
  const allowedRoles = ['Admin', 'Lab Technician', 'Manufacturing Engineer', 'Researcher'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to perform outward operations. Required roles: ${allowedRoles.join(', ')}`
    });
  }

  next();
};

// Check if user can view components (all users can view, but this is for consistency)
const canViewComponents = (req, res, next) => {
  const allowedRoles = ['Admin', 'User', 'Lab Technician', 'Researcher', 'Manufacturing Engineer'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to view components.`
    });
  }

  next();
};

// Check if user can manage users
const canManageUsers = (req, res, next) => {
  const allowedRoles = ['Admin'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to manage users. Admin privileges required.`
    });
  }

  next();
};

// Check if user can access dashboard/reports
const canAccessDashboard = (req, res, next) => {
  const allowedRoles = ['Admin', 'User', 'Lab Technician', 'Researcher', 'Manufacturing Engineer'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to access dashboard. Required roles: ${allowedRoles.join(', ')}`
    });
  }

  next();
};

// Middleware to check resource ownership or admin privileges
const checkOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login first.'
    });
  }

  // Admin can access everything
  if (req.user.role === 'Admin') {
    return next();
  }

  // For other users, check if they own the resource
  // This will be used in routes where req.params contains user ID
  const resourceUserId = req.params.userId || req.params.id;
  
  if (resourceUserId && resourceUserId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};

module.exports = {
  authorize,
  adminOnly,
  canManageComponents,
  canInward,
  canOutward,
  canViewComponents,
  canManageUsers,
  canAccessDashboard,
  checkOwnershipOrAdmin
};