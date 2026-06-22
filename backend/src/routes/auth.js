/**
 * Auth routes:
 *  GET  /auth/saml/login    — initiates SAML SP-initiated SSO flow
 *  POST /auth/saml/callback — ACS endpoint; Okta POSTs SAMLResponse here
 *  GET  /auth/me            — returns current user from JWT cookie
 *  POST /auth/logout        — clears cookie + revokes session in DB
 */

import express from 'express';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';
import { signToken } from '../config/jwt.js';
import authenticate from '../middleware/authenticate.js';
import Session from '../models/Session.js';
import { audit, EVENTS } from '../utils/auditLogger.js';
import logger from '../utils/logger.js';

const router = express.Router();

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Helper: set JWT cookie ────────────────────────────────────────────────────
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,                                     // inaccessible to JS — prevents XSS
    secure: process.env.COOKIE_SECURE === 'true',       // HTTPS only in production
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',   // CSRF protection
    maxAge: 8 * 60 * 60 * 1000,                        // 8 hours (matches JWT_EXPIRES_IN)
    path: '/',
  });
};

// ── GET /auth/saml/login ──────────────────────────────────────────────────────
// Redirects the user's browser to Okta with a SAML AuthnRequest
router.get('/saml/login', passport.authenticate('saml', { failureRedirect: `${FRONTEND_URL()}/access-denied` }));

// ── POST /api/v1/auth/saml/acs (ACS) ─────────────────────────────────────────
// Okta POSTs the SAMLResponse here after the user authenticates
router.post(
  '/saml/acs',
  (req, res, next) => {
    passport.authenticate('saml', { session: false }, async (err, user, info) => {
      const ip        = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // SAML validation error (cert mismatch, expired assertion, etc.)
      if (err) {
        logger.error('[ACS] SAML authentication error', { error: err.message });
        await audit(EVENTS.AUTH_FAILURE, { ip, userAgent, metadata: { error: err.message } });
        return res.redirect(`${FRONTEND_URL()}/access-denied?reason=saml_error`);
      }

      // Denied — no valid group
      if (!user) {
        const reason = info?.reason || 'unknown';
        logger.warn('[ACS] Login denied', { reason, email: info?.email });
        return res.redirect(`${FRONTEND_URL()}/access-denied?reason=${reason}&email=${encodeURIComponent(info?.email || '')}`);
      }

      try {
        // Create a unique session ID embedded in the JWT
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

        // Persist session for revocation support
        await Session.create({
          sessionId,
          userId:    user.id,
          email:     user.email,
          role:      user.role,
          ip,
          userAgent,
          expiresAt,
        });

        const token = signToken({ ...user, sessionId });
        setTokenCookie(res, token);

        await audit(EVENTS.LOGIN_SUCCESS, {
          userId:    user.id,
          email:     user.email,
          ip,
          userAgent,
          metadata:  { role: user.role, groups: user.groups },
        });

        logger.info('[ACS] Login complete, redirecting to dashboard', { email: user.email });
        return res.redirect(`${FRONTEND_URL()}/dashboard`);
      } catch (dbErr) {
        logger.error('[ACS] Post-auth DB error', { error: dbErr.message });
        return res.redirect(`${FRONTEND_URL()}/access-denied?reason=server_error`);
      }
    })(req, res, next);
  }
);

// ── GET /auth/me ─────────────────────────────────────────────────────────────
// Returns the current authenticated user. Called by the React frontend on load.
router.get('/me', authenticate, (req, res) => {
  const { sessionId, iat, exp, ...userFields } = req.user; // strip JWT internals
  res.json({ user: userFields });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  const { sessionId, email, id } = req.user;
  const ip        = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Revoke session in DB
    await Session.findOneAndUpdate({ sessionId }, { revoked: true });

    await audit(EVENTS.LOGOUT, { userId: id, email, ip, userAgent });

    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('[Logout] Error', { error: err.message });
    // Still clear cookie even if DB update fails
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out' });
  }
});

export default router;
