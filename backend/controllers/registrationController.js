const Registration = require('../models/Registration');
const Event = require('../models/Event');

const registerForEvent = async (req, res) => {
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

        let registration = await Registration.findOne({
            eventId,
            volunteerId: req.user.id
        });

        if (registration) {
            if (registration.status === 'registered') {
                return res.status(400).json({
                    message: 'You are already registered for this event'
                });
            }

            registration.status = 'registered';
            await registration.save();

            return res.status(200).json(registration);
        }

        registration = await Registration.create({
            eventId,
            volunteerId: req.user.id,
            status: 'registered'
        });

        res.status(201).json(registration);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const cancelRegistration = async (req, res) => {
    try {
        const eventId = req.params.eventId;

        if (req.user.role !== 'volunteer') {
            return res.status(403).json({
                message: 'Only volunteers can cancel registrations'
            });
        }

        const registration = await Registration.findOne({
            eventId,
            volunteerId: req.user.id
        });

        if (!registration || registration.status !== 'registered') {
            return res.status(404).json({
                message: 'Active registration not found'
            });
        }

        registration.status = 'cancelled';
        await registration.save();

        res.json({
            message: 'Registration cancelled successfully',
            registration
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getMyRegistrations = async (req, res) => {
    try {
        if (req.user.role !== 'volunteer') {
            return res.status(403).json({
                message: 'Only volunteers can view their registrations'
            });
        }

        const registrations = await Registration.find({
            volunteerId: req.user.id
        });

        res.json(registrations);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getEventRegistrations = async (req, res) => {
    try {
        const eventId = req.params.eventId;

        if (req.user.role !== 'coordinator') {
            return res.status(403).json({
                message: 'Coordinator access only'
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
                message: 'Not authorized to view registrations for this event'
            });
        }

        const registrations = await Registration.find({
            eventId,
            status: 'registered'
        }).populate(
            'volunteerId',
            'name email university address'
        );

        res.json(registrations);

    } catch (error) {
        res.status(500).json({
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