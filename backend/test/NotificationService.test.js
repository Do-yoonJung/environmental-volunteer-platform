const assert = require('assert');

const NotificationService = require('../services/NotificationService');
const ReminderService = require('../services/ReminderService');
const SmtpEmailAdapter = require('../services/email/SmtpEmailAdapter');
const { createEmailSender } = require('../config/email');
const { registrationConfirmed } = require('../templates/registrationConfirmed');
const { eventReminder } = require('../templates/eventReminder');
const registrationController = require('../controllers/registrationController');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const templates = { registrationConfirmed, eventReminder };

const HOUR_MS = 60 * 60 * 1000;

// Minimal stand-in for an Express response
const mockResponse = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
};

// Registration.find(...).populate(...).populate(...) is awaited directly,
// so the stub has to be chainable and thenable.
const findReturning = (registrations) => ({
    populate() { return this; },
    then(resolve, reject) {
        return Promise.resolve(registrations).then(resolve, reject);
    }
});

const buildRegistration = (overrides = {}) => ({
    _id: 'registration-123',
    status: 'registered',
    reminderSentAt: null,
    saved: false,
    volunteerId: {
        _id: 'volunteer-456',
        name: 'Alex Volunteer',
        email: 'alex@example.com',
        remindersEnabled: true
    },
    eventId: {
        _id: 'event-1',
        title: 'Park cleanup',
        deadline: new Date(Date.now() + 12 * HOUR_MS)
    },
    async save() { this.saved = true; },
    ...overrides
});

// Builds a NotificationService around a fake sender and an in-memory log
const buildService = (sendImpl, options = {}) => {
    const logEntries = [];
    const service = new NotificationService(
        { send: sendImpl },
        templates,
        { async record(entry) { logEntries.push(entry); } },
        { retryDelayMs: 0, ...options }
    );
    return { service, logEntries };
};

