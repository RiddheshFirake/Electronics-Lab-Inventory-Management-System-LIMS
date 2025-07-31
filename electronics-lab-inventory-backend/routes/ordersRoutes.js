const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

router.get('/inward', ordersController.getInwardOrders);
router.get('/outward', ordersController.getOutwardOrders);
router.get('/activity', ordersController.getOrderActivity);

module.exports = router;
