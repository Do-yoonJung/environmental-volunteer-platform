const EmailSender = require('./EmailSender');

class SmtpEmailAdapter extends EmailSender {
    constructor(transporter, from) {
        super();
        this.transporter = transporter;
        this.from = from;
    }

    async send({ to, subject, html, text }) {
        const info = await this.transporter.sendMail({
            from: this.from,
            to,
            subject,
            html,
            text
        });

        return { providerMessageId: info.messageId };
    }
}

module.exports = SmtpEmailAdapter;
