'use strict';
/**
 * JWT helpers — original Classplus pattern: HS384, x-access-token header
 */
const jwt = require('jsonwebtoken');

// Dev secret — prod mein env var hoga
const SECRET = process.env.JWT_SECRET || 'apna-class-plus-dev-secret';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

function signAccess(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role, type: 'access' },
    SECRET,
    { expiresIn: ACCESS_TTL, algorithm: 'HS384' }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, type: 'refresh' },
    SECRET,
    { expiresIn: REFRESH_TTL, algorithm: 'HS384' }
  );
}

function verify(token) {
  return jwt.verify(token, SECRET, { algorithms: ['HS384'] });
}

module.exports = { signAccess, signRefresh, verify };
