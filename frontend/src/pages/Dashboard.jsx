/**
 * Dashboard — main page after login.
 * Displays user identity, role, groups, and auth metadata.
 */

import useAuthGuard from '../auth/useAuthGuard.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Navbar from '../components/Navbar.jsx';

const InfoRow = ({ label, value, children }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f0f0f0',
  }}>
    <span style={{ color: '#6b7280', fontWeight: 500, minWidth: '140px' }}>{label}</span>
    <span style={{ fontWeight: 600, textAlign: 'right' }}>{children || value}</span>
  </div>
);

const Dashboard = () => {
  const { user, loading } = useAuthGuard();

  if (loading) return <LoadingSpinner />;
  if (!user)   return null;

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>
          Welcome back, {user.firstName} 👋
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          You are authenticated via <strong>Okta SAML 2.0</strong>
        </p>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
            Identity
          </h3>
          <InfoRow label="Full Name">{user.firstName} {user.lastName}</InfoRow>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Username" value={user.username} />
          <InfoRow label="Auth Provider" value={user.authProvider} />
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
            Authorization
          </h3>
          <InfoRow label="Role">
            <span className={`badge badge-${user.role}`}>{user.role}</span>
          </InfoRow>
          <InfoRow label="Groups">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {user.groups && user.groups.length > 0
                ? user.groups.map((g) => (
                    <span key={g} style={{
                      background: '#e8f4fd',
                      color: '#005a9e',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                    }}>
                      {g}
                    </span>
                  ))
                : <span style={{ color: '#9ca3af' }}>None</span>
              }
            </div>
          </InfoRow>
        </div>

        <div className="card" style={{ background: '#f0f7ff', border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: '0.85rem', color: '#1e40af' }}>
            ✅ Your session is valid and secured with an HttpOnly JWT cookie. Role-based access control is active.
          </p>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
