const Component = require('../models/Component');
const TransactionLog = require('../models/TransactionLog');
const User = require('../models/User');
const Notification = require('../models/Notification');

// controllers/dashboardController.js

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private (canAccessDashboard)
exports.getDashboardOverview = async (req, res, next) => {
    try {
        const totalComponents = await Component.countDocuments();
        const totalQuantityResult = await Component.aggregate([
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const totalQuantity = totalQuantityResult.length > 0 ? totalQuantityResult[0].total : 0;

        const lowStockCount = await Component.findLowStock().countDocuments();
        const oldStockCount = await Component.findOldStock().countDocuments();

        const totalInventoryValueAggregate = await Component.aggregate([
            { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } }
        ]);
        const totalInventoryValue = totalInventoryValueAggregate.length > 0 ? totalInventoryValueAggregate[0].totalValue : 0;

        // To get "Today's Sale" or "Total Inwarded Items":
        // You need a specific aggregation for today's inward.
        // For now, let's just use a placeholder or assume `totalInward`
        // is a simple value from the overview data if it's meant to be.

        // If "Today's Sale" means total quantity inwarded today:
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const totalInwardTodayResult = await TransactionLog.aggregate([
            {
                $match: {
                    operationType: 'inward',
                    transactionDate: { $gte: startOfToday, $lte: endOfToday }
                }
            },
            {
                $group: {
                    _id: null,
                    totalInwardedQuantity: { $sum: '$quantity' }
                }
            }
        ]);
        const totalInwardToday = totalInwardTodayResult.length > 0 ? totalInwardTodayResult[0].totalInwardedQuantity : 0;


        res.status(200).json({
            success: true,
            data: {
                totalComponents,
                totalQuantity, // Ensure this is a number
                lowStockCount,
                oldStockCount,
                totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
                totalInward: totalInwardToday // This should be a number
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get monthly transaction statistics
// @route   GET /api/dashboard/monthly-stats
// @access  Private (Admin, Lab Technician, Manufacturing Engineer)
exports.getMonthlyStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = parseInt(req.query.months) || 12;

    const monthlyStats = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(year, new Date().getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const yearForMonth = date.getFullYear();

      const stats = await TransactionLog.getMonthlyStats(yearForMonth, month);
      
      monthlyStats.push({
        month: month,
        year: yearForMonth,
        monthName: date.toLocaleString('default', { month: 'long' }),
        inwardQuantity: stats.inwardQuantity || 0,
        outwardQuantity: stats.outwardQuantity || 0,
        inwardValue: stats.inwardValue || 0,
        outwardValue: stats.outwardValue || 0,
        transactionCount: stats.transactionCount || 0
      });
    }

    res.status(200).json({
      success: true,
      data: monthlyStats
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get daily transaction trends (last 30 days)
// @route   GET /api/dashboard/daily-trends
// @access  Private (Admin, Lab Technician, Manufacturing Engineer)
exports.getDailyTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyTrends = await TransactionLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            operationType: '$operationType'
          },
          quantity: { $sum: '$quantity' },
          value: { $sum: '$totalCost' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          inwardQuantity: {
            $sum: { $cond: [{ $eq: ['$_id.operationType', 'inward'] }, '$quantity', 0] }
          },
          outwardQuantity: {
            $sum: { $cond: [{ $eq: ['$_id.operationType', 'outward'] }, '$quantity', 0] }
          },
          inwardValue: {
            $sum: { $cond: [{ $eq: ['$_id.operationType', 'inward'] }, '$value', 0] }
          },
          outwardValue: {
            $sum: { $cond: [{ $eq: ['$_id.operationType', 'outward'] }, '$value', 0] }
          },
          totalTransactions: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: dailyTrends
    });
  } catch (error) {
    console.error('Get daily trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get top components by usage/value
// @route   GET /api/dashboard/top-components
// @access  Private (Admin, Lab Technician, Manufacturing Engineer)
exports.getTopComponents = async (req, res) => {
  try {
    const type = req.query.type || 'usage'; // usage, value, quantity
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    let aggregationPipeline = [];

    if (type === 'usage') {
      // Top components by outward quantity
      aggregationPipeline = [
        {
          $match: {
            operationType: 'outward',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$componentId',
            totalQuantity: { $sum: '$quantity' },
            transactionCount: { $sum: 1 },
            totalValue: { $sum: '$totalCost' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'components',
            localField: '_id',
            foreignField: '_id',
            as: 'component'
          }
        },
        { $unwind: '$component' }
      ];
    } else if (type === 'value') {
      // Top components by inventory value
      aggregationPipeline = [
        { $match: { status: 'Active' } },
        {
          $addFields: {
            totalValue: { $multiply: ['$quantity', '$unitPrice'] }
          }
        },
        { $sort: { totalValue: -1 } },
        { $limit: limit }
      ];
    } else if (type === 'quantity') {
      // Top components by current quantity
      aggregationPipeline = [
        { $match: { status: 'Active' } },
        { $sort: { quantity: -1 } },
        { $limit: limit }
      ];
    }

    let results;
    if (type === 'usage') {
      results = await TransactionLog.aggregate(aggregationPipeline);
    } else {
      results = await Component.aggregate(aggregationPipeline);
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get top components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user activity statistics
// @route   GET /api/dashboard/user-activity
// @access  Private (Admin)
exports.getUserActivity = async (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe) || 30; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Get transaction activity by user
    const userActivity = await TransactionLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          inwardTransactions: {
            $sum: { $cond: [{ $eq: ['$operationType', 'inward'] }, 1, 0] }
          },
          outwardTransactions: {
            $sum: { $cond: [{ $eq: ['$operationType', 'outward'] }, 1, 0] }
          },
          totalQuantityHandled: { $sum: '$quantity' },
          totalValueHandled: { $sum: '$totalCost' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userName: '$user.name',
          userRole: '$user.role',
          userDepartment: '$user.department',
          inwardTransactions: 1,
          outwardTransactions: 1,
          totalTransactions: { $add: ['$inwardTransactions', '$outwardTransactions'] },
          totalQuantityHandled: 1,
          totalValueHandled: 1
        }
      },
      { $sort: { totalTransactions: -1 } }
    ]);

    // Get recently active users
    const recentlyActiveUsers = await User.aggregate([
      { $match: { isActive: true } },
      { $sort: { lastLogin: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          department: 1,
          lastLogin: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        userActivity,
        recentlyActiveUsers
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get inventory alerts
// @route   GET /api/dashboard/alerts
// @access  Private (Admin, Lab Technician, Manufacturing Engineer)
exports.getInventoryAlerts = async (req, res) => {
  try {
    // Get low stock components
    const lowStockComponents = await Component.find({
      $expr: { $lte: ['$quantity', '$criticalLowThreshold'] },
      status: 'Active'
    })
      .select('componentName partNumber quantity criticalLowThreshold location category')
      .sort({ quantity: 1 })
      .limit(20);

    // Get old stock components (no outward movement in 3+ months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const oldStockComponents = await Component.find({
      $or: [
        { lastOutwardMovement: { $lt: threeMonthsAgo } },
        { lastOutwardMovement: { $exists: false } }
      ],
      status: 'Active',
      quantity: { $gt: 0 }
    })
      .select('componentName partNumber quantity lastOutwardMovement location category')
      .sort({ lastOutwardMovement: 1 })
      .limit(20);

    // Get pending approvals
    const pendingApprovals = await TransactionLog.find({
      operationType: 'outward',
      quantity: { $gte: 100 },
      approvedBy: { $exists: false }
    })
      .populate('componentId', 'componentName partNumber')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get components with zero stock
    const zeroStockComponents = await Component.find({
      quantity: 0,
      status: 'Active'
    })
      .select('componentName partNumber location category')
      .sort({ componentName: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        lowStockComponents,
        oldStockComponents,
        pendingApprovals,
        zeroStockComponents,
        summary: {
          lowStockCount: lowStockComponents.length,
          oldStockCount: oldStockComponents.length,
          pendingApprovalsCount: pendingApprovals.length,
          zeroStockCount: zeroStockComponents.length
        }
      }
    });
  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/dashboard/system-stats
// @access  Private (Admin)
exports.getSystemStats = async (req, res) => {
  try {
    // Get database statistics
    const totalComponents = await Component.countDocuments();
    const activeComponents = await Component.countDocuments({ status: 'Active' });
    const discontinuedComponents = await Component.countDocuments({ status: 'Discontinued' });
    const obsoleteComponents = await Component.countDocuments({ status: 'Obsolete' });

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const totalTransactions = await TransactionLog.countDocuments();
    const totalNotifications = await Notification.countDocuments();
    const archivedNotifications = await Notification.countDocuments({ isArchived: true });

    // Get storage usage by category
    const storageByCategory = await Component.aggregate([
      {
        $group: {
          _id: '$category',
          componentCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Get user distribution by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        components: {
          total: totalComponents,
          active: activeComponents,
          discontinued: discontinuedComponents,
          obsolete: obsoleteComponents
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        transactions: {
          total: totalTransactions
        },
        notifications: {
          total: totalNotifications,
          archived: archivedNotifications
        },
        storageByCategory,
        usersByRole
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};