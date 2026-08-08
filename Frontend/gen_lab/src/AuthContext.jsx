import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('genlab_user')) || null;
    } catch {
      return null;
    }
  });

  const loginUser = (userObj) => {
    localStorage.setItem('genlab_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('genlab_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loginUser, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
