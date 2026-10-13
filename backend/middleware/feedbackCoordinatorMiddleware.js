const Event = require('../models/Event');

const feedbackCoordinatorAccess = async (
  req,
  res,
  next
) => {
  try {
    const eventId = req.params.eventId;

    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'coordinator') {
      return res.status(403).json({
        message:
          'Only coordinators can view event feedback'
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    if (
      event.userId.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          'You can only view feedback for events you manage'
      });
    }

    req.feedbackEvent = event;

    next();

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  feedbackCoordinatorAccess
};