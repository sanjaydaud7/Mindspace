const express = require('express');
const router = express.Router();

// Safe import that checks if model already exists
let Admin;
try {
    Admin = require('../models/adminModel');
} catch (error) {
    console.log('Admin model import error:', error.message);
    // If there's an issue, try to get the existing model
    const mongoose = require('mongoose');
    Admin = mongoose.models.Admin;
}

const { signup, login, getProfile, updateProfile } = require('../controllers/adminController'); // Import the missing functions
const { protect, restrictTo } = require('../middleware/adminMiddleware');
const { check } = require('express-validator');

// Add multer to handle file uploads
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});

// Validation middleware for signup
const signupValidation = [
    check('firstName').notEmpty().withMessage('First name is required'),
    check('lastName').notEmpty().withMessage('Last name is required'),
    check('email').isEmail().withMessage('Please enter a valid email address'),
    check('mobile').notEmpty().withMessage('Mobile number is required'),
    check('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/\d/).withMessage('Password must contain a number'),
    check('role')
    .isIn(['counselor', 'therapist', 'admin']).withMessage('Invalid role')
];

// Validation middleware for login
const loginValidation = [
    check('email').isEmail().withMessage('Please enter a valid email address'),
    check('password').notEmpty().withMessage('Password is required')
];

// Validation middleware for profile update
const updateProfileValidation = [
    check('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
    check('specialties').optional().isLength({ max: 500 }).withMessage('Specialties must be less than 500 characters'),
    check('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    check('qualifications').optional().isLength({ max: 1000 }).withMessage('Qualifications must be less than 1000 characters'),
    check('languages').optional().isLength({ max: 200 }).withMessage('Languages must be less than 200 characters')
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);

// Profile routes - FIXED to accept image upload
router.get('/profile', protect, getProfile); // Use actual controller function
router.put('/profile', protect, upload.single('profilePicture'), updateProfileValidation, updateProfile); // Accept 'profilePicture' file


// User management routes (if you have them)
router.get('/users', protect, restrictTo('admin'), async(req, res) => {
    try {
        // You'll need to create a User model and controller for this
        res.json({ success: true, users: [] }); // Placeholder
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Specialists route - Add this new route
router.get('/specialists', async(req, res) => {
    try {
        // Fetch only counselors and therapists from admin collection
        const specialists = await Admin.find({
            role: { $in: ['counselor', 'therapist'] }
        }).select('firstName lastName role specialties bio experience languages -_id');

        // Transform data for frontend
        const formattedSpecialists = specialists.map((specialist, index) => ({
            id: index + 1,
            name: `${specialist.firstName} ${specialist.lastName}`,
            role: specialist.role === 'counselor' ? 'Licensed Counselor' : 'Clinical Therapist',
            specialty: specialist.specialties || 'General Mental Health',
            avatar: `${specialist.firstName.charAt(0)}${specialist.lastName.charAt(0)}`,
            experience: specialist.experience || 0,
            bio: specialist.bio || 'Dedicated mental health professional committed to helping clients achieve wellness.',
            languages: specialist.languages || 'English',
            rating: (4.5 + Math.random() * 0.5).toFixed(1), // Random rating between 4.5-5.0
            reviews: Math.floor(Math.random() * 200) + 50, // Random reviews 50-250
            availability: generateWeeklyAvailability(index + 1)
        }));

        res.status(200).json({
            success: true,
            specialists: formattedSpecialists
        });
    } catch (error) {
        console.error('Error fetching specialists:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching specialists',
            error: error.message
        });
    }
});

// Helper function for availability (add this at the end of the file)
function generateWeeklyAvailability(specialistId) {
    const availability = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1); // Start from tomorrow

    days.forEach((day, index) => {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + index);
        const dateKey = date.toISOString().split('T')[0];

        const slots = [
            '09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM',
            '03:30 PM', '05:00 PM', '06:30 PM'
        ];

        availability[dateKey] = slots.map(slot => ({
            time: slot,
            date: dateKey,
            day: day,
            available: Math.random() > 0.25 // 75% availability
        }));
    });

    return availability;
}

module.exports = router;