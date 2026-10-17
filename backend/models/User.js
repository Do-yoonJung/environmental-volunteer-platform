
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{
        type: String,
        enum: ['volunteer', 'coordinator'],
        default: 'volunteer'
    },
    university: { type: String },
    address: { type: String },
    // Story 6 (FR-EN-08): volunteers can turn event reminder emails off.
    // Confirmation emails are always sent regardless of this flag.
    remindersEnabled: { type: Boolean, default: true },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
