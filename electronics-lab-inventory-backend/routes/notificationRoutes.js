const express = require('express');
const {
  getNotifications,
  getNotification,
  markAsRead,
  markMultipleAsRead,
  archiveNotification,
  takeAction,
  getNotificationStats,
  createNotification,
  getAllNotifications,
  deleteNotification,
  cleanupExpiredNotifications
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// User notification routes
router.route('/')
  .get(getNotifications)
  .post(adminOnly, createNotification);

router.get('/stats', getNotificationStats);
router.put('/mark-read-bulk', markMultipleAsRead);

// Admin routes
router.get('/all', adminOnly, getAllNotifications);
router.delete('/cleanup', adminOnly, cleanupExpiredNotifications);

// Individual notification routes
router.route('/:id')
  .get(getNotification)
  .delete(adminOnly, deleteNotification);

router.put('/:id/read', markAsRead);
router.put('/:id/archive', archiveNotification);
router.put('/:id/action', takeAction);

module.exports = router;