const express = require('express');
const {
  getComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  inwardStock,
  outwardStock,
  getComponentTransactions,
  getLowStockComponents,
  getOldStockComponents,
  getCategories,
  getLocations,
  bulkImportComponents,
  exportComponents, 
  getPredefinedCategories
} = require('../controllers/componentController');

const { protect } = require('../middleware/authMiddleware');
const {
  canViewComponents,
  canManageComponents,
  canInward,
  canOutward,
  adminOnly
} = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Special routes (must come before parameterized routes)
router.get('/low-stock', canViewComponents, getLowStockComponents);
router.get('/old-stock', canViewComponents, getOldStockComponents);
router.get('/categories', canViewComponents, getCategories);
router.get('/locations', canViewComponents, getLocations);
router.get('/export', canViewComponents, exportComponents);
router.post('/bulk-import', canManageComponents, bulkImportComponents);
router.get('/predefined-categories', canViewComponents, getPredefinedCategories);

// Main CRUD routes
router.route('/')
  .get(canViewComponents, getComponents)
  .post(canManageComponents, createComponent);

router.route('/:id')
  .get(canViewComponents, getComponent)
  .put(canManageComponents, updateComponent)
  .delete(adminOnly, deleteComponent);

// Stock management routes
router.post('/:id/inward', canInward, inwardStock);
router.post('/:id/outward', canOutward, outwardStock);

// Transaction history
router.get('/:id/transactions', canViewComponents, getComponentTransactions);

module.exports = router;