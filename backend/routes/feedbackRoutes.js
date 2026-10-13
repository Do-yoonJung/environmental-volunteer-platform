const express = require('express');

const feedbackController =
  require('../controllers/feedbackController');

const {
  protect
} = require('../middleware/authMiddleware');

const {
  feedbackEligibility
} = require('../middleware/feedbackEligibilityMiddleware');

const router = express.Router();

// Volunteer: submit feedback for an attended event
router.post(
  '/:eventId',
  protect,
  feedbackEligibility,
  feedbackController.submitFeedback
);

module.exports = router;