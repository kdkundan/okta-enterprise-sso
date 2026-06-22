/**
 * Group-to-Role mapping.
 *
 * Rules:
 *  - Groups are sourced from the "groups" SAML attribute (filtered in Okta to start with "sso_")
 *  - First matching group in the map determines the user's role (order matters)
 *  - If no valid group is found, login is denied and the user is redirected to /access-denied
 *
 * To add a new role: add an entry here AND create the corresponding Okta group.
 */

export const GROUP_ROLE_MAP = {
  sso_admin:    'admin',
  sso_operator: 'operator',
};

// Priority order — evaluated top-to-bottom; first match wins
const ROLE_PRIORITY = [
  'sso_admin',
  'sso_operator',
];

/**
 * Resolve the application role from a list of Okta groups.
 * @param {string[]} groups - groups from SAML assertion
 * @returns {{ role: string, matchedGroup: string } | null}
 */
export const resolveRole = (groups = []) => {
  for (const group of ROLE_PRIORITY) {
    if (groups.includes(group)) {
      return { role: GROUP_ROLE_MAP[group], matchedGroup: group };
    }
  }
  return null; // no valid application group
};
