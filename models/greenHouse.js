const mongoose = require('mongoose');

const greenhouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'farm',
    required: true
  },
  cropType: {
    type: String,
    required: true
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  optimalConditions: {
    temperature: { min: Number, max: Number },
    humidity: { min: Number, max: Number },
    soilMoisture: { min: Number, max: Number },
    light: { min: Number, max: Number }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('greenHouse', greenhouseSchema);