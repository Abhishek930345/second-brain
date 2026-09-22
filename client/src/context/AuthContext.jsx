import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Sirf ek baar chalega
    if (hasFetched.current) return;
    hasFetched.current = true;

    const init = async () => {
      // URL mein token check karo
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        localStorage.setItem('token', urlToken);
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Token hai toh user fetch karo
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('token');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

//export const useAuth = () => useContext(AuthContext);
export const useAuth = () => useContext(AuthContext);