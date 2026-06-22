/**
 * JWT authentication middleware.
 * Reads the token from the HttpOnly cookie, verifies it,
 * and checks that the session has not been revoked in MongoDB.
 */

import { verifyToken } from '../config/jwt.js';
import Session from '../models/Session.js';
import logger from '../utils/logger.js';

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NO_TOKEN' });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('[Auth] JWT expired', { error: err.message });
      return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    logger.warn('[Auth] JWT invalid', { error: err.message });
    return res.status(401).json({ error: 'Invalid token', code: 'TOKEN_INVALID' });
  }

  // Check session has not been revoked
  try {
    const session = await Session.findOne({ sessionId: decoded.sessionId, revoked: false });
    if (!session) {
      return res.status(401).json({ error: 'Session revoked or not found. Please log in again.', code: 'SESSION_REVOKED' });
    }
  } catch (err) {
    logger.error('[Auth] Session lookup error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }

  req.user = decoded;
  next();
};

export default authenticate;
