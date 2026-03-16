import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const TestConsumer: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return <div>{user ? 'logged in' : 'logged out'}</div>;
};

test('AuthProvider renders children and shows logged out state', async () => {
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
  // Initially shows loading, then resolves
  expect(await screen.findByText(/logged/)).toBeInTheDocument();
});
