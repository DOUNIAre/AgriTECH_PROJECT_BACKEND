const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sensor',
    required: true
  },
  greenhouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'greenHouse',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  quality: {
    type: String,
    enum: ['good', 'warning', 'error'],
    default: 'good'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

sensorDataSchema.index({ sensor: 1, timestamp: -1 });
sensorDataSchema.index({ greenhouse: 1, timestamp: -1 });

module.exports = mongoose.model('sensorData', sensorDataSchema);