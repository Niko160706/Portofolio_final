import React, { useEffect, useState } from 'react';
import { BRANCHES, MAIN_PATH, PRECURSOR_PATH, WHISPER_PATH } from './fractureGeometry';

export type FractureIntensity = 'G0' | 'G1' | 'G2' | 'G3';

interface AlterFractureLabProps {
  initialIntensity: FractureIntensity;
  showControls?: boolean;
  transparentVoid?: boolean;
}

const intensityLabels: FractureIntensity[] = ['G0', 'G1', 'G2', 'G3'];

export function AlterFractureLab({ initialIntensity, showControls = true, transparentVoid = false }: AlterFractureLabProps) {
  const [intensity, setIntensity] = useState<FractureIntensity>(initialIntensity);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [osReduced, setOsReduced] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(preference.matches);
    setOsReduced(preference.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
      setOsReduced(event.matches);
      setRunId((value) => value + 1);
    };
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  const choose = (next: FractureIntensity) => {
    setIntensity(next);
    setVisible(true);
    setRunId((value) => value + 1);
  };

  const replay = () => {
    setVisible(true);
    setRunId((value) => value + 1);
  };

  return (
    <>
      {visible && (
        <div
          key={`${intensity}-${runId}`}
          className="alter-fracture"
          data-intensity={intensity}
          data-reduced-motion={reduced}
          aria-hidden="true"
          data-alter-fracture="true"
        >
          <svg
            className="alter-fracture__stage"
            viewBox="0 0 1000 700"
            preserveAspectRatio="none"
            focusable="false"
          >
            <defs>
              <pattern id="alter-terminal-pattern" width="140" height="96" patternUnits="userSpaceOnUse">
                <rect width="140" height="96" fill="#0D1113" />
                <g fill="#C54250" fontFamily="IBM Plex Mono, monospace" fontSize="10" opacity=".68">
                  <text x="7" y="13">7A</text>
                  <text x="52" y="27">0F</text>
                  <text x="104" y="17">C4</text>
                  <text x="22" y="52">E1</text>
                  <text x="76" y="63">9B</text>
                  <text x="116" y="48">2D</text>
                  <text x="9" y="87">5C</text>
                  <text x="63" y="92">A7</text>
                  <text x="118" y="75">3F</text>
                  <text x="38" y="77">8D</text>
                </g>
                <g fill="#D8E0DC" fontFamily="IBM Plex Mono, monospace" fontSize="8" opacity=".24">
                  <text x="31" y="38">observer</text>
                  <text x="82" y="79">trace_04</text>
                  <text x="12" y="68">/dev/veil</text>
                </g>
                <g fill="#E35A64" fontFamily="IBM Plex Mono, monospace" fontSize="9" opacity=".58">
                  <text x="48" y="44">omitted</text>
                  <text x="96" y="93">contested</text>
                  <text x="74" y="10">005</text>
                </g>
              </pattern>
              <linearGradient id="alter-void-depth" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#07090B" />
                <stop offset=".55" stopColor="#0D1113" />
                <stop offset="1" stopColor="#14191B" />
              </linearGradient>
            </defs>

            <g className="alter-fracture__shake">
              <g className="alter-fracture__geometry">
              <g className="alter-fracture__main">
                <path className="alter-fracture__void" d={MAIN_PATH} fill={transparentVoid ? 'none' : 'url(#alter-terminal-pattern)'} />
                <path className="alter-fracture__edge-dark" d={MAIN_PATH} fill="none" stroke="#05070A" strokeWidth="8" strokeLinejoin="miter" />
                <path className="alter-fracture__edge-red" d={MAIN_PATH} fill="none" stroke="#C54250" strokeWidth="2.5" strokeLinejoin="miter" />
                <path className="alter-fracture__chroma-red" d={MAIN_PATH} fill="none" stroke="#E35A64" strokeWidth="4.5" transform="translate(-4 1)" opacity=".62" />
                <path className="alter-fracture__chroma-cyan" d={MAIN_PATH} fill="none" stroke="#80B7B3" strokeWidth="3.5" transform="translate(4 -1)" opacity=".42" />
              </g>

              {BRANCHES.map((branch, index) => (
                <g key={branch} className={`alter-fracture__branch alter-fracture__branch--${index + 1}`}>
                  <path d={branch} fill="none" stroke="#05070A" strokeWidth={9 - index} strokeLinecap="square" />
                  <path d={branch} fill="none" stroke="#C54250" strokeWidth="1.8" opacity=".8" />
                  <path d={branch} fill="none" stroke="#E35A64" strokeWidth="2.8" transform="translate(-3 1)" opacity=".45" />
                  <path d={branch} fill="none" stroke="#80B7B3" strokeWidth="2.8" transform="translate(3 -1)" opacity=".38" />
                </g>
              ))}
              </g>

              <g className="alter-fracture__debris">
                <rect className="alter-fracture__debris" x="196" y="180" width="20" height="5" fill="#C54250" />
                <rect className="alter-fracture__debris alter-fracture__debris--2" x="268" y="304" width="15" height="4" fill="#D8E0DC" />
                <rect className="alter-fracture__debris alter-fracture__debris--3" x="330" y="360" width="12" height="3" fill="#E35A64" />
                <polygon className="alter-fracture__debris alter-fracture__debris--4" points="286,320 306,315 302,330 282,335" fill="#80B7B3" />
                <polygon className="alter-fracture__debris alter-fracture__debris--5" points="342,420 360,416 364,430 344,436" fill="#D8E0DC" />
                <rect className="alter-fracture__debris alter-fracture__debris--2" x="250" y="500" width="18" height="4" fill="#D8E0DC" />
                <rect className="alter-fracture__debris alter-fracture__debris--3" x="386" y="570" width="14" height="4" fill="#C54250" />
                <polygon className="alter-fracture__debris alter-fracture__debris--4" points="402,250 424,246 420,262 398,266" fill="#C54250" />
                <polygon className="alter-fracture__debris alter-fracture__debris--5" points="240,600 262,595 258,611 236,616" fill="#80B7B3" />
                <rect className="alter-fracture__debris alter-fracture__debris--2" x="172" y="630" width="14" height="3" fill="#C54250" />
                <rect className="alter-fracture__debris alter-fracture__debris--3" x="330" y="210" width="10" height="3" fill="#D8E0DC" />
                <rect className="alter-fracture__debris alter-fracture__debris--4" x="150" y="360" width="9" height="3" fill="#80B7B3" />
              </g>

              <path className="alter-fracture__precursor" d={PRECURSOR_PATH} fill="none" stroke="#E35A64" strokeWidth="2.5" strokeLinecap="square" />
              <g className="alter-fracture__whisper">
                <path d={WHISPER_PATH} fill="none" stroke="#C54250" strokeWidth="2" strokeLinecap="square" />
                <text x="497" y="323" fill="#C54250" fontFamily="IBM Plex Mono, monospace" fontSize="10">7A</text>
              </g>
            </g>
          </svg>
        </div>
      )}

      {showControls && (
      <aside className="alter-fracture__controls" aria-label="Alter fracture proof of concept controls" data-alter-fracture-controls="true">
        <strong>ALTER / FRACTURE LAB</strong>
        <div>Intensity: {visible ? intensity : 'off'} | {reduced ? 'static' : 'animated'}</div>
        <div className="alter-fracture__controls-row">
          {intensityLabels.map((label) => (
            <button
              key={label}
              type="button"
              aria-pressed={visible && intensity === label}
              onClick={() => choose(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="alter-fracture__controls-row">
          <button type="button" onClick={replay}>Replay</button>
          <button type="button" onClick={() => setVisible(false)}>Hide</button>
          <button
            type="button"
            aria-pressed={reduced}
            disabled={osReduced}
            title={osReduced ? 'System reduced-motion preference is active' : undefined}
            onClick={() => {
              setReduced((value) => !value);
              setRunId((value) => value + 1);
            }}
          >
            Motion: {osReduced ? 'OS Off' : reduced ? 'Off' : 'On'}
          </button>
        </div>
        <p>QA only. Static SVG fallback when motion is reduced.</p>
      </aside>
      )}
    </>
  );
}
