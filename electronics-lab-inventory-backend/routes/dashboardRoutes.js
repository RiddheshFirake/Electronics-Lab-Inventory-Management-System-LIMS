const express = require('express');
const {
  getDashboardOverview,
  getMonthlyStats,
  getDailyTrends,
  getTopComponents,
  getUserActivity,
  getInventoryAlerts,
  getSystemStats
} = require('../controllers/dashboardController');

const { protect } = require('../middleware/authMiddleware');
const {
  canAccessDashboard,
  adminOnly
} = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Dashboard routes (require dashboard access)
router.get('/overview', canAccessDashboard, getDashboardOverview);
router.get('/monthly-stats', canAccessDashboard, getMonthlyStats);
router.get('/daily-trends', canAccessDashboard, getDailyTrends);
router.get('/top-components', canAccessDashboard, getTopComponents);
router.get('/alerts', canAccessDashboard, getInventoryAlerts);

// Admin only routes
router.get('/user-activity', adminOnly, getUserActivity);
router.get('/system-stats', adminOnly, getSystemStats);

module.exports = router;