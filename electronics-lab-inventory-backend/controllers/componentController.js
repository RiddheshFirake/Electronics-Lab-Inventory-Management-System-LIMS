const Component = require('../models/Component');
const TransactionLog = require('../models/TransactionLog');
const { createLowStockNotification, createOldStockNotification } = require('../utils/notificationUtils');

// @desc    Get all components
// @route   GET /api/components
// @access  Private
exports.getComponents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query object
    let query = {};
    let sort = {};

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by category
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Filter by status
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    // Filter by location
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }

    // Filter by manufacturer
    if (req.query.manufacturer) {
      query.manufacturer = { $regex: req.query.manufacturer, $options: 'i' };
    }

    // Quantity range filter
    if (req.query.minQuantity || req.query.maxQuantity) {
      query.quantity = {};
      if (req.query.minQuantity) {
        query.quantity.$gte = parseInt(req.query.minQuantity);
      }
      if (req.query.maxQuantity) {
        query.quantity.$lte = parseInt(req.query.maxQuantity);
      }
    }

    // Low stock filter
    if (req.query.lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$criticalLowThreshold'] };
    }

    // Old stock filter (no outward movement in 3+ months)
    if (req.query.oldStock === 'true') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      query.$or = [
        { lastOutwardMovement: { $lt: threeMonthsAgo } },
        { lastOutwardMovement: { $exists: false } }
      ];
    }

    // Sorting
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort = { createdAt: -1 }; // Default sort by creation date
    }

    const total = await Component.countDocuments(query);
    const components = await Component.find(query)
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort(sort)
      .limit(limit)
      .skip(startIndex);

    // Pagination result
    const pagination = {
      current: page,
      total: Math.ceil(total / limit),
      count: components.length,
      totalCount: total
    };

    res.status(200).json({
      success: true,
      count: components.length,
      total,
      pagination,
      data: components
    });
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single component
// @route   GET /api/components/:id
// @access  Private
exports.getComponent = async (req, res) => {
  try {
    const component = await Component.findById(req.params.id)
      .populate('addedBy', 'name email role department')
      .populate('lastModifiedBy', 'name email role department');

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Get recent transaction history for this component
    const recentTransactions = await TransactionLog.find({ componentId: component._id })
      .populate('user', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        component,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new component
// @route   POST /api/components
// @access  Private (Admin, Lab Technician)
exports.createComponent = async (req, res) => {
  try {
    // Add user who created the component
    req.body.addedBy = req.user.id;
    req.body.lastModifiedBy = req.user.id;

    const component = await Component.create(req.body);

    // Populate the created component
    await component.populate('addedBy', 'name email');
    await component.populate('lastModifiedBy', 'name email');

    res.status(201).json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Create component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update component
// @route   PUT /api/components/:id
// @access  Private (Admin, Lab Technician)
exports.updateComponent = async (req, res) => {
  try {
    let component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Add user who modified the component
    req.body.lastModifiedBy = req.user.id;

    component = await Component.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete component
// @route   DELETE /api/components/:id
// @access  Private (Admin only)
exports.deleteComponent = async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Check if there are any transaction logs associated with this component
    const transactionCount = await TransactionLog.countDocuments({ componentId: component._id });

    if (transactionCount > 0) {
      // If there are transactions, mark as discontinued instead of deleting
      component.status = 'Discontinued';
      await component.save();

      return res.status(200).json({
        success: true,
        message: 'Component marked as discontinued due to existing transaction history'
      });
    }

    // If no transactions, safe to delete
    await component.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    console.error('Delete component error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Inward stock (add quantity)
// @route   POST /api/components/:id/inward
// @access  Private (Admin, Lab Technician)
exports.inwardStock = async (req, res) => {
  try {
    const { quantity, reasonOrProject, notes, batchNumber, supplierInvoice, unitCost } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Store the previous quantity before updating
    const previousQuantity = component.quantity;

    // Update component stock using the model method
    await component.updateStock(quantity, 'inward', req.user.id);

    // Calculate new quantity after update
    const newQuantity = previousQuantity + quantity;

    // Create transaction log
    const transactionData = {
      componentId: component._id,
      user: req.user.id,
      operationType: 'inward',
      quantity: parseInt(quantity),
      quantityBefore: previousQuantity,
      quantityAfter: newQuantity,
      reasonOrProject: reasonOrProject || 'Stock replenishment',
      notes,
      batchNumber,
      supplierInvoice,
      unitCost
    };

    const transaction = await TransactionLog.create(transactionData);
    await transaction.populate('user', 'name email role');

    // Get updated component
    const updatedComponent = await Component.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Stock inward successful',
      data: {
        component: updatedComponent,
        transaction
      }
    });
  } catch (error) {
    console.error('Inward stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Outward stock (deduct quantity)
// @route   POST /api/components/:id/outward
// @access  Private (Admin, Lab Technician, Manufacturing Engineer, Researcher)
exports.outwardStock = async (req, res) => {
  try {
    const { quantity, reasonOrProject, notes, approvedBy } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    if (!reasonOrProject) {
      return res.status(400).json({
        success: false,
        message: 'Reason or project is required for outward transactions'
      });
    }

    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    if (component.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${component.quantity}, Requested: ${quantity}`
      });
    }

    // Check if approval is needed for large quantities (>=100)
    const needsApproval = quantity >= 100;
    if (needsApproval && !approvedBy && req.user.role !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Approval is required for outward quantities of 100 or more'
      });
    }

    // Store the previous quantity before updating
    const previousQuantity = component.quantity;

    // Update component stock using the model method
    await component.updateStock(quantity, 'outward', req.user.id);

    // Calculate new quantity after update
    const newQuantity = previousQuantity - quantity;

    // Create transaction log
    const transactionData = {
      componentId: component._id,
      user: req.user.id,
      operationType: 'outward',
      quantity: parseInt(quantity),
      quantityBefore: previousQuantity,
      quantityAfter: newQuantity,
      reasonOrProject,
      notes,
      approvedBy: needsApproval ? (approvedBy || req.user.id) : undefined
    };

    const transaction = await TransactionLog.create(transactionData);
    await transaction.populate('user', 'name email role');
    if (transaction.approvedBy) {
      await transaction.populate('approvedBy', 'name email');
    }

    // Check if component is now below critical threshold
    const updatedComponent = await Component.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (updatedComponent.isCriticallyLow) {
      await createLowStockNotification(updatedComponent);
    }

    res.status(200).json({
      success: true,
      message: 'Stock outward successful',
      data: {
        component: updatedComponent,
        transaction
      }
    });
  } catch (error) {
    console.error('Outward stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get component transaction history
// @route   GET /api/components/:id/transactions
// @access  Private
exports.getComponentTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Build query
    let query = { componentId: req.params.id };

    // Filter by operation type
    if (req.query.operationType && req.query.operationType !== 'all') {
      query.operationType = req.query.operationType;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.transactionDate = {};
      if (req.query.startDate) {
        query.transactionDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.transactionDate.$lte = new Date(req.query.endDate);
      }
    }

    const total = await TransactionLog.countDocuments(query);
    const transactions = await TransactionLog.find(query)
      .populate('user', 'name email role department')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Pagination result
    const pagination = {
      current: page,
      total: Math.ceil(total / limit),
      count: transactions.length,
      totalCount: total
    };

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pagination,
      data: transactions,
      component: {
        id: component._id,
        componentName: component.componentName,
        partNumber: component.partNumber
      }
    });
  } catch (error) {
    console.error('Get component transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get low stock components
// @route   GET /api/components/low-stock
// @access  Private
exports.getLowStockComponents = async (req, res) => {
  try {
    const components = await Component.findLowStock()
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('Get low stock components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get old stock components (no movement in 3+ months)
// @route   GET /api/components/old-stock
// @access  Private
exports.getOldStockComponents = async (req, res) => {
  try {
    const components = await Component.findOldStock()
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('Get old stock components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get component categories with counts
// @route   GET /api/components/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = await Component.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get component locations with counts
// @route   GET /api/components/locations
// @access  Private
exports.getLocations = async (req, res) => {
  try {
    const locations = await Component.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk import components
// @route   POST /api/components/bulk-import
// @access  Private (Admin, Lab Technician)
exports.bulkImportComponents = async (req, res) => {
  try {
    const { components } = req.body;

    if (!components || !Array.isArray(components)) {
      return res.status(400).json({
        success: false,
        message: 'Components array is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (let i = 0; i < components.length; i++) {
      const componentData = components[i];
      
      try {
        // Add metadata
        componentData.addedBy = req.user.id;
        componentData.lastModifiedBy = req.user.id;

        const component = await Component.create(componentData);
        results.successful.push({
          index: i,
          component: component
        });
      } catch (error) {
        results.failed.push({
          index: i,
          data: componentData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.successful.length} components successfully, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export components to CSV format
// @route   GET /api/components/export
// @access  Private
exports.exportComponents = async (req, res) => {
  try {
    // Build query similar to getComponents
    let query = {};

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$criticalLowThreshold'] };
    }

    const components = await Component.find(query)
      .populate('addedBy', 'name')
      .populate('lastModifiedBy', 'name')
      .sort({ createdAt: -1 });

    // Format data for export
    const exportData = components.map(component => ({
      'Component Name': component.componentName,
      'Part Number': component.partNumber,
      'Manufacturer': component.manufacturer,
      'Category': component.category,
      'Description': component.description,
      'Quantity': component.quantity,
      'Unit Price': component.unitPrice,
      'Total Value': component.totalValue,
      'Location': component.location,
      'Critical Low Threshold': component.criticalLowThreshold,
      'Status': component.status,
      'Tags': component.tags.join(', '),
      'Datasheet Link': component.datasheetLink || '',
      'Added By': component.addedBy?.name || '',
      'Last Modified By': component.lastModifiedBy?.name || '',
      'Created At': component.createdAt.toISOString(),
      'Updated At': component.updatedAt.toISOString()
    }));

    res.status(200).json({
      success: true,
      count: exportData.length,
      data: exportData
    });
  } catch (error) {
    console.error('Export components error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get predefined categories list
// @route   GET /api/components/predefined-categories
// @access  Private
exports.getPredefinedCategories = async (req, res) => {
  try {
    const predefinedCategories = [
      'Resistors',
      'Capacitors', 
      'Inductors',
      'Diodes',
      'Transistors',
      'Integrated Circuits (ICs)',
      'Connectors',
      'Sensors',
      'Microcontrollers/Development Boards',
      'Switches/Buttons',
      'LEDs/Displays',
      'Cables/Wires',
      'Mechanical Parts/Hardware',
      'Miscellaneous Lab Supplies'
    ];

    res.status(200).json({
      success: true,
      data: predefinedCategories
    });
  } catch (error) {
    console.error('Get predefined categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};