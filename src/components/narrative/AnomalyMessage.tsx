import React, { useEffect, useRef } from 'react';
import { narrativeAnomalies, type AnomalyId } from '../../data/narrative';

export interface AnomalyMessageProps {
  anomalyId: AnomalyId | null;
  onDismiss: () => void;
  onDisableEffects: () => void;
}

export const AnomalyMessage: React.FC<AnomalyMessageProps> = ({
  anomalyId,
  onDismiss,
  onDisableEffects
}) => {
  const noteRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!anomalyId) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    noteRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [anomalyId, onDismiss]);

  if (!anomalyId) return null;
  const data = narrativeAnomalies[anomalyId];
  if (!data) return null;

  const isDiagnostics = anomalyId === 'AN-04';

  return (
    <aside
      ref={noteRef}
      className={`anomaly-note ${isDiagnostics ? 'anomaly-note--diagnostics' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={`System note: ${data.header}`}
      tabIndex={-1}
    >
      <header className="anomaly-note-head">
        <span className="bitmap-label">System note</span>
        <span className="mono-label anomaly-id">{data.id}</span>
        <button type="button" className="anomaly-close" onClick={onDismiss} aria-label="Dismiss system note">
          ×
        </button>
      </header>

      <p className="anomaly-heading">{data.header}</p>

      {isDiagnostics ? (
        <pre className="diagnostics-terminal">{data.body}</pre>
      ) : (
        <p className="anomaly-body">{data.body}</p>
      )}

      {data.detail && <p className="anomaly-detail">{data.detail}</p>}

      <footer className="anomaly-foot">
        <span className="mono-label">{data.footnote}</span>
        <div className="anomaly-actions">
          <button type="button" className="text-button" onClick={onDisableEffects}>
            Disable effects
          </button>
          <button type="button" className="retro-action" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </footer>
    </aside>
  );
};
