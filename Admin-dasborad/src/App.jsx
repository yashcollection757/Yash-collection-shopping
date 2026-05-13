import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin       from './pages/AdminLogin';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import AdminDashboard   from './pages/AdminDashboard';
import AdminUsers       from './pages/AdminUsers';
import AdminOrders      from './pages/AdminOrders';
import AdminProducts    from './pages/AdminProducts';
import AdminCollections from './pages/AdminCollections';
import AdminBanners     from './pages/AdminBanners';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login"                    element={<AdminLogin />} />
        <Route path="/forgot-password"          element={<ForgotPassword />} />
        <Route path="/reset-password/:token"    element={<ResetPassword />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard"    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/users"        element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/orders"       element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
        <Route path="/products"     element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
        <Route path="/collections"  element={<ProtectedRoute><AdminCollections /></ProtectedRoute>} />
        <Route path="/banners"      element={<ProtectedRoute><AdminBanners /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

