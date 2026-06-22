/**
 * Axios instance pre-configured for the backend API.
 * withCredentials: true is required so the browser sends the HttpOnly cookie
 * on cross-origin requests during development.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      // Avoid redirect loops on the login page itself
      if (!window.location.pathname.includes('/login')) {
        window.location.href = code === 'TOKEN_EXPIRED'
          ? '/login?reason=session_expired'
          : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
