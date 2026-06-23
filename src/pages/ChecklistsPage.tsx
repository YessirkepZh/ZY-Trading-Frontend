import { useState, useEffect, useCallback } from 'react';
import {
  fetchChecklistGroups,
  fetchChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../api/checklist';
import Loader from '../components/Loader';
import type {
  ChecklistGroup,
  ChecklistItem,
  ChecklistItemType,
} from '../types';

const ITEM_TYPE_LABELS: Record<ChecklistItemType, string> = {
  plus: 'Плюс',
  minus: 'Минус',
  wait: 'Ожидание',
};

const ITEM_TYPE_COLORS: Record<ChecklistItemType, string> = {
  plus:  'text-green  bg-green/10  border-green/30',
  minus: 'text-red    bg-red/10    border-red/30',
  wait:  'text-orange bg-orange/10 border-orange/30',
};

interface FormState {
  groupId: number;
  itemType: ChecklistItemType;
  key: string;
  label: string;
  position: string;
}

const EMPTY_FORM = (groupId: number): FormState => ({
  groupId,
  itemType: 'plus',
  key: '',
  label: '',
  position: '0',
});

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface ItemFormProps {
  groups: ChecklistGroup[];
  items: ChecklistItem[];
  initial: FormState;
  submitLabel: string;
  error: string | null;
  loading: boolean;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  lockGroup?: boolean;
}

function nextPosition(items: ChecklistItem[], groupId: number, itemType: ChecklistItemType): number {
  const matches = items.filter((i) => i.groupId === groupId && i.itemType === itemType);
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((i) => i.position)) + 1;
}

function ItemForm({
  groups,
  items,
  initial,
  submitLabel,
  error,
  loading,
  onSubmit,
  onCancel,
  lockGroup,
}: ItemFormProps) {
  const [form, setForm] = useState<FormState>(initial);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      position: String(nextPosition(items, prev.groupId, prev.itemType)),
    }));
  }, [form.groupId, form.itemType, items]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-3"
    >
      {!lockGroup && (
        <div>
          <label className="block text-xs text-muted mb-1">Группа</label>
          <select
            value={form.groupId}
            onChange={(e) => set('groupId', Number(e.target.value))}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-muted mb-1">Тип</label>
        <select
          value={form.itemType}
          onChange={(e) => set('itemType', e.target.value as ChecklistItemType)}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors"
        >
          {(Object.keys(ITEM_TYPE_LABELS) as ChecklistItemType[]).map((t) => (
            <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Ключ (snake_case)</label>
        <input
          type="text"
          value={form.key}
          onChange={(e) => set('key', e.target.value)}
          placeholder="proboy_new_signal"
          pattern="[a-z0-9_]+"
          required
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors placeholder:text-muted/50"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Текст пункта</label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
          placeholder="Поджатие к уровню"
          required
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors placeholder:text-muted/50"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Позиция</label>
        <input
          type="number"
          value={form.position}
          onChange={(e) => set('position', e.target.value)}
          min={0}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue/20 text-blue border border-blue/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-text hover:border-border/80 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

interface EditFormProps {
  item: ChecklistItem;
  error: string | null;
  loading: boolean;
  onSubmit: (label: string, position: number) => void;
  onCancel: () => void;
}

function EditForm({ item, error, loading, onSubmit, onCancel }: EditFormProps) {
  const [label, setLabel] = useState(item.label);
  const [position, setPosition] = useState(String(item.position));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(label, Number(position));
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs text-muted mb-1">Текст пункта</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Позиция</label>
        <input
          type="number"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          min={0}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue/20 text-blue border border-blue/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-text transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

export default function ChecklistsPage() {
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ChecklistItem | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [grps, itms] = await Promise.all([
        fetchChecklistGroups(),
        fetchChecklistItems(),
      ]);
      setGroups(grps);
      setItems(itms);
      if (grps.length > 0 && activeGroupId === null) {
        setActiveGroupId(grps[0].id);
      }
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    loadData();
  }, []);

  const visibleItems = items
    .filter((i) => i.groupId === activeGroupId)
    .sort((a, b) => a.position - b.position);

  const grouped = (Object.keys(ITEM_TYPE_LABELS) as ChecklistItemType[]).reduce<
    Record<ChecklistItemType, ChecklistItem[]>
  >(
    (acc, t) => {
      acc[t] = visibleItems.filter((i) => i.itemType === t);
      return acc;
    },
    { plus: [], minus: [], wait: [] },
  );

  const handleCreate = async (form: FormState) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const created = await createChecklistItem({
        groupId: form.groupId,
        itemType: form.itemType,
        key: form.key,
        label: form.label,
        position: Number(form.position),
      });
      setItems((prev) => [...prev, created]);
      setShowCreateModal(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка создания';
      const status = (err as { response?: { status?: number } })?.response?.status;
      setFormError(status === 409 ? 'Пункт с таким ключом уже существует' : msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (label: string, position: number) => {
    if (!editItem) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const updated = await updateChecklistItem(editItem.id, { label, position });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditItem(null);
    } catch {
      setFormError('Ошибка обновления');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await deleteChecklistItem(deleteItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch {
      setFormError('Ошибка удаления');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="rounded-lg bg-red/10 border border-red/30 p-4 text-red text-sm">
        {error}
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Чеклисты</h2>
        <button
          onClick={() => {
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 bg-blue/20 text-blue border border-blue/30 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить пункт
        </button>
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 flex-wrap">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroupId(g.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeGroupId === g.id
                ? 'bg-blue/20 text-blue border-blue/30'
                : 'bg-surface text-muted border-border hover:text-text hover:border-border/60'
            }`}
          >
            {g.name}
            <span className="ml-2 text-xs opacity-60">
              {items.filter((i) => i.groupId === g.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Items by type */}
      {visibleItems.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center text-muted text-sm">
          Нет пунктов для группы «{activeGroup?.name}»
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.keys(ITEM_TYPE_LABELS) as ChecklistItemType[]).map((type) => {
            const typeItems = grouped[type];
            if (typeItems.length === 0) return null;
            return (
              <div key={type} className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${ITEM_TYPE_COLORS[type]}`}>
                    {ITEM_TYPE_LABELS[type]}
                  </span>
                  <span className="text-xs text-muted">{typeItems.length} пункт{typeItems.length === 1 ? '' : typeItems.length < 5 ? 'а' : 'ов'}</span>
                </div>
                <ul className="divide-y divide-border/50">
                  {typeItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-muted w-5 text-right shrink-0">{item.position}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-text truncate">{item.label}</p>
                          <p className="text-xs text-muted/60 font-mono">{item.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setFormError(null);
                            setEditItem(item);
                          }}
                          className="p-1.5 rounded text-muted hover:text-blue hover:bg-blue/10 transition-colors"
                          title="Редактировать"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setFormError(null);
                            setDeleteItem(item);
                          }}
                          className="p-1.5 rounded text-muted hover:text-red hover:bg-red/10 transition-colors"
                          title="Удалить"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <Modal title="Новый пункт чеклиста" onClose={() => setShowCreateModal(false)}>
          <ItemForm
            groups={groups}
            items={items}
            initial={EMPTY_FORM(activeGroupId ?? groups[0]?.id ?? 1)}
            submitLabel="Создать"
            error={formError}
            loading={formLoading}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editItem && (
        <Modal title="Редактировать пункт" onClose={() => setEditItem(null)}>
          <EditForm
            item={editItem}
            error={formError}
            loading={formLoading}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteItem && (
        <Modal title="Удалить пункт?" onClose={() => setDeleteItem(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Вы уверены, что хотите удалить пункт{' '}
              <span className="text-text font-medium">«{deleteItem.label}»</span>?
              Это действие необратимо.
            </p>
            {formError && (
              <p className="text-xs text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={formLoading}
                className="flex-1 bg-red/20 text-red border border-red/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red/30 transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-text transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
