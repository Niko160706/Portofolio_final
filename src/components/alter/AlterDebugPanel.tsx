import React from 'react';
import { ALTER_CLUES, alterClueIds, type AlterEvent, type AlterState } from '../../lib/alter/alterTypes';

interface AlterDebugPanelProps {
  state: AlterState;
  dispatch: (event: AlterEvent) => void;
  eventLog: AlterEvent[];
  reset: () => void;
  hydrated: boolean;
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  left: 12,
  bottom: 12,
  zIndex: 10000,
  width: 'min(360px, calc(100vw - 24px))',
  maxHeight: '52vh',
  overflow: 'auto',
  padding: 12,
  border: '1px solid #1e1e1e',
  background: '#f7f7f2',
  color: '#111',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 11,
  lineHeight: 1.45,
  boxShadow: '3px 3px 0 rgba(0,0,0,.18)'
};

const buttonStyle: React.CSSProperties = {
  minHeight: 30,
  padding: '4px 7px',
  border: '1px solid #1e1e1e',
  background: '#fff',
  color: '#111',
  font: 'inherit',
  cursor: 'pointer'
};

export function AlterDebugPanel({ state, dispatch, eventLog, reset, hydrated }: AlterDebugPanelProps) {
  const clueButtons = alterClueIds.map((clueId) => (
    <button
      key={clueId}
      type="button"
      style={buttonStyle}
      onClick={() =>
        dispatch({
          type: 'anomaly.clue.discovered',
          clueId,
          discoveredAt: Date.now()
        })
      }
    >
      +{clueId}
    </button>
  ));

  return (
    <aside style={panelStyle} aria-label="Alter development inspector" data-alter-debug="true">
      <strong>ALTER / DEV</strong>
      <div>phase: {state.phase} | categories: {state.uniqueCategories}/3 | hydrated: {String(hydrated)}</div>
      <div>clues: {state.discoveredClues.map((clue) => clue.id).join(', ') || 'none'}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '8px 0' }}>{clueButtons}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <button
          type="button"
          style={buttonStyle}
          disabled={state.phase !== 'P2'}
          onClick={() => dispatch({ type: 'alter.reveal.requested', at: Date.now() })}
        >
          Reveal
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={state.phase !== 'P3'}
          onClick={() => dispatch({ type: 'alter.reveal.completed', at: Date.now() })}
        >
          Reveal complete
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={state.phase !== 'P4'}
          onClick={() => dispatch({ type: 'alter.reconciliation.reached', at: Date.now() })}
        >
          Reconcile
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={state.phase !== 'P3' && state.phase !== 'P4' && state.phase !== 'P5'}
          onClick={() => dispatch({ type: 'alter.exit.requested', at: Date.now() })}
        >
          Exit
        </button>
        <button type="button" style={buttonStyle} onClick={reset}>
          Reset
        </button>
      </div>
      <div style={{ marginTop: 8, color: '#5a5a5a' }}>events: {eventLog.length}</div>
      <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {eventLog.slice(0, 8).map((event, index) => `${index + 1}. ${event.type}`).join('\n') || 'none yet'}
      </pre>
    </aside>
  );
}
