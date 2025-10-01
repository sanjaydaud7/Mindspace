const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
// const Appointment = require('../models/Appointment'); // Uncomment if using a separate Appointment model
// const Resource = require('../models/Resource'); // Uncomment if using a separate Resource model

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Fetching dashboard statistics...');
        
        // Count total users
        const totalUsers = await User.countDocuments();
        
        // Count upcoming appointments (you can adjust this query based on your appointment schema)
        const totalAppointments = await User.countDocuments({ 
            // Add your appointment filtering logic here
            // For example, if appointments are stored in a separate collection:
            // status: 'confirmed', 
            // dateTime: { $gte: new Date() } 
        });
        
        // Count total resources (adjust based on your resources schema)
        const totalResources = 87; // You can replace this with actual count from resources collection
        
        // Calculate total revenue (adjust based on your payment/revenue tracking)
        const totalRevenue = 5240; // You can replace this with actual revenue calculation
        
        const stats = {
            totalUsers,
            totalAppointments,
            totalResources,
            totalRevenue
        };
        
        console.log('✅ Statistics generated:', stats);
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('❌ Stats fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

module.exports = router;