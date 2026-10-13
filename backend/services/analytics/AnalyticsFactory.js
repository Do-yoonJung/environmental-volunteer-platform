const AttendanceAnalytics =
  require('./AttendanceAnalytics');

const FeedbackAnalytics =
  require('./FeedbackAnalytics');

class AnalyticsFactory {
  static create(type) {
    switch (type) {
      case 'attendance':
        return new AttendanceAnalytics();

      case 'feedback':
        return new FeedbackAnalytics();

      default:
        throw new Error(
          `Unsupported analytics type: ${type}`
        );
    }
  }
}

module.exports = AnalyticsFactory;