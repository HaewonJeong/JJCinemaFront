import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, signup as apiSignup } from '../api/mockApi';

const AuthContext = createContext(null);
const STORAGE_KEY = 'movie_booking_current_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) setUser(JSON.parse(raw));
    setLoading(false);
  }, []);

  async function login(email, password) {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    return loggedInUser;
  }

  async function signup(name, email, password) {
    const newUser = await apiSignup({ name, email, password });
    setUser(newUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}
