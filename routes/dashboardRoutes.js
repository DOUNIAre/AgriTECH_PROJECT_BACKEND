const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

router.use(auth.protect);

router.get('/', dashboardController.getDashboardData);
router.get('/greenhouse/:greenhouseId', dashboardController.getGreenhouseDetails);

module.exports = router;