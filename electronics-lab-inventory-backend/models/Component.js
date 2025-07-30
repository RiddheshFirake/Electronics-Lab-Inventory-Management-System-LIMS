const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  componentName: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
    maxlength: [200, 'Component name cannot be more than 200 characters']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    maxlength: [100, 'Manufacturer name cannot be more than 100 characters']
  },
  partNumber: {
    type: String,
    required: [true, 'Part number is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Part number cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  datasheetLink: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty datasheet links
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Datasheet link must be a valid URL'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot be more than 100 characters'],
    validate: {
      validator: function (v) {
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
        return predefinedCategories.includes(v) || (v && v.length > 0);
      },
      message: 'Category must be a valid predefined category or a custom category'
    }
  },
  criticalLowThreshold: {
    type: Number,
    required: [true, 'Critical low threshold is required'],
    min: [0, 'Critical low threshold cannot be negative']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  status: {
    type: String,
    enum: ['Active', 'Discontinued', 'Obsolete'],
    default: 'Active'
  },
  lastOutwardMovement: {
    type: Date,
    default: null
  },
  totalInward: {
    type: Number,
    default: 0,
    min: [0, 'Total inward cannot be negative']
  },
  totalOutward: {
    type: Number,
    default: 0,
    min: [0, 'Total outward cannot be negative']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
componentSchema.index({ partNumber: 1 }, { unique: true });
componentSchema.index({ componentName: 'text', description: 'text' });
componentSchema.index({ category: 1 });
componentSchema.index({ location: 1 });
componentSchema.index({ quantity: 1 });
componentSchema.index({ status: 1 });
componentSchema.index({ lastOutwardMovement: 1 });

// Virtual for checking if stock is critically low
componentSchema.virtual('isCriticallyLow').get(function () {
  return this.quantity <= this.criticalLowThreshold;
});

// Virtual for checking if component is old stock (no outward movement for 3+ months)
componentSchema.virtual('isOldStock').get(function () {
  if (!this.lastOutwardMovement) {
    // If no outward movement ever, check if created more than 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return this.createdAt < threeMonthsAgo;
  }

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return this.lastOutwardMovement < threeMonthsAgo;
});

// Virtual for total value in inventory
componentSchema.virtual('totalValue').get(function () {
  return this.quantity * this.unitPrice;
});

// Pre-save middleware to update lastModifiedBy
componentSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this._lastModifiedBy || this.addedBy;
  }
  next();
});

// Static method to find low stock components
componentSchema.statics.findLowStock = function () {
  return this.find({
    $expr: { $lte: ['$quantity', '$criticalLowThreshold'] },
    status: 'Active'
  });
};

// Static method to find old stock components
componentSchema.statics.findOldStock = function () {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  return this.find({
    $or: [
      {
        lastOutwardMovement: { $lt: threeMonthsAgo }
      },
      {
        lastOutwardMovement: null,
        createdAt: { $lt: threeMonthsAgo }
      }
    ],
    status: 'Active'
  });
};

// Instance method to update stock - FIXED VERSION
componentSchema.methods.updateStock = async function (quantity, operation, userId) {
  const previousQuantity = this.quantity;

  if (operation === 'inward') {
    this.quantity += quantity;
    this.totalInward += quantity;
  } else if (operation === 'outward') {
    if (this.quantity < quantity) {
      throw new Error('Insufficient stock for outward operation');
    }
    this.quantity -= quantity;
    this.totalOutward += quantity;
    this.lastOutwardMovement = new Date();
  }

  this._lastModifiedBy = userId;
  const newQuantity = this.quantity;

  await this.save();

  // Return the quantity information needed for transaction log
  return {
    previousQuantity,
    newQuantity,
    operation,
    quantity
  };
};

// Transform toJSON to include virtuals
componentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Component', componentSchema);