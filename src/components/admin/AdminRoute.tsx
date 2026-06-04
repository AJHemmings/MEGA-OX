import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminRole } from '../../hooks/useAdminRole';
import PageBackground from '../common/PageBackground';
import { tokens } from '../../styles/tokens';

interface Props {
  requiredRole?: 'super_admin';
  children: React.ReactNode;
}

export const AdminRoute: React.FC<Props> = ({ requiredRole, children }) => {
  const { role, loading } = useAdminRole();

  if (loading) {
    return (
      <PageBackground>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', color: tokens.textMuted, fontFamily: tokens.font, fontSize: 14,
        }}>
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (role === null) return <Navigate to="/menu" replace />;
  if (requiredRole === 'super_admin' && role !== 'super_admin') {
    return <Navigate to="/admin/skins" replace />;
  }

  return <>{children}</>;
};
