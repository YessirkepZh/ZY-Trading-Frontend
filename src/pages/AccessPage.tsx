import { useEffect, useState } from 'react';
import {
  createApiToken,
  createInvite,
  fetchApiTokens,
  fetchInvites,
  revokeApiToken,
} from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import type { ApiToken, Invite, UserRole } from '../types';

const INPUT_CLASS =
  'w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors placeholder:text-muted/50';
const PRIMARY_BUTTON_CLASS =
  'bg-blue/20 text-blue border border-blue/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue/30 transition-colors disabled:opacity-50 whitespace-nowrap';

function SecretBox({ label, value, onDismiss }: { label: string; value: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-green/10 border border-green/30 rounded-lg p-3 space-y-2">
      <p className="text-xs text-green">{label}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 min-w-0 break-all bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text">
          {value}
        </code>
        <div className="flex gap-2">
          <button type="button" onClick={handleCopy} className={PRIMARY_BUTTON_CLASS}>
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-text transition-colors"
          >
            Скрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function ApiTokensSection({ singleDevice }: { singleDevice: boolean }) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApiTokens()
      .then((res) => { if (!cancelled) setTokens(res); })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить токены'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      singleDevice &&
      tokens.length > 0 &&
      !window.confirm('Новый токен отключит текущий: расширение на старом устройстве перестанет работать. Продолжить?')
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { token, apiToken } = await createApiToken(name.trim());
      setTokens((prev) => (singleDevice ? [apiToken] : [apiToken, ...prev]));
      setNewToken(token);
      setName('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось создать токен'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (token: ApiToken) => {
    if (!window.confirm(`Отозвать токен «${token.name}»? Расширение с ним перестанет работать.`)) return;
    setError(null);
    try {
      await revokeApiToken(token.id);
      setTokens((prev) => prev.filter((t) => t.id !== token.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось отозвать токен'));
    }
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-4 md:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text">Токены для расширения</h3>
        <p className="text-xs text-muted mt-1">
          Вставьте токен в поле «Ключ доступа» в Chrome-расширении. Токен показывается один раз.
        </p>
        {singleDevice && (
          <p className="text-xs text-muted mt-1">
            Токен работает только на одном устройстве — том, где его используют первым. Новый токен отключает
            предыдущий.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="token-name" className="sr-only">Название токена</label>
        <input
          id="token-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Chrome на ноутбуке"
          maxLength={100}
          required
          className={INPUT_CLASS}
        />
        <button type="submit" disabled={submitting || !name.trim()} className={PRIMARY_BUTTON_CLASS}>
          {submitting ? 'Создание...' : 'Создать токен'}
        </button>
      </form>

      {newToken && (
        <SecretBox
          label="Скопируйте токен сейчас — после скрытия его нельзя будет посмотреть снова."
          value={newToken}
          onDismiss={() => setNewToken(null)}
        />
      )}

      {error && (
        <p className="text-xs text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading ? (
        <Loader />
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted">Активных токенов нет</p>
      ) : (
        <ul className="divide-y divide-border/50 border border-border rounded-lg">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-text truncate">{t.name}</p>
                <p className="text-xs text-muted">
                  <code>{t.tokenPrefix}…</code>
                  {' · '}
                  {t.lastUsedAt ? `использован ${formatDate(t.lastUsedAt)}` : 'не использовался'}
                  {singleDevice && (t.deviceBound ? ' · привязан к устройству' : ' · ещё не привязан')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(t)}
                className="text-xs text-muted hover:text-red px-2 py-1 rounded transition-colors shrink-0"
              >
                Отозвать
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function inviteStatus(invite: Invite): { label: string; className: string } {
  if (invite.usedAt) return { label: 'принято', className: 'text-green' };
  if (new Date(invite.expiresAt) < new Date()) return { label: 'истекло', className: 'text-muted' };
  return { label: `до ${formatDate(invite.expiresAt)}`, className: 'text-orange' };
}

function InvitesSection() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInvites()
      .then((res) => { if (!cancelled) setInvites(res); })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить приглашения'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { token, invite } = await createInvite({ email: email.trim() || undefined, role });
      setInvites((prev) => [invite, ...prev]);
      setInviteLink(`${window.location.origin}/invite?token=${encodeURIComponent(token)}`);
      setEmail('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось создать приглашение'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-4 md:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text">Приглашения</h3>
        <p className="text-xs text-muted mt-1">
          Ссылка действует 7 дней и срабатывает один раз. Новый пользователь получит копию ваших чеклистов.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="invite-email" className="sr-only">Email приглашённого</label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (необязательно)"
          className={INPUT_CLASS}
        />
        <label htmlFor="invite-role" className="sr-only">Роль</label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors sm:w-40"
        >
          <option value="user">Пользователь</option>
          <option value="admin">Администратор</option>
        </select>
        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
          {submitting ? 'Создание...' : 'Пригласить'}
        </button>
      </form>

      {inviteLink && (
        <SecretBox
          label="Отправьте эту ссылку приглашённому — повторно её показать нельзя."
          value={inviteLink}
          onDismiss={() => setInviteLink(null)}
        />
      )}

      {error && (
        <p className="text-xs text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading ? (
        <Loader />
      ) : invites.length === 0 ? (
        <p className="text-sm text-muted">Приглашений пока нет</p>
      ) : (
        <ul className="divide-y divide-border/50 border border-border rounded-lg">
          {invites.map((invite) => {
            const status = inviteStatus(invite);
            return (
              <li key={invite.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{invite.email ?? 'Любой email'}</p>
                  <p className="text-xs text-muted">
                    {invite.role === 'admin' ? 'Администратор' : 'Пользователь'} · создано {formatDate(invite.createdAt)}
                  </p>
                </div>
                <span className={`text-xs shrink-0 ${status.className}`}>{status.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function AccessPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-text">Доступ</h2>
        <p className="text-xs text-muted mt-1">Вы вошли как {user.email}</p>
      </div>
      <ApiTokensSection singleDevice={user.role !== 'admin'} />
      {user.role === 'admin' && <InvitesSection />}
    </div>
  );
}
