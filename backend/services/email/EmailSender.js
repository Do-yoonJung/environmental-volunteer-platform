class EmailSender {
    async send() {
        throw new Error('send() must be implemented by an adapter');
    }
}

module.exports = EmailSender;
