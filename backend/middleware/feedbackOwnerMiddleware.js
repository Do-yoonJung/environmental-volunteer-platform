const Feedback = require('../models/Feedback');

const feedbackOwnerAccess = async (
  req,
  res,
  next
) => {
  try {
    const feedbackId = req.params.feedbackId;

    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'volunteer') {
      return res.status(403).json({
        message:
          'Only volunteers can update feedback'
      });
    }

    const feedback = await Feedback.findById(
      feedbackId
    );

    if (!feedback) {
      return res.status(404).json({
        message: 'Feedback not found'
      });
    }

    if (
      feedback.volunteerId.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          'You can only update your own feedback'
      });
    }

    req.feedback = feedback;

    next();

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  feedbackOwnerAccess
};