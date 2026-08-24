const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;