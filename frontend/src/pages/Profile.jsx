/**
 * Profile page — detailed view of the authenticated user's attributes.
 */

import useAuthGuard from '../auth/useAuthGuard.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Navbar from '../components/Navbar.jsx';

const Profile = () => {
  const { user, loading } = useAuthGuard();

  if (loading) return <LoadingSpinner />;
  if (!user)   return null;

  const fields = [
    { label: 'First Name',     value: user.firstName },
    { label: 'Last Name',      value: user.lastName },
    { label: 'Email',          value: user.email },
    { label: 'Username',       value: user.username },
    { label: 'Role',           value: user.role },
    { label: 'Auth Provider',  value: user.authProvider },
    { label: 'Groups',         value: user.groups?.join(', ') || 'None' },
  ];

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
        <h2 style={{ marginBottom: '2rem' }}>My Profile</h2>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#0078d4', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '2rem', color: '#fff', fontWeight: 700,
            }}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem' }}>{user.firstName} {user.lastName}</h3>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {fields.map(({ label, value }) => (
                <tr key={label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem 0', color: '#6b7280', fontWeight: 500, width: '140px' }}>{label}</td>
                  <td style={{ padding: '0.75rem 0', fontWeight: 600, wordBreak: 'break-all' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default Profile;
