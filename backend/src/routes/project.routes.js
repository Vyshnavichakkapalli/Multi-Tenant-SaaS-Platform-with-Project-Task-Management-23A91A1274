const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const projectController = require('../controllers/project.controller');

router.post('/projects', auth, projectController.createProject);
router.get('/projects', auth, projectController.listProjects);
router.get('/projects/:projectId', auth, projectController.getProjectDetails);
router.put('/projects/:projectId', auth, projectController.updateProject);
router.delete('/projects/:projectId', auth, projectController.deleteProject);

module.exports = router;