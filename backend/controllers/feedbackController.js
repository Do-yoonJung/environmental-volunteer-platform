const Feedback = require('../models/Feedback');
const Event = require('../models/Event');

const submitFeedback = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const volunteerId = req.user.id;
    const { rating, comment } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    const existingFeedback = await Feedback.findOne({
      eventId,
      volunteerId
    });

    if (existingFeedback) {
      return res.status(400).json({
        message:
          'You have already submitted feedback for this event'
      });
    }

    const feedback = await Feedback.create({
      eventId,
      volunteerId,
      rating: numericRating,
      comment:
        typeof comment === 'string'
          ? comment.trim()
          : ''
    });

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          'You have already submitted feedback for this event'
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  submitFeedback
};