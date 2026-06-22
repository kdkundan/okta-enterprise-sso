import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      style={{
        padding: '0.4rem 1rem',
        borderRadius: '6px',
        background: pathname === to ? 'rgba(255,255,255,0.2)' : 'transparent',
        color: '#fff',
        fontWeight: pathname === to ? 600 : 400,
      }}
    >
      {label}
    </Link>
  );

  return (
    <nav style={{
      background: '#0078d4',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginRight: '1rem' }}>
          🔐 Enterprise SSO
        </span>
        {user && (
          <>
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/profile', 'Profile')}
          </>
        )}
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
            {user.firstName} {user.lastName}
          </span>
          <span className={`badge badge-${user.role}`} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            {user.role}
          </span>
          <button onClick={logout} className="btn-danger" style={{ padding: '0.35rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
