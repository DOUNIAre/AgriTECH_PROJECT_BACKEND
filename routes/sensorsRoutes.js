const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const auth = require('../middleware/authMiddleware');

// Public endpoint for IoT devices
router.post('/data', sensorController.receiveSensorData);

// Protected routes
router.use(auth.protect);
router.post('/register', sensorController.registerSensor);
router.get('/:sensorId/data', sensorController.getSensorData);

module.exports = router;