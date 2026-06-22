/**
 * Audit logger — writes security events to MongoDB AuditLog collection.
 * Events: LOGIN_SUCCESS, LOGIN_DENIED, LOGOUT, AUTH_FAILURE
 */

import AuditLog from '../models/AuditLog.js';
import logger from './logger.js';

export const EVENTS = {
  LOGIN_SUCCESS:  'LOGIN_SUCCESS',
  LOGIN_DENIED:   'LOGIN_DENIED',
  LOGOUT:         'LOGOUT',
  AUTH_FAILURE:   'AUTH_FAILURE',
  SESSION_EXPIRED:'SESSION_EXPIRED',
};

/**
 * @param {string} event - one of EVENTS
 * @param {object} options
 * @param {string} [options.userId]
 * @param {string} [options.email]
 * @param {string} [options.ip]
 * @param {string} [options.userAgent]
 * @param {object} [options.metadata]
 */
export const audit = async (event, { userId, email, ip, userAgent, metadata } = {}) => {
  try {
    await AuditLog.create({
      event,
      userId,
      email,
      ip,
      userAgent,
      metadata,
    });
  } catch (err) {
    // Never let audit failure break the auth flow
    logger.error('[Audit] Failed to write audit log', { error: err.message, event });
  }
};
