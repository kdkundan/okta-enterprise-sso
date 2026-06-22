/**
 * useAuthGuard — redirect unauthenticated or unauthorized users.
 *
 * @param {string} [requiredRole] - if provided, also checks role
 * @returns {{ user, loading }}
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const useAuthGuard = (requiredRole = null) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      navigate('/access-denied', { replace: true });
    }
  }, [user, loading, navigate, requiredRole]);

  return { user, loading };
};

export default useAuthGuard;
