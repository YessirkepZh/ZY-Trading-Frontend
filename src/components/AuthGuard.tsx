import { useState } from 'react';
import LoginPage from './LoginPage';
import { API_KEY_STORAGE_KEY, checkApiKey } from '../api/client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(() => Boolean(localStorage.getItem(API_KEY_STORAGE_KEY)));

  const handleLogin = async (password: string): Promise<string | null> => {
    const result = await checkApiKey(password);
    if (result === 'ok') {
      localStorage.setItem(API_KEY_STORAGE_KEY, password);
      setIsAuth(true);
      return null;
    }
    return result === 'invalid' ? 'Неверный пароль' : 'Сервер недоступен, попробуйте позже';
  };

  if (!isAuth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <>{children}</>;
}
