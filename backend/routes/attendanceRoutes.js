const express = require('express');

const {
  recordAttendance
} = require('../controllers/attendanceController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/:eventId/:volunteerId',
  protect,
  recordAttendance
);

module.exports = router;