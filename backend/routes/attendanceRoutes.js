const express = require('express');

const {
  recordAttendance,
  updateAttendance
} = require('../controllers/attendanceController');

const {
  protect,
  coordinatorOnly
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/:eventId/:volunteerId',
  protect,
  coordinatorOnly,
  recordAttendance
);

router.put(
  '/:eventId/:volunteerId',
  protect,
  coordinatorOnly,
  updateAttendance
);

module.exports = router;