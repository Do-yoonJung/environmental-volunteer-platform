const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const registrationConfirmed = (registration) => {
    const volunteer = registration.volunteerId;
    const event = registration.eventId;
    const volunteerName = volunteer.name || 'volunteer';
    const eventTitle = event.title || 'the event';
    const eventDate = event.deadline
        ? new Date(event.deadline).toLocaleDateString()
        : null;
    const dateText = eventDate ? ` The event deadline is ${eventDate}.` : '';

    return {
        to: volunteer.email,
        subject: `Registration confirmed: ${eventTitle}`,
        text: `Hello ${volunteerName}, your registration for ${eventTitle} is confirmed.${dateText}`,
        html: `<p>Hello ${escapeHtml(volunteerName)},</p>` +
            `<p>Your registration for <strong>${escapeHtml(eventTitle)}</strong> is confirmed.</p>` +
            (eventDate ? `<p>Event deadline: ${escapeHtml(eventDate)}</p>` : '')
    };
};

module.exports = { registrationConfirmed };
