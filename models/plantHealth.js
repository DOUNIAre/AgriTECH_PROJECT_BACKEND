const mongoose = require('mongoose');

const plantHealthSchema = new mongoose.Schema({
  greenhouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'greenHouse',
    required: true
  },
  totalPlants: {
    type: Number,
    required: true
  },
  healthyPlants: {
    type: Number,
    required: true
  },
  diseasedPlants: {
    type: Number,
    required: true
  },
  diseaseType: String,
  detectionConfidence: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('plantHealth', plantHealthSchema);