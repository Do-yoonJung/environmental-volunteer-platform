
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    deadline: { type: Date },
});

module.exports = mongoose.model('Event', eventSchema);
