const assert = require('assert');
const NotificationService = require('../services/NotificationService');
const templates = require('../templates/registrationConfirmed');

describe('NotificationService', () => {
    const registration = {
        _id: 'registration-123',
        volunteerId: {
            name: 'Alex Volunteer',
            email: 'alex@example.com'
        },
        eventId: {
            title: 'Park cleanup'
        }
    };

    it('retries a failed send and records the successful delivery', async () => {
        let sendAttempts = 0;
        const logEntries = [];
        const emailSender = {
            async send(message) {
                sendAttempts += 1;
                assert.strictEqual(message.to, 'alex@example.com');

                if (sendAttempts < 3) {
                    throw new Error('Temporary SMTP failure');
                }

                return { providerMessageId: 'message-123' };
            }
        };
        const logRepo = {
            async record(entry) {
                logEntries.push(entry);
            }
        };
        const service = new NotificationService(emailSender, templates, logRepo, {
            retryDelayMs: 0
        });

        const result = await service.notifyRegistrationConfirmed(registration);

        assert.deepStrictEqual(result, { providerMessageId: 'message-123' });
        assert.strictEqual(sendAttempts, 3);
        assert.deepStrictEqual(logEntries, [{
            type: 'registration_confirmed',
            registrationId: 'registration-123',
            recipient: 'alex@example.com',
            status: 'sent',
            attempts: 3,
            providerMessageId: 'message-123'
        }]);
    });

    it('sends and records an event reminder', async () => {
        const sentMessages = [];
        const logEntries = [];
        const emailSender = {
            async send(message) {
                sentMessages.push(message);
                return { providerMessageId: 'reminder-123' };
            }
        };
        const logRepo = {
            async record(entry) {
                logEntries.push(entry);
            }
        };
        const service = new NotificationService(
            emailSender,
            {
                ...templates,
                eventReminder: () => ({
                    to: 'alex@example.com',
                    subject: 'Event reminder: Park cleanup',
                    text: 'Reminder'
                })
            },
            logRepo,
            { retryDelayMs: 0 }
        );

        await service.notifyEventReminder(registration);

        assert.strictEqual(sentMessages.length, 1);
        assert.strictEqual(sentMessages[0].to, 'alex@example.com');
        assert.deepStrictEqual(logEntries, [{
            type: 'event_reminder',
            registrationId: 'registration-123',
            recipient: 'alex@example.com',
            status: 'sent',
            attempts: 1,
            providerMessageId: 'reminder-123'
        }]);
    });

    it('records the final failure and rejects after exhausting retries', async () => {
        let sendAttempts = 0;
        const logEntries = [];
        const sendError = new Error('SMTP unavailable');
        const emailSender = {
            async send() {
                sendAttempts += 1;
                throw sendError;
            }
        };
        const logRepo = {
            async record(entry) {
                logEntries.push(entry);
            }
        };
        const service = new NotificationService(emailSender, templates, logRepo, {
            retryDelayMs: 0
        });

        await assert.rejects(
            service.notifyRegistrationConfirmed(registration),
            (error) => error === sendError
        );

        assert.strictEqual(sendAttempts, 3);
        assert.strictEqual(logEntries[0].status, 'failed');
        assert.strictEqual(logEntries[0].attempts, 3);
        assert.strictEqual(logEntries[0].error, 'SMTP unavailable');
    });

    it('escapes user-provided values in the HTML confirmation', () => {
        const message = templates.registrationConfirmed({
            volunteerId: {
                name: '<script>alert("x")</script>',
                email: 'alex@example.com'
            },
            eventId: {
                title: '<img src=x onerror=alert(1)>'
            }
        });

        assert.ok(!message.html.includes('<script>'));
        assert.ok(!message.html.includes('<img'));
        assert.ok(message.html.includes('&lt;script&gt;'));
        assert.ok(message.text.includes('<script>alert("x")</script>'));
    });
});
