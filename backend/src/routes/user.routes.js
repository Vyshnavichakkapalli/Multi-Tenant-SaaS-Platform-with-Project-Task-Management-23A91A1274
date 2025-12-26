const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const userController = require('../controllers/user.controller');

router.post(
  '/tenants/:tenantId/users',
  auth,
  authorize(['tenant_admin']),
  userController.createUser
);

router.get(
  '/tenants/:tenantId/users',
  auth,
  userController.listUsers
);

router.put(
  '/users/:userId',
  auth,
  userController.updateUser
);

router.delete(
  '/users/:userId',
  auth,
  authorize(['tenant_admin']),
  userController.deleteUser
);

module.exports = router;