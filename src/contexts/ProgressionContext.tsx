import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useProgression, ProgressionState } from '../hooks/useProgression';

type ProgressionContextValue = ProgressionState & { refresh: () => void };

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export const ProgressionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const progression = useProgression(user?.id);
  return (
    <ProgressionContext.Provider value={progression}>
      {children}
    </ProgressionContext.Provider>
  );
};

export function useProgressionContext(): ProgressionContextValue {
  const ctx = useContext(ProgressionContext);
  if (!ctx) throw new Error('useProgressionContext used outside ProgressionProvider');
  return ctx;
}
