const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/analytics', protect, requireRole('admin'), adminController.getAnalytics);
router.get('/network-info', protect, requireRole('admin'), adminController.getNetworkInfo);

module.exports = router;
