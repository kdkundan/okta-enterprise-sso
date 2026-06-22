/**
 * Login page — entry point for unauthenticated users.
 * Clicking "Sign in with Okta" does a full-page redirect to the backend
 * which then issues the SAML AuthnRequest to Okta.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const REASON_MESSAGES = {
  session_expired: 'Your session has expired. Please sign in again.',
  no_valid_group:  'Access denied: your account is not assigned to a valid application group.',
  saml_error:      'Authentication failed due to a SAML error. Contact your IT administrator.',
  server_error:    'A server error occurred. Please try again.',
};

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  // Already logged in? Go to dashboard
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    window.location.href = `${apiUrl}/auth/saml/login`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' }}>Enterprise SSO</h1>
          <p style={{ color: '#6b7280', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Sign in with your Okta corporate account
          </p>
        </div>

        {reason && REASON_MESSAGES[reason] && (
          <div style={{
            background: '#fde8e8',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            color: '#c53030',
            fontSize: '0.9rem',
            textAlign: 'left',
          }}>
            ⚠️ {REASON_MESSAGES[reason]}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="btn-primary"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 600 }}
        >
          Sign in with Okta
        </button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
          Secured by SAML 2.0 · Powered by Okta
        </p>
      </div>
    </div>
  );
};

export default Login;
