const Notification = require('../models/Notification');
const Component = require('../models/Component');
const TransactionLog = require('../models/TransactionLog');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query for user-specific notifications
    let query = {
      $or: [
        { recipient: req.user.id },
        { recipientRole: req.user.role }
      ],
      isArchived: false
    };

    // Filter by type
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

    // Filter by priority
    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    // Filter by read status
    if (req.query.read === 'true') {
      query.isRead = true;
    } else if (req.query.read === 'false') {
      query.isRead = false;
    }

    // Filter by action required
    if (req.query.actionRequired === 'true') {
      query.actionRequired = true;
      query.actionTaken = false;
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('relatedComponent', 'componentName partNumber')
      .populate('relatedTransaction', 'operationType quantity')
      .populate('readBy', 'name email')
      .populate('actionTakenBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Pagination result
    const pagination = {
      current: page,
      total: Math.ceil(total / limit),
      count: notifications.length,
      totalCount: total
    };

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      pagination,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('relatedComponent', 'componentName partNumber manufacturer location quantity criticalLowThreshold')
      .populate('relatedTransaction', 'operationType quantity reasonOrProject')
      .populate('readBy', 'name email role')
      .populate('actionTakenBy', 'name email role');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user has access to this notification
    const hasAccess = notification.recipient?.toString() === req.user.id ||
                     notification.recipientRole === req.user.role ||
                     req.user.role === 'Admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user has access to this notification
    const hasAccess = notification.recipient?.toString() === req.user.id ||
                     notification.recipientRole === req.user.role ||
                     req.user.role === 'Admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    // Mark as read using the instance method
    await notification.markRead(req.user.id);

    const updatedNotification = await Notification.findById(req.params.id)
      .populate('readBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/mark-read-bulk
// @access  Private
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const id of notificationIds) {
      try {
        const notification = await Notification.findById(id);
        
        if (!notification) {
          results.failed.push({ id, error: 'Notification not found' });
          continue;
        }

        // Check access
        const hasAccess = notification.recipient?.toString() === req.user.id ||
                         notification.recipientRole === req.user.role ||
                         req.user.role === 'Admin';

        if (!hasAccess) {
          results.failed.push({ id, error: 'Access denied' });
          continue;
        }

        await notification.markRead(req.user.id);
        results.successful.push(id);
      } catch (error) {
        results.failed.push({ id, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Marked ${results.successful.length} notifications as read`,
      data: results
    });
  } catch (error) {
    console.error('Mark multiple as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Archive notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
exports.archiveNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user has access to this notification
    const hasAccess = notification.recipient?.toString() === req.user.id ||
                     notification.recipientRole === req.user.role ||
                     req.user.role === 'Admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    notification.isArchived = true;
    notification.archivedAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification archived successfully',
      data: notification
    });
  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Take action on notification
// @route   PUT /api/notifications/:id/action
// @access  Private
exports.takeAction = async (req, res) => {
  try {
    const { actionData } = req.body;

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user has access to this notification
    const hasAccess = notification.recipient?.toString() === req.user.id ||
                     notification.recipientRole === req.user.role ||
                     req.user.role === 'Admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    if (!notification.actionRequired) {
      return res.status(400).json({
        success: false,
        message: 'This notification does not require action'
      });
    }

    if (notification.actionTaken) {
      return res.status(400).json({
        success: false,
        message: 'Action has already been taken on this notification'
      });
    }

    // Take action using the instance method
    await notification.takeAction(req.user.id);

    // Store additional action data if provided
    if (actionData) {
      notification.data = { ...notification.data, actionData };
      await notification.save();
    }

    const updatedNotification = await Notification.findById(req.params.id)
      .populate('actionTakenBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Action taken successfully',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Take action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
exports.getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.getStats(req.user.id, req.user.role);

    // Get additional statistics
    const totalNotifications = await Notification.countDocuments({
      $or: [
        { recipient: req.user.id },
        { recipientRole: req.user.role }
      ],
      isArchived: false
    });

    const notificationsByType = await Notification.aggregate([
      {
        $match: {
          $or: [
            { recipient: req.user._id },
            { recipientRole: req.user.role }
          ],
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: { $sum: { $cond: ['$isRead', 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const notificationsByPriority = await Notification.aggregate([
      {
        $match: {
          $or: [
            { recipient: req.user._id },
            { recipientRole: req.user.role }
          ],
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          unreadCount: { $sum: { $cond: ['$isRead', 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        totalNotifications,
        notificationsByType,
        notificationsByPriority
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create manual notification (Admin only)
// @route   POST /api/notifications
// @access  Private (Admin)
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      recipient,
      recipientRole,
      relatedComponent,
      relatedTransaction,
      data,
      actionRequired,
      expiresAt
    } = req.body;

    const notificationData = {
      title,
      message,
      type: type || 'system',
      priority: priority || 'medium',
      actionRequired: actionRequired || false
    };

    // Set recipient (either specific user or role)
    if (recipient) {
      notificationData.recipient = recipient;
    } else if (recipientRole) {
      notificationData.recipientRole = recipientRole;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either recipient or recipientRole must be specified'
      });
    }

    // Add optional fields
    if (relatedComponent) notificationData.relatedComponent = relatedComponent;
    if (relatedTransaction) notificationData.relatedTransaction = relatedTransaction;
    if (data) notificationData.data = data;
    if (expiresAt) notificationData.expiresAt = new Date(expiresAt);

    const notification = await Notification.create(notificationData);

    // Populate the created notification
    await notification.populate('relatedComponent', 'componentName partNumber');
    await notification.populate('relatedTransaction', 'operationType quantity');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all notifications (Admin only)
// @route   GET /api/notifications/all
// @access  Private (Admin)
exports.getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filter by type
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

    // Filter by priority
    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    // Filter by archived status
    if (req.query.archived === 'true') {
      query.isArchived = true;
    } else if (req.query.archived === 'false') {
      query.isArchived = false;
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('recipient', 'name email role')
      .populate('relatedComponent', 'componentName partNumber')
      .populate('relatedTransaction', 'operationType quantity')
      .populate('readBy', 'name email')
      .populate('actionTakenBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Pagination result
    const pagination = {
      current: page,
      total: Math.ceil(total / limit),
      count: notifications.length,
      totalCount: total
    };

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      pagination,
      data: notifications
    });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete notification (Admin only)
// @route   DELETE /api/notifications/:id
// @access  Private (Admin)
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cleanup expired notifications
// @route   DELETE /api/notifications/cleanup
// @access  Private (Admin)
exports.cleanupExpiredNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired notifications`
    });
  } catch (error) {
    console.error('Cleanup expired notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};