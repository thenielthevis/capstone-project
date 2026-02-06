import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser, getToken, saveUser as saveUserStorage, saveToken, logout as logoutAuth } from '../utils/auth';

interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  role?: string;
  profilePicture?: string;
  googleId?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  loginAsGuest: () => void;
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

  const loginAsGuest = () => {
    const guestUser: User = {
      id: 'guest_' + Math.random().toString(36).substr(2, 9),
      username: 'Guest User',
      email: 'guest@lifora.com',
      role: 'user',
      isGuest: true,
    };
    const guestToken = 'guest_token_' + Date.now();

    setUserState(guestUser);
    setTokenState(guestToken);
    saveUserStorage(guestUser);
    saveToken(guestToken);
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
    loginAsGuest,
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
