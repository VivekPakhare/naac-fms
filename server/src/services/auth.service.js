const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { checkDeadlineNotifications } = require('../controllers/notification.controller');

const SALT_ROUNDS = 12;

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
    },
    select: USER_SELECT,
  });

  const token = generateToken(user);

  return { user, token };
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
};
