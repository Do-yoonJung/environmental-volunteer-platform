const Attendance = require('../models/Attendance');

const feedbackEligibility = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;

    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'volunteer') {
      return res.status(403).json({
        message: 'Only volunteers can submit feedback'
      });
    }

    const attendance = await Attendance.findOne({
      eventId,
      volunteerId: req.user.id,
      status: 'present'
    });

    if (!attendance) {
      return res.status(403).json({
        message:
          'You can only submit feedback for events you attended'
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  feedbackEligibility
};