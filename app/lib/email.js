"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = (from, to, subject, message, html = false) => {
    if (Array.isArray(to))
        to = to.join(', ');
    if (!process.env.SMTP_URL) {
        throw new Error('SMTP_URL is not set.');
    }
    const smtpUrl = new URL(process.env.SMTP_URL || '');
    if (['smtp:', 'smtps:'].indexOf(smtpUrl.protocol) < 0) {
        throw new Error('Protocol in SMTP_URL is invalid. Expecting "smtps" or "smtp".');
    }
    const transporter = nodemailer_1.default.createTransport({
        host: smtpUrl.hostname,
        port: parseInt(smtpUrl.port || smtpUrl.protocol == 'smtps:' ? '465' : '25'),
        secure: (smtpUrl.protocol == 'smtps:') || smtpUrl.port === '465',
        auth: {
            user: smtpUrl.username,
            pass: smtpUrl.password,
        }
    });
    return transporter.sendMail({
        from,
        bcc: process.env.SMTP_TEST_RECIPIENTS || to,
        subject,
        text: !html ? message : undefined,
        html: html ? message : undefined,
    });
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map