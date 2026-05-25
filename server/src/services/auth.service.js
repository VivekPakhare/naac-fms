const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { checkDeadlineNotifications } = require('../controllers/notification.controller');
const { sendVerificationOtp, sendPasswordResetOtp } = require('./email.service');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 15;

// Fields to never return to the client
const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  department: true,
  designation: true,
  subjectsTaught: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Generate a random 6-digit OTP string.
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Register a new teacher account.
 * HOD accounts are pre-seeded and cannot be registered via API.
 * Does NOT return a JWT — user must verify their email first.
 */
async function registerUser({ fullName, email, password, department, designation, subjectsTaught }) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate verification OTP
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Create user (role is always 'teacher' for self-registration)
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: 'teacher',
      department: department || null,
      designation: designation || null,
      subjectsTaught: subjectsTaught || null,
      isActive: true,
      emailVerified: false,
      verificationOtp: otp,
      otpExpiresAt,
    },
    select: USER_SELECT,
  });

  // Send verification email (non-blocking error handling)
  try {
    await sendVerificationOtp(email, fullName, otp);
  } catch (err) {
    console.error('[AUTH] Failed to send verification email:', err.message);
  }

  return { user, requiresVerification: true };
}

/**
 * Verify a user's email using the 6-digit OTP.
 * Returns JWT token on success.
 */
async function verifyOtp(email, otp) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('No account found with this email.');
    error.status = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error('Email is already verified.');
    error.status = 400;
    throw error;
  }

  if (!user.verificationOtp || user.verificationOtp !== otp) {
    const error = new Error('Invalid OTP. Please check and try again.');
    error.status = 400;
    throw error;
  }

  if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
    const error = new Error('OTP has expired. Please request a new one.');
    error.status = 400;
    throw error;
  }

  // Mark email as verified and clear OTP fields
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationOtp: null,
      otpExpiresAt: null,
    },
    select: USER_SELECT,
  });

  const token = generateToken(updatedUser);

  return { user: updatedUser, token };
}

/**
 * Resend verification OTP for an unverified account.
 */
async function resendOtp(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('No account found with this email.');
    error.status = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error('Email is already verified.');
    error.status = 400;
    throw error;
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationOtp: otp, otpExpiresAt },
  });

  try {
    await sendVerificationOtp(email, user.fullName, otp);
  } catch (err) {
    console.error('[AUTH] Failed to resend verification email:', err.message);
  }

  return { message: 'Verification OTP resent successfully.' };
}

/**
 * Initiate forgot-password flow — send reset OTP.
 */
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal whether the email exists (security)
    return { message: 'If an account with that email exists, a reset code has been sent.' };
  }

  const otp = generateOtp();
  const resetOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetOtp: otp, resetOtpExpiresAt },
  });

  try {
    await sendPasswordResetOtp(email, user.fullName, otp);
  } catch (err) {
    console.error('[AUTH] Failed to send password reset email:', err.message);
  }

  return { message: 'If an account with that email exists, a reset code has been sent.' };
}

/**
 * Reset password using a valid reset OTP.
 */
async function resetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('No account found with this email.');
    error.status = 404;
    throw error;
  }

  if (!user.resetOtp || user.resetOtp !== otp) {
    const error = new Error('Invalid reset code. Please check and try again.');
    error.status = 400;
    throw error;
  }

  if (!user.resetOtpExpiresAt || new Date() > user.resetOtpExpiresAt) {
    const error = new Error('Reset code has expired. Please request a new one.');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetOtp: null,
      resetOtpExpiresAt: null,
    },
  });

  return { message: 'Password reset successfully. Please login with your new password.' };
}

/**
 * Authenticate a user with email and password.
 */
async function loginUser({ email, password }) {
  // Find user by email (include passwordHash for verification)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  console.log(`[AUTH] Login attempt for: ${email} — User found: ${!!user}`);

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  if (!user.isActive) {
    console.log(`[AUTH] Account deactivated: ${email}`);
    const error = new Error('Account has been deactivated. Contact the administrator.');
    error.status = 403;
    throw error;
  }

  // Check email verification
  if (!user.emailVerified) {
    console.log(`[AUTH] Email not verified: ${email}`);
    const error = new Error('Please verify your email before logging in.');
    error.status = 403;
    error.requiresVerification = true;
    error.userEmail = email;
    throw error;
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(`[AUTH] Password match for ${email}: ${isMatch}`);

  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken(user);
  console.log(`[AUTH] JWT generated for ${email} (${user.role})`);

  // Check deadline-based notifications (non-blocking)
  checkDeadlineNotifications(user.id).catch(() => {});

  // Return user without passwordHash
  const { passwordHash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Get a user's profile by ID.
 */
async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  return user;
}

/**
 * Update a user's profile.
 * Cannot change: email, role, passwordHash.
 */
async function updateUserProfile(userId, updates) {
  // Whitelist allowed fields
  const allowedFields = ['fullName', 'department', 'designation', 'subjectsTaught'];
  const data = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  if (Object.keys(data).length === 0) {
    const error = new Error('No valid fields to update.');
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  });

  return user;
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  generateToken,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
};
