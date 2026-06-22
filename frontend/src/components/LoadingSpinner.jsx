const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#6b7280',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e1e4e8',
      borderTop: '3px solid #0078d4',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingSpinner;
