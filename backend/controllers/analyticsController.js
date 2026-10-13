const analyticsService =
  require('../services/AnalyticsService');

const getEventSummary = async (
  req,
  res
) => {
  try {
    const event =
      req.analyticsEvent;

    const summary =
      await analyticsService
        .getEventSummary(
          event._id
        );

    return res.json({
      event: {
        _id: event._id,
        title: event.title
      },

      attendance:
        summary.attendance,

      feedback:
        summary.feedback
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getEventSummary
};