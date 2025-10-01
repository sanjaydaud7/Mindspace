const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: String, // Assuming user authentication; store user ID
    required: false // Set to true if authentication is implemented
  },
  time: {
    type: String,
    required: true
  },
  mood: {
    type: Number,
    required: true
  },
  moodLabel: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mood', moodSchema);