import { useCallback, useEffect, useRef, useState } from 'react';
import type * as ThreeTypes from 'three';

export type Vector3 = [number, number, number];
export type Matrix2 = [number, number, number, number];

export interface VectorDemoEvent {
  type: 'preset' | 'vector-committed' | 'reset';
  preset: string;
  vector: Vector3;
  transformed: Vector3;
  matrix: Matrix2;
  determinant: number;
}

interface VectorDemoProps {
  onInteraction?: (event: VectorDemoEvent) => void;
  resetToken?: number;
  onInspectOrientation?: () => void;
}

const initialVector: Vector3 = [2, 2, 1];
const presets: { name: string; matrix: Matrix2 }[] = [
  { name: 'Identity', matrix: [1, 0, 0, 1] },
  { name: 'Rotate 45°', matrix: [Math.SQRT1_2, -Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2] },
  { name: 'Shear X', matrix: [1, 0.5, 0, 1] },
  { name: 'Reflect Y', matrix: [-1, 0, 0, 1] }
];

export function transformVector([x, y, z]: Vector3, [a, b, c, d]: Matrix2): Vector3 {
  return [a * x + b * y, c * x + d * y, z];
}

function projectVector([x, y, z]: Vector3, scale: number) {
  return { x: 300 + (x - y) * 48 * scale, y: 240 + ((x + y) * 24 - z * 70) * scale };
}

const determinantOf = ([a, b, c, d]: Matrix2) => a * d - b * c;
const format = (value: number) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}`;

export function VectorDemo({ onInteraction, resetToken = 0, onInspectOrientation }: VectorDemoProps) {
  const host = useRef<HTMLDivElement>(null);
  const vectorRef = useRef<Vector3>(initialVector);
  const matrixRef = useRef<Matrix2>(presets[2].matrix);
  const updateScene = useRef<() => void>(() => {});
  const resetCamera = useRef<() => void>(() => {});
  const resetScene = useRef<() => void>(() => {});
  const matrixAnimation = useRef(0);
  const lastResetToken = useRef(resetToken);

  const [values, setValues] = useState<Vector3>(initialVector);
  const [displayMatrix, setDisplayMatrix] = useState<Matrix2>(presets[2].matrix);
  const [activePreset, setActivePreset] = useState('Shear X');
  const [renderMode, setRenderMode] = useState<'loading' | 'interactive' | 'reduced' | 'fallback'>('loading');

  const transformed = transformVector(values, displayMatrix);
  const determinant = determinantOf(displayMatrix);
  const [a, b, c, d] = displayMatrix;
  const maxExtent = Math.max(1, Math.abs((values[0] - values[1]) * 48), Math.abs((values[0] + values[1]) * 24 - values[2] * 70), Math.abs((transformed[0] - transformed[1]) * 48), Math.abs((transformed[0] + transformed[1]) * 24 - transformed[2] * 70));
  const projectionScale = Math.min(1, 135 / maxExtent);
  const sourcePoint = projectVector(values, projectionScale);
  const resultPoint = projectVector(transformed, projectionScale);

  const emit = useCallback((type: VectorDemoEvent['type'], preset = activePreset) => {
    const matrix = [...matrixRef.current] as Matrix2;
    const vector = [...vectorRef.current] as Vector3;
    onInteraction?.({ type, preset, vector, transformed: transformVector(vector, matrix), matrix, determinant: determinantOf(matrix) });
  }, [activePreset, onInteraction]);

  const applyMatrix = useCallback((target: Matrix2) => {
    if (matrixAnimation.current) cancelAnimationFrame(matrixAnimation.current);
    const start = [...matrixRef.current] as Matrix2;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      matrixRef.current = target;
      setDisplayMatrix(target);
      updateScene.current();
      return;
    }
    const beganAt = performance.now();
    const frame = (now: number) => {
      const progress = Math.min(1, (now - beganAt) / 360);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const next = start.map((value, index) => value + (target[index] - value) * eased) as Matrix2;
      matrixRef.current = progress === 1 ? target : next;
      setDisplayMatrix(matrixRef.current);
      updateScene.current();
      if (progress < 1) matrixAnimation.current = requestAnimationFrame(frame);
      else matrixAnimation.current = 0;
    };
    matrixAnimation.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let disposed = false;
    let cleanup = () => {};
    let started = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.dataset.motion = 'reduced';
        setRenderMode('reduced');
        return;
      }
      void start();
    }, { rootMargin: '180px' });
    observer.observe(root);

    async function start() {
      if (started || disposed) return;
      started = true;
      const container = root;
      if (!container) return;
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0xffffff, 0);
        container.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional vectors. Drag to orbit and scroll to zoom.');

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
        camera.position.set(8.8, 7.2, 10.8);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.minDistance = 7;
        controls.maxDistance = 24;
        controls.minPolarAngle = 0.18;
        controls.maxPolarAngle = Math.PI - 0.18;
        controls.target.set(0, 0, 0.35);

        const grid = new THREE.GridHelper(12, 12, 0xd3dad4, 0xe8ece8);
        grid.rotation.x = Math.PI / 2;
        scene.add(grid);
        const axisColors = [0x303934, 0x638b71, 0x87918b];
        for (let index = 0; index < 3; index += 1) {
          const direction = new THREE.Vector3().setComponent(index, 1);
          scene.add(new THREE.ArrowHelper(direction, new THREE.Vector3(), 4.4, axisColors[index], 0.17, 0.1));
        }
        const sourceArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0.5).normalize(), new THREE.Vector3(), 3, 0x9ba3a0, 0.24, 0.13);
        const transformedArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0.5).normalize(), new THREE.Vector3(), 3, 0x5c9274, 0.27, 0.15);
        const deltaGeometry = new THREE.BufferGeometry();
        const deltaPositions = new Float32Array(6);
        deltaGeometry.setAttribute('position', new THREE.BufferAttribute(deltaPositions, 3));
        const deltaLine = new THREE.Line(deltaGeometry, new THREE.LineDashedMaterial({ color: 0xa8b0aa, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.68 }));
        scene.add(deltaLine, sourceArrow, transformedArrow);

        const draw = () => renderer.render(scene, camera);
        updateScene.current = () => {
          const source = new THREE.Vector3(...vectorRef.current);
          const output = new THREE.Vector3(...transformVector(vectorRef.current, matrixRef.current));
          const setArrow = (arrow: ThreeTypes.ArrowHelper, value: ThreeTypes.Vector3, head: number, width: number) => {
            const length = value.length();
            arrow.visible = length > 0.001;
            if (!arrow.visible) return;
            arrow.setDirection(value.clone().normalize());
            arrow.setLength(length, Math.min(head, length * 0.24), Math.min(width, length * 0.12));
          };
          setArrow(sourceArrow, source, 0.24, 0.13);
          setArrow(transformedArrow, output, 0.27, 0.15);
          deltaPositions.set([source.x, source.y, source.z, output.x, output.y, output.z]);
          deltaGeometry.attributes.position.needsUpdate = true;
          deltaGeometry.computeBoundingSphere();
          deltaLine.computeLineDistances();
          draw();
        };

        let cameraFrame = 0;
        let cameraActive = false;
        let settleUntil = 0;
        const cameraLoop = (now: number) => {
          controls.update();
          draw();
          if (cameraActive || now < settleUntil) cameraFrame = requestAnimationFrame(cameraLoop);
          else cameraFrame = 0;
        };
        const startCameraMotion = () => { cameraActive = true; if (!cameraFrame) cameraFrame = requestAnimationFrame(cameraLoop); };
        const endCameraMotion = () => { cameraActive = false; settleUntil = performance.now() + 420; if (!cameraFrame) cameraFrame = requestAnimationFrame(cameraLoop); };
        controls.addEventListener('start', startCameraMotion);
        controls.addEventListener('end', endCameraMotion);
        controls.addEventListener('change', draw);
        resetCamera.current = () => {
          camera.position.set(8.8, 7.2, 10.8);
          controls.target.set(0, 0, 0.35);
          controls.update();
          draw();
        };
        const size = () => {
          if (!container.clientWidth || !container.clientHeight) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight, false);
          draw();
        };
        const resize = new ResizeObserver(size);
        resize.observe(container);
        size();
        updateScene.current();
        container.dataset.motion = 'ready';
        setRenderMode('interactive');
        cleanup = () => {
          resize.disconnect();
          controls.removeEventListener('start', startCameraMotion);
          controls.removeEventListener('end', endCameraMotion);
          controls.removeEventListener('change', draw);
          controls.dispose();
          if (cameraFrame) cancelAnimationFrame(cameraFrame);
          scene.traverse((object) => {
            const renderable = object as ThreeTypes.Object3D & { geometry?: ThreeTypes.BufferGeometry; material?: ThreeTypes.Material | ThreeTypes.Material[] };
            renderable.geometry?.dispose();
            if (Array.isArray(renderable.material)) renderable.material.forEach((material) => material.dispose());
            else renderable.material?.dispose();
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        container.dataset.motion = 'fallback';
        setRenderMode('fallback');
      }
    }
    return () => { disposed = true; observer.disconnect(); cleanup(); };
  }, []);

  const selectPreset = (preset: (typeof presets)[number]) => {
    setActivePreset(preset.name);
    applyMatrix(preset.matrix);
    const vector = [...vectorRef.current] as Vector3;
    onInteraction?.({ type: 'preset', preset: preset.name, vector, transformed: transformVector(vector, preset.matrix), matrix: preset.matrix, determinant: determinantOf(preset.matrix) });
  };

  const changeComponent = (index: number, value: number) => {
    const next = [...values] as Vector3;
    next[index] = value;
    vectorRef.current = next;
    setValues(next);
    updateScene.current();
  };

  const performReset = useCallback(() => {
    const identity = presets[0];
    if (matrixAnimation.current) cancelAnimationFrame(matrixAnimation.current);
    vectorRef.current = initialVector;
    matrixRef.current = identity.matrix;
    setValues(initialVector);
    setDisplayMatrix(identity.matrix);
    setActivePreset(identity.name);
    updateScene.current();
    resetCamera.current();
    onInteraction?.({ type: 'reset', preset: identity.name, vector: initialVector, transformed: initialVector, matrix: identity.matrix, determinant: 1 });
  }, [onInteraction]);
  resetScene.current = performReset;

  useEffect(() => {
    if (resetToken === lastResetToken.current) return;
    lastResetToken.current = resetToken;
    resetScene.current();
  }, [resetToken]);

  useEffect(() => () => { if (matrixAnimation.current) cancelAnimationFrame(matrixAnimation.current); }, []);

  const interpretation = Math.abs(determinant) < 0.005 ? 'Area collapses to zero; this matrix is not invertible.' : determinant < 0 ? `Orientation reverses. Unsigned area scales by ${Math.abs(determinant).toFixed(2)}.` : `Orientation is preserved. Area scales by ${Math.abs(determinant).toFixed(2)}.`;

  return (
    <div className="vector-demo" aria-label="Interactive mathematical studio">
      <div className="vector-stage" ref={host}>
        <svg className="vector-fallback" viewBox="0 0 600 400" role="img" aria-label="Static preview of source and transformed vectors on X, Y and Z axes">
          <defs><marker id="vector-arrow-source" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9ba3a0" /></marker><marker id="vector-arrow-result" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5c9274" /></marker></defs>
          <path d="M85 134L515 346M85 346L515 134M300 370V30" stroke="#dce2dd" fill="none" />
          <path d={`M300 240L${sourcePoint.x} ${sourcePoint.y}`} stroke="#9ba3a0" strokeWidth="4" markerEnd="url(#vector-arrow-source)" />
          <path d={`M300 240L${resultPoint.x} ${resultPoint.y}`} stroke="#5c9274" strokeWidth="5" markerEnd="url(#vector-arrow-result)" />
          <g fill="#3b443d" fontSize="18"><text x="516" y="350">X</text><text x="516" y="130">Y</text><text x="305" y="28">Z</text></g>
        </svg>
        <span className="axis-labels">X · Y · Z</span>
        <div className="vector-stage-legend" aria-hidden="true"><span><i />Source</span><span><i className="legend-transformed" />Transformed</span></div>
      </div>
      <div className="vector-stage-footer"><p className="vector-hint">{renderMode === 'interactive' ? 'Drag to orbit · scroll or pinch to zoom' : renderMode === 'reduced' ? 'Reduced motion: static view. Controls remain available.' : renderMode === 'fallback' ? 'WebGL unavailable: interactive SVG preview shown.' : 'Loading interactive vector view…'}</p><button type="button" onClick={() => resetCamera.current()}>Reset camera</button></div>
      <div className="vector-control-deck">
        <section className="vector-control-group vector-explore" aria-labelledby="vector-explore-title"><h4 id="vector-explore-title">Transformation</h4><div className="matrix-presets" role="group" aria-label="Matrix transformation presets">{presets.map((preset) => <button key={preset.name} type="button" aria-pressed={activePreset === preset.name} onClick={() => selectPreset(preset)}>{preset.name}</button>)}</div></section>
        <section className="vector-control-group vector-inputs" aria-labelledby="vector-inputs-title"><div className="vector-group-heading"><h4 id="vector-inputs-title">Source vector</h4><span>Range −3 to 3</span></div><div className="vector-controls">{values.map((value, index) => <label key={index}><span>{['X', 'Y', 'Z'][index]}</span><output>{value.toFixed(1)}</output><input aria-label={`Source vector ${['X', 'Y', 'Z'][index]}`} type="range" min="-3" max="3" step="0.1" value={value} onChange={(event) => changeComponent(index, Number(event.target.value))} onPointerUp={() => emit('vector-committed')} onKeyUp={(event) => { if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') emit('vector-committed'); }} /></label>)}</div></section>
        <section className="vector-control-group vector-results" aria-labelledby="vector-results-title"><div className="vector-group-heading"><h4 id="vector-results-title">Results</h4><button type="button" onClick={performReset}>Reset scene</button></div><div className="vector-result-grid" aria-live="polite"><div className="vector-result-item"><span>Original vector</span><strong>({values.map(format).join(', ')})</strong></div><div className="vector-result-item"><span>Transformed vector</span><strong>({transformed.map(format).join(', ')})</strong></div><div className="vector-result-item"><span>Matrix</span><table className="vector-matrix" aria-label="Current 2 by 2 matrix"><tbody><tr><td>{format(a)}</td><td>{format(b)}</td></tr><tr><td>{format(c)}</td><td>{format(d)}</td></tr></tbody></table></div><div className="vector-result-item"><span>Determinant</span><strong>{format(determinant)}</strong></div></div><p className="vector-interpretation">{interpretation}</p>{determinant < 0 && onInspectOrientation && <button type="button" className="vector-inspect" onClick={onInspectOrientation}>Inspect orientation</button>}</section>
      </div>
    </div>
  );
}
