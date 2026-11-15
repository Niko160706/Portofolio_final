import { useEffect, useRef, useState } from 'react';

interface AlterRainProps {
  motionEnabled: boolean;
}

const GLYPHS = '01ABCDEF<>/\\[]{}#%$&*+=:;.,';
const PALE = new Set(['A', 'E', '7', '4', '0']);
const COLUMN_SEED = 0x1a2b3c4d;

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

export function AlterRain({ motionEnabled }: AlterRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) {
      setFallback(true);
      return;
    }

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = 0;
    let columns: Array<{
      x: number;
      y: number;
      speed: number;
      size: number;
      brightness: number;
      glyphs: string[];
    }> = [];

    const random = seededRandom(COLUMN_SEED);

    const buildColumns = () => {
      const count = width < 600 ? 14 : Math.min(38, Math.max(18, Math.floor(width / 44)));
      columns = Array.from({ length: count }, (_, index) => ({
        x: (width / count) * (index + 0.5) + (random() - 0.5) * 18,
        y: random() * height,
        speed: 14 + random() * 34,
        size: width < 600 ? 10 : 12,
        brightness: 0.24 + random() * 0.5,
        glyphs: Array.from({ length: 5 + Math.floor(random() * 5) }, () => GLYPHS[Math.floor(random() * GLYPHS.length)])
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = rect.width;
      height = rect.height;
      buildColumns();
    };

    const clearField = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = '#07090B';
      context.fillRect(0, 0, width, height);
    };

    const drawGlyphs = (time: number, delta: number) => {
      context.fillStyle = 'rgba(7, 9, 11, 0.16)';
      context.fillRect(0, 0, width, height);
      context.textBaseline = 'top';
      for (const column of columns) {
        column.y += (column.speed * delta) / 1000;
        if (column.y > height + column.glyphs.length * column.size * 1.2) {
          column.y = -column.glyphs.length * column.size * 1.2;
          column.speed = 14 + random() * 34;
          column.brightness = 0.24 + random() * 0.5;
        }
        context.font = `${column.size}px "IBM Plex Mono", monospace`;
        column.glyphs.forEach((glyph, index) => {
          const y = column.y + index * column.size * 1.2;
          if (y < -column.size || y > height + column.size) return;
          const pale = PALE.has(glyph);
          context.fillStyle = pale
            ? `rgba(216, 224, 220, ${column.brightness * 0.55})`
            : `rgba(197, 66, 80, ${column.brightness})`;
          context.fillText(glyph, column.x, y);
        });
      }
    };

    const drawStatic = () => {
      clearField();
      context.textBaseline = 'top';
      for (const column of columns) {
        context.font = `${column.size}px "IBM Plex Mono", monospace`;
        column.glyphs.forEach((glyph, index) => {
          const y = (column.y + index * column.size * 1.2) % (height + 60) - 30;
          const pale = PALE.has(glyph);
          context.fillStyle = pale
            ? `rgba(216, 224, 220, ${column.brightness * 0.45})`
            : `rgba(197, 66, 80, ${column.brightness * 0.8})`;
          context.fillText(glyph, column.x, y);
        });
      }
    };

    const animate = (time: number) => {
      const delta = lastTime ? Math.min(48, time - lastTime) : 16;
      lastTime = time;
      drawGlyphs(time, delta);
      frame = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const start = () => {
      stop();
      resize();
      if (!motionEnabled) {
        drawStatic();
        return;
      }
      lastTime = 0;
      frame = requestAnimationFrame(animate);
    };

    start();

    const onResize = () => {
      resize();
      if (!motionEnabled) drawStatic();
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (motionEnabled && !frame) {
        lastTime = 0;
        frame = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [motionEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="alter-terminal__rain"
      aria-hidden="true"
      data-rain={fallback ? 'fallback' : 'canvas'}
    />
  );
}
