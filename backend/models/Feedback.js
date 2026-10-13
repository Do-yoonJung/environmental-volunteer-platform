const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },

        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

// Prevent a volunteer from submitting feedback more than once
// for the same event
feedbackSchema.index(
    {
        eventId: 1,
        volunteerId: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    'Feedback',
    feedbackSchema
);