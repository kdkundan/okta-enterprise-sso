/**
 * Access Denied page — shown when:
 *  - User authenticated with Okta but has no valid application group
 *  - User tries to access a route above their role
 */

import { useSearchParams, Link } from 'react-router-dom';

const REASON_DETAIL = {
  no_valid_group: {
    title: 'No Application Group Assigned',
    message:
      'You successfully authenticated with Okta, but your account is not assigned to any valid application group (e.g. elog_admin, elog_operator). Please contact your system administrator to request access.',
  },
  saml_error: {
    title: 'SAML Authentication Error',
    message:
      'A SAML error occurred during authentication. This may be due to a certificate mismatch, expired assertion, or misconfigured Okta application. Contact your IT administrator.',
  },
  server_error: {
    title: 'Server Error',
    message: 'An unexpected server error occurred. Please try again or contact support.',
  },
  insufficient_role: {
    title: 'Insufficient Permissions',
    message: 'You do not have the required role to access this page.',
  },
};

const DEFAULT = {
  title: 'Access Denied',
  message: 'You do not have permission to access this resource.',
};

const AccessDenied = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const email  = searchParams.get('email');
  const detail = REASON_DETAIL[reason] || DEFAULT;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fef2f2',
    }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚫</div>
        <h1 style={{ color: '#c53030', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {detail.title}
        </h1>

        {email && (
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Account: <strong>{email}</strong>
          </p>
        )}

        <p style={{ color: '#374151', marginBottom: '2rem', lineHeight: '1.7' }}>
          {detail.message}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login">
            <button className="btn-primary">Return to Login</button>
          </Link>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#9ca3af' }}>
          If you believe this is an error, contact your IT administrator and reference error code:{' '}
          <code>{reason || 'ACCESS_DENIED'}</code>
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
