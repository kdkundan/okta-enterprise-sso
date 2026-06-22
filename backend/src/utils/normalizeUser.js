/**
 * Normalize the raw SAML profile returned by passport-saml into
 * a consistent, application-level user object.
 *
 * Okta SAML attribute names depend on how you configured
 * "Attribute Statements" in the Okta app. The keys below match
 * the recommended setup documented in docs/attribute-statements.md
 */

import { resolveRole } from '../auth/groupMapper.js';

/**
 * @param {object} profile - raw passport-saml profile
 * @returns {{ normalized: object, roleResult: object|null }}
 */
export const normalizeUser = (profile) => {
  const attrs = profile.attributes || profile; // passport-saml v3 uses profile.attributes

  const email      = attrs['email']     || attrs['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || profile.nameID || '';
  const firstName  = attrs['firstName'] || attrs['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']   || '';
  const lastName   = attrs['lastName']  || attrs['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']      || '';
  const username   = attrs['username']  || attrs['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']         || email;

  // Groups come as an array or single string depending on assertion
  let groups = attrs['groups'] || [];
  if (typeof groups === 'string') groups = [groups];

  const roleResult = resolveRole(groups);

  const normalized = {
    email,
    firstName,
    lastName,
    username,
    groups,
    role: roleResult ? roleResult.role : null,
    authProvider: 'okta-saml',
    nameID: profile.nameID || email,
  };

  return { normalized, roleResult };
};
