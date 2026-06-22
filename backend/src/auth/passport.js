/**
 * Passport configuration.
 * Sets up the SAML strategy and wires the verify callback that:
 *  1. Normalizes SAML attributes
 *  2. Resolves group → role
 *  3. Upserts the User document in MongoDB
 *  4. Records the audit event
 */

import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import { getSamlConfig } from '../config/saml.js';
import { normalizeUser } from '../utils/normalizeUser.js';
import { audit, EVENTS } from '../utils/auditLogger.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Call initPassport() after dotenv has loaded.
 * Fetches Okta IdP metadata (cert + entryPoint) before registering the strategy.
 */
export const initPassport = async () => {
  const samlConfig = await getSamlConfig();

passport.use(
  'saml',
  new SamlStrategy(samlConfig, async (profile, done) => {
    try {
      const { normalized, roleResult } = normalizeUser(profile);

      // Deny login if user belongs to no valid application group
      if (!roleResult) {
        logger.warn('[Auth] Login denied — no valid application group', {
          email: normalized.email,
          groups: normalized.groups,
        });
        await audit(EVENTS.LOGIN_DENIED, {
          email: normalized.email,
          metadata: { reason: 'no_valid_group', groups: normalized.groups },
        });
        return done(null, false, { reason: 'no_valid_group', email: normalized.email });
      }

      // Role override: check if DB has a manual override for this user
      let dbUser = await User.findOne({ email: normalized.email });
      const effectiveRole = (dbUser && dbUser.roleOverride) ? dbUser.roleOverride : normalized.role;

      // Upsert user — create on first login, update on subsequent logins
      dbUser = await User.findOneAndUpdate(
        { email: normalized.email },
        {
          $set: {
            firstName:   normalized.firstName,
            lastName:    normalized.lastName,
            username:    normalized.username,
            groups:      normalized.groups,
            role:        normalized.role,      // SAML-derived role (always updated)
            authProvider: normalized.authProvider,
            nameID:      normalized.nameID,
            lastLoginAt: new Date(),
          },
          $inc: { loginCount: 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const userPayload = {
        id:           dbUser._id.toString(),
        email:        dbUser.email,
        firstName:    dbUser.firstName,
        lastName:     dbUser.lastName,
        username:     dbUser.username,
        groups:       dbUser.groups,
        role:         effectiveRole,
        authProvider: dbUser.authProvider,
      };

      logger.info('[Auth] Login success', { email: userPayload.email, role: userPayload.role });
      return done(null, userPayload);
    } catch (err) {
      logger.error('[Auth] SAML verify error', { error: err.message });
      return done(err);
    }
  })
);

// JWT-based auth — no persistent session needed for passport itself
// Sessions are tracked in MongoDB Session model instead
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
}; // end initPassport

export default passport;
