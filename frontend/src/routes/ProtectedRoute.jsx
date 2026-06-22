/**
 * ProtectedRoute — wraps any route that requires authentication.
 * Shows a loading spinner while session is being restored from cookie.
 * Redirects to /login if unauthenticated, /access-denied if wrong role.
 */

import useAuthGuard from '../auth/useAuthGuard.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuthGuard(requiredRole);

  if (loading) return <LoadingSpinner />;
  if (!user)   return null; // redirect is in-flight via useAuthGuard

  return children;
};

export default ProtectedRoute;
