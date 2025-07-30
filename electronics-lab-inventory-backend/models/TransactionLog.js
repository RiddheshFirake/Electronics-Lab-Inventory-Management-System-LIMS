const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: [true, 'Component ID is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  operationType: {
    type: String,
    required: [true, 'Operation type is required'],
    enum: {
      values: ['inward', 'outward'],
      message: 'Operation type must be either inward or outward'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  quantityBefore: {
    type: Number,
    required: [true, 'Quantity before transaction is required'],
    min: [0, 'Quantity before cannot be negative']
  },
  quantityAfter: {
    type: Number,
    required: [true, 'Quantity after transaction is required'],
    min: [0, 'Quantity after cannot be negative']
  },
  reasonOrProject: {
    type: String,
    required: [true, 'Reason or project is required'],
    trim: true,
    maxlength: [200, 'Reason or project cannot be more than 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot be more than 50 characters']
  },
  supplierInvoice: {
    type: String,
    trim: true,
    maxlength: [50, 'Supplier invoice cannot be more than 50 characters']
  },
  unitCost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative']
  },
  totalCost: {
    type: Number,
    min: [0, 'Total cost cannot be negative']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
transactionLogSchema.index({ componentId: 1 });
transactionLogSchema.index({ user: 1 });
transactionLogSchema.index({ operationType: 1 });
transactionLogSchema.index({ transactionDate: -1 });
transactionLogSchema.index({ createdAt: -1 });

// Compound indexes for common queries
transactionLogSchema.index({ componentId: 1, operationType: 1 });
transactionLogSchema.index({ componentId: 1, transactionDate: -1 });

// Pre-save middleware to calculate total cost
transactionLogSchema.pre('save', function(next) {
  if (this.unitCost && !this.totalCost) {
    this.totalCost = this.quantity * this.unitCost;
  }
  next();
});

// Static method to get monthly transaction summary
transactionLogSchema.statics.getMonthlyStats = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const stats = await this.aggregate([
    {
      $match: {
        transactionDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$operationType',
        totalQuantity: { $sum: '$quantity' },
        totalTransactions: { $sum: 1 },
        totalCost: { $sum: '$totalCost' },
        uniqueComponents: { $addToSet: '$componentId' }
      }
    },
    {
      $project: {
        _id: 1,
        totalQuantity: 1,
        totalTransactions: 1,
        totalCost: 1,
        uniqueComponentsCount: { $size: '$uniqueComponents' }
      }
    }
  ]);

  return stats;
};

// Static method to get component transaction history
transactionLogSchema.statics.getComponentHistory = function(componentId, limit = 50) {
  return this.find({ componentId })
    .populate('user', 'name email role')
    .populate('approvedBy', 'name email')
    .sort({ transactionDate: -1 })
    .limit(limit);
};

// Static method to get user transaction history
transactionLogSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({ user: userId })
    .populate('componentId', 'componentName partNumber')
    .populate('approvedBy', 'name email')
    .sort({ transactionDate: -1 })
    .limit(limit);
};

// Static method to get transactions requiring approval
transactionLogSchema.statics.getPendingApprovals = function() {
  return this.find({ 
    approvedBy: { $exists: false },
    operationType: 'outward',
    quantity: { $gte: 100 } // Transactions with high quantities need approval
  })
    .populate('user', 'name email role')
    .populate('componentId', 'componentName partNumber')
    .sort({ createdAt: -1 });
};

// Virtual for transaction value
transactionLogSchema.virtual('transactionValue').get(function() {
  return this.totalCost || (this.unitCost * this.quantity) || 0;
});

// Virtual for checking if transaction needs approval
transactionLogSchema.virtual('needsApproval').get(function() {
  return this.operationType === 'outward' && this.quantity >= 100 && !this.approvedBy;
});

// Transform toJSON to include virtuals
transactionLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);