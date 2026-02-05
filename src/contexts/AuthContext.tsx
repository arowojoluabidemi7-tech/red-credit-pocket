import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { storage } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'referralCode' | 'balance' | 'rpcBalance' | 'hasClaimedWelcome' | 'claimCount' | 'createdAt'>) => User;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = storage.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    // Check admin session
    const adminSession = localStorage.getItem('redpay_admin');
    setIsAdmin(adminSession === 'true');
  }, []);

  const login = (email: string, password: string): boolean => {
    // Admin login
    if (email === 'admin@redpay.com' && password === 'admin123') {
      localStorage.setItem('redpay_admin', 'true');
      setIsAdmin(true);
      return true;
    }

    // User login - find by email and validate password
    const allUsers = storage.getAllUsers();
    const foundUser = allUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      storage.setUser(foundUser);
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    storage.clearUser();
    localStorage.removeItem('redpay_admin');
    setUser(null);
    setIsAdmin(false);
  };

  const signup = (userData: Omit<User, 'id' | 'referralCode' | 'balance' | 'rpcBalance' | 'hasClaimedWelcome' | 'claimCount' | 'createdAt'>): User => {
    const newUser = storage.createUser(userData);
    setUser(newUser);
    return newUser;
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      storage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const refreshUser = () => {
    const savedUser = storage.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin,
      login,
      logout,
      signup,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
