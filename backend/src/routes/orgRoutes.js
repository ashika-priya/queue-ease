const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', orgController.getOrganizations);
router.get('/:id', orgController.getOrganizationById);
router.post('/', protect, requireRole('admin'), orgController.createOrganization);

module.exports = router;
