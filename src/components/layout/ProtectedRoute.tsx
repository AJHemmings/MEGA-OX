import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ResumeGameToast from '../ResumeGameToast';
import { AdminDebugFAB } from '../admin/AdminDebugFAB';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a2332' }}>
        <div style={{ color: '#00d4aa', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return user ? (
    <>
      <Outlet />
      <ResumeGameToast />
      <AdminDebugFAB />
    </>
  ) : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
