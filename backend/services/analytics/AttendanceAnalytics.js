const Registration =
  require('../../models/Registration');

const Attendance =
  require('../../models/Attendance');

class AttendanceAnalytics {
  async calculate(eventId) {
    const registered =
      await Registration.countDocuments({
        eventId,
        status: 'registered'
      });

    const present =
      await Attendance.countDocuments({
        eventId,
        status: 'present'
      });

    const absent =
      await Attendance.countDocuments({
        eventId,
        status: 'absent'
      });

    const attendanceRate =
      registered > 0
        ? Number(
            (
              (present / registered) *
              100
            ).toFixed(2)
          )
        : null;

    return {
      registered,
      present,
      absent,
      attendanceRate,
      hasAttendanceData:
        present + absent > 0
    };
  }
}

module.exports = AttendanceAnalytics;