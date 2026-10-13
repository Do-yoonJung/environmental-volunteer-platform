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

const {
  feedbackOwnerAccess
} = require(
  '../middleware/feedbackOwnerMiddleware'
);

const router = express.Router();

// Coordinator: view feedback for an event they manage
router.get(
  '/event/:eventId',
  protect,
  feedbackCoordinatorAccess,
  feedbackController.getEventFeedback
);

// Volunteer: view own feedback for an event
router.get(
  '/my/:eventId',
  protect,
  feedbackController.getMyEventFeedback
);

// Volunteer: submit feedback for an attended event
router.post(
  '/:eventId',
  protect,
  feedbackEligibility,
  feedbackController.submitFeedback
);

// Volunteer: update own existing feedback
router.put(
  '/:feedbackId',
  protect,
  feedbackOwnerAccess,
  feedbackController.updateFeedback
);

module.exports = router;