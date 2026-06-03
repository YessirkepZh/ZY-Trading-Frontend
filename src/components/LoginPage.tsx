import { useState, useRef } from 'react';

interface LoginPageProps {
  onLogin: (password: string) => boolean;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(password);
    if (!ok) {
      setError(true);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 400);
      inputRef.current?.focus();
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
            <label className="block text-xs text-muted mb-2 uppercase tracking-wide">Пароль</label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text text-sm outline-none focus:border-blue transition-colors"
              autoFocus
              autoComplete="current-password"
            />
            {error && (
              <p className="text-red text-xs mt-2">Неверный пароль</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue hover:bg-blue/80 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
