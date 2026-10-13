const AnalyticsFactory =
  require('./analytics/AnalyticsFactory');

class AnalyticsService {
  async getEventSummary(eventId) {
    const attendanceAnalytics =
      AnalyticsFactory.create(
        'attendance'
      );

    const feedbackAnalytics =
      AnalyticsFactory.create(
        'feedback'
      );

    const [
      attendance,
      feedback
    ] = await Promise.all([
      attendanceAnalytics.calculate(
        eventId
      ),
      feedbackAnalytics.calculate(
        eventId
      )
    ]);

    return {
      attendance,
      feedback
    };
  }
}

module.exports =
  new AnalyticsService();