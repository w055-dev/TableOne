import { useState, useCallback } from 'react';
import { ADMIN_PASSWORD } from '../constants';

export const useAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');

  const login = useCallback(() => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      return true;
    }
    return false;
  }, [password]);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setPassword('');
  }, []);

  const openLogin = useCallback(() => {
    setShowLogin(true);
    setPassword('');
  }, []);

  const closeLogin = useCallback(() => {
    setShowLogin(false);
    setPassword('');
  }, []);

  return {
    isAdmin,
    showLogin,
    password,
    setPassword,
    login,
    logout,
    openLogin,
    closeLogin
  };
};