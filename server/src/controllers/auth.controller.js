const authService = require('../services/auth.service');
const { logActivity } = require('../utils/activityLogger');

/**
 * POST /api/auth/register
 * Register a new teacher account.
 */
async function register(req, res, next) {
  try {
    const { full_name, email, password, department, designation, subjects_taught } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const result = await authService.registerUser({
      fullName: full_name,
      email: email.toLowerCase().trim(),
      password,
      department: department || null,
      designation: designation || null,
      subjectsTaught: subjects_taught || null,
    });

    // Log activity
    const clientIp = req.ip || req.connection?.remoteAddress;
    await logActivity({
      userId: result.user.id,
      action: 'USER_REGISTERED',
      targetType: 'user',
      targetId: result.user.id,
      description: `New teacher registered: ${result.user.email}`,
      ipAddress: clientIp,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const result = await authService.loginUser({
      email: email.toLowerCase().trim(),
      password,
    });

    // Log activity
    const clientIp = req.ip || req.connection?.remoteAddress;
    await logActivity({
      userId: result.user.id,
      action: 'USER_LOGIN',
      targetType: 'user',
      targetId: result.user.id,
      description: `User logged in: ${result.user.email} (${result.user.role})`,
      ipAddress: clientIp,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get the authenticated user's profile.
 */
async function getMe(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 * Update the authenticated user's profile.
 */
async function updateProfile(req, res, next) {
  try {
    const { full_name, department, designation, subjects_taught } = req.body;

    const user = await authService.updateUserProfile(req.user.id, {
      fullName: full_name,
      department,
      designation,
      subjectsTaught: subjects_taught,
    });

    // Log activity
    const clientIp = req.ip || req.connection?.remoteAddress;
    await logActivity({
      userId: req.user.id,
      action: 'PROFILE_UPDATED',
      targetType: 'user',
      targetId: req.user.id,
      description: `Profile updated by ${user.email}`,
      ipAddress: clientIp,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
}

module.exports = { register, login, getMe, updateProfile };
