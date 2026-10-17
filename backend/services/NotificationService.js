// NFR-EN-02 / NFR-EN-08: never write a full email address to the log.
// 'alex@example.com' -> 'a***@example.com'
const maskEmail = (email) => {
    if (typeof email !== 'string' || !email.includes('@')) {
        return '***';
    }

    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
};

// Registrations may arrive with volunteerId populated (a User document)
// or as a bare ObjectId; log the id either way.
const extractVolunteerId = (registration) => {
    const volunteer = registration && registration.volunteerId;

    if (!volunteer) {
        return null;
    }

    return String(volunteer._id || volunteer);
};

class NotificationService {
    constructor(emailSender, templates, logRepo, options = {}) {
        this.emailSender = emailSender;
        this.templates = templates;
        this.logRepo = logRepo;
        this.maxAttempts = options.maxAttempts || 3;
        this.retryDelayMs = options.retryDelayMs ?? 250;
    }

    async notifyRegistrationConfirmed(registration) {
        const message =
            this.templates.registrationConfirmed(registration);

        return this.sendWithRetry(
            message,
            registration,
            'registration_confirmed'
        );
    }

    async notifyEventReminder(registration) {
        const message =
            this.templates.eventReminder(registration);

        return this.sendWithRetry(
            message,
            registration,
            'event_reminder'
        );
    }

    async sendWithRetry(message, registration, notificationType) {
        let lastError;

        for (
            let attempt = 1;
            attempt <= this.maxAttempts;
            attempt += 1
        ) {
            let result;

            try {
                result = await this.emailSender.send(message);
            } catch (error) {
                lastError = error;

                if (attempt < this.maxAttempts) {
                    await new Promise((resolve) => {
                        setTimeout(
                            resolve,
                            this.retryDelayMs *
                                (2 ** (attempt - 1))
                        );
                    });

                    continue;
                }

                try {
                    await this.logRepo.record({
                        type: notificationType,
                        registrationId: registration._id,
                        volunteerId: extractVolunteerId(registration),
                        recipient: maskEmail(message.to),
                        status: 'failed',
                        attempts: attempt,
                        error: error.message
                    });
                } catch (logError) {
                    console.error(
                        'Failed to record notification delivery failure',
                        logError
                    );
                }

                throw lastError;
            }

            try {
                await this.logRepo.record({
                    type: notificationType,
                    registrationId: registration._id,
                    volunteerId: extractVolunteerId(registration),
                    recipient: maskEmail(message.to),
                    status: 'sent',
                    attempts: attempt,
                    providerMessageId:
                        result &&
                        result.providerMessageId
                });
            } catch (logError) {
                console.error(
                    'Email was sent, but its successful delivery could not be recorded',
                    logError
                );
            }

            return result;
        }

        throw lastError;
    }
}

module.exports = NotificationService;
module.exports.maskEmail = maskEmail;