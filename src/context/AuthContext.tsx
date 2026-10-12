import { useState, useEffect, ReactNode } from 'react';
import { cloudClient } from '../services/cloudClient';
import type { UserProfile } from '../types/auth';
import { AuthContext } from './authCore';



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const current = await cloudClient.getMe();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const profile = await cloudClient.login(email, password);
    setUser(profile);
  };

  const register = async (email: string, password: string) => {
    const profile = await cloudClient.register(email, password);
    setUser(profile);
  };

  const logout = async () => {
    await cloudClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
