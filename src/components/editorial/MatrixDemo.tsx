import { useMemo, useState } from 'react';

type Matrix = { a: number; b: number; c: number; d: number };

const initialMatrix: Matrix = { a: 1.4, b: 0.6, c: 0.2, d: 1.2 };
const SCALE = 90;

const toSvg = (x: number, y: number) => ({ x: x * SCALE, y: -y * SCALE });

export const MatrixDemo: React.FC = () => {
  const [matrix, setMatrix] = useState<Matrix>(initialMatrix);
  const [showOriginal, setShowOriginal] = useState(true);

  const determinant = useMemo(
    () => matrix.a * matrix.d - matrix.b * matrix.c,
    [matrix]
  );

  const transformed = useMemo(() => {
    const { a, b, c, d } = matrix;
    return {
      e1: toSvg(a, c),
      e2: toSvg(b, d),
      corner: toSvg(a + b, c + d),
      area: toSvg(b, d)
    };
  }, [matrix]);

  const update = (key: keyof Matrix, value: number) => {
    setMatrix((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setMatrix(initialMatrix);
    setShowOriginal(true);
  };

  return (
    <div className="matrix-demo">
      <div className="matrix-demo__stage">
        <svg
          className="matrix-demo__svg"
          viewBox="-240 -180 480 360"
          role="img"
          aria-labelledby="matrix-demo-title matrix-demo-desc"
        >
          <title id="matrix-demo-title">Interactive 2D linear transformation</title>
          <desc id="matrix-demo-desc">
            A unit square transformed by a 2x2 matrix. The four sliders change the matrix
            coefficients and update the square, the basis vectors, and the determinant.
          </desc>

          <defs>
            <pattern id="matrix-demo-grid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="#D9D9D0" strokeWidth="0.7" />
            </pattern>
            <marker id="matrix-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2D5BFF" />
            </marker>
            <marker id="matrix-arrow-ochre" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#111111" />
            </marker>
            <marker id="matrix-arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#111111" />
            </marker>
          </defs>

          <rect x="-240" y="-180" width="480" height="360" fill="#FAFAF7" />
          <rect x="-240" y="-180" width="480" height="360" fill="url(#matrix-demo-grid)" />

          {/* axes */}
          <line x1="-230" y1="0" x2="230" y2="0" stroke="#8A8A8A" strokeWidth="1" />
          <line x1="0" y1="165" x2="0" y2="-165" stroke="#8A8A8A" strokeWidth="1" />

          {/* original unit square */}
          {showOriginal && (
            <polygon
              points="0,0 90,0 90,-90 0,-90"
              fill="rgba(17, 17, 17, 0.04)"
              stroke="#5A5A5A"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* transformed square */}
          <polygon
            points={`0,0 ${transformed.e1.x},${transformed.e1.y} ${transformed.corner.x},${transformed.corner.y} ${transformed.e2.x},${transformed.e2.y}`}
            fill="rgba(45, 91, 255, 0.12)"
            stroke="#2D5BFF"
            strokeWidth="2"
          />

          {/* basis vectors */}
          <line
            x1="0"
            y1="0"
            x2={transformed.e1.x}
            y2={transformed.e1.y}
            stroke="#2D5BFF"
            strokeWidth="4"
            markerEnd="url(#matrix-arrow-blue)"
          />
          <line
            x1="0"
            y1="0"
            x2={transformed.e2.x}
            y2={transformed.e2.y}
            stroke="#111111"
            strokeWidth="4"
            markerEnd="url(#matrix-arrow-ochre)"
          />

          {/* transformed corner vector */}
          <line
            x1="0"
            y1="0"
            x2={transformed.corner.x}
            y2={transformed.corner.y}
            stroke="#111111"
            strokeWidth="1.6"
            strokeDasharray="6 5"
            markerEnd="url(#matrix-arrow-ink)"
          />

          <g
            fontFamily="'IBM Plex Mono', monospace"
            fontSize="13"
            fill="#5A5A5A"
          >
            <text x="214" y="-8">x</text>
            <text x="8" y="-152">y</text>
            <text x={transformed.e1.x + 7} y={transformed.e1.y - 5} fill="#2D5BFF">T(e₁)</text>
            <text x={transformed.e2.x + 7} y={transformed.e2.y - 5} fill="#111111">T(e₂)</text>
            <text x={transformed.corner.x + 8} y={transformed.corner.y - 7}>T(v)</text>
          </g>

          <g
            fontFamily="'IBM Plex Mono', monospace"
            fontSize="14"
            fill="#111111"
          >
            <text x="-228" y="-156">A = [ {matrix.a.toFixed(1)} {matrix.b.toFixed(1)} ; {matrix.c.toFixed(1)} {matrix.d.toFixed(1)} ]</text>
            <text x="-228" y="-140" fill="#5A5A5A">
              det(A) = {determinant.toFixed(2)}
            </text>
          </g>

        </svg>
      </div>

      <div className="matrix-controls" role="group" aria-label="Matrix coefficients">
        {([
          ['a', matrix.a],
          ['b', matrix.b],
          ['c', matrix.c],
          ['d', matrix.d]
        ] as Array<[keyof Matrix, number]>).map(([key, value]) => (
          <label className="matrix-control" key={key}>
            <span className="matrix-control__name">{key}</span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={value}
              aria-label={`Matrix coefficient ${key}, current value ${value.toFixed(1)}`}
              onChange={(event) => update(key, Number(event.target.value))}
            />
            <output>{value.toFixed(1)}</output>
          </label>
        ))}

        <label className="matrix-toggle">
          <input
            type="checkbox"
            checked={showOriginal}
            onChange={(event) => setShowOriginal(event.target.checked)}
          />
          <span>original</span>
        </label>

        <button type="button" className="matrix-reset" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
};
