import React, { useEffect, useRef } from 'react';

interface UtilityDialogProps {
  label: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const UtilityDialog: React.FC<UtilityDialogProps> = ({ label, title, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useRef(`utility-title-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="utility-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        className="utility-dialog"
      >
        <header className="utility-head">
          <span className="bitmap-label">{label}</span>
          <button ref={closeRef} type="button" className="utility-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </header>
        <h2 id={titleId.current} className="utility-title">{title}</h2>
        <div className="utility-body">{children}</div>
      </div>
    </div>
  );
};
