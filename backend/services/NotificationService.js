class NotificationService {
    constructor(emailSender, templates, logRepo, options = {}) {
        this.emailSender = emailSender;
        this.templates = templates;
        this.logRepo = logRepo;
        this.maxAttempts = options.maxAttempts || 3;
        this.retryDelayMs = options.retryDelayMs ?? 250;
    }

    async notifyRegistrationConfirmed(registration) {
        const message = this.templates.registrationConfirmed(registration);
        let lastError;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
            let result;

            try {
                result = await this.emailSender.send(message);
            } catch (error) {
                lastError = error;

                if (attempt < this.maxAttempts) {
                    await new Promise((resolve) => {
                        setTimeout(resolve, this.retryDelayMs * (2 ** (attempt - 1)));
                    });
                    continue;
                }

                try {
                    await this.logRepo.record({
                        type: 'registration_confirmed',
                        registrationId: registration._id,
                        recipient: message.to,
                        status: 'failed',
                        attempts: attempt,
                        error: error.message
                    });
                } catch (logError) {
                    console.error('Failed to record notification delivery failure', logError);
                }

                throw lastError;
            }

            try {
                await this.logRepo.record({
                    type: 'registration_confirmed',
                    registrationId: registration._id,
                    recipient: message.to,
                    status: 'sent',
                    attempts: attempt,
                    providerMessageId: result && result.providerMessageId
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
