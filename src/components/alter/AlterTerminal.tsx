import React, { useEffect, useRef, useState } from 'react';
import { AlterRain } from './AlterRain';
import { fractureMaskDataUri } from './fractureGeometry';
import {
  alterHelpLines,
  formatComparison,
  formatHash,
  formatReconciliation,
  formatRecord,
  formatStatus,
  formatTraceList,
  parseAlterCommand
} from '../../lib/alter/alterParser';
import { getEchoVoiceLines, getMoroVoiceLines } from '../../data/alterNarrative';
import type { AlterClueId, AlterPhase } from '../../lib/alter/alterTypes';

interface AlterTerminalProps {
  reveal: boolean;
  onExit: () => void;
  phase: AlterPhase;
  clues: AlterClueId[];
  onReconcile: () => void;
}

const INITIAL_HISTORY = [
  'ARCHIVE / OBSERVER',
  'link established.',
  'Type help for the authored command surface.'
];

export function AlterTerminal({ reveal, onExit, phase, clues, onReconcile }: AlterTerminalProps) {
  const [motion, setMotion] = useState(true);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>(INITIAL_HISTORY);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotion(!preference.matches);
    const onChange = (event: MediaQueryListEvent) => setMotion(!event.matches);
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!reveal) inputRef.current?.focus();
  }, [reveal]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onExit]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [history]);

  const append = (lines: string[]) => {
    setHistory((current) => [...current, ...lines].slice(-140));
  };

  const runCommand = (raw: string) => {
    const parsed = parseAlterCommand(raw);
    if (parsed.type === 'empty') return;
    append([`\u276f ${raw}`]);

    switch (parsed.type) {
      case 'help':
        append(alterHelpLines);
        break;
      case 'status':
        append(formatStatus());
        break;
      case 'trace-list':
        append(formatTraceList());
        break;
      case 'trace-inspect':
        append(formatRecord(parsed.id));
        break;
      case 'hash-inspect':
        append(formatHash(parsed.id));
        break;
      case 'compare':
        append(formatComparison(parsed.id));
        break;
      case 'reconcile':
        if (phase === 'P5') {
          append(['Reconciliation already recorded. Read the resolution below.']);
        } else if (phase === 'P4') {
          append(formatReconciliation());
          onReconcile();
        } else {
          append(['The archive is not open yet. Investigate first.']);
        }
        break;
      case 'moro':
        append(getMoroVoiceLines({ phase, clues }));
        break;
      case 'echo':
        append(getEchoVoiceLines({ phase, clues }));
        break;
      case 'exit':
        onExit();
        return;
      case 'unsafe':
        append([
          'command rejected. This preview accepts authored commands only.',
          'No shell, network, or file access was attempted. Type help.'
        ]);
        break;
      case 'unknown':
        append([`unknown command: ${parsed.input}`, 'Type help for the authored command list.']);
        break;
    }

    setCommand('');
  };

  const style = {
    '--alter-reveal-mask': fractureMaskDataUri()
  } as React.CSSProperties;

  return (
    <div
      className="alter-terminal"
      data-reveal={reveal}
      data-motion={motion}
      data-alter-terminal="true"
      style={style}
      role="dialog"
      aria-modal="true"
      aria-label="Alter archive"
      aria-hidden={reveal || undefined}
    >
      <div className="alter-terminal__fallback" aria-hidden="true" />
      <AlterRain motionEnabled={motion} />
      <div className="alter-terminal__scrim" aria-hidden="true" />

      <div ref={shellRef} className="alter-terminal__shell" tabIndex={-1}>
        <header className="alter-terminal__header">
          <span className="alter-terminal__brand">ALTER / ARCHIVE</span>
          <span className="alter-terminal__session">SESSION 03 / INTERACTIVE FICTION</span>
          {!reveal && (
            <div className="alter-terminal__controls">
              <button type="button" aria-pressed={motion} onClick={() => setMotion((value) => !value)}>
                Motion: {motion ? 'On' : 'Off'}
              </button>
              <button type="button" onClick={onExit}>
                Exit
              </button>
            </div>
          )}
        </header>

        <main className="alter-terminal__main">
          <p className="alter-terminal__eyebrow">ARCHIVE / OBSERVER</p>
          <h1>Signal retained.</h1>
          <p className="alter-terminal__lead">
            The surface has opened. This is the first readable layer below the portfolio.
          </p>

          <div ref={outputRef} className="alter-terminal__output" aria-live="polite" aria-relevant="additions">
            {history.map((line, index) => (
              <p key={`${index}-${line.slice(0, 12)}`}>{line || '\u00a0'}</p>
            ))}
          </div>

          {phase === 'P5' && !reveal && (
            <section className="alter-terminal__resolution" aria-label="Reconciliation">
              <p className="alter-terminal__resolution-label">RECONCILIATION / RECORD 004</p>
              <p>MORO kept the visible summary readable.</p>
              <p>ECHO preserved the seven omitted observations.</p>
              <p>Neither account is complete. The disagreement is the record.</p>
            </section>
          )}

          {!reveal && (
            <form
              className="alter-terminal__form"
              onSubmit={(event) => {
                event.preventDefault();
                runCommand(command);
              }}
            >
              <label className="sr-only" htmlFor="alter-command">
                Archive command
              </label>
              <span aria-hidden="true">{'\u276f'}</span>
              <input
                ref={inputRef}
                id="alter-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="help"
                aria-label="Archive command"
                maxLength={120}
              />
              <button type="submit">Run</button>
            </form>
          )}

          <p className="alter-terminal__hint">
            Authored traces only. No shell, network, real data, or live model.
          </p>
        </main>

        <footer className="alter-terminal__footer">
          <span>The Human Protocol</span>
          <span>authored simulation / session only</span>
        </footer>
      </div>
    </div>
  );
}
