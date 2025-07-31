// controllers/ordersController.js

const TransactionLog = require('../models/TransactionLog');
const User = require('../models/User'); // For user info if needed

// GET /api/orders/inward
exports.getInwardOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Changed 'status' to 'transactionStatus' to match model field
    const transactionStatus = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;

    const filter = { operationType: 'inward' }; // Correct operationType filter
    if (transactionStatus) filter.transactionStatus = transactionStatus; // Apply filter to the new field

    const orders = await TransactionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('componentId', 'componentName') // Corrected populate field to componentId
      .populate('user', 'name') // Assuming 'user' is the one who inwarded
      .lean();

    // Map output to required frontend shape
    const ordersData = orders.map(order => ({
      _id: order._id,
      orderNumber: order.supplierInvoice || "", // Using supplierInvoice as a placeholder for orderNumber
      componentName: order.componentId?.componentName || "N/A", // Access componentName from populated field
      supplierName: order.reasonOrProject || "N/A", // Using reasonOrProject as a placeholder for supplier
      quantity: order.quantity,
      transactionStatus: order.transactionStatus, // Use the new transactionStatus field
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: ordersData
    });
  } catch (error) {
    console.error('Inward Orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/orders/outward
exports.getOutwardOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Changed 'status' to 'transactionStatus' to match model field
    const transactionStatus = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;

    const filter = { operationType: 'outward' }; // Correct operationType filter
    if (transactionStatus) filter.transactionStatus = transactionStatus; // Apply filter to the new field

    const orders = await TransactionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('componentId', 'componentName') // Corrected populate field to componentId
      .populate('user', 'name') // Assuming 'user' is the one who outwarded/issued
      .lean();

    const ordersData = orders.map(order => ({
      _id: order._id,
      orderNumber: order.reasonOrProject || "", // Using reasonOrProject as a placeholder for orderNumber
      componentName: order.componentId?.componentName || "N/A", // Access componentName from populated field
      issuedToName: order.user?.name || "N/A", // Using user name as placeholder for issuedTo
      quantity: order.quantity,
      transactionStatus: order.transactionStatus, // Use the new transactionStatus field
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: ordersData
    });
  } catch (error) {
    console.error('Outward Orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/orders/activity
exports.getOrderActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    // Get the latest N transactions for recent activity
    const logs = await TransactionLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name role')
      .populate('componentId', 'componentName') // Corrected populate field to componentId
      .lean();

    const activity = logs.map(log => ({
      _id: log._id,
      userName: log.user?.name || "User",
      type: log.operationType, // 'inward' or 'outward'
      componentName: log.componentId?.componentName || "N/A",
      quantity: log.quantity,
      issuedTo: log.reasonOrProject || "", // Re-using reasonOrProject or notes
      timestamp: log.createdAt
    }));

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Order Activity error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};