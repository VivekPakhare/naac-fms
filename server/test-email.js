/**
 * Quick SMTP connection test — run with: node test-email.js
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log('SMTP Config:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  Pass:', process.env.SMTP_PASS ? '***set***' : '***MISSING***');
  console.log('  From:', process.env.SMTP_FROM);
  console.log();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (err) {
    console.error('❌ SMTP connection FAILED:', err.message);
    console.error('\nFull error:', err);
    if (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted')) {
      console.log('\n💡 TIP: Gmail requires an "App Password" — not your regular password.');
      console.log('   1. Enable 2-Step Verification: https://myaccount.google.com/security');
      console.log('   2. Create App Password: https://myaccount.google.com/apppasswords');
      console.log('   3. Use the 16-character code as SMTP_PASS in .env');
    }
    return;
  }

  // Send test email
  console.log('Sending test email...');
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // send to yourself
      subject: 'NAAC FMS — SMTP Test',
      html: '<h2>✅ SMTP is working!</h2><p>Your NAAC FMS email configuration is correct.</p>',
    });
    console.log('✅ Test email sent! Message ID:', info.messageId);
    console.log('   Check your inbox at:', process.env.SMTP_USER);
  } catch (err) {
    console.error('❌ Failed to send test email:', err.message);
  }
}

test();
