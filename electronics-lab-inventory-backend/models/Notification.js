const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: ['low_stock', 'old_stock', 'high_usage', 'system', 'approval_needed'],
      message: 'Type must be one of: low_stock, old_stock, high_usage, system, approval_needed'
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientRole: {
    type: String,
    enum: ['Admin', 'User', 'Lab Technician', 'Researcher', 'Manufacturing Engineer', 'All']
  },
  relatedComponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component'
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransactionLog'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from creation
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      return expiry;
    }
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionTakenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionTakenAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ relatedComponent: 1 });

// TTL index to automatically delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isRead: 1 });

// Static method to create low stock notification
notificationSchema.statics.createLowStockNotification = async function(component) {
  const notification = new this({
    title: `Low Stock Alert: ${component.componentName}`,
    message: `Component "${component.componentName}" (${component.partNumber}) has ${component.quantity} units remaining, which is below the critical threshold of ${component.criticalLowThreshold} units.`,
    type: 'low_stock',
    priority: 'high',
    recipientRole: 'Admin',
    relatedComponent: component._id,
    actionRequired: true,
    data: {
      currentQuantity: component.quantity,
      threshold: component.criticalLowThreshold,
      location: component.location,
      partNumber: component.partNumber
    }
  });

  return await notification.save();
};

// Static method to create old stock notification
notificationSchema.statics.createOldStockNotification = async function(component) {
  const monthsOld = component.lastOutwardMovement 
    ? Math.floor((new Date() - component.lastOutwardMovement) / (1000 * 60 * 60 * 24 * 30))
    : Math.floor((new Date() - component.createdAt) / (1000 * 60 * 60 * 24 * 30));

  const notification = new this({
    title: `Old Stock Alert: ${component.componentName}`,
    message: `Component "${component.componentName}" (${component.partNumber}) has had no outward movement for ${monthsOld} months. Consider reviewing if this stock is still needed.`,
    type: 'old_stock',
    priority: 'medium',
    recipientRole: 'Admin',
    relatedComponent: component._id,
    actionRequired: true,
    data: {
      monthsWithoutMovement: monthsOld,
      currentQuantity: component.quantity,
      location: component.location,
      partNumber: component.partNumber,
      lastOutwardMovement: component.lastOutwardMovement
    }
  });

  return await notification.save();
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadForUser = function(userId, userRole) {
  return this.find({
    $or: [
      { recipient: userId },
      { recipientRole: userRole },
      { recipientRole: 'All' }
    ],
    isRead: false,
    isArchived: false
  })
    .populate('relatedComponent', 'componentName partNumber quantity')
    .populate('relatedTransaction', 'operationType quantity')
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findByIdAndUpdate(
    notificationId,
    {
      isRead: true,
      readAt: new Date(),
      readBy: userId
    },
    { new: true }
  );
};

// Static method to get notification statistics
notificationSchema.statics.getStats = async function(userId, userRole) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { recipient: userId },
          { recipientRole: userRole },
          { recipientRole: 'All' }
        ],
        isArchived: false
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$isRead', false] }, 1, 0]
          }
        },
        actionRequired: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$actionRequired', true] }, { $eq: ['$actionTaken', false] }] },
              1,
              0
            ]
          }
        },
        critical: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0]
          }
        },
        high: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'high'] }, 1, 0]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    unread: 0,
    actionRequired: 0,
    critical: 0,
    high: 0
  };
};

// Instance method to mark as read
notificationSchema.methods.markRead = function(userId) {
  this.isRead = true;
  this.readAt = new Date();
  this.readBy = userId;
  return this.save();
};

// Instance method to take action
notificationSchema.methods.takeAction = function(userId) {
  this.actionTaken = true;
  this.actionTakenAt = new Date();
  this.actionTakenBy = userId;
  return this.save();
};

// Virtual for age of notification
notificationSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // Age in days
});

// Virtual for checking if notification is urgent
notificationSchema.virtual('isUrgent').get(function() {
  return ['high', 'critical'].includes(this.priority) && !this.isRead;
});

// Transform toJSON to include virtuals
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);