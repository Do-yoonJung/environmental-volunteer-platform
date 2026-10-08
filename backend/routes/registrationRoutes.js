const express = require('express');

const registrationController = require('../controllers/registrationController');

const { protect } = require('../middleware/authMiddleware');

const createRegistrationRoutes = (notificationService) => {
    const router = express.Router();

    // Volunteer: view own registrations
    router.get('/me', protect, registrationController.getMyRegistrations);

    // Coordinator: view registered volunteers for own event
    router.get('/event/:eventId', protect, registrationController.getEventRegistrations);

    // Volunteer: register for event
    router.post('/:eventId', protect, (req, res) => (
        registrationController.registerForEvent(req, res, notificationService)
    ));

    // Volunteer: cancel registration
    router.put('/:eventId/cancel', protect, registrationController.cancelRegistration);

    return router;
};

module.exports = createRegistrationRoutes;