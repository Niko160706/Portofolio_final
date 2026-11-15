import { useEffect, useReducer, useRef, useState } from 'react';
import { profile } from '../../data/profile';
import {
  createInitialNarrativeState,
  narrativeReducer
} from '../../lib/narrativeMachine';
import {
  loadStoredNarrative,
  saveStoredNarrative,
  resetStoredNarrative
} from '../../lib/storage';
import { SiteHeader } from '../v3/SiteHeader';
import { Hero } from '../v3/Hero';
import { SelectedWork } from '../v3/SelectedWork';
import { LabSection } from '../v3/LabSection';
import { MethodsSection } from '../v3/MethodsSection';
import { AboutSection } from '../v3/AboutSection';
import { ContactSection } from '../v3/ContactSection';
import { SiteFooter } from '../v3/SiteFooter';
import { MoroCompanion, type MoroCompanionHandle } from '../v3/MoroCompanion';
import { UtilityDialog } from '../v3/UtilityDialog';
import { SettingsPanel } from '../v3/SettingsPanel';
import { AnomalyMessage } from '../narrative/AnomalyMessage';
import { AlterDebugPanel } from '../alter/AlterDebugPanel';
import { AlterFractureLab, type FractureIntensity } from '../alter/AlterFractureLab';
import { useAlterExperience } from '../../lib/alter/useAlterExperience';
import { shouldShowAlterDebug } from '../../lib/alter/alterDebug';
import { canDiscoverClue } from '../../lib/alter/alterMachine';
import type { AlterClueId } from '../../lib/alter/alterTypes';
import {
  archiveNoteEvent,
  moroActionEvent,
  researchCompletedEvent,
  researchInspectEvent,
  visualizeCommittedEvent
} from '../../lib/alter/alterBridge';
import type { VectorDemoEvent } from '../v3/VectorDemo';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

export const EditorialApp: React.FC = () => {
  const alter = useAlterExperience();
  const [showAlterDebug, setShowAlterDebug] = useState(false);
  const [fractureIntensity, setFractureIntensity] = useState<FractureIntensity | null>(null);
  const [clueFlash, setClueFlash] = useState<{ id: AlterClueId; key: number } | null>(null);

  useEffect(() => {
    const alterMode = import.meta.env.DEV || import.meta.env.MODE === 'alter-debug';
    setShowAlterDebug(
      shouldShowAlterDebug({
        dev: import.meta.env.DEV,
        mode: import.meta.env.MODE,
        search: window.location.search
      })
    );
    if (!alterMode) return;
    const requested = new URLSearchParams(window.location.search).get('alterFracture');
    if (requested === 'G0' || requested === 'G1' || requested === 'G2' || requested === 'G3') {
      setFractureIntensity(requested);
    }
  }, []);

  const [narrative, dispatchNarrative] = useReducer(
    narrativeReducer,
    undefined,
    () => createInitialNarrativeState()
  );

  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    dispatchNarrative({ type: 'PREFERENCES_RESTORED', stored: loadStoredNarrative() });
    setStorageReady(true);
  }, []);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [visualizeResetToken, setVisualizeResetToken] = useState(0);
  const [visualizeContext, setVisualizeContext] = useState<{ current?: VectorDemoEvent; previous?: VectorDemoEvent }>({});
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moroRef = useRef<MoroCompanionHandle>(null);
  const clueFlashTimer = useRef<number | null>(null);

  const discoverClue = (clueId: AlterClueId) => {
    if (!canDiscoverClue(alter.state, clueId)) return;
    alter.dispatch({ type: 'anomaly.clue.discovered', clueId, discoveredAt: Date.now() });
    setClueFlash({ id: clueId, key: Date.now() });
    if (clueFlashTimer.current !== null) window.clearTimeout(clueFlashTimer.current);
    clueFlashTimer.current = window.setTimeout(() => setClueFlash(null), 520);
  };

  useEffect(() => () => {
    if (clueFlashTimer.current !== null) window.clearTimeout(clueFlashTimer.current);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveStoredNarrative({
      version: 1,
      effectsEnabled: narrative.effectsEnabled,
      seen: narrative.seen
    });
  }, [storageReady, narrative.effectsEnabled, narrative.seen]);

  useEffect(() => {
    const sections = ['work', 'lab', 'methods', 'about', 'contact']
      .map((id) => ({ id, element: document.getElementById(id) }))
      .filter((item): item is { id: string; element: HTMLElement } => Boolean(item.element));

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = sections.find((item) => item.element === visible.target);
        if (match) setActiveSection(match.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.45] }
    );

    sections.forEach((section) => observer.observe(section.element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const handleInspectAssistant = () => {
    alter.dispatch(moroActionEvent('inspect-signal'));
    dispatchNarrative({ type: 'ASSISTANT_INSPECT_CLICKED' });
    if (narrative.effectsEnabled) {
      setTimeout(() => dispatchNarrative({ type: 'ANIMATION_COMPLETED' }), 500);
    }
  };

  const handleInspectTrace = () => {
    discoverClue('C02');
    alter.dispatch(researchInspectEvent('trace-04'));
    dispatchNarrative({ type: 'RESEARCH_TRACE_INSPECTED', projectId: 'deep-research' });
    if (narrative.effectsEnabled) {
      setTimeout(() => dispatchNarrative({ type: 'ANIMATION_COMPLETED' }), 400);
    }
  };

  const handleResearchStart = () => moroRef.current?.play('running');
  const handleResearchPause = () => moroRef.current?.setIdleState('idle');
  const handleResearchComplete = () => {
    alter.dispatch(researchCompletedEvent('research', true));
    moroRef.current?.playOnce('review', 'idle');
  };
  const handleResearchReset = () => moroRef.current?.setIdleState('idle');
  const handleVectorInteraction = (event: VectorDemoEvent) => {
    alter.dispatch(visualizeCommittedEvent(event));
    setVisualizeContext((context) => ({ previous: context.current, current: event }));
    if (event.type === 'reset') moroRef.current?.respond("Back to our starting point!", 'jumping');
    else if (event.type === 'preset' && event.preset === 'Identity') moroRef.current?.respond('Identity leaves every component exactly where it started.', 'review');
    else if (event.type === 'preset' && event.preset === 'Rotate 45°') moroRef.current?.respond('Rotation changes direction while preserving length.', 'review');
    else if (event.type === 'preset' && event.preset === 'Reflect Y' && event.determinant < 0) moroRef.current?.respond('The orientation flipped. Notice the negative determinant?', 'review');
    else if (event.type === 'preset' && event.preset === 'Shear X') moroRef.current?.respond(event.determinant === 1 ? 'This shear changes shape while preserving area.' : 'This shear changes shape; its determinant tells us how area scales.', 'running');
    else if (event.type === 'vector-committed') moroRef.current?.respond(`Your vector now ends at (${event.transformed.map((value) => value.toFixed(2)).join(', ')}).`, 'review');
  };

  const handleToggleHiddenFiles = (enabled: boolean) => {
    dispatchNarrative({ type: 'EXPLORER_SHOW_HIDDEN_CHANGED', enabled });
  };

  const handleOpenHiddenLog = () => {
    alter.dispatch(archiveNoteEvent('observer-log'));
    dispatchNarrative({ type: 'HIDDEN_LOG_OPENED' });
    if (narrative.effectsEnabled) {
      setTimeout(() => dispatchNarrative({ type: 'ANIMATION_COMPLETED' }), 400);
    }
  };

  const handleRunDiagnostics = () => {
    dispatchNarrative({ type: 'DIAGNOSTICS_REQUESTED' });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setEmailCopied(true);
    } catch {
      const field = document.createElement('textarea');
      field.value = profile.email;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.top = '-1000px';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      document.body.removeChild(field);
      setEmailCopied(true);
    }

    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setEmailCopied(false), 2600);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
  };

  const activeAnomaly: import('../../data/narrative').AnomalyId | null =
    narrative.effectsEnabled &&
    (narrative.current === 'glitching' ||
      narrative.current === 'message-visible' ||
      narrative.current === 'diagnostics-open')
      ? narrative.activeAnomalyId
      : null;

  return (
    <div id="top" className="site">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <SiteHeader activeSection={activeSection} />

      <main id="main-content">
        <Hero />

        <SelectedWork
          onTraceInspect={handleInspectTrace}
          traceSeen={Boolean(narrative.seen['AN-02']) && narrative.effectsEnabled}
          onTraceStart={handleResearchStart}
          onTracePause={handleResearchPause}
          onTraceComplete={handleResearchComplete}
          onTraceReset={handleResearchReset}
          onVectorInteraction={handleVectorInteraction}
          visualizeResetToken={visualizeResetToken}
          onInspectOrientation={() => discoverClue('C03')}
          onArchiveNote={() => discoverClue('C04')}
        />

        <LabSection
          hiddenFilesVisible={narrative.hiddenFilesVisible}
          onToggleHiddenFiles={handleToggleHiddenFiles}
          onOpenHiddenLog={handleOpenHiddenLog}
          diagnosticsUnlocked={narrative.diagnosticsUnlocked}
          onRunDiagnostics={handleRunDiagnostics}
        />

        <MethodsSection />
        <AboutSection />

        <ContactSection emailCopied={emailCopied} onCopyEmail={handleCopyEmail} />
      </main>

      <MoroCompanion
        ref={moroRef}
        onOpenProjects={() => scrollTo('work')}
        onOpenContact={() => scrollTo('contact')}
        onInspectSystem={handleInspectAssistant}
        visualizeContext={visualizeContext}
        onResetVisualize={() => setVisualizeResetToken((value) => value + 1)}
        onDiscoverClue={discoverClue}
        discoveredClues={alter.state.discoveredClues.map((clue) => clue.id)}
      />

      <SiteFooter
        effectsEnabled={narrative.effectsEnabled}
        onToggleEffects={() => dispatchNarrative({ type: 'EFFECTS_CHANGED', enabled: !narrative.effectsEnabled })}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <AnomalyMessage
        anomalyId={activeAnomaly}
        onDismiss={() => dispatchNarrative({ type: 'DISMISS_ACTIVE_ANOMALY' })}
        onDisableEffects={() => dispatchNarrative({ type: 'EFFECTS_CHANGED', enabled: false })}
      />

      {isSettingsOpen && (
        <UtilityDialog
          label="Utility"
          title="Settings & about this experience"
          onClose={() => setIsSettingsOpen(false)}
        >
          <SettingsPanel
            effectsEnabled={narrative.effectsEnabled}
            onToggleEffects={(enabled) => dispatchNarrative({ type: 'EFFECTS_CHANGED', enabled })}
            onResetNarrative={() => {
              resetStoredNarrative();
              dispatchNarrative({ type: 'NARRATIVE_RESET' });
            }}
          />
        </UtilityDialog>
      )}

      {clueFlash && (
        <AlterFractureLab key={clueFlash.key} initialIntensity="G1" showControls={false} />
      )}

      {alter.state.phase === 'P2' && (
        <div className="alter-investigate" role="region" aria-label="Anomaly investigation" data-alter-investigate="true">
          <span>{alter.state.uniqueCategories} discrepancies recorded</span>
          <button
            id="alter-investigate-button"
            type="button"
            onClick={() => alter.dispatch({ type: 'alter.reveal.requested', at: Date.now() })}
          >
            Investigate anomaly
          </button>
        </div>
      )}

      {alter.state.phase === 'P3' && (
        <>
          <AlterFractureLab initialIntensity="G3" showControls={false} />
          <div
            className="alter-reveal-bar"
            role="dialog"
            aria-modal="false"
            aria-label="Fracture preview"
            data-alter-reveal="true"
          >
            <span>Interactive fiction / Fracture preview</span>
            <button
              type="button"
              onClick={() => {
                alter.dispatch({ type: 'alter.exit.requested', at: Date.now() });
                window.setTimeout(
                  () => document.querySelector<HTMLElement>('.moro-companion__trigger')?.focus(),
                  80
                );
              }}
            >
              Return to site
            </button>
          </div>
        </>
      )}

      {fractureIntensity && <AlterFractureLab initialIntensity={fractureIntensity} />}

      {showAlterDebug && (
        <AlterDebugPanel
          state={alter.state}
          dispatch={alter.dispatch}
          eventLog={alter.eventLog}
          reset={alter.reset}
          hydrated={alter.hydrated}
        />
      )}
    </div>
  );
};
