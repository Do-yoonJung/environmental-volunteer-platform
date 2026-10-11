const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const eventReminder = (registration) => {
    const volunteer = registration.volunteerId;
    const event = registration.eventId;

    const volunteerName =
        volunteer.name || 'volunteer';

    const eventTitle =
        event.title || 'the event';

    const eventDate = event.deadline
        ? new Date(event.deadline).toLocaleDateString(
            'en-AU',
            {
                timeZone: 'Australia/Brisbane'
            }
        )
        : null;

    const dateText = eventDate
        ? ` The event date is ${eventDate}.`
        : '';

    return {
        to: volunteer.email,

        subject: `Event reminder: ${eventTitle}`,

        text:
            `Hello ${volunteerName}, ` +
            `this is a reminder for ${eventTitle}.` +
            dateText,

        html:
            `<p>Hello ${escapeHtml(volunteerName)},</p>` +
            `<p>This is a reminder for ` +
            `<strong>${escapeHtml(eventTitle)}</strong>.</p>` +
            (
                eventDate
                    ? `<p>Event date: ${escapeHtml(eventDate)}</p>`
                    : ''
            )
    };
};

module.exports = {
    eventReminder
};