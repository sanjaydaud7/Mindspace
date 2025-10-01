const express = require('express')
const router = express.Router()
const Mood = require('../models/Mood')

// Save mood to MongoDB
router.post('/moods', async (req, res) => {
  try {
    const { time, mood, moodLabel, userId } = req.body

    const newMood = new Mood({
      userId: userId || null, // Use null if no user authentication
      time,
      mood,
      moodLabel
    })

    await newMood.save()
    res.status(201).json({ message: 'Mood saved successfully', mood: newMood })
  } catch (error) {
    console.error('Error saving mood:', error)
    res.status(500).json({ error: 'Failed to save mood' })
  }
})

// Retrieve mood history (optionally filter by userId if authenticated)
router.get('/moods', async (req, res) => {
  try {
    // moodRoutes.js
    const userId = req.query.userId || null
    const moods = await Mood.find({ userId }).sort({ createdAt: -1 }).limit(50)
    res.status(200).json(moods)
  } catch (error) {
    console.error('Error fetching mood history:', error)
    res.status(500).json({ error: 'Failed to fetch mood history' })
  }
})

module.exports = router
