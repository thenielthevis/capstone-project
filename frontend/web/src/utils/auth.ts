// Authentication utility functions for web
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  username: string;
  email: string;
  role?: string;
  profilePicture?: string;
  googleId?: string;
  isGuest?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface GoogleUserInfo {
  username: string;
  email: string;
  googleId: string;
  profilePicture?: string;
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

// Register user
export const registerUser = async (credentials: RegisterCredentials): Promise<void> => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
};

// Register Google user
export const registerGoogleUser = async (userInfo: GoogleUserInfo): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/users/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userInfo),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Google Sign-In failed');
  }

  return response.json();
};

// Token storage
export const saveToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// User storage
export const saveUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userData = localStorage.getItem('user');
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const removeUser = (): void => {
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

// Logout user
export const logout = (): void => {
  removeToken();
  removeUser();
};

// Get authorization header
export const getAuthHeader = (): Record<string, string> => {
  const token = getToken();
  if (!token) return {};

  return {
    'Authorization': `Bearer ${token}`,
  };
};

// Google Sign-In handler for web
export const handleGoogleSignIn = async (): Promise<AuthResponse> => {
  try {
    // Sign out any existing Firebase session first
    await signOut(auth);

    // Sign in with Google popup
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Extract user information
    const userInfo: GoogleUserInfo = {
      username: user.displayName || user.email?.split('@')[0] || 'Google User',
      email: user.email!,
      googleId: user.uid,
      profilePicture: user.photoURL || undefined,
    };

    // Register/login with backend
    const response = await registerGoogleUser(userInfo);

    return response;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw new Error(error.message || 'Google Sign-In failed');
  }
};
