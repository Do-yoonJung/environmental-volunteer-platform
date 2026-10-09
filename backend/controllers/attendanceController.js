const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const recordAttendance = async (req, res) => {
  try {
    const { eventId, volunteerId } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'coordinator') {
      return res.status(403).json({
        message: 'Coordinator access only'
      });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({
        message: 'Attendance status must be present or absent'
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    if (event.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to manage attendance for this event'
      });
    }

    const registration = await Registration.findOne({
      eventId,
      volunteerId,
      status: 'registered'
    });

    if (!registration) {
      return res.status(400).json({
        message: 'Volunteer is not actively registered for this event'
      });
    }

    const existingAttendance = await Attendance.findOne({
      eventId,
      volunteerId
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: 'Attendance has already been recorded for this volunteer'
      });
    }

    const attendance = await Attendance.create({
      eventId,
      volunteerId,
      status
    });

    res.status(201).json(attendance);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  recordAttendance
};