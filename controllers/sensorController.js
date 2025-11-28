const Sensor = require('../models/sensor');
const Greenhouse = require('../models/greenHouse');
const SensorData = require('../models/sensorData');
const Activity = require('../models/activity');

// Register new sensor
exports.registerSensor = async (req, res) => {
  try {
    const { greenhouseId, deviceId, name, type, manufacturer, model } = req.body;

    if (!greenhouseId || !deviceId || !name || !type) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Required fields are missing' }
      });
    }

    // Verify greenhouse belongs to user
    const greenhouse = await Greenhouse.findById(greenhouseId).populate('farm');
    if (!greenhouse || greenhouse.farm.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to add sensors to this greenhouse' }
      });
    }

    // Check if sensor already exists
    const existingSensor = await Sensor.findOne({ deviceId });
    if (existingSensor) {
      return res.status(400).json({
        success: false,
        error: { code: 'SENSOR_EXISTS', message: 'Sensor with this device ID already registered' }
      });
    }

    const sensor = await Sensor.create({
      greenhouse: greenhouseId,
      deviceId,
      name,
      type,
      manufacturer,
      model
    });

    // Log activity
    await Activity.create({
      farm: greenhouse.farm._id,
      greenhouse: greenhouseId,
      type: 'maintenance',
      title: 'New sensor registered',
      description: `Sensor ${name} (${type}) added to ${greenhouse.name}`,
      status: 'info'
    });

    res.status(201).json({
      success: true,
      data: {
        sensor: {
          _id: sensor._id.toString(),
          deviceId: sensor.deviceId,
          name: sensor.name,
          type: sensor.type,
          status: sensor.status,
          lastReading: sensor.lastReading
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

// Receive sensor data from IoT devices
exports.receiveSensorData = async (req, res) => {
  try {
    const { deviceId, value, unit, timestamp } = req.body;

    const sensor = await Sensor.findOne({ deviceId });
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: { code: 'SENSOR_NOT_FOUND', message: 'Sensor not registered' }
      });
    }

    // Update sensor last reading
    sensor.lastReading = {
      value,
      timestamp: timestamp || new Date()
    };
    await sensor.save();

    // Store sensor data
    const sensorData = await SensorData.create({
      sensor: sensor._id,
      greenhouse: sensor.greenhouse,
      value,
      unit,
      timestamp: timestamp || new Date()
    });

    // Check for alerts (simplified)
    await checkForAlerts(sensor, value, sensorData);

    res.json({
      success: true,
      data: {
        message: 'Data received successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

// Get sensor data history
exports.getSensorData = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const sensor = await Sensor.findById(sensorId).populate('greenhouse');
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sensor not found' }
      });
    }

    // Check authorization
    if (sensor.greenhouse.farm.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to access this sensor' }
      });
    }

    const timeFilter = new Date();
    timeFilter.setHours(timeFilter.getHours() - parseInt(hours));

    const data = await SensorData.find({
      sensor: sensorId,
      timestamp: { $gte: timeFilter }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        sensor,
        readings: data
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

// Helper function to check for alerts
async function checkForAlerts(sensor, value, sensorData) {
  // check against optimal ranges (zegemha chaker)
  if (sensor.type === 'temperature' && (value < 10 || value > 35)) {
    await createAlert(sensor, value, 'Temperature out of range');
  } else if (sensor.type === 'soil_moisture' && value < 20) {
    await createAlert(sensor, value, 'Low soil moisture detected');
  }
}

async function createAlert(sensor, value, message) {
  const greenhouse = await Greenhouse.findById(sensor.greenhouse);
  
  await Activity.create({
    farm: greenhouse.farm,
    greenhouse: sensor.greenhouse,
    type: 'disease_detected',
    title: 'Sensor Alert',
    description: `${message}: ${value}`,
    status: 'warning',
    plant: `Sensor: ${sensor.name}`
  });
}