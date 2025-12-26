const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const tenantController = require('../controllers/tenant.controller');

router.get('/:tenantId', auth, tenantController.getTenantById);
router.put('/:tenantId', auth, tenantController.updateTenant);
router.get('/', auth, authorize(['super_admin']), tenantController.listTenants);

module.exports = router;