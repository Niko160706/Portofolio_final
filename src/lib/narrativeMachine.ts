import type { AnomalyId } from '../data/narrative';
import type { StoredNarrative } from './storage';

export type NarrativeStatus = 'idle' | 'glitching' | 'message-visible' | 'diagnostics-open' | 'disabled';

export interface NarrativeState {
  effectsEnabled: boolean;
  seen: Record<AnomalyId, boolean>;
  diagnosticsUnlocked: boolean;
  current: NarrativeStatus;
  activeAnomalyId: AnomalyId | null;
  hiddenFilesVisible: boolean;
}

export type PortfolioEvent =
  | { type: 'PREFERENCES_RESTORED'; stored: StoredNarrative }
  | { type: 'ASSISTANT_INSPECT_CLICKED' }
  | { type: 'RESEARCH_TRACE_INSPECTED'; projectId: 'deep-research' }
  | { type: 'EXPLORER_SHOW_HIDDEN_CHANGED'; enabled: boolean }
  | { type: 'HIDDEN_LOG_OPENED' }
  | { type: 'DIAGNOSTICS_REQUESTED' }
  | { type: 'EFFECTS_CHANGED'; enabled: boolean }
  | { type: 'NARRATIVE_RESET' }
  | { type: 'DISMISS_ACTIVE_ANOMALY' }
  | { type: 'ANIMATION_COMPLETED' };

export function createInitialNarrativeState(stored?: StoredNarrative): NarrativeState {
  const effectsEnabled = stored ? stored.effectsEnabled : true;
  const seen: Record<AnomalyId, boolean> = stored
    ? { ...stored.seen }
    : {
        'AN-01': false,
        'AN-02': false,
        'AN-03': false,
        'AN-04': false
      };

  const diagnosticsUnlocked = Boolean(seen['AN-01'] || seen['AN-02']);

  return {
    effectsEnabled,
    seen,
    diagnosticsUnlocked,
    current: effectsEnabled ? 'idle' : 'disabled',
    activeAnomalyId: null,
    hiddenFilesVisible: false
  };
}

export function narrativeReducer(state: NarrativeState, event: PortfolioEvent): NarrativeState {
  switch (event.type) {
    case 'PREFERENCES_RESTORED':
      return createInitialNarrativeState(event.stored);
    case 'EFFECTS_CHANGED': {
      const enabled = event.enabled;
      return {
        ...state,
        effectsEnabled: enabled,
        current: enabled ? 'idle' : 'disabled',
        activeAnomalyId: enabled ? state.activeAnomalyId : null
      };
    }

    case 'NARRATIVE_RESET': {
      return {
        ...state,
        seen: {
          'AN-01': false,
          'AN-02': false,
          'AN-03': false,
          'AN-04': false
        },
        diagnosticsUnlocked: false,
        activeAnomalyId: null,
        current: state.effectsEnabled ? 'idle' : 'disabled',
        hiddenFilesVisible: false
      };
    }

    case 'EXPLORER_SHOW_HIDDEN_CHANGED': {
      return {
        ...state,
        hiddenFilesVisible: event.enabled
      };
    }

    case 'DISMISS_ACTIVE_ANOMALY': {
      return {
        ...state,
        activeAnomalyId: null,
        current: state.effectsEnabled ? 'idle' : 'disabled'
      };
    }

    case 'ANIMATION_COMPLETED': {
      if (state.current === 'glitching') {
        return {
          ...state,
          current: 'message-visible'
        };
      }
      return state;
    }

    case 'ASSISTANT_INSPECT_CLICKED': {
      if (!state.effectsEnabled) {
        return state;
      }
      if (state.current === 'glitching' || state.current === 'message-visible') {
        return state;
      }
      const updatedSeen = { ...state.seen, 'AN-01': true };
      return {
        ...state,
        seen: updatedSeen,
        diagnosticsUnlocked: true,
        activeAnomalyId: 'AN-01',
        current: 'glitching'
      };
    }

    case 'RESEARCH_TRACE_INSPECTED': {
      if (!state.effectsEnabled) {
        return state;
      }
      if (event.projectId !== 'deep-research') {
        return state;
      }
      if (state.current === 'glitching' || state.current === 'message-visible') {
        return state;
      }
      const updatedSeen = { ...state.seen, 'AN-02': true };
      return {
        ...state,
        seen: updatedSeen,
        diagnosticsUnlocked: true,
        activeAnomalyId: 'AN-02',
        current: 'glitching'
      };
    }

    case 'HIDDEN_LOG_OPENED': {
      if (!state.effectsEnabled) {
        return state;
      }
      if (state.current === 'glitching' || state.current === 'message-visible') {
        return state;
      }
      const updatedSeen = { ...state.seen, 'AN-03': true };
      return {
        ...state,
        seen: updatedSeen,
        activeAnomalyId: 'AN-03',
        current: 'glitching'
      };
    }

    case 'DIAGNOSTICS_REQUESTED': {
      if (!state.diagnosticsUnlocked) {
        // Not unlocked yet; client component shows default 'No diagnostic entries available'
        return state;
      }
      const updatedSeen = { ...state.seen, 'AN-04': true };
      return {
        ...state,
        seen: updatedSeen,
        activeAnomalyId: 'AN-04',
        current: 'diagnostics-open'
      };
    }

    default:
      return state;
  }
}
