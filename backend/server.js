
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { createEmailSender } = require('./config/email');
const NotificationService = require('./services/NotificationService');
const templates = require('./templates/registrationConfirmed');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

let notificationService;
const lazyNotificationService = {
    notifyRegistrationConfirmed(registration) {
        if (!notificationService) {
            notificationService = new NotificationService(
                createEmailSender(),
                templates,
                {
                    record: async (entry) => {
                        const logMethod = entry.status === 'failed'
                            ? console.error
                            : console.info;
                        logMethod.call(console, 'Registration notification', entry);
                    }
                }
            );
        }

        return notificationService.notifyRegistrationConfirmed(registration);
    }
};

app.use(
    '/api/registrations',
    require('./routes/registrationRoutes')(lazyNotificationService)
);

// Export the app object for testing
if (require.main === module) {
    connectDB();
    // If the file is run directly, start the server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }


module.exports = app
