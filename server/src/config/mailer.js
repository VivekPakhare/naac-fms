const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter — configured from SMTP env vars.
 * Uses Gmail SMTP by default (port 587, STARTTLS).
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Default "from" address for all outgoing emails.
 */
const MAIL_FROM = process.env.SMTP_FROM || 'college accreditation & document workflow platform <noreply@naac.edu>';

module.exports = { transporter, MAIL_FROM };

