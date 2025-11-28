const Farm = require('../models/farm');
const Greenhouse = require('../models/greenHouse');
const Sensor = require('../models/sensor');
const SensorData = require('../models/sensorData');
const PlantHealth = require('../models/plantHealth');
const Activity = require('../models/activity');

// Get dashboard overview data
exports.getDashboardData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    // Get user's farm
    const farm = await Farm.findOne({ farmer: req.user.id });
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: { code: 'FARM_NOT_FOUND', message: 'No farm found for this user' }
      });
    }

    // Get all greenhouses for the farm
    const greenhouses = await Greenhouse.find({ farm: farm._id });
    const greenhouseIds = greenhouses.map(gh => gh._id);

    // Get latest plant health data
    const latestHealth = await PlantHealth.find({ 
      greenhouse: { $in: greenhouseIds } 
    })
    .sort({ timestamp: -1 })
    .limit(1);

    // Calculate stats
    let totalPlants = 0;
    let healthyPlants = 0;
    let diseasedPlants = 0;
    let waterLevel = 0;

    if (latestHealth.length > 0) {
      const health = latestHealth[0];
      totalPlants = health.totalPlants;
      healthyPlants = health.healthyPlants;
      diseasedPlants = health.diseasedPlants;
    }

    // Get water level from sensors
    const waterSensors = await Sensor.find({ 
      greenhouse: { $in: greenhouseIds },
      type: 'soil_moisture',
      status: 'active'
    });

    if (waterSensors.length > 0) {
      const waterReadings = await Promise.all(
        waterSensors.map(async (sensor) => {
          const latest = await SensorData.findOne({ sensor: sensor._id })
            .sort({ timestamp: -1 });
          return latest ? latest.value : 0;
        })
      );
      waterLevel = Math.round(waterReadings.reduce((a, b) => a + b, 0) / waterReadings.length);
    }

    // Get chart data7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartData = await PlantHealth.aggregate([
      {
        $match: {
          greenhouse: { $in: greenhouseIds },
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          healthy: { $avg: '$healthyPlants' },
          diseased: { $avg: '$diseasedPlants' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Format chart data for frontend
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const formattedChartData = chartData.map(item => ({
      name: days[item._id.day - 1],
      healthy: Math.round(item.healthy),
      diseased: Math.round(item.diseased)
    }));

    // Get recent activities
    const recentActivities = await Activity.find({ farm: farm._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('greenhouse', 'name');

    res.json({
      success: true,
      data: {
        stats: {
          totalPlants,
          healthyPlants,
          diseased: diseasedPlants,
          waterLevel
        },
        chartData: formattedChartData,
        recentActivities: recentActivities.map(activity => ({
          _id: activity._id.toString(),
          time: formatTime(activity.createdAt),
          action: activity.title,
          plant: activity.plant || activity.greenhouse?.name || 'General',
          status: activity.status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

// Get greenhouse details
exports.getGreenhouseDetails = async (req, res) => {
  try {
    const { greenhouseId } = req.params;

    const greenhouse = await Greenhouse.findById(greenhouseId)
      .populate('farm');
    
    if (!greenhouse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Greenhouse not found' }
      });
    }

    // Check if user owns this greenhouse
    if (greenhouse.farm.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to access this greenhouse' }
      });
    }

    // Get sensors for this greenhouse
    const sensors = await Sensor.find({ greenhouse: greenhouseId });
    
    // Get latest sensor data
    const sensorData = await Promise.all(
      sensors.map(async (sensor) => {
        const latest = await SensorData.findOne({ sensor: sensor._id })
          .sort({ timestamp: -1 });
        return {
          sensor: sensor,
          latestData: latest
        };
      })
    );

    // Get plant health history
    const healthHistory = await PlantHealth.find({ greenhouse: greenhouseId })
      .sort({ timestamp: -1 })
      .limit(30);

    res.json({
      success: true,
      data: {
        greenhouse,
        sensors: sensorData,
        healthHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

// Helper function to format time
function formatTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} h ago`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}