const Registration = require('../models/Registration');

class ReminderService {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }

    async sendDueReminders() {
        const now = new Date();

        const registrations = await Registration.find({
            status: 'registered',
            reminderSentAt: null
        })
            .populate('eventId')
            .populate('volunteerId');

        const results = [];

        for (const registration of registrations) {
            const event = registration.eventId;
            const volunteer = registration.volunteerId;

            if (!event || !volunteer) {
                continue;
            }

            if (!event.deadline) {
                continue;
            }

            // FR-EN-08: respect the volunteer's reminder preference.
            // Confirmation emails are unaffected; only reminders are skipped.
            if (volunteer.remindersEnabled === false) {
                results.push({
                    registrationId: registration._id,
                    status: 'skipped',
                    reason: 'reminders disabled by volunteer'
                });
                continue;
            }

            const deadline = new Date(event.deadline);

            const reminderTime = new Date(
                 deadline.getTime() - (24 * 60 * 60 * 1000)
            );
            /*
            const reminderTime = new Date(
                deadline.getTime() - (48 * 60 * 60 * 1000)
            )*/;

            const shouldSendReminder =
                now >= reminderTime &&
                now < deadline;

            if (!shouldSendReminder) {
                continue;
            }

            try {
                await this.notificationService
                    .notifyEventReminder(registration);

                registration.reminderSentAt =
                    new Date();

                await registration.save();

                results.push({
                    registrationId:
                        registration._id,
                    status: 'sent'
                });

            } catch (error) {
                console.error(
                    'Failed to send event reminder',
                    {
                        registrationId:
                            registration._id,
                        error: error.message
                    }
                );

                results.push({
                    registrationId:
                        registration._id,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = ReminderService;