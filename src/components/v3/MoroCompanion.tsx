import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { isMoroManifest, MoroSpritePlayer, type MoroState } from '../../lib/moroSpritePlayer';
import type { VectorDemoEvent } from './VectorDemo';
import type { AlterClueId, AlterPhase } from '../../lib/alter/alterTypes';
import { getMoroPhaseLine } from '../../data/alterNarrative';

export interface MoroCompanionHandle {
  respond: (message: string, state?: MoroState) => void;
  play: (state: MoroState) => void;
  playOnce: (state: MoroState, returnTo?: MoroState) => void;
  setIdleState: (state: MoroState) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

interface MoroCompanionProps {
  onOpenProjects: () => void;
  onOpenContact: () => void;
  onInspectSystem: () => void;
  visualizeContext: { current?: VectorDemoEvent; previous?: VectorDemoEvent };
  onResetVisualize: () => void;
  onDiscoverClue?: (clueId: AlterClueId) => void;
  discoveredClues?: AlterClueId[];
  alterPhase?: AlterPhase;
  alterClues?: AlterClueId[];
}

const messages = {
  hero: "Hi, I'm MORO. Want to see what Niko has been building?",
  deep: "This one follows evidence. Its browser trace is illustrative.",
  visualize: 'Want to play with some vectors?',
  contact: "Want to say hello? Niko's contact links are right there.",
  quickTap: 'A quick hello back.',
  tripleTap: 'Three taps. I noticed.',
  drag: "Thanks for the walk. I'm back where I belong.",
  hold: 'Holding on gives me a moment to take a closer look.',
  manyTaps: "I hear you. Let's keep exploring."
};

type PresentationMode = 'hero' | 'visualize' | 'floating';
const MORO_BASE_WIDTH = 136;
const MORO_BASE_HEIGHT = MORO_BASE_WIDTH * 208 / 192;

const morotransform = (scale: number, rotation: number) => {
  const x = -MORO_BASE_WIDTH * (1 - scale) / 2;
  const y = -MORO_BASE_HEIGHT * (1 - scale) / 2;
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
};

export const MoroCompanion = forwardRef<MoroCompanionHandle, MoroCompanionProps>(
  function MoroCompanion({ onOpenProjects, onOpenContact, onInspectSystem, visualizeContext, onResetVisualize, onDiscoverClue, discoveredClues = [], alterPhase, alterClues = [] }, ref) {
    const rootRef = useRef<HTMLDivElement>(null);
    const motionRef = useRef<HTMLDivElement>(null);
    const safeAreaRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<MoroSpritePlayer | null>(null);
    const modeRef = useRef<PresentationMode>('hero');
    const positionAnimationRef = useRef<Animation | null>(null);
    const poseAnimationRef = useRef<Animation | null>(null);
    const inactivityTimer = useRef<number | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const tapResetTimer = useRef<number | null>(null);
    const suppressClickTimer = useRef<number | null>(null);
    const tapCount = useRef(0);
    const lastTapAt = useRef(0);
    const manualPosition = useRef(false);
    const suppressClick = useRef(false);
    const gesture = useRef<{
      pointerId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      dragging: boolean;
      longPressed: boolean;
      direction: MoroState | null;
    } | null>(null);
    const openRef = useRef(false);
    const movementEnabledRef = useRef(true);
    const heroVisibleRef = useRef(true);
    const lastCenterX = useRef(0);
    const lastDirectResponseAt = useRef(0);
    const attentionUsed = useRef(false);
    const visualizeIntroduced = useRef(false);

    const [enabled, setEnabled] = useState(true);
    const [motionEnabled, setMotionEnabled] = useState(true);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [open, setOpen] = useState(false);
    const [greeting, setGreeting] = useState(false);
    const [greetingText, setGreetingText] = useState("Hi. I'm MORO.");
    const [context, setContext] = useState(messages.hero);
    const [currentArea, setCurrentArea] = useState<'hero' | 'deep' | 'visualize' | 'contact'>('hero');
    const [currentState, setCurrentState] = useState<MoroState>('idle');
    const [ready, setReady] = useState(false);
    const [fallback, setFallback] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const positionDialogue = useCallback(() => {
      const root = rootRef.current;
      const panel = panelRef.current;
      if (!root || !panel) return;

      const rootRect = root.getBoundingClientRect();
      const safeArea = safeAreaRef.current?.getBoundingClientRect();
      const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? 0;
      const safeTop = Math.max(headerBottom + 12, 12);
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const safeBottom = viewportHeight - Math.max(12, safeArea?.height ?? 0);
      const availableHeight = Math.max(180, safeBottom - safeTop);
      const gap = 14;

      panel.style.maxHeight = 'none';
      const panelWidth = panel.offsetWidth;
      const naturalHeight = panel.scrollHeight;
      const canFitAbove = rootRect.top - gap - naturalHeight >= safeTop;
      const canFitLeft = rootRect.left - gap - panelWidth >= 12;
      const canFitRight = rootRect.right + gap + panelWidth <= window.innerWidth - 12;
      let top: number;
      let left: number;

      if (canFitAbove) {
        left = rootRect.width - panelWidth;
        top = -(Math.min(naturalHeight, availableHeight) + gap);
        if (rootRect.top + top < safeTop) top = safeTop - rootRect.top;
      } else if (canFitLeft) {
        left = -(panelWidth + gap);
        top = (safeTop + safeBottom - Math.min(naturalHeight, availableHeight)) / 2 - rootRect.top;
      } else if (canFitRight) {
        left = rootRect.width + gap;
        top = (safeTop + safeBottom - Math.min(naturalHeight, availableHeight)) / 2 - rootRect.top;
      } else {
        left = Math.max(
          12 - rootRect.left,
          Math.min(window.innerWidth - panelWidth - 12 - rootRect.left, rootRect.width - panelWidth)
        );
        top = safeTop - rootRect.top;
      }

      panel.style.maxHeight = `${availableHeight}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.left = `${Math.round(left)}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    }, []);

    const place = useCallback((mode: PresentationMode, animate: boolean, force = false) => {
      const root = rootRef.current;
      if (!root) return;
      const changed = modeRef.current !== mode;
      if (!changed && !force) return;
      if (!changed && mode === 'floating' && positionAnimationRef.current?.playState === 'running' && !force) return;

      const mobile = window.innerWidth <= 600;
      const heroSize = mobile ? 88 : window.innerWidth <= 1120 ? 98 : 136;
      const size = mode === 'hero' ? heroSize : mode === 'visualize' ? (mobile ? 78 : 88) : (mobile ? 72 : 76);
      const height = size * 208 / 192;
      const scale = size / MORO_BASE_WIDTH;
      let x: number;
      let y: number;

      if (mode !== 'floating') {
        const anchor = document.getElementById(mode === 'hero' ? 'moro-hero-anchor' : 'moro-visualize-anchor');
        if (!anchor) return;
        const bounds = anchor.getBoundingClientRect();
        x = bounds.left + bounds.width / 2 - size / 2;
        y = bounds.top + bounds.height / 2 - height / 2;

        // An anchor can sit just outside the viewport during fast scrolling.
        // Clamp the target so the companion never animates off-screen.
        const safeArea = safeAreaRef.current?.getBoundingClientRect();
        const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? 0;
        const safeTop = Math.max(headerBottom + 12, 12);
        const safeBottom = window.innerHeight - Math.max(16, safeArea?.height ?? 0) - 12;
        x = Math.max(12, Math.min(window.innerWidth - size - 12, x));
        y = Math.max(safeTop, Math.min(safeBottom - height, y));
      } else {
        const safeArea = safeAreaRef.current?.getBoundingClientRect();
        const right = Math.max(28, safeArea?.width ?? 0, window.innerWidth <= 600 ? 20 : 28);
        const bottom = Math.max(28, safeArea?.height ?? 0, window.innerWidth <= 600 ? 20 : 28);
        // Keep the full sprite canvas inside the visual viewport, including mobile safe areas.
        x = Math.max(12, Math.min(window.innerWidth - right - size, window.innerWidth - size - 12));
        y = Math.max(12, Math.min(window.innerHeight - bottom - height, window.innerHeight - height - 12));
      }

      const previousCenter = lastCenterX.current;
      const nextCenter = x + size / 2;
      const shouldAnimate = changed && animate && movementEnabledRef.current && !reducedMotion;
      root.dataset.mode = mode;
      root.dataset.transition = String(shouldAnimate);
      root.dataset.positioned = 'true';
      root.style.width = `${size}px`;
      root.style.height = `${height}px`;
      modeRef.current = mode;
      if (shouldAnimate) {
        const motion = motionRef.current;
        if (!motion) return;
        const currentPosition = getComputedStyle(root).transform;
        const positionMatrix = new DOMMatrixReadOnly(currentPosition === 'none' ? undefined : currentPosition);
        const currentPose = getComputedStyle(motion).transform;
        const poseMatrix = new DOMMatrixReadOnly(currentPose === 'none' ? undefined : currentPose);
        positionAnimationRef.current?.cancel();
        poseAnimationRef.current?.cancel();
        root.style.transform = currentPosition === 'none' ? 'translate3d(0, 0, 0)' : currentPosition;
        motion.style.transform = currentPose === 'none' ? 'rotate(0deg) scale(1)' : currentPose;

        const endPosition = `translate3d(${x}px, ${y}px, 0)`;
        const midX = positionMatrix.e + (x - positionMatrix.e) * 0.42;
        const midY = positionMatrix.f + (y - positionMatrix.f) * 0.82;
        const startScale = Math.hypot(poseMatrix.a, poseMatrix.b) || 1;
        const startAngle = Math.atan2(poseMatrix.b, poseMatrix.a) * 180 / Math.PI;
        const midScale = startScale + (scale - startScale) * 0.72;
        // Keep the companion upright. A full spin reads as "flipped" during
        // fast scrolling; a small overshoot keeps the motion playful but calm.
        const endAngle = 0;
        const midAngle = startAngle + (endAngle - startAngle) * 0.56 + 6;
        const finalPose = morotransform(scale, endAngle);
        const timing: KeyframeAnimationOptions = { duration: 980, easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'forwards' };
        const positionAnimation = root.animate([
          { transform: `translate3d(${positionMatrix.e}px, ${positionMatrix.f}px, 0)`, offset: 0 },
          { transform: `translate3d(${midX}px, ${midY}px, 0)`, offset: 0.56 },
          { transform: endPosition, offset: 1 }
        ], timing);
        const poseAnimation = motion.animate([
          { transform: morotransform(startScale, startAngle), offset: 0 },
          { transform: morotransform(midScale, midAngle), offset: 0.56 },
          { transform: morotransform(scale, endAngle), offset: 1 }
        ], timing);
        positionAnimationRef.current = positionAnimation;
        poseAnimationRef.current = poseAnimation;
        Promise.all([positionAnimation.finished, poseAnimation.finished]).then(() => {
          if (positionAnimationRef.current !== positionAnimation || poseAnimationRef.current !== poseAnimation) return;
          root.style.transform = endPosition;
          motion.style.transform = finalPose;
          positionAnimation.cancel();
          poseAnimation.cancel();
          positionAnimationRef.current = null;
          poseAnimationRef.current = null;
          root.dataset.transition = 'false';
        }).catch(() => {});
        if (playerRef.current && previousCenter !== 0 && previousCenter !== nextCenter) {
          playerRef.current.playOnce(nextCenter > previousCenter ? 'running-right' : 'running-left', 'idle');
        }
      } else {
        positionAnimationRef.current?.cancel();
        poseAnimationRef.current?.cancel();
        positionAnimationRef.current = null;
        poseAnimationRef.current = null;
        root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        if (motionRef.current) motionRef.current.style.transform = morotransform(scale, 0);
        root.dataset.transition = 'false';
      }
      lastCenterX.current = nextCenter;
    }, [reducedMotion]);

    const setPresentation = useCallback((mode: PresentationMode, animate = true) => {
      place(mode, animate && movementEnabledRef.current && !reducedMotion, true);
    }, [place, reducedMotion]);

    useImperativeHandle(ref, () => ({
      respond: (message, state = 'review') => { lastDirectResponseAt.current = performance.now(); if (state) playerRef.current?.playOnce(state, 'idle'); setContext(message); announce(message, 6000); },
      play: (state) => playerRef.current?.play(state),
      playOnce: (state, returnTo) => playerRef.current?.playOnce(state, returnTo),
      setIdleState: (state) => playerRef.current?.setIdleState(state),
      pause: () => playerRef.current?.pause(),
      resume: () => playerRef.current?.resume(),
      reset: () => playerRef.current?.reset()
    }), []);

    useEffect(() => {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(preference.matches);
      const onMotionPreference = (event: MediaQueryListEvent) => {
        setReducedMotion(event.matches);
        playerRef.current?.setMotionEnabled(movementEnabledRef.current && !event.matches);
        setPresentation(modeRef.current, !event.matches);
      };
      preference.addEventListener('change', onMotionPreference);

      try {
        const savedEnabled = localStorage.getItem('moro-disabled') !== 'true';
        const savedMotion = localStorage.getItem('moro-motion-disabled') !== 'true';
        setEnabled(savedEnabled);
        setMotionEnabled(savedMotion);
        movementEnabledRef.current = savedMotion;
        if (!savedMotion) place('floating', false, true);
      } catch {
        // The companion remains available when storage is blocked.
      }

      return () => preference.removeEventListener('change', onMotionPreference);
    }, [place, setPresentation]);

    useEffect(() => () => {
      positionAnimationRef.current?.cancel();
      poseAnimationRef.current?.cancel();
      if (inactivityTimer.current !== null) window.clearTimeout(inactivityTimer.current);
      if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
      if (tapResetTimer.current !== null) window.clearTimeout(tapResetTimer.current);
      if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
    }, []);

    useEffect(() => {
      if (!enabled || !canvasRef.current) return;
      let disposed = false;
      let player: MoroSpritePlayer | null = null;

      const load = async () => {
        const baseUrl = new URL(`${import.meta.env.BASE_URL}assets/companions/moro/`, document.baseURI);
        const response = await fetch(new URL('manifest.json', baseUrl));
        if (!response.ok) throw new Error(`MORO manifest request failed (${response.status}).`);
        const manifest: unknown = await response.json();
        if (!isMoroManifest(manifest)) throw new Error('MORO animation manifest is invalid.');

        player = new MoroSpritePlayer(
          canvasRef.current as HTMLCanvasElement,
          manifest,
          baseUrl,
          (state) => {
            if (!disposed) {
              setCurrentState(state);
              if (rootRef.current) rootRef.current.dataset.animationState = state;
            }
          },
          () => { if (!disposed) setFallback(true); }
        );
        playerRef.current = player;
        player.setMotionEnabled(movementEnabledRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        await player.load();
        if (disposed) return;
        setReady(true);

        const canAnimate = movementEnabledRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (canAnimate && !player.isFallback) player.playOnce('waving', 'idle');
        else player.setIdleState('idle');

        if (canAnimate && window.innerWidth > 760) {
          try {
            if (!sessionStorage.getItem('moro-greeted')) {
              sessionStorage.setItem('moro-greeted', 'true');
              setGreeting(true);
              const timer = window.setTimeout(() => setGreeting(false), 6500);
              cleanupGreeting = () => window.clearTimeout(timer);
            }
          } catch {
            // A greeting is optional; failed storage access does not affect the companion.
          }
        }

        const resetInactivity = () => {
          if (inactivityTimer.current !== null) window.clearTimeout(inactivityTimer.current);
          if (!movementEnabledRef.current || openRef.current || modeRef.current !== 'floating') return;
          inactivityTimer.current = window.setTimeout(() => {
            if (!openRef.current && modeRef.current === 'floating') playerRef.current?.play('waiting');
          }, 32_000);
        };
        const onActivity = () => {
          if (playerRef.current?.currentState === 'waiting') playerRef.current.setIdleState('idle');
          resetInactivity();
        };
        document.addEventListener('pointerdown', onActivity, { passive: true });
        document.addEventListener('keydown', onActivity);
        document.addEventListener('scroll', onActivity, { passive: true });
        cleanupActivity = () => {
          document.removeEventListener('pointerdown', onActivity);
          document.removeEventListener('keydown', onActivity);
          document.removeEventListener('scroll', onActivity);
          if (inactivityTimer.current !== null) window.clearTimeout(inactivityTimer.current);
        };
        resetInactivity();
      };

      let cleanupGreeting = () => {};
      let cleanupActivity = () => {};
      load().catch(() => { if (!disposed) setLoadError(true); });

      return () => {
        disposed = true;
        cleanupGreeting();
        cleanupActivity();
        player?.destroy();
        if (playerRef.current === player) playerRef.current = null;
      };
    }, [enabled]);

    useEffect(() => {
      if (!enabled) {
        place('floating', false, true);
        return;
      }
      const heroAnchor = document.getElementById('moro-hero-anchor');
      const visualizeAnchor = document.getElementById('moro-visualize-anchor');
      if (!heroAnchor) return;
      const placementIsSafe = (anchor: HTMLElement | null, size: number) => {
        if (!anchor) return false;
        const bounds = anchor.getBoundingClientRect();
        const height = size * 208 / 192;
        const x = bounds.left + bounds.width / 2 - size / 2;
        const y = bounds.top + bounds.height / 2 - height / 2;
        const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? 0;
        const safeTop = Math.max(headerBottom + 12, 12);
        const safeBottom = window.innerHeight - Math.max(16, safeAreaRef.current?.getBoundingClientRect().height ?? 0) - 12;
        return x >= 12 && x + size <= window.innerWidth - 12 && y >= safeTop && y + height <= safeBottom;
      };
      const desiredMode = (): PresentationMode => {
        const mobile = window.innerWidth <= 600;
        const visualizeSize = mobile ? 78 : 88;
        // Only anchor to the Visualize row when its anchor is fully on-screen.
        // The section can enter the viewport before that row does; anchoring
        // early would send MORO to an off-screen coordinate.
        if (placementIsSafe(visualizeAnchor, visualizeSize)) return 'visualize';
        const heroSize = mobile ? 88 : window.innerWidth <= 1120 ? 98 : 136;
        heroVisibleRef.current = placementIsSafe(heroAnchor, heroSize);
        return heroVisibleRef.current ? 'hero' : 'floating';
      };
      const update = () => {
        const next = desiredMode();
        if (next !== modeRef.current) setPresentation(next, true);
        else if (!manualPosition.current && next !== 'floating') place(next, false, true);
      };
      let scrollFrame = 0;
      const onScroll = () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          update();
        });
      };
      let resizeFrame = 0;
      const onResize = () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          resizeFrame = 0;
          // Snap to the new viewport. Resizing or a mobile URL-bar change
          // should never leave the floating companion outside the viewport.
          if (manualPosition.current) {
            const root = rootRef.current;
            if (!root) return;
            const rect = root.getBoundingClientRect();
            const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? 0;
            const minY = Math.max(headerBottom + 12, 12);
            const x = Math.max(12, Math.min(window.innerWidth - rect.width - 12, rect.left));
            const y = Math.max(minY, Math.min(window.innerHeight - rect.height - 12, rect.top));
            root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            lastCenterX.current = x + rect.width / 2;
            return;
          }
          place(desiredMode(), false, true);
        });
      };

      const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver(update, { threshold: [0, 0.15, 0.5, 1] })
        : null;
      observer?.observe(heroAnchor);
      if (visualizeAnchor) observer?.observe(visualizeAnchor);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      window.visualViewport?.addEventListener('resize', onResize);
      place(desiredMode(), false, true);

      return () => {
        observer?.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        window.visualViewport?.removeEventListener('resize', onResize);
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
      };
    }, [enabled, place, reducedMotion, setPresentation]);

    useEffect(() => {
      if (!open) return;
      panelRef.current?.focus();
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        setOpen(false);
        openRef.current = false;
        tapCount.current = 0;
        triggerRef.current?.focus();
      };
      const closeOnOutsidePress = (event: PointerEvent) => {
        if (rootRef.current?.contains(event.target as Node)) return;
        setOpen(false);
        openRef.current = false;
        tapCount.current = 0;
      };
      document.addEventListener('keydown', closeOnEscape);
      document.addEventListener('pointerdown', closeOnOutsidePress);
      return () => {
        document.removeEventListener('keydown', closeOnEscape);
        document.removeEventListener('pointerdown', closeOnOutsidePress);
      };
    }, [open]);

    useLayoutEffect(() => {
      if (!open) return;
      positionDialogue();
      const updateDialoguePosition = () => positionDialogue();
      window.addEventListener('scroll', updateDialoguePosition, { passive: true });
      window.addEventListener('resize', updateDialoguePosition);
      window.visualViewport?.addEventListener('resize', updateDialoguePosition);
      return () => {
        window.removeEventListener('scroll', updateDialoguePosition);
        window.removeEventListener('resize', updateDialoguePosition);
        window.visualViewport?.removeEventListener('resize', updateDialoguePosition);
      };
    }, [open, positionDialogue]);

    useEffect(() => {
      const sections = [
        { id: 'work-deep', area: 'deep' as const, message: messages.deep },
        { id: 'work-visualize', area: 'visualize' as const, message: messages.visualize },
        { id: 'contact', area: 'contact' as const, message: messages.contact }
      ];
      const elements = sections
        .map((item) => ({ ...item, element: document.getElementById(item.id) }))
        .filter((item): item is typeof item & { element: HTMLElement } => Boolean(item.element));
      if (!elements.length || !('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        if (performance.now() - lastDirectResponseAt.current < 4000) return;
        const section = elements.find((item) => item.element === visible.target);
        if (!section) return;
        setCurrentArea(section.area);
        setContext(section.message);
        if (section.area === 'visualize' && !visualizeIntroduced.current) {
          visualizeIntroduced.current = true;
          setGreetingText(messages.visualize);
          setGreeting(true);
          playerRef.current?.playOnce('waving', 'idle');
          if (tapResetTimer.current !== null) window.clearTimeout(tapResetTimer.current);
          tapResetTimer.current = window.setTimeout(() => setGreeting(false), 5200);
        }
      }, { threshold: [0.25, 0.5] });
      elements.forEach((item) => observer.observe(item.element));
      return () => observer.disconnect();
    }, []);

    const closeDialogue = (restoreFocus = true) => {
      setOpen(false);
      openRef.current = false;
      tapCount.current = 0;
      if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const handleAttention = () => {
      if (attentionUsed.current || !movementEnabledRef.current || reducedMotion) return;
      attentionUsed.current = true;
      playerRef.current?.playOnce('review', 'idle');
    };

    const announce = (message: string, duration = 2600) => {
      setGreetingText(message);
      setGreeting(true);
      if (tapResetTimer.current !== null) window.clearTimeout(tapResetTimer.current);
      tapResetTimer.current = window.setTimeout(() => setGreeting(false), duration);
    };

    const freezeMovement = () => {
      const root = rootRef.current;
      const motion = motionRef.current;
      if (!root || !motion) return;
      const position = new DOMMatrixReadOnly(getComputedStyle(root).transform);
      const pose = getComputedStyle(motion).transform;
      positionAnimationRef.current?.cancel();
      poseAnimationRef.current?.cancel();
      positionAnimationRef.current = null;
      poseAnimationRef.current = null;
      root.style.transform = `translate3d(${position.e}px, ${position.f}px, 0)`;
      motion.style.transform = pose;
      root.dataset.transition = 'false';
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!movementEnabledRef.current || reducedMotion || event.button !== 0) return;
      const root = rootRef.current;
      if (!root) return;
      const bounds = root.getBoundingClientRect();
      const nextGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: bounds.left,
        originY: bounds.top,
        dragging: false,
        longPressed: false,
        direction: null as MoroState | null
      };
      gesture.current = nextGesture;
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer capture is optional */ }
      longPressTimer.current = window.setTimeout(() => {
        const active = gesture.current;
        if (!active || active.dragging) return;
        active.longPressed = true;
        suppressClick.current = true;
        playerRef.current?.playOnce('review', 'idle');
        announce(messages.hold, 3200);
      }, 650);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
      const active = gesture.current;
      const root = rootRef.current;
      if (!active || !root || active.pointerId !== event.pointerId || active.longPressed) return;
      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;
      if (!active.dragging && Math.hypot(dx, dy) > 8) {
        active.dragging = true;
        suppressClick.current = true;
        manualPosition.current = true;
        tapCount.current = 0;
        if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
        freezeMovement();
      }
      if (!active.dragging) return;

      const bounds = root.getBoundingClientRect();
      const x = Math.max(8, Math.min(window.innerWidth - bounds.width - 8, active.originX + dx));
      const y = Math.max(8, Math.min(window.innerHeight - bounds.height - 8, active.originY + dy));
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      lastCenterX.current = x + bounds.width / 2;
      if (Math.abs(dx) > Math.abs(dy)) {
        const direction = dx >= 0 ? 'running-right' : 'running-left';
        if (active.direction !== direction) {
          active.direction = direction;
          playerRef.current?.play(direction);
        }
      } else if (active.direction !== 'running') {
        active.direction = 'running';
        playerRef.current?.play('running');
      }
    };

    const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
      const active = gesture.current;
      if (!active || active.pointerId !== event.pointerId) return;
      if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (suppressClick.current) {
        if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
        suppressClickTimer.current = window.setTimeout(() => { suppressClick.current = false; }, 0);
      }
      if (active.dragging) {
        announce(messages.drag);
        playerRef.current?.playOnce('review', 'idle');
      }
      gesture.current = null;
    };

    const handleNudge = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (!movementEnabledRef.current || reducedMotion || !event.key.startsWith('Arrow')) return;
      event.preventDefault();
      const root = rootRef.current;
      if (!root) return;
      freezeMovement();
      const bounds = root.getBoundingClientRect();
      const step = event.shiftKey ? 48 : 20;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      const x = Math.max(8, Math.min(window.innerWidth - bounds.width - 8, bounds.left + dx));
      const y = Math.max(8, Math.min(window.innerHeight - bounds.height - 8, bounds.top + dy));
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      manualPosition.current = true;
      tapCount.current = 0;
      lastCenterX.current = x + bounds.width / 2;
      if (dx) playerRef.current?.playOnce(dx > 0 ? 'running-right' : 'running-left', 'idle');
      else playerRef.current?.playOnce('jumping', 'idle');
    };

    const handleTrigger = () => {
      if (suppressClick.current) {
        suppressClick.current = false;
        if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
        return;
      }
      setGreeting(false);
      const now = performance.now();
      tapCount.current = now - lastTapAt.current < 500 ? tapCount.current + 1 : 1;
      lastTapAt.current = now;
      if (tapResetTimer.current !== null) window.clearTimeout(tapResetTimer.current);
      tapResetTimer.current = window.setTimeout(() => { tapCount.current = 0; }, 1300);
      if (tapCount.current >= 2) {
        openRef.current = true;
        setOpen(true);
        if (tapCount.current === 2) {
          setContext(messages.quickTap);
          playerRef.current?.playOnce('waving', 'idle');
        } else if (tapCount.current === 3) {
          setContext(messages.tripleTap);
          playerRef.current?.playOnce('jumping', 'idle');
          tapCount.current = 0;
        } else {
          setContext(messages.manyTaps);
          playerRef.current?.playOnce('review', 'idle');
          tapCount.current = 0;
        }
        return;
      }
      const nextOpen = !openRef.current;
      openRef.current = nextOpen;
      setOpen(nextOpen);
      if (nextOpen) {
        const phaseLine = alterPhase
          ? getMoroPhaseLine({ phase: alterPhase, clues: alterClues })
          : null;
        if (phaseLine) {
          lastDirectResponseAt.current = performance.now();
          setContext(phaseLine);
          playerRef.current?.playOnce('waiting', 'idle');
        } else {
          playerRef.current?.playOnce('jumping', 'idle');
        }
      }
    };

    const handleMovementToggle = () => {
      const next = !movementEnabledRef.current;
      movementEnabledRef.current = next;
      setMotionEnabled(next);
      try { localStorage.setItem('moro-motion-disabled', String(!next)); } catch { /* optional preference */ }
      playerRef.current?.setMotionEnabled(next);
      setGreeting(false);
      setPresentation(modeRef.current, next);
    };

    const disable = () => {
      try { localStorage.setItem('moro-disabled', 'true'); } catch { /* optional preference */ }
      closeDialogue(false);
      setReady(false);
      setFallback(false);
      setLoadError(false);
      setEnabled(false);
    };

    const reply = (message: string, state: MoroState = 'review') => {
      setContext(message);
      playerRef.current?.playOnce(state, 'idle');
    };

    const explainCurrentTransform = () => {
      const current = visualizeContext.current;
      if (!current) {
        reply('Choose a transformation first, then I can explain the result.');
        return;
      }
      if (current.preset === 'Identity') reply('Identity keeps x, y, and z unchanged. Its determinant is 1.');
      else if (current.preset === 'Rotate 45°') reply('This rotation turns the vector 45 degrees in the XY plane while preserving length and area.');
      else if (current.preset === 'Shear X') reply(`This shear adds ${current.matrix[1].toFixed(2)} times y to x. Its determinant is ${current.determinant.toFixed(2)}, so area is ${Math.abs(current.determinant - 1) < .005 ? 'preserved' : 'scaled'}.`);
      else if (current.preset === 'Reflect Y') reply(`The x component changes sign. The determinant is ${current.determinant.toFixed(2)}, so orientation reverses.`);
      else reply(`The determinant is ${current.determinant.toFixed(2)}. Its absolute value gives the area scale in the XY plane.`);
    };

    const explainChange = () => {
      const current = visualizeContext.current;
      const previous = visualizeContext.previous;
      if (!current || !previous) {
        reply('Make one more change and I can compare the two results.');
        return;
      }
      const delta = current.transformed.map((value, index) => value - previous.transformed[index]);
      reply(`The transformed endpoint moved by (${delta.map((value) => value.toFixed(2)).join(', ')}). It is now (${current.transformed.map((value) => value.toFixed(2)).join(', ')}).`);
    };

    const resetVisualize = () => {
      onResetVisualize();
      reply('Back to our starting point!', 'jumping');
    };

    return (
      <div
        ref={rootRef}
        className="moro-companion"
        data-mode="hero"
        data-transition="false"
        data-positioned="false"
        data-animation-state={currentState}
        data-ready={ready}
        data-movement-enabled={motionEnabled && !reducedMotion}
      >
        <span ref={safeAreaRef} className="moro-companion__safe-area" aria-hidden="true" />
        {!enabled ? (
          <button
            type="button"
            className="moro-companion__enable"
            onClick={() => {
              try { localStorage.setItem('moro-disabled', 'false'); } catch { /* optional preference */ }
              setReady(false);
              setLoadError(false);
              setEnabled(true);
            }}
          >
            Enable MORO
          </button>
        ) : (
          <>
            {greeting && !open && (
              <div className="moro-companion__greeting">
                <span>{greetingText}</span>
                <button type="button" aria-label="Dismiss MORO greeting" onClick={() => setGreeting(false)}>×</button>
              </div>
            )}
            {open && (
              <div id="moro-dialogue" ref={panelRef} className="moro-companion__dialogue" role="dialog" aria-modal="false" aria-label="MORO dialogue" aria-describedby="moro-dialogue-message" tabIndex={-1}>
                <div className="moro-companion__dialogue-head">
                  <span>MORO</span>
                  <button type="button" aria-label="Close MORO dialogue" onClick={() => closeDialogue()}>×</button>
                </div>
                <p id="moro-dialogue-message" className="moro-companion__message">{context}</p>
                <div className="moro-companion__links">
                  {currentArea === 'visualize' ? (
                    <>
                      <button type="button" onClick={explainCurrentTransform}>Explain current transform</button>
                      <button type="button" onClick={explainChange}>What changed?</button>
                      <button type="button" onClick={resetVisualize}>Reset scene</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { onOpenProjects(); closeDialogue(); }}>Show me the work</button>
                      <button type="button" onClick={() => { onOpenContact(); closeDialogue(); }}>Contact Niko</button>
                    </>
                  )}
                </div>
                <div className="moro-companion__settings">
                  <button type="button" onClick={handleMovementToggle}>
                    {motionEnabled ? 'Turn off movement' : 'Turn on movement'}
                  </button>
                  <button type="button" onClick={disable}>Disable MORO</button>
                </div>
                <button className="moro-companion__inspect" type="button" onClick={() => { onInspectSystem(); closeDialogue(); }}>
                  Inspect unusual signal
                </button>
                <div className="moro-companion__alter-links">
                  <button type="button" onClick={() => { onDiscoverClue?.('C01'); closeDialogue(); }}>
                    MORO status note
                  </button>
                  {discoveredClues.includes('C02') && (
                    <button type="button" onClick={() => { onDiscoverClue?.('C05'); closeDialogue(); }}>
                      Ask about omitted observations
                    </button>
                  )}
                </div>
                <p className="moro-companion__note">Try dragging, tapping twice, pressing and holding, or moving me with the arrow keys. Scripted companion, no live AI.</p>
              </div>
            )}
            {fallback && <span className="moro-companion__fallback">Static image fallback</span>}
            {loadError && <span className="moro-companion__error" role="status">MORO animation is unavailable.</span>}
            <div ref={motionRef} className="moro-companion__motion">
              <button
                ref={triggerRef}
                type="button"
                className="moro-companion__trigger"
                title={motionEnabled && !reducedMotion ? 'Talk to MORO. Drag or use the arrow keys to move.' : 'Talk to MORO.'}
                aria-label="Talk to MORO"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls="moro-dialogue"
                aria-keyshortcuts={motionEnabled && !reducedMotion ? 'ArrowUp ArrowDown ArrowLeft ArrowRight' : undefined}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerEnter={handleAttention}
                onFocus={handleAttention}
                onClick={handleTrigger}
                onKeyDown={handleNudge}
                disabled={!ready}
              >
                <canvas ref={canvasRef} width="192" height="208" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);
