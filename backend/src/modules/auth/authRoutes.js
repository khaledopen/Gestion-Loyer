const express = require('express');
const router = express.Router();
const authController = require('./authController');
const authMiddleware = require('../../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
