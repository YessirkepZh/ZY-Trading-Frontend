import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvite } from '../api/auth';
import { getApiErrorMessage } from '../api/client';

const MIN_PASSWORD_LENGTH = 10;

const INPUT_CLASS =
  'w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text text-sm outline-none focus:border-blue transition-colors';

export default function InvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await acceptInvite(token, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось принять приглашение'));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text tracking-wide">ZY Trading</h1>
          <p className="text-muted text-sm mt-1">Регистрация по приглашению</p>
        </div>

        {!token ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-sm text-red">
            Ссылка приглашения неполная. Попросите администратора прислать её заново.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-xs text-muted mb-2 uppercase tracking-wide">Email</label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className={INPUT_CLASS}
                autoFocus
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="invite-password" className="block text-xs text-muted mb-2 uppercase tracking-wide">Пароль</label>
              <input
                id="invite-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className={INPUT_CLASS}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              <p className="text-xs text-muted mt-1">Не короче {MIN_PASSWORD_LENGTH} символов</p>
            </div>

            <div>
              <label htmlFor="invite-confirm" className="block text-xs text-muted mb-2 uppercase tracking-wide">Повторите пароль</label>
              <input
                id="invite-confirm"
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                className={INPUT_CLASS}
                autoComplete="new-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'invite-error' : undefined}
                required
              />
              {error && <p id="invite-error" className="text-red text-xs mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password || !confirm}
              className="w-full bg-blue hover:bg-blue/80 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
