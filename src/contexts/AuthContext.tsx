// Stub — implemented in Task 7
import React, { createContext, useContext } from 'react';
export const AuthContext = createContext<any>(null);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
);
export const useAuth = () => useContext(AuthContext);
