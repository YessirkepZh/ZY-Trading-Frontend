import { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[200px] md:flex-shrink-0 md:flex-col">
        <div className="fixed top-0 left-0 w-[200px] h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 w-[200px] h-screen md:hidden transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 w-full">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted hover:text-text p-1 -ml-1"
            aria-label="Открыть меню"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-text text-sm">ZY Trading</span>
        </header>

        <div className="p-4 md:p-6 w-full max-w-full text-left">
          {children}
        </div>
      </main>
    </div>
  );
}
