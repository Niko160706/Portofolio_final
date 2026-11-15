import React, { useEffect, useRef, useState } from 'react';
import { AlterRain } from './AlterRain';
import { fractureMaskDataUri } from './fractureGeometry';

interface AlterTerminalProps {
  reveal: boolean;
  onExit: () => void;
}

export function AlterTerminal({ reveal, onExit }: AlterTerminalProps) {
  const [motion, setMotion] = useState(true);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotion(!preference.matches);
    const onChange = (event: MediaQueryListEvent) => setMotion(!event.matches);
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!reveal) shellRef.current?.focus();
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
          <pre className="alter-terminal__log">{`> link established
> source: observer.cache
> integrity: contested
> record index: sealed

Interactive fiction / no live system or real data.`}</pre>
          <p className="alter-terminal__hint">
            The record index is sealed in this layer. Authored traces will be mounted next.
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
