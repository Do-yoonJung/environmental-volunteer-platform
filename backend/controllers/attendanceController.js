const attendanceFacade =
  require('../services/AttendanceFacade');

const recordAttendance = async (req, res) => {
  try {
    const { eventId, volunteerId } = req.params;
    const { status } = req.body;

    const attendance =
      await attendanceFacade.recordAttendance(
        req.user.id,
        eventId,
        volunteerId,
        status
      );

    return res
      .status(201)
      .json(attendance);

  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        message: error.message
      });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { eventId, volunteerId } = req.params;
    const { status } = req.body;

    const attendance =
      await attendanceFacade.updateAttendance(
        req.user.id,
        eventId,
        volunteerId,
        status
      );

    return res.json(attendance);

  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        message: error.message
      });
  }
};

module.exports = {
  recordAttendance,
  updateAttendance
};