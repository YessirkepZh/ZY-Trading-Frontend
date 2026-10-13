import { NavLink, useNavigate } from 'react-router-dom';
import { API_KEY_STORAGE_KEY } from '../api/client';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    navigate(0);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-blue/20 text-blue'
        : 'text-muted hover:text-text hover:bg-white/5'
    }`;

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-base font-bold text-text">ZY Trading</h1>
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-1">
        <NavLink to="/" end className={navClass} onClick={onClose}>
          <span>📊</span>
          <span>Дашборд</span>
        </NavLink>
        <NavLink to="/deals" className={navClass} onClick={onClose}>
          <span>📋</span>
          <span>Сделки</span>
        </NavLink>
        <NavLink to="/analysis" className={navClass} onClick={onClose}>
          <span>📈</span>
          <span>Анализ</span>
        </NavLink>

        <div className="mt-2 mb-1 px-3">
          <span className="text-xs text-muted/50 uppercase tracking-widest">Настройки</span>
        </div>
        <NavLink to="/settings/checklists" className={navClass} onClick={onClose}>
          <span>✅</span>
          <span>Чеклисты</span>
        </NavLink>
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-red hover:bg-red/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
