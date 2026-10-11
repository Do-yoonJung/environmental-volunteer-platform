const cron = require('node-cron');
const ReminderService = require('../services/ReminderService');

const startReminderScheduler = (notificationService) => {
    const reminderService =
        new ReminderService(notificationService);

    const checkForReminders = async () => {
        try {
            const results =
                await reminderService.sendDueReminders();

            console.log('Reminder scheduler check completed:', {
                remindersProcessed: results.length,
                results
            });
        } catch (error) {
            console.error(
                'Reminder scheduler failed:',
                error.message
            );
        }
    };

    cron.schedule('*/5 * * * *', checkForReminders);

    console.log(
        'Event reminder scheduler started'
    );

    checkForReminders();
};

module.exports = startReminderScheduler;