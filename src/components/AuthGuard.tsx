import { useEffect, useState } from 'react';
import LoginPage from './LoginPage';
import Loader from './Loader';
import { fetchMe, login, logout } from '../api/auth';
import { getApiErrorMessage, refreshSession, setSessionExpiredHandler } from '../api/client';
import { AuthContext } from '../hooks/useAuth';
import type { AuthUser } from '../types';

type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: AuthUser };

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;

    setSessionExpiredHandler(() => setState({ status: 'anonymous' }));

    refreshSession()
      .then((ok) => (ok ? fetchMe() : null))
      .then((user) => {
        if (!cancelled) setState(user ? { status: 'authenticated', user } : { status: 'anonymous' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'anonymous' });
      });

    return () => {
      cancelled = true;
      setSessionExpiredHandler(null);
    };
  }, []);

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const user = await login(email, password);
      setState({ status: 'authenticated', user });
      return null;
    } catch (err) {
      return getApiErrorMessage(err, 'Не удалось войти');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setState({ status: 'anonymous' });
    }
  };

  if (state.status === 'checking') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (state.status === 'anonymous') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={{ user: state.user, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
