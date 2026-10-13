const express = require('express');

const feedbackController =
  require('../controllers/feedbackController');

const {
  protect
} = require('../middleware/authMiddleware');

const {
  feedbackEligibility
} = require(
  '../middleware/feedbackEligibilityMiddleware'
);

const {
  feedbackCoordinatorAccess
} = require(
  '../middleware/feedbackCoordinatorMiddleware'
);

const router = express.Router();

// Coordinator: view feedback for an event they manage
router.get(
  '/event/:eventId',
  protect,
  feedbackCoordinatorAccess,
  feedbackController.getEventFeedback
);

// Volunteer: submit feedback for an attended event
router.post(
  '/:eventId',
  protect,
  feedbackEligibility,
  feedbackController.submitFeedback
);

module.exports = router;