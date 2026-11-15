export const moroStateOrder = [
  'idle',
  'running-right',
  'running-left',
  'waving',
  'jumping',
  'failed',
  'waiting',
  'running',
  'review'
] as const;

export type MoroState = (typeof moroStateOrder)[number];

export interface MoroFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  durationMs: number;
}

export interface MoroAnimation {
  label: string;
  row: number;
  frames: MoroFrame[];
}

export interface MoroManifest {
  frameSize: { width: number; height: number };
  atlas: string;
  fallback: string;
  animations: Record<MoroState, MoroAnimation>;
}

export type MoroStateChange = (state: MoroState, fallback: boolean) => void;

export function isMoroManifest(value: unknown): value is MoroManifest {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as Partial<MoroManifest>;
  if (
    manifest.frameSize?.width !== 192 ||
    manifest.frameSize?.height !== 208 ||
    typeof manifest.atlas !== 'string' ||
    typeof manifest.fallback !== 'string' ||
    !manifest.animations
  ) return false;

  return moroStateOrder.every((state) => {
    const animation = manifest.animations?.[state];
    return Boolean(
      animation &&
      typeof animation.label === 'string' &&
      Number.isInteger(animation.row) &&
      Array.isArray(animation.frames) &&
      animation.frames.length > 0 &&
      animation.frames.every((frame) =>
        Number.isFinite(frame.x) &&
        Number.isFinite(frame.y) &&
        frame.width === 192 &&
        frame.height === 208 &&
        Number.isFinite(frame.durationMs) &&
        frame.durationMs > 0
      )
    );
  });
}

