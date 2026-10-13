const Feedback =
  require('../../models/Feedback');

class FeedbackAnalytics {
  async calculate(eventId) {
    const feedback =
      await Feedback.find({
        eventId
      }).select('rating');

    const feedbackCount =
      feedback.length;

    let averageRating = null;

    if (feedbackCount > 0) {
      const totalRating =
        feedback.reduce(
          (total, item) =>
            total + item.rating,
          0
        );

      averageRating = Number(
        (
          totalRating /
          feedbackCount
        ).toFixed(2)
      );
    }

    return {
      feedbackCount,
      averageRating,
      hasFeedbackData:
        feedbackCount > 0
    };
  }
}

module.exports = FeedbackAnalytics;