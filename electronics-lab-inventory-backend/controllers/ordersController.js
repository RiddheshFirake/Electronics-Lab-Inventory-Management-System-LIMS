// controllers/ordersController.js

const TransactionLog = require('../models/TransactionLog'); // Adjust if your model name is different
const User = require('../models/User'); // For user info if needed

// GET /api/orders/inward
exports.getInwardOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;

    const filter = { type: 'inward' };
    if (status) filter.status = status;

    const orders = await TransactionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('component', 'componentName') // If you store ref id; adjust as per schema
      .populate('supplier', 'name') // If supplier is a ref
      .lean();

    // Map output to required frontend shape
    const ordersData = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber || "",
      componentName: order.componentName || (order.component && order.component.componentName) || "",
      supplierName: order.supplierName || (order.supplier && order.supplier.name) || "",
      quantity: order.quantity,
      status: order.status,
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
    const status = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;

    const filter = { type: 'outward' };
    if (status) filter.status = status;

    const orders = await TransactionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('component', 'componentName')
      .populate('issuedTo', 'name') // issuedTo might be a user ref
      .lean();

    const ordersData = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber || "",
      componentName: order.componentName || (order.component && order.component.componentName) || "",
      issuedToName: order.issuedToName || (order.issuedTo && order.issuedTo.name) || "",
      quantity: order.quantity,
      status: order.status,
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
      .populate('user', 'name role') // If you have a "user" ref field
      .populate('component', 'componentName')
      .lean();

    const activity = logs.map(log => ({
      _id: log._id,
      userName: log.userName || (log.user && log.user.name) || "User",
      type: log.type, // 'inward' or 'outward'
      componentName: log.componentName || (log.component && log.component.componentName) || "",
      quantity: log.quantity,
      issuedTo: log.issuedToName || (log.issuedTo && log.issuedTo.name) || "",
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
