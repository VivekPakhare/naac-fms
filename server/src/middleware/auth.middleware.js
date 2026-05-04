const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { prisma } = require('../config/db');

/**
 * Middleware: authenticateToken
 * Validates JWT from the Authorization: Bearer <token> header.
 * Attaches req.user = { id, email, role, fullName, department, isActive }
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists and is active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        department: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact the administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

/**
 * Middleware: requireRole
 * Checks that the authenticated user has one of the specified roles.
 *
 * Usage: requireRole('hod') or requireRole('teacher', 'hod')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
};

/**
 * Middleware: requireOwnership
 * Ensures a teacher can only access their own data.
 * HODs bypass this check (they can access any record).
 *
 * Looks up the record by req.params.id in the given Prisma model,
 * then compares the record's teacherId (or userId) with req.user.id.
 *
 * Usage: requireOwnership('formSubmission') or requireOwnership('uploadedDocument')
 *
 * @param {string} modelName — Prisma model name (camelCase, e.g. 'formSubmission')
 * @param {string} [ownerField='teacherId'] — field name that stores the owner's user ID
 */
const requireOwnership = (modelName, ownerField = 'teacherId') => {
  return async (req, res, next) => {
    try {
      // HODs can access any data
      if (req.user.role === 'hod') {
        return next();
      }

      const recordId = req.params.id;
      if (!recordId) {
        return res.status(400).json({
          success: false,
          message: 'Record ID is required.',
        });
      }

      const record = await prisma[modelName].findUnique({
        where: { id: recordId },
        select: { [ownerField]: true },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Record not found.',
        });
      }

      if (record[ownerField] !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own data.',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authenticateToken, requireRole, requireOwnership };