describe('Epic 3 - Email Notification & Reminder', () => {
    let originalConsoleError;
    let originalConsoleInfo;

    beforeEach(() => {
        // Keep expected failure logging out of the test output
        originalConsoleError = console.error;
        originalConsoleInfo = console.info;
        console.error = () => {};
        console.info = () => {};
    });

    afterEach(() => {
        console.error = originalConsoleError;
        console.info = originalConsoleInfo;
    });

    describe('Story 5 - Registration Confirmation Email (I6G4A2-11)', () => {
        it('FR-EN-01 / AC-EN-01: sends the confirmation to the volunteer and records it as sent', async () => {
            const sent = [];
            const { service, logEntries } = buildService(async (message) => {
                sent.push(message);
                return { providerMessageId: 'message-123' };
            });

            const result = await service.notifyRegistrationConfirmed(buildRegistration());

            assert.deepStrictEqual(result, { providerMessageId: 'message-123' });
            assert.strictEqual(sent.length, 1);
            assert.strictEqual(sent[0].to, 'alex@example.com');
            assert.deepStrictEqual(logEntries, [{
                type: 'registration_confirmed',
                registrationId: 'registration-123',
                volunteerId: 'volunteer-456',
                recipient: 'a***@example.com',
                status: 'sent',
                attempts: 1,
                providerMessageId: 'message-123'
            }]);
        });

        it('FR-EN-02 / AC-EN-02: confirmation carries the volunteer name, event title, date, subject and a plain-text alternative', () => {
            const message = registrationConfirmed(buildRegistration({
                eventId: { title: 'Park cleanup', deadline: '2026-11-07T22:00:00.000Z' }
            }));

            assert.strictEqual(message.to, 'alex@example.com');
            assert.strictEqual(message.subject, 'Registration confirmed: Park cleanup');
            assert.ok(message.text.includes('Alex Volunteer'));
            assert.ok(message.text.includes('Park cleanup'));
            assert.ok(message.text.includes('The event deadline is'));
            assert.ok(message.html.includes('<strong>Park cleanup</strong>'));
            assert.ok(message.html.includes('Event deadline:'));
        });

        it('FR-EN-04 / AC-EN-03: retries a failed send and records the eventual success', async () => {
            let sendAttempts = 0;
            const { service, logEntries } = buildService(async () => {
                sendAttempts += 1;
                if (sendAttempts < 3) {
                    throw new Error('Temporary SMTP failure');
                }
                return { providerMessageId: 'message-123' };
            });

            const result = await service.notifyRegistrationConfirmed(buildRegistration());

            assert.deepStrictEqual(result, { providerMessageId: 'message-123' });
            assert.strictEqual(sendAttempts, 3);
            assert.strictEqual(logEntries.length, 1);
            assert.strictEqual(logEntries[0].status, 'sent');
            assert.strictEqual(logEntries[0].attempts, 3);
        });

        it('FR-EN-04 / AC-EN-03: records the final failure and rejects after exhausting retries', async () => {
            let sendAttempts = 0;
            const sendError = new Error('SMTP unavailable');
            const { service, logEntries } = buildService(async () => {
                sendAttempts += 1;
                throw sendError;
            });

            await assert.rejects(
                service.notifyRegistrationConfirmed(buildRegistration()),
                (error) => error === sendError
            );

            assert.strictEqual(sendAttempts, 3);
            assert.strictEqual(logEntries.length, 1);
            assert.strictEqual(logEntries[0].status, 'failed');
            assert.strictEqual(logEntries[0].attempts, 3);
            assert.strictEqual(logEntries[0].error, 'SMTP unavailable');
            assert.strictEqual(logEntries[0].recipient, 'a***@example.com');
            assert.strictEqual(logEntries[0].volunteerId, 'volunteer-456');
        });

        it('FR-EN-01: a logging failure after a successful send does not fail the notification', async () => {
            const service = new NotificationService(
                { async send() { return { providerMessageId: 'message-2' }; } },
                templates,
                { async record() { throw new Error('log store down'); } },
                { retryDelayMs: 0 }
            );

            const result = await service.notifyRegistrationConfirmed(buildRegistration());

            assert.deepStrictEqual(result, { providerMessageId: 'message-2' });
        });

        describe('FR-EN-03 / AC-EN-03: registration is never blocked by email failure', () => {
            let originalEventFindById;
            let originalRegistrationFindOne;
            let originalRegistrationCreate;

            beforeEach(() => {
                originalEventFindById = Event.findById;
                originalRegistrationFindOne = Registration.findOne;
                originalRegistrationCreate = Registration.create;
            });

            afterEach(() => {
                Event.findById = originalEventFindById;
                Registration.findOne = originalRegistrationFindOne;
                Registration.create = originalRegistrationCreate;
            });

            it('returns 201 and the saved registration even when the notification service throws', async () => {
                Event.findById = async () => ({ _id: 'event-1', title: 'Park cleanup' });
                Registration.findOne = async () => null;
                Registration.create = async (doc) => ({
                    ...doc,
                    _id: 'registration-123',
                    toObject() { return { ...doc, _id: 'registration-123' }; }
                });

                const failingNotificationService = {
                    async notifyRegistrationConfirmed() { throw new Error('SMTP unavailable'); }
                };

                const req = {
                    params: { eventId: 'event-1' },
                    user: { id: 'volunteer-456', role: 'volunteer', name: 'Alex Volunteer', email: 'alex@example.com' }
                };
                const res = mockResponse();

                await registrationController.registerForEvent(req, res, failingNotificationService);

                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.body._id, 'registration-123');
                assert.strictEqual(res.body.status, 'registered');
            });

            it('re-registering after cancellation resets reminderSentAt so a fresh reminder can be sent', async () => {
                Event.findById = async () => ({ _id: 'event-1', title: 'Park cleanup' });
                const existing = {
                    _id: 'registration-123',
                    status: 'cancelled',
                    reminderSentAt: new Date('2026-10-01T00:00:00Z'),
                    async save() { this.saved = true; },
                    toObject() { return { _id: this._id, status: this.status, reminderSentAt: this.reminderSentAt }; }
                };
                Registration.findOne = async () => existing;

                let notified = false;
                const notificationService = { async notifyRegistrationConfirmed() { notified = true; } };

                const req = { params: { eventId: 'event-1' }, user: { id: 'volunteer-456', role: 'volunteer' } };
                const res = mockResponse();

                await registrationController.registerForEvent(req, res, notificationService);

                assert.strictEqual(res.statusCode, 200);
                assert.strictEqual(existing.status, 'registered');
                assert.strictEqual(existing.reminderSentAt, null);
                assert.strictEqual(existing.saved, true);
                assert.strictEqual(notified, true);
            });
        });

        describe('FR-EN-09 / NFR-EN-01: email provider is configured through the environment', () => {
            const keys = ['SMTP_ADDRESS', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
            let saved;

            beforeEach(() => {
                saved = {};
                keys.forEach((key) => { saved[key] = process.env[key]; delete process.env[key]; });
            });

            afterEach(() => {
                keys.forEach((key) => {
                    if (saved[key] === undefined) { delete process.env[key]; } else { process.env[key] = saved[key]; }
                });
            });

            it('fails fast and names every missing SMTP variable', () => {
                process.env.SMTP_ADDRESS = 'smtp.example.com';

                assert.throws(
                    () => createEmailSender(),
                    (error) =>
                        error.message.includes('Missing email configuration') &&
                        error.message.includes('SMTP_PORT') &&
                        error.message.includes('SMTP_USER') &&
                        error.message.includes('SMTP_PASSWORD') &&
                        !error.message.includes('SMTP_ADDRESS')
                );
            });

            it('builds an SmtpEmailAdapter sending from the configured user when configuration is complete', () => {
                process.env.SMTP_ADDRESS = 'smtp.example.com';
                process.env.SMTP_PORT = '587';
                process.env.SMTP_USER = 'user@example.com';
                process.env.SMTP_PASSWORD = 'secret';

                const sender = createEmailSender();

                assert.ok(sender instanceof SmtpEmailAdapter);
                assert.strictEqual(sender.from, 'user@example.com');
            });
        });

        it('NFR-EN-05: SmtpEmailAdapter translates send() into a nodemailer sendMail call', async () => {
            let mailOptions;
            const transporter = {
                async sendMail(options) { mailOptions = options; return { messageId: 'smtp-123' }; }
            };
            const adapter = new SmtpEmailAdapter(transporter, 'evp@example.com');

            const result = await adapter.send({
                to: 'alex@example.com',
                subject: 'Hello',
                html: '<p>Hi</p>',
                text: 'Hi'
            });

            assert.deepStrictEqual(mailOptions, {
                from: 'evp@example.com',
                to: 'alex@example.com',
                subject: 'Hello',
                html: '<p>Hi</p>',
                text: 'Hi'
            });
            assert.deepStrictEqual(result, { providerMessageId: 'smtp-123' });
        });

        it('NFR-EN-02 / NFR-EN-08: masks email addresses before they reach the notification log', () => {
            const { maskEmail } = NotificationService;

            assert.strictEqual(maskEmail('alex@example.com'), 'a***@example.com');
            assert.strictEqual(maskEmail('a@b.co'), 'a***@b.co');
            assert.strictEqual(maskEmail('not-an-email'), '***');
            assert.strictEqual(maskEmail(undefined), '***');
        });

        it('NFR-EN-04: escapes user-provided values in the HTML confirmation', () => {
            const message = registrationConfirmed({
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

    describe('Story 6 - Event Reminder Email (I6G4A2-77)', () => {
        let originalRegistrationFind;

        beforeEach(() => {
            originalRegistrationFind = Registration.find;
        });

        afterEach(() => {
            Registration.find = originalRegistrationFind;
        });

        const notificationSpy = () => {
            const calls = [];
            return {
                calls,
                async notifyEventReminder(registration) { calls.push(registration); }
            };
        };

        it('FR-EN-07 / AC-EN-07 & FR-EN-08 / AC-EN-08: only active registrations without a sent reminder are considered', async () => {
            let query;
            Registration.find = (q) => { query = q; return findReturning([]); };

            await new ReminderService(notificationSpy()).sendDueReminders();

            assert.deepStrictEqual(query, { status: 'registered', reminderSentAt: null });
        });

        it('FR-EN-05 / AC-EN-06: sends exactly one reminder once the event is inside the 24-hour window', async () => {
            const registration = buildRegistration({
                eventId: { title: 'Park cleanup', deadline: new Date(Date.now() + 12 * HOUR_MS) }
            });
            Registration.find = () => findReturning([registration]);
            const notifications = notificationSpy();

            const results = await new ReminderService(notifications).sendDueReminders();

            assert.strictEqual(notifications.calls.length, 1);
            assert.strictEqual(notifications.calls[0]._id, 'registration-123');
            assert.ok(registration.reminderSentAt instanceof Date);
            assert.strictEqual(registration.saved, true);
            assert.deepStrictEqual(results, [{ registrationId: 'registration-123', status: 'sent' }]);
        });

        it('FR-EN-05: does not send a reminder outside the 24-hour window', async () => {
            const tooEarly = buildRegistration({
                _id: 'too-early',
                eventId: { title: 'Park cleanup', deadline: new Date(Date.now() + 30 * HOUR_MS) }
            });
            const alreadyPassed = buildRegistration({
                _id: 'already-passed',
                eventId: { title: 'Park cleanup', deadline: new Date(Date.now() - 1 * HOUR_MS) }
            });
            Registration.find = () => findReturning([tooEarly, alreadyPassed]);
            const notifications = notificationSpy();

            const results = await new ReminderService(notifications).sendDueReminders();

            assert.strictEqual(notifications.calls.length, 0);
            assert.strictEqual(tooEarly.reminderSentAt, null);
            assert.strictEqual(alreadyPassed.reminderSentAt, null);
            assert.deepStrictEqual(results, []);
        });

        it('FR-EN-08 / AC-EN-09: skips volunteers who have turned reminders off without marking the reminder as sent', async () => {
            const registration = buildRegistration({
                volunteerId: { _id: 'volunteer-456', name: 'Alex', email: 'alex@example.com', remindersEnabled: false }
            });
            Registration.find = () => findReturning([registration]);
            const notifications = notificationSpy();

            const results = await new ReminderService(notifications).sendDueReminders();

            assert.strictEqual(notifications.calls.length, 0);
            assert.strictEqual(registration.reminderSentAt, null);
            assert.deepStrictEqual(results, [{
                registrationId: 'registration-123',
                status: 'skipped',
                reason: 'reminders disabled by volunteer'
            }]);
        });

        it('FR-EN-08: volunteers created before the preference existed still receive reminders (default on)', async () => {
            const registration = buildRegistration({
                volunteerId: { _id: 'volunteer-456', name: 'Alex', email: 'alex@example.com' }
            });
            Registration.find = () => findReturning([registration]);
            const notifications = notificationSpy();

            await new ReminderService(notifications).sendDueReminders();

            assert.strictEqual(notifications.calls.length, 1);
        });

        it('FR-EN-04 / FR-EN-07: a failed reminder is reported, left unsent for the next run, and does not stop other reminders', async () => {
            const failing = buildRegistration({ _id: 'registration-fail' });
            const healthy = buildRegistration({ _id: 'registration-ok' });
            Registration.find = () => findReturning([failing, healthy]);

            const notifications = {
                async notifyEventReminder(registration) {
                    if (registration._id === 'registration-fail') { throw new Error('SMTP unavailable'); }
                }
            };

            const results = await new ReminderService(notifications).sendDueReminders();

            assert.deepStrictEqual(results, [
                { registrationId: 'registration-fail', status: 'failed', error: 'SMTP unavailable' },
                { registrationId: 'registration-ok', status: 'sent' }
            ]);
            assert.strictEqual(failing.reminderSentAt, null);
            assert.ok(healthy.reminderSentAt instanceof Date);
        });

        it('FR-EN-02 / NFR-EN-07: reminder template renders the event date in Australia/Brisbane time with a plain-text alternative', () => {
            // 2026-11-07T22:00Z is 08:00 on 8 November in Brisbane (UTC+10, no DST)
            const message = eventReminder(buildRegistration({
                eventId: { title: 'Park cleanup', deadline: '2026-11-07T22:00:00.000Z' }
            }));

            assert.strictEqual(message.to, 'alex@example.com');
            assert.strictEqual(message.subject, 'Event reminder: Park cleanup');
            assert.ok(message.text.includes('08/11/2026'));
            assert.ok(message.html.includes('Event date: 08/11/2026'));
            assert.ok(message.text.includes('Alex Volunteer'));
        });

        it('FR-EN-05 / NFR-EN-08: sends the reminder and logs it with a masked recipient and the volunteer id', async () => {
            const sentMessages = [];
            const { service, logEntries } = buildService(async (message) => {
                sentMessages.push(message);
                return { providerMessageId: 'reminder-123' };
            });

            await service.notifyEventReminder(buildRegistration());

            assert.strictEqual(sentMessages.length, 1);
            assert.strictEqual(sentMessages[0].to, 'alex@example.com');
            assert.deepStrictEqual(logEntries, [{
                type: 'event_reminder',
                registrationId: 'registration-123',
                volunteerId: 'volunteer-456',
                recipient: 'a***@example.com',
                status: 'sent',
                attempts: 1,
                providerMessageId: 'reminder-123'
            }]);
            assert.ok(!JSON.stringify(logEntries[0]).includes('alex@example.com'));
        });
    });
});
