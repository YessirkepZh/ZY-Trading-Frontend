import { useEffect } from 'react';

interface ScreenshotModalProps {
  src: string;
  label: string;
  onClose: () => void;
}

export default function ScreenshotModal({ src, label, onClose }: ScreenshotModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm text-muted">{label}</span>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={src}
          alt={label}
          className="w-full rounded-lg max-h-[80vh] object-contain"
        />
      </div>
    </div>
  );
}
