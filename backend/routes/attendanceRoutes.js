const express = require('express');

const {
  recordAttendance,
  updateAttendance
} = require('../controllers/attendanceController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/:eventId/:volunteerId',
  protect,
  recordAttendance
);

router.put(
  '/:eventId/:volunteerId',
  protect,
  updateAttendance
);

module.exports = router;