const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

class AttendanceFacade {
  async getRegisteredVolunteers(coordinatorId, eventId) {
    await this.#findOwnedEvent(coordinatorId, eventId);

    const registrations = await Registration.find({
      eventId,
      status: 'registered'
    }).populate(
      'volunteerId',
      'name email university address'
    );

    const attendances = await Attendance.find({
      eventId
    });

    return registrations.map((registration) => {
      const attendance = attendances.find(
        (item) =>
          item.volunteerId.toString() ===
          registration.volunteerId._id.toString()
      );

      return {
        ...registration.toObject(),
        attendanceStatus: attendance
          ? attendance.status
          : null
      };
    });
  }

  async recordAttendance(
    coordinatorId,
    eventId,
    volunteerId,
    status
  ) {
    this.#validateStatus(status);

    await this.#findOwnedEvent(
      coordinatorId,
      eventId
    );

    await this.#findActiveRegistration(
      eventId,
      volunteerId
    );

    const existingAttendance =
      await Attendance.findOne({
        eventId,
        volunteerId
      });

    if (existingAttendance) {
      const error = new Error(
        'Attendance has already been recorded for this volunteer'
      );

      error.statusCode = 400;
      throw error;
    }

    return Attendance.create({
      eventId,
      volunteerId,
      status
    });
  }

  async updateAttendance(
    coordinatorId,
    eventId,
    volunteerId,
    status
  ) {
    this.#validateStatus(status);

    await this.#findOwnedEvent(
      coordinatorId,
      eventId
    );

    await this.#findActiveRegistration(
      eventId,
      volunteerId
    );

    const attendance =
      await Attendance.findOne({
        eventId,
        volunteerId
      });

    if (!attendance) {
      const error = new Error(
        'Attendance record not found'
      );

      error.statusCode = 404;
      throw error;
    }

    attendance.status = status;

    return attendance.save();
  }

  #validateStatus(status) {
    if (!['present', 'absent'].includes(status)) {
      const error = new Error(
        'Attendance status must be present or absent'
      );

      error.statusCode = 400;
      throw error;
    }
  }

  async #findOwnedEvent(
    coordinatorId,
    eventId
  ) {
    const event = await Event.findById(eventId);

    if (!event) {
      const error = new Error(
        'Event not found'
      );

      error.statusCode = 404;
      throw error;
    }

    if (
      event.userId.toString() !==
      coordinatorId.toString()
    ) {
      const error = new Error(
        'Not authorized to manage attendance for this event'
      );

      error.statusCode = 403;
      throw error;
    }

    return event;
  }

  async #findActiveRegistration(
    eventId,
    volunteerId
  ) {
    const registration =
      await Registration.findOne({
        eventId,
        volunteerId,
        status: 'registered'
      });

    if (!registration) {
      const error = new Error(
        'Volunteer is not actively registered for this event'
      );

      error.statusCode = 400;
      throw error;
    }

    return registration;
  }
}

module.exports = new AttendanceFacade();