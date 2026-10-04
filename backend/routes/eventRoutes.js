const express = require('express');
const {
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

const {
    protect,
    coordinatorOnly
} = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getEvents)
    .post(protect, coordinatorOnly, addEvent);

router.route('/:id')
    .put(protect, coordinatorOnly, updateEvent)
    .delete(protect, coordinatorOnly, deleteEvent);

module.exports = router;