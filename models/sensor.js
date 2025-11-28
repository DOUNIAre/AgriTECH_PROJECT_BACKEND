const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  greenhouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'greenHouse',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['temperature', 'humidity', 'soil_moisture', 'light', 'co2', 'ph'],
    required: true
  },
  manufacturer: String,
  model: String,
  status: {
    type: String,
    enum: ['active', 'calibrating', 'error', 'offline'],
    default: 'active'
  },
  lastReading: {
    value: Number,
    timestamp: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('sensor', sensorSchema);