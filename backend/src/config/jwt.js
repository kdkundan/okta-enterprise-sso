/**
 * JWT utility — sign and verify tokens.
 * Tokens are issued after successful SAML validation and stored
 * in an HttpOnly cookie to prevent XSS access.
 */

import jwt from 'jsonwebtoken';

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return process.env.JWT_SECRET;
};

/**
 * Sign a JWT containing the normalized user payload.
 * @param {object} payload - normalized user object
 * @returns {string} signed JWT
 */
export const signToken = (payload) => {
  return jwt.sign(payload, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'okta-saml-enterprise-sso',
    audience: 'enterprise-app',
  });
};

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, secret(), {
    issuer: 'okta-saml-enterprise-sso',
    audience: 'enterprise-app',
  });
};
