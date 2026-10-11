const nodemailer = require('nodemailer');
const SmtpEmailAdapter = require('../services/email/SmtpEmailAdapter');

const createEmailSender = () => {
    const requiredVariables = [
        'SMTP_ADDRESS',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASSWORD'
    ];
    const missingVariables = requiredVariables.filter(
        (name) => !process.env[name]
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing email configuration: ${missingVariables.join(', ')}`
        );
    }

    const port = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be an integer between 1 and 65535');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_ADDRESS,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

    return new SmtpEmailAdapter(transporter, process.env.SMTP_USER);
};

module.exports = { createEmailSender };
