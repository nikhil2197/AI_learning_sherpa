
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  name: string;
  email: string;
}

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (userData: { name: string; email: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        setIsLoading(true);
        const userData = await apiRequest<User>('GET', '/api/current-user');
        setUser(userData);
      } catch (err) {
        // Not logged in, or session expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkCurrentUser();
  }, []);

  // Login function
  const login = async (userData: { name: string; email: string }): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await apiRequest<User>('POST', '/api/users', userData);
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/logout');
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
