const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const { createEmailSender } = require('./config/email');

const NotificationService =
    require('./services/NotificationService');

const startReminderScheduler =
    require('./scheduler/reminderScheduler');

const {
    registrationConfirmed
} = require('./templates/registrationConfirmed');

const {
    eventReminder
} = require('./templates/eventReminder');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    '/api/auth',
    require('./routes/authRoutes')
);

app.use(
    '/api/events',
    require('./routes/eventRoutes')
);

let notificationService;

const templates = {
    registrationConfirmed,
    eventReminder
};

const getNotificationService = () => {
    if (!notificationService) {
        notificationService =
            new NotificationService(
                createEmailSender(),
                templates,
                {
                    record: async (entry) => {
                        const logMethod =
                            entry.status === 'failed'
                                ? console.error
                                : console.info;

                        logMethod.call(
                            console,
                            'Notification',
                            entry
                        );
                    }
                }
            );
    }

    return notificationService;
};

const lazyNotificationService = {
    notifyRegistrationConfirmed(registration) {
        return getNotificationService()
            .notifyRegistrationConfirmed(
                registration
            );
    },

    notifyEventReminder(registration) {
        return getNotificationService()
            .notifyEventReminder(
                registration
            );
    }
};

app.use(
    '/api/registrations',
    require('./routes/registrationRoutes')(
        lazyNotificationService
    )
);

app.use(
    '/api/attendance',
    require('./routes/attendanceRoutes')
);

app.use(
    '/api/feedback',
    require('./routes/feedbackRoutes')
);

app.use(
    '/api/analytics',
    require('./routes/analyticsRoutes')
);

if (require.main === module) {
    connectDB();

    startReminderScheduler(
        lazyNotificationService
    );

    const PORT =
        process.env.PORT || 5001;

    app.listen(
        PORT,
        () =>
            console.log(
                `Server running on port ${PORT}`
            )
    );
}

module.exports = app;