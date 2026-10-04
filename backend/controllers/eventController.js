const Event = require('../models/Event');

const getEvents = async (req, res) => {
    try {
        let events;

        if (req.user.role === 'coordinator') {
            events = await Event.find({ userId: req.user.id });
        } else {
            events = await Event.find();
        }

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addEvent = async (req, res) => {
    const { title, description, deadline } = req.body;
    try {
        const event = await Event.create({ userId: req.user.id, title, description, deadline });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateEvent = async (req, res) => {
    const { title, description, completed, deadline } = req.body;

    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        event.title = title || event.title;
        event.description = description || event.description;
        event.completed = completed ?? event.completed;
        event.deadline = deadline || event.deadline;

        const updatedEvent = await event.save();

        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found to delete' });
        }

        if (event.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();

        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getEvents, addEvent, updateEvent, deleteEvent };
