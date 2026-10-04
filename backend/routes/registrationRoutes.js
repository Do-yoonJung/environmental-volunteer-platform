const express = require('express');

const {
    registerForEvent,
    cancelRegistration,
    getMyRegistrations,
    getEventRegistrations
} = require('../controllers/registrationController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Volunteer: view own registrations
router.get('/me', protect, getMyRegistrations);

// Coordinator: view registered volunteers for own event
router.get('/event/:eventId', protect, getEventRegistrations);

// Volunteer: register for event
router.post('/:eventId', protect, registerForEvent);

// Volunteer: cancel registration
router.put('/:eventId/cancel', protect, cancelRegistration);

module.exports = router;