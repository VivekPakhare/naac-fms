const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'naac-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
