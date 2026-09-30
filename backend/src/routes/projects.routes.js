const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');

// Projets
router.get('/', projectsController.getProjects);
router.post('/', projectsController.createProject);

// Tâches (routes fixes, distinctes de /:id pour éviter toute confusion avec un id de projet)
router.post('/tasks', projectsController.createTask);
router.get('/tasks/:taskId', projectsController.getTaskDetail);
router.put('/tasks/:taskId', projectsController.updateTask);
router.delete('/tasks/:taskId', projectsController.deleteTask);
router.post('/tasks/:taskId/toggle-priority', projectsController.toggleTaskPriority);
router.post('/tasks/:taskId/duplicate', projectsController.duplicateTask);
router.get('/tasks/:taskId/messages', projectsController.getTaskMessages);
router.post('/tasks/:taskId/messages', projectsController.postTaskMessage);

// Étapes (colonnes)
router.put('/stages/:stageId', projectsController.updateStage);
router.delete('/stages/:stageId', projectsController.deleteStage);
router.post('/stages/:stageId/fold', projectsController.toggleFoldStage);
router.post('/stages/:stageId/archive-tasks', projectsController.archiveStageTasks);

// Projet individuel
router.get('/:id/board', projectsController.getProjectBoard);
router.post('/:id/stages', projectsController.createStage);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

module.exports = router;