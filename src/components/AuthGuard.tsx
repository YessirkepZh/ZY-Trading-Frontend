import { useState, useEffect } from 'react';
import LoginPage from './LoginPage';

const PASSWORD_KEY = 'zy_auth';
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'zy2024';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(PASSWORD_KEY);
    if (stored === CORRECT_PASSWORD) {
      setIsAuth(true);
    }
  }, []);

  const handleLogin = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(PASSWORD_KEY, password);
      setIsAuth(true);
      return true;
    }
    return false;
  };

  if (!isAuth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <>{children}</>;
}
