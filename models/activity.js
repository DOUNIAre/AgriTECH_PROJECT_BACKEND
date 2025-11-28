const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'farm',
    required: true
  },
  greenhouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'greenHouse'
  },
  type: {
    type: String,
    enum: ['ai_analysis', 'disease_detected', 'irrigation', 'harvest', 'maintenance'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  plant: String,
  status: {
    type: String,
    enum: ['success', 'warning', 'info', 'error'],
    default: 'info'
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = mongoose.model('activity', activitySchema);