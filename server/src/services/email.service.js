const { transporter, MAIL_FROM } = require('../config/mailer');

/**
 * Send a verification OTP email for new account registration.
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @param {string} otp - 6-digit OTP code
 */
async function sendVerificationOtp(email, fullName, otp) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">college accreditation & document workflow platform</h1>
        <p style="color: #d1fae5; margin: 4px 0 0; font-size: 13px;">Email Verification</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #e2e8f0; font-size: 15px; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">Use the following 6-digit code to verify your email address. This code expires in <strong style="color: #e2e8f0;">15 minutes</strong>.</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #34d399;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't create an account on college accreditation & document workflow platform, you can safely ignore this email.</p>
      </div>
      <div style="background: #1e293b; padding: 16px 32px; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NAAC File Management System</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: MAIL_FROM,
    to: email,
    subject: 'Verify Your Email — college accreditation & document workflow platform',
    html,
  });
}

/**
 * Send a password reset OTP email.
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @param {string} otp - 6-digit OTP code
 */
async function sendPasswordResetOtp(email, fullName, otp) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">college accreditation & document workflow platform</h1>
        <p style="color: #e0e7ff; margin: 4px 0 0; font-size: 13px;">Password Reset</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #e2e8f0; font-size: 15px; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">We received a request to reset your password. Use the following 6-digit code. This code expires in <strong style="color: #e2e8f0;">15 minutes</strong>.</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #818cf8;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
      <div style="background: #1e293b; padding: 16px 32px; text-align: center;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NAAC File Management System</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: MAIL_FROM,
    to: email,
    subject: 'Reset Your Password — college accreditation & document workflow platform',
    html,
  });
}

module.exports = { sendVerificationOtp, sendPasswordResetOtp };

