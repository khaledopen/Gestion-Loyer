const express = require('express');
const router = express.Router();
const controller = require('./dashboardController');

router.get('/stats', controller.getStats);

module.exports = router;
