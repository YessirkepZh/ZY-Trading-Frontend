import { useCallback, useEffect, useRef, useState } from 'react';

interface ScreenshotModalProps {
  src: string;
  label: string;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export default function ScreenshotModal({ src, label, onClose }: ScreenshotModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((current) => clampScale(current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((current) => clampScale(current - ZOOM_STEP));
  }, []);

  const enterFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element || document.fullscreenElement) return;

    try {
      await element.requestFullscreen();
    } catch {
      // Browser may block fullscreen without a direct user gesture.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await enterFullscreen();
  }, [enterFullscreen]);

  const handleClose = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void handleClose();
        }
        return;
      }

      if (event.key === '+' || event.key === '=') {
        zoomIn();
      }

      if (event.key === '-') {
        zoomOut();
      }

      if (event.key === '0') {
        resetView();
      }
    };

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);

      if (document.fullscreenElement) {
        void document.exitFullscreen();
      }
    };
  }, [handleClose, resetView, zoomIn, zoomOut]);

  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((current) => clampScale(current + delta));
  };

  const handleDoubleClick = () => {
    setScale((current) => (current === 1 ? 2 : 1));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;

    setIsDragging(true);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      posX: position.x,
      posY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setPosition({
      x: dragStart.current.posX + (event.clientX - dragStart.current.x),
      y: dragStart.current.posY + (event.clientY - dragStart.current.y),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={handleClose}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 bg-black/90 border-b border-border shrink-0"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="text-sm text-text truncate">{label}</span>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={zoomOut}
            className="text-muted hover:text-text transition-colors p-2 rounded hover:bg-white/10"
            aria-label="Уменьшить"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <span className="text-xs text-muted w-12 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            className="text-muted hover:text-text transition-colors p-2 rounded hover:bg-white/10"
            aria-label="Увеличить"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={resetView}
            className="text-muted hover:text-text transition-colors px-2 py-2 rounded hover:bg-white/10 text-xs"
          >
            100%
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="text-muted hover:text-text transition-colors p-2 rounded hover:bg-white/10"
            aria-label={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleClose()}
            className="text-muted hover:text-text transition-colors p-2 rounded hover:bg-white/10"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-hidden touch-none"
        onClick={(event) => event.stopPropagation()}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={src}
            alt={label}
            draggable={false}
            onDoubleClick={handleDoubleClick}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>

      <div
        className="px-4 py-2 text-xs text-muted text-center bg-black/90 border-t border-border shrink-0"
        onClick={(event) => event.stopPropagation()}
      >
        Колёсико или +/- для зума • двойной клик 100%/200% • перетаскивание при увеличении • Esc — закрыть
      </div>
    </div>
  );
}
