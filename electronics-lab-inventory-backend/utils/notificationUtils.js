const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Component = require('../models/Component');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Email transporter configuration
let emailTransporter = null;

// Initialize email transporter if email credentials are provided
const initializeEmailTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify email configuration
    emailTransporter.verify((error, success) => {
      if (error) {
        console.log('Email configuration error:', error);
        emailTransporter = null;
      } else {
        console.log('Email server is ready to take our messages');
      }
    });
  }
};

/**
 * Create a low stock notification
 * @param {Object} component - Component object
 * @returns {Promise<Object>} Created notification
 */
const createLowStockNotification = async (component) => {
  try {
    // Check if similar notification already exists and is unread
    const existingNotification = await Notification.findOne({
      type: 'low_stock',
      relatedComponent: component._id,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (existingNotification) {
      console.log(`Low stock notification already exists for component: ${component.partNumber}`);
      return existingNotification;
    }

    const notification = await Notification.createLowStockNotification(component);
    
    // Send email notification to admins
    await sendEmailNotification('low_stock', notification, component);
    
    console.log(`Low stock notification created for component: ${component.partNumber}`);
    return notification;
  } catch (error) {
    console.error('Error creating low stock notification:', error);
    throw error;
  }
};

/**
 * Create an old stock notification
 * @param {Object} component - Component object
 * @returns {Promise<Object>} Created notification
 */
const createOldStockNotification = async (component) => {
  try {
    // Check if similar notification already exists and is unread
    const existingNotification = await Notification.findOne({
      type: 'old_stock',
      relatedComponent: component._id,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    if (existingNotification) {
      console.log(`Old stock notification already exists for component: ${component.partNumber}`);
      return existingNotification;
    }

    const notification = await Notification.createOldStockNotification(component);
    
    // Send email notification to admins
    await sendEmailNotification('old_stock', notification, component);
    
    console.log(`Old stock notification created for component: ${component.partNumber}`);
    return notification;
  } catch (error) {
    console.error('Error creating old stock notification:', error);
    throw error;
  }
};

/**
 * Create a high usage notification
 * @param {Object} component - Component object
 * @param {Object} usageData - Usage statistics
 * @returns {Promise<Object>} Created notification
 */
const createHighUsageNotification = async (component, usageData) => {
  try {
    const notification = new Notification({
      title: `High Usage Alert: ${component.componentName}`,
      message: `Component "${component.componentName}" (${component.partNumber}) has unusually high usage. ${usageData.quantity} units used in the last ${usageData.period}.`,
      type: 'high_usage',
      priority: 'medium',
      recipientRole: 'Admin',
      relatedComponent: component._id,
      data: {
        usageQuantity: usageData.quantity,
        usagePeriod: usageData.period,
        currentQuantity: component.quantity,
        partNumber: component.partNumber
      }
    });

    await notification.save();
    
    // Send email notification
    await sendEmailNotification('high_usage', notification, component);
    
    console.log(`High usage notification created for component: ${component.partNumber}`);
    return notification;
  } catch (error) {
    console.error('Error creating high usage notification:', error);
    throw error;
  }
};

/**
 * Create a system notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} priority - Notification priority
 * @param {string} recipientRole - Target role
 * @returns {Promise<Object>} Created notification
 */
const createSystemNotification = async (title, message, priority = 'medium', recipientRole = 'All') => {
  try {
    const notification = new Notification({
      title,
      message,
      type: 'system',
      priority,
      recipientRole,
      data: {
        timestamp: new Date(),
        system: true
      }
    });

    await notification.save();
    console.log(`System notification created: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Send email notification
 * @param {string} type - Notification type
 * @param {Object} notification - Notification object
 * @param {Object} component - Component object (optional)
 */
const sendEmailNotification = async (type, notification, component = null) => {
  if (!emailTransporter) {
    console.log('Email transporter not configured, skipping email notification');
    return;
  }

  try {
    // Get admin users for email notifications
    const adminUsers = await User.find({ 
      role: 'Admin', 
      isActive: true,
      emailNotifications: { $ne: false } // Allow users to opt out
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found for email notifications');
      return;
    }

    const recipients = adminUsers.map(user => user.email).join(', ');

    let subject, htmlContent;

    switch (type) {
      case 'low_stock':
        subject = `🚨 Low Stock Alert - ${component.componentName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Low Stock Alert</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>${component.componentName}</h3>
              <p><strong>Part Number:</strong> ${component.partNumber}</p>
              <p><strong>Current Quantity:</strong> ${component.quantity}</p>
              <p><strong>Critical Threshold:</strong> ${component.criticalLowThreshold}</p>
              <p><strong>Location:</strong> ${component.location}</p>
              <p><strong>Category:</strong> ${component.category}</p>
            </div>
            <p style="color: #dc3545; font-weight: bold;">
              Action Required: Please reorder this component as it has fallen below the critical threshold.
            </p>
            <hr>
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated notification from Electronics Lab Inventory Management System.
            </p>
          </div>
        `;
        break;

      case 'old_stock':
        subject = `📦 Old Stock Alert - ${component.componentName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107;">Old Stock Alert</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>${component.componentName}</h3>
              <p><strong>Part Number:</strong> ${component.partNumber}</p>
              <p><strong>Current Quantity:</strong> ${component.quantity}</p>
              <p><strong>Location:</strong> ${component.location}</p>
              <p><strong>Last Movement:</strong> ${component.lastOutwardMovement ? component.lastOutwardMovement.toLocaleDateString() : 'Never'}</p>
            </div>
            <p style="color: #856404;">
              This component has had no outward movement for over 3 months. Consider reviewing if this stock is still needed.
            </p>
            <hr>
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated notification from Electronics Lab Inventory Management System.
            </p>
          </div>
        `;
        break;

      case 'high_usage':
        subject = `📈 High Usage Alert - ${component.componentName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17a2b8;">High Usage Alert</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>${component.componentName}</h3>
              <p><strong>Part Number:</strong> ${component.partNumber}</p>
              <p><strong>Current Quantity:</strong> ${component.quantity}</p>
              <p><strong>Usage Data:</strong> ${notification.data.usageQuantity} units in ${notification.data.usagePeriod}</p>
            </div>
            <p style="color: #0c5460;">
              This component is experiencing higher than normal usage. Monitor stock levels closely.
            </p>
            <hr>
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated notification from Electronics Lab Inventory Management System.
            </p>
          </div>
        `;
        break;

      default:
        subject = notification.title;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <hr>
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated notification from Electronics Lab Inventory Management System.
            </p>
          </div>
        `;
    }

    const mailOptions = {
      from: `"Lab Inventory System" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: subject,
      html: htmlContent
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Email notification sent successfully for ${type}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

/**
 * Check for low stock components and create notifications
 */
const checkLowStockComponents = async () => {
  try {
    console.log('Checking for low stock components...');
    
    const lowStockComponents = await Component.findLowStock();
    
    for (const component of lowStockComponents) {
      await createLowStockNotification(component);
    }
    
    console.log(`Checked ${lowStockComponents.length} low stock components`);
  } catch (error) {
    console.error('Error checking low stock components:', error);
  }
};

/**
 * Check for old stock components and create notifications
 */
const checkOldStockComponents = async () => {
  try {
    console.log('Checking for old stock components...');
    
    const oldStockComponents = await Component.findOldStock();
    
    for (const component of oldStockComponents) {
      await createOldStockNotification(component);
    }
    
    console.log(`Checked ${oldStockComponents.length} old stock components`);
  } catch (error) {
    console.error('Error checking old stock components:', error);
  }
};

/**
 * Clean up old notifications (older than 30 days and read)
 */
const cleanupOldNotifications = async () => {
  try {
    console.log('Cleaning up old notifications...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      isRead: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
  }
};

/**
 * Generate notification summary for dashboard
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Notification summary
 */
const getNotificationSummary = async (userId, userRole) => {
  try {
    const stats = await Notification.getStats(userId, userRole);
    
    // Get recent critical notifications
    const criticalNotifications = await Notification.find({
      $or: [
        { recipient: userId },
        { recipientRole: userRole },
        { recipientRole: 'All' }
      ],
      priority: 'critical',
      isRead: false,
      isArchived: false
    })
      .populate('relatedComponent', 'componentName partNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      stats,
      criticalNotifications
    };
  } catch (error) {
    console.error('Error getting notification summary:', error);
    throw error;
  }
};

/**
 * Start the notification scheduler
 */
const startNotificationScheduler = () => {
  console.log('Starting notification scheduler...');
  
  // Initialize email transporter
  initializeEmailTransporter();

  // Check for low stock every 4 hours
  cron.schedule('0 */4 * * *', () => {
    console.log('Running scheduled low stock check...');
    checkLowStockComponents();
  });

  // Check for old stock daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled old stock check...');
    checkOldStockComponents();
  });

  // Clean up old notifications daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('Running scheduled notification cleanup...');
    cleanupOldNotifications();
  });

  // Send daily summary to admins at 8 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Sending daily notification summary...');
      
      const lowStockCount = await Component.countDocuments({
        $expr: { $lte: ['$quantity', '$criticalLowThreshold'] },
        status: 'Active'
      });

      const oldStockCount = await Component.findOldStock().countDocuments();

      if (lowStockCount > 0 || oldStockCount > 0) {
        await createSystemNotification(
          'Daily Inventory Summary',
          `Daily inventory summary: ${lowStockCount} components are below critical threshold, ${oldStockCount} components have no recent outward movement.`,
          'medium',
          'Admin'
        );
      }
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  });

  console.log('Notification scheduler started successfully');
};

/**
 * Stop the notification scheduler (for testing purposes)
 */
const stopNotificationScheduler = () => {
  cron.destroy();
  console.log('Notification scheduler stopped');
};

/**
 * Mark multiple notifications as read
 * @param {Array} notificationIds - Array of notification IDs
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const markMultipleAsRead = async (notificationIds, userId) => {
  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        $or: [
          { recipient: userId },
          { recipientRole: { $exists: true } }
        ]
      },
      {
        isRead: true,
        readAt: new Date(),
        readBy: userId
      }
    );

    return result;
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw error;
  }
};

/**
 * Archive multiple notifications
 * @param {Array} notificationIds - Array of notification IDs
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const archiveMultipleNotifications = async (notificationIds, userId) => {
  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        $or: [
          { recipient: userId },
          { recipientRole: { $exists: true } }
        ]
      },
      {
        isArchived: true,
        archivedAt: new Date()
      }
    );

    return result;
  } catch (error) {
    console.error('Error archiving multiple notifications:', error);
    throw error;
  }
};

/**
 * Send test notification (for testing purposes)
 * @param {string} type - Notification type
 * @returns {Promise<Object>} Test notification
 */
const sendTestNotification = async (type = 'system') => {
  try {
    const notification = await createSystemNotification(
      'Test Notification',
      'This is a test notification to verify the notification system is working correctly.',
      'low',
      'Admin'
    );

    return notification;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

module.exports = {
  createLowStockNotification,
  createOldStockNotification,
  createHighUsageNotification,
  createSystemNotification,
  sendEmailNotification,
  checkLowStockComponents,
  checkOldStockComponents,
  cleanupOldNotifications,
  getNotificationSummary,
  startNotificationScheduler,
  stopNotificationScheduler,
  markMultipleAsRead,
  archiveMultipleNotifications,
  sendTestNotification,
  initializeEmailTransporter
};