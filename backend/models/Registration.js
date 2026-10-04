const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
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

        status: {
            type: String,
            enum: ['registered', 'cancelled'],
            default: 'registered'
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same volunteer from registering for the same event more than once
registrationSchema.index(
    { eventId: 1, volunteerId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Registration', registrationSchema);