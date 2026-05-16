import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  useEffect(() => {
    if (token) {
      // Ping the backend to verify the token is still valid
      // If the user was deleted or suspended, this will throw a 401 
      // and authAPI will automatically log them out.
      authAPI.getProfile().catch(() => {
        // apiCall wrapper handles the redirect to /login
      });
    }
  }, [location.pathname, token]); // Re-verify on navigation

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
