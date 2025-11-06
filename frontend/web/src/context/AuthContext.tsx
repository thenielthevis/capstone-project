import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser, getToken, saveUser as saveUserStorage, saveToken, logout as logoutAuth } from '../utils/auth';

interface User {
  username: string;
  email: string;
  profilePicture?: string;
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      const storedUser = getUser();
      const storedToken = getToken();
      
      if (storedUser && storedToken) {
        setUserState(storedUser);
        setTokenState(storedToken);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      saveUserStorage(newUser);
    }
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      saveToken(newToken);
    }
  };

  const login = (newUser: User, newToken: string) => {
    setUserState(newUser);
    setTokenState(newToken);
    saveUserStorage(newUser);
    saveToken(newToken);
  };

  const logout = () => {
    setUserState(null);
    setTokenState(null);
    logoutAuth();
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    setUser,
    setToken,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
