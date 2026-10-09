const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
      enum: ['present', 'absent'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index(
  { eventId: 1, volunteerId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);