import { useState, useRef } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
}

const INPUT_CLASS =
  'w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text text-sm outline-none focus:border-blue transition-colors';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const loginError = await onLogin(email, password);
    setSubmitting(false);
    if (loginError) {
      setError(loginError);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 400);
      passwordRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text tracking-wide">ZY Trading</h1>
          <p className="text-muted text-sm mt-1">Аналитическая система</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`bg-surface border border-border rounded-xl p-6 ${shaking ? 'shake' : ''}`}
        >
          <div className="mb-4">
            <label htmlFor="login-email" className="block text-xs text-muted mb-2 uppercase tracking-wide">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={INPUT_CLASS}
              autoFocus
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="block text-xs text-muted mb-2 uppercase tracking-wide">Пароль</label>
            <input
              id="login-password"
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={INPUT_CLASS}
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
              required
            />
            {error && (
              <p id="login-error" className="text-red text-xs mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full bg-blue hover:bg-blue/80 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
