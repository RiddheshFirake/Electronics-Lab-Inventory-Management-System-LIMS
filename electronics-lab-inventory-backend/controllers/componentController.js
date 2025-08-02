const Component = require('../models/Component');
const TransactionLog = require('../models/TransactionLog');
const { createLowStockNotification, createOldStockNotification } = require('../utils/notificationUtils');

// NEW: Controller to simulate scanning a barcode and fetching details
exports.scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    // This is a mock implementation. In a real application, you would
    // call a third-party API (e.g., UPC database, supplier API) here.
    let productDetails = {};

    switch (barcode) {
      case '123456789012':
        productDetails = {
          componentName: 'Arduino Uno R3',
          manufacturer: 'Arduino',
          partNumber: 'A000066',
          barcode: barcode,
          description: 'The classic Arduino Uno board based on the ATmega328P microcontroller.',
          location: 'Shelf B-1',
          unitPrice: 200.00,
          datasheetLink: 'https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf',
          category: 'Microcontrollers/Development Boards',
          criticalLowThreshold: 5,
          tags: ['microcontroller', 'atmega328p', 'development', 'uno']
        };
        break;
      case '987654321098':
        productDetails = {
          componentName: '10k Ohm Resistor',
          manufacturer: 'Vishay',
          partNumber: '10K-RES-0805',
          barcode: barcode,
          description: 'Standard 10k Ohm surface-mount resistor, 0805 package.',
          location: 'Drawer R-3',
          unitPrice: 1.50,
          datasheetLink: 'https://www.vishay.com/docs/20035/dcrseries.pdf',
          category: 'Resistors',
          criticalLowThreshold: 50,
          tags: ['resistor', 'smd', '0805', '10kohm']
        };
        break;
      case '456789012345':
        productDetails = {
          componentName: 'LM358 Op-Amp',
          manufacturer: 'Texas Instruments',
          partNumber: 'LM358DR',
          barcode: barcode,
          description: 'General purpose dual operational amplifier.',
          location: 'Cabinet IC-4',
          unitPrice: 15.00,
          datasheetLink: 'https://www.ti.com/lit/ds/symlink/lm358.pdf',
          category: 'Integrated Circuits (ICs)',
          criticalLowThreshold: 10,
          tags: ['op-amp', 'ic', 'analog']
        };
        break;
      default:
        // No match found
        return res.status(404).json({
          success: false,
          message: 'No product details found for this barcode. Please enter details manually.'
        });
    }

    res.status(200).json({
      success: true,
      data: productDetails
    });
  } catch (error) {
    console.error('Scan barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

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

// @desc    Create new component (UPDATED - Solution 1)
// @route   POST /api/components
// @access  Private (Admin, Lab Technician)
exports.createComponent = async (req, res) => {
  try {
    // Add the current user ID to the component data (Solution 1)
    const componentData = {
      ...req.body,
      addedBy: req.user._id || req.user.id, // Get user ID from the authenticated request
      lastModifiedBy: req.user._id || req.user.id
    };
    
    const component = new Component(componentData);
    const savedComponent = await component.save();
    
    // Populate the created component
    await savedComponent.populate('addedBy', 'name email');
    await savedComponent.populate('lastModifiedBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: savedComponent,
      message: 'Component created successfully'
    });
  } catch (error) {
    console.error('Create component error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      
      return res.status(409).json({
        success: false,
        message: `Component with ${field} "${value}" already exists. Please use update instead.`,
        errorCode: 'DUPLICATE_COMPONENT',
        duplicateField: field,
        duplicateValue: value
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating component'
    });
  }
};

// @desc    Update component (UPDATED - Solution 1)
// @route   PUT /api/components/:id
// @access  Private (Admin, Lab Technician)
exports.updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    
    let component = await Component.findById(id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }
    
    // Add/preserve the user tracking fields (Solution 1)
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id || req.user.id, // Track who updated it
      updatedAt: new Date()
    };
    
    // Don't override addedBy if it already exists
    if (!updateData.addedBy) {
      delete updateData.addedBy;
    }
    
    component = await Component.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    res.status(200).json({
      success: true,
      data: component,
      message: 'Component updated successfully'
    });
  } catch (error) {
    console.error('Update component error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      
      return res.status(409).json({
        success: false,
        message: `Component with ${field} "${value}" already exists.`,
        errorCode: 'DUPLICATE_COMPONENT',
        duplicateField: field,
        duplicateValue: value
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating component'
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
      unitCost,
      transactionStatus: 'Completed' // NEW: Set status for inward
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
      approvedBy: needsApproval ? (approvedBy || req.user.id) : undefined,
      transactionStatus: 'Completed' // NEW: Set status for outward
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

// @desc    Bulk import components (UPDATED - Solution 1)
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
        // Add metadata (Solution 1)
        componentData.addedBy = req.user._id || req.user.id;
        componentData.lastModifiedBy = req.user._id || req.user.id;

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

// Check if component exists by barcode or part number
// Check if component exists by barcode or part number
exports.checkComponentExists = async (req, res) => {
  try {
    const { barcode, partNumber } = req.query;
    
    console.log('Checking component exists:', { barcode, partNumber }); // Debug log
    
    let query = {};
    if (barcode) {
      query.barcode = barcode;
    }
    if (partNumber) {
      query.partNumber = partNumber;
    }
    
    if (Object.keys(query).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Barcode or partNumber required'
      });
    }
    
    const component = await Component.findOne(query)
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    console.log('Found component:', component ? 'YES' : 'NO'); // Debug log
    
    res.json({
      success: true,
      exists: !!component,
      component: component || null
    });
  } catch (error) {
    console.error('Check component exists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking component existence'
    });
  }
};


// Search components by part number or other criteria
exports.searchComponents = async (req, res) => {
  try {
    const { partNumber, componentName, manufacturer } = req.query;
    
    let query = {};
    
    if (partNumber) {
      query.partNumber = { $regex: partNumber, $options: 'i' };
    }
    if (componentName) {
      query.componentName = { $regex: componentName, $options: 'i' };
    }
    if (manufacturer) {
      query.manufacturer = { $regex: manufacturer, $options: 'i' };
    }
    
    if (Object.keys(query).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter required'
      });
    }
    
    const components = await Component.find(query)
      .populate('addedBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      data: components
    });
  } catch (error) {
    console.error('Search components error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching components'
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