export class MoroSpritePlayer {
  private readonly context: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly image: HTMLImageElement;
  private state: MoroState = 'idle';
  private idleState: MoroState = 'idle';
  private frameIndex = 0;
  private elapsed = 0;
  private lastTime = 0;
  private raf = 0;
  private timer = 0;
  private looping = true;
  private returnTo: MoroState | null = null;
  private userPaused = false;
  private motionEnabled = true;
  private fallback = false;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly manifest: MoroManifest,
    private readonly assetRoot: URL,
    private readonly onStateChange?: MoroStateChange,
    private readonly onFallback?: () => void
  ) {
    this.canvas.width = manifest.frameSize.width;
    this.canvas.height = manifest.frameSize.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('MORO canvas context is unavailable.');
    this.context = context;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.image = new Image();
    this.image.decoding = 'async';
    this.image.fetchPriority = 'low';

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.reducedMotion.addEventListener('change', this.handleMotionPreferenceChange);
  }

  async load(): Promise<void> {
    try {
      await this.decodeImage(new URL(this.manifest.atlas, this.assetRoot));
    } catch {
      try {
        this.fallback = true;
        await this.decodeImage(new URL(this.manifest.fallback, this.assetRoot));
        this.onFallback?.();
      } catch {
        throw new Error('MORO atlas and static fallback could not be loaded.');
      }
    }

    if (this.destroyed) return;
    this.render();
    this.onStateChange?.(this.state, this.fallback);
    if (this.reducedMotion.matches) this.motionEnabled = false;
    this.lastTime = performance.now();
    if (this.canAnimate()) this.schedule();
  }

  play(state: MoroState): void {
    this.start(state, true, null);
  }

  playOnce(state: MoroState, returnTo: MoroState = this.idleState): void {
    if (!this.motionAllowed()) {
      this.start(this.idleState, true, null);
      return;
    }
    this.start(state, false, returnTo);
  }

  setIdleState(state: MoroState): void {
    this.idleState = state;
    if (this.state === 'idle' || this.looping) this.start(state, true, null);
  }

  pause(): void {
    this.userPaused = true;
    this.cancelSchedule();
  }

  resume(): void {
    this.userPaused = false;
    this.lastTime = performance.now();
    this.schedule();
  }

  reset(): void {
    this.userPaused = false;
    this.start(this.idleState, true, null);
  }

  setMotionEnabled(enabled: boolean): void {
    this.motionEnabled = enabled && !this.reducedMotion.matches;
    if (!this.motionEnabled) {
      this.userPaused = false;
      this.start(this.idleState, true, null);
    } else if (this.canAnimate()) {
      this.lastTime = performance.now();
      this.schedule();
    }
  }

  get currentState(): MoroState {
    return this.state;
  }

  get isFallback(): boolean {
    return this.fallback;
  }

  destroy(): void {
    this.destroyed = true;
    this.cancelSchedule();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.reducedMotion.removeEventListener('change', this.handleMotionPreferenceChange);
    this.image.onload = null;
    this.image.onerror = null;
    this.image.src = '';
  }

  private async decodeImage(url: URL): Promise<void> {
    this.image.src = url.href;
    await this.image.decode();
  }

  private start(state: MoroState, looping: boolean, returnTo: MoroState | null): void {
    if (this.destroyed) return;
    // Defensive fallback for callers that bypass the MoroState type at runtime.
    if (!this.manifest.animations[state]) {
      state = this.idleState;
      looping = true;
      returnTo = null;
    }
    if (!this.motionAllowed() && state !== this.idleState) {
      state = this.idleState;
      looping = true;
      returnTo = null;
    }
    this.cancelSchedule();
    this.state = state;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.lastTime = performance.now();
    this.looping = looping;
    this.returnTo = returnTo;
    this.render();
    this.onStateChange?.(state, this.fallback);
    if (this.canAnimate()) this.schedule();
  }

  private motionAllowed(): boolean {
    return this.motionEnabled && !this.reducedMotion.matches;
  }

  private canAnimate(): boolean {
    return this.motionAllowed() && !document.hidden && !this.userPaused && !this.fallback;
  }

  private schedule(): void {
    if (this.timer || this.raf || !this.canAnimate()) return;
    const animation = this.manifest.animations[this.state];
    const remaining = Math.max(0, animation.frames[this.frameIndex].durationMs - this.elapsed);
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      if (this.canAnimate()) this.raf = requestAnimationFrame(this.tick);
    }, remaining);
  }

  private cancelSchedule(): void {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (time: number): void => {
    this.raf = 0;
    if (!this.canAnimate()) return;
    const delta = this.lastTime ? Math.max(0, time - this.lastTime) : 0;
    this.lastTime = time;
    this.elapsed += delta;

    const animation = this.manifest.animations[this.state];
    let changed = false;
    while (this.elapsed >= animation.frames[this.frameIndex].durationMs) {
      this.elapsed -= animation.frames[this.frameIndex].durationMs;
      if (this.frameIndex < animation.frames.length - 1) {
        this.frameIndex += 1;
        changed = true;
      } else if (this.looping) {
        this.frameIndex = 0;
        changed = true;
      } else if (this.returnTo) {
        this.start(this.returnTo, true, null);
        return;
      } else {
        this.elapsed = 0;
        this.userPaused = true;
        break;
      }
    }

    if (changed) this.render();
    this.schedule();
  };

  private render(): void {
    if (this.destroyed || !this.image.complete || !this.image.naturalWidth) return;
    const { width, height } = this.manifest.frameSize;
    this.context.clearRect(0, 0, width, height);
    if (this.fallback) {
      this.context.drawImage(this.image, 0, 0, width, height);
      return;
    }
    const frame = this.manifest.animations[this.state].frames[this.frameIndex];
    this.context.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0,
      0,
      width,
      height
    );
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.cancelSchedule();
      this.lastTime = 0;
    } else if (this.canAnimate()) {
      this.lastTime = performance.now();
      this.schedule();
    }
  };

  private handleMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    if (event.matches) {
      this.start(this.idleState, true, null);
    } else if (this.motionEnabled && this.canAnimate()) {
      this.start(this.idleState, true, null);
    }
  };
}
