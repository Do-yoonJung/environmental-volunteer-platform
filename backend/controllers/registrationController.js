const Registration = require('../models/Registration');
const Event = require('../models/Event');

const attendanceFacade =
  require('../services/AttendanceFacade');

const registerForEvent = async (
  req,
  res,
  notificationService
) => {
  try {
    const eventId = req.params.eventId;

    if (req.user.role !== 'volunteer') {
      return res.status(403).json({
        message: 'Only volunteers can register for events'
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    let registration =
      await Registration.findOne({
        eventId,
        volunteerId: req.user.id
      });

    if (registration) {
      if (
        registration.status === 'registered'
      ) {
        return res.status(400).json({
          message:
            'You are already registered for this event'
        });
      }

      registration.status = 'registered';
      await registration.save();

      await notifyRegistrationConfirmed(
        notificationService,
        registration,
        event,
        req.user
      );

      return res
        .status(200)
        .json(registration);
    }

    registration =
      await Registration.create({
        eventId,
        volunteerId: req.user.id,
        status: 'registered'
      });

    await notifyRegistrationConfirmed(
      notificationService,
      registration,
      event,
      req.user
    );

    return res
      .status(201)
      .json(registration);

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

const notifyRegistrationConfirmed = async (
  notificationService,
  registration,
  event,
  volunteer
) => {
  try {
    if (!notificationService) {
      throw new Error(
        'Notification service is not configured'
      );
    }

    await notificationService
      .notifyRegistrationConfirmed({
        ...registration.toObject(),
        eventId: event,
        volunteerId: volunteer
      });

  } catch (error) {
    console.error(
      'Registration succeeded, but confirmation notification failed',
      error
    );
  }
};

const cancelRegistration = async (
  req,
  res
) => {
  try {
    const eventId = req.params.eventId;

    if (req.user.role !== 'volunteer') {
      return res.status(403).json({
        message:
          'Only volunteers can cancel registrations'
      });
    }

    const registration =
      await Registration.findOne({
        eventId,
        volunteerId: req.user.id
      });

    if (
      !registration ||
      registration.status !== 'registered'
    ) {
      return res.status(404).json({
        message:
          'Active registration not found'
      });
    }

    registration.status = 'cancelled';

    await registration.save();

    return res.json({
      message:
        'Registration cancelled successfully',
      registration
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

const getMyRegistrations = async (
  req,
  res
) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({
        message:
          'Only volunteers can view their registrations'
      });
    }

    const registrations =
      await Registration.find({
        volunteerId: req.user.id
      });

    return res.json(registrations);

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

const getEventRegistrations = async (
  req,
  res
) => {
  try {
    const registrations =
      await attendanceFacade.getRegisteredVolunteers(
        req.user.id,
        req.params.eventId
      );

    return res.json(registrations);

  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        message: error.message
      });
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventRegistrations
};