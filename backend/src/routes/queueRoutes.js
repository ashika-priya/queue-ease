const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { protect, optionalAuth, requireRole } = require('../middleware/auth');

// Customer / Public routes
router.post('/join', optionalAuth, queueController.joinQueue);
router.get('/active/my-tickets', optionalAuth, queueController.getMyActiveTickets);
router.post('/entry/:entryId/cancel', optionalAuth, queueController.cancelTicket);
router.get('/public/:orgId', queueController.getPublicDisplayData);

// Staff / Operator routes
router.get('/staff/my-queue', protect, requireRole('staff', 'admin'), queueController.getStaffQueue);
router.post('/:queueId/next', protect, requireRole('staff', 'admin'), queueController.callNext);
router.post('/:queueId/recall', protect, requireRole('staff', 'admin'), queueController.recall);
router.post('/:queueId/skip', protect, requireRole('staff', 'admin'), queueController.skip);
router.post('/:queueId/complete', protect, requireRole('staff', 'admin'), queueController.complete);
router.post('/:queueId/pause', protect, requireRole('staff', 'admin'), queueController.pauseQueue);
router.post('/:queueId/resume', protect, requireRole('staff', 'admin'), queueController.resumeQueue);

module.exports = router;
