const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const taskController = require('../controllers/task.controller');

router.post(
  '/projects/:projectId/tasks',
  auth,
  taskController.createTask
);

router.get(
  '/projects/:projectId/tasks',
  auth,
  taskController.listTasks
);

router.patch(
  '/tasks/:taskId/status',
  auth,
  taskController.updateTaskStatus
);

router.put(
  '/tasks/:taskId',
  auth,
  taskController.updateTask
);

module.exports = router;