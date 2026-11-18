import React, { createContext, useContext, useState, useEffect } from 'react';
import { SEEDED_USERS, DEFAULT_USER } from '../constants/users';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ajaia_docs_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = SEEDED_USERS.find(u => u.email === parsed.email);
        return match || DEFAULT_USER;
      }
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    }
    return DEFAULT_USER;
  });

  const switchUser = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('ajaia_docs_current_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        users: SEEDED_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
