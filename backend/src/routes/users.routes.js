const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.get('/app-access-fields', usersController.getAppAccessFields); // AVANT /:id
router.get('/:id', usersController.getUserDetail);
router.put('/:id', usersController.updateUser);
router.post('/:id/archive', usersController.archiveUser);
router.post('/:id/unarchive', usersController.unarchiveUser);

module.exports = router;