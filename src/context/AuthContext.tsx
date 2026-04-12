import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  isTourShown: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  login: (email: string, password: string, forceLogoutPrevious?: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  verifyToken: () => Promise<boolean>;
  markTourShown: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const existingToken = apiClient.getToken();
      if (!existingToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await apiClient.verifyToken(existingToken);
        setToken(existingToken);
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name || response.user.email.split('@')[0],
          isTourShown: !!response.user.isTourShown,
        });
      } catch (err) {
        apiClient.removeToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  const verifyTokenOnMount = async (token: string) => {
    try {
      const response = await apiClient.verifyToken(token);
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.email.split('@')[0],
        isTourShown: !!response.user.isTourShown,
      });
      return true;
    } catch (err) {
      apiClient.removeToken();
      setToken(null);
      setUser(null);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.signup({ name, email, password, confirmPassword });
      setToken(response.token);
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        isTourShown: !!response.user.isTourShown,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, forceLogoutPrevious = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.login({ email, password, forceLogoutPrevious });
      setToken(response.token);
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        isTourShown: !!response.user.isTourShown,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logoutSession().catch(() => {
      // Ignore backend logout errors on client-side logout fallback.
    });
    apiClient.logout();
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const verifyToken = async (): Promise<boolean> => {
    const currentToken = apiClient.getToken();
    if (!currentToken) return false;

    try {
      const response = await apiClient.verifyToken(currentToken);
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.email.split('@')[0],
        isTourShown: !!response.user.isTourShown,
      });
      setToken(currentToken);
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const markTourShown = async (): Promise<void> => {
    if (!token || !user) return;

    await apiClient.updateTourStatus(true);
    setUser({ ...user, isTourShown: true });
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user: isAuthenticated ? user : null,
        token: isAuthenticated ? token : null,
        isAuthenticated,
        isLoading,
        isInitializing,
        error,
        signup,
        login,
        logout,
        clearError,
        verifyToken,
        markTourShown,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
