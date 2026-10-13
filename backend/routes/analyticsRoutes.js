const express =
  require('express');

const analyticsController =
  require(
    '../controllers/analyticsController'
  );

const {
  protect
} = require(
  '../middleware/authMiddleware'
);

const {
  analyticsAccess
} = require(
  '../middleware/analyticsAccessMiddleware'
);

const router =
  express.Router();

router.get(
  '/event/:eventId',
  protect,
  analyticsAccess,
  analyticsController
    .getEventSummary
);

module.exports = router;