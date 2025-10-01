const mongoose = require('mongoose');

// Define the mood schema
const moodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    mood: {
        type: String,
        required: true,
        enum: ['happy', 'sad', 'angry', 'anxious', 'neutral']
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Export the Mood model
module.exports = mongoose.models.Mood || mongoose.model('Mood', moodSchema);