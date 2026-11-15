import { describe, it, expect } from 'vitest';
import { createInitialNarrativeState, narrativeReducer } from '../../src/lib/narrativeMachine';

describe('narrativeMachine finite state machine', () => {
  it('initializes with default values and effects enabled', () => {
    const state = createInitialNarrativeState();
    expect(state.effectsEnabled).toBe(true);
    expect(state.current).toBe('idle');
    expect(state.diagnosticsUnlocked).toBe(false);
    expect(state.activeAnomalyId).toBeNull();
    expect(state.seen['AN-01']).toBe(false);
  });

  it('restores persisted preferences after hydration without reopening an anomaly', () => {
    const state = narrativeReducer(createInitialNarrativeState(), {
      type: 'PREFERENCES_RESTORED',
      stored: { version: 1, effectsEnabled: false, seen: { 'AN-01': true, 'AN-02': false, 'AN-03': false, 'AN-04': false } }
    });
    expect(state.current).toBe('disabled');
    expect(state.effectsEnabled).toBe(false);
    expect(state.diagnosticsUnlocked).toBe(true);
    expect(state.activeAnomalyId).toBeNull();
  });

  it('triggers AN-01 on ASSISTANT_INSPECT_CLICKED and unlocks diagnostics', () => {
    const initial = createInitialNarrativeState();
    const next = narrativeReducer(initial, { type: 'ASSISTANT_INSPECT_CLICKED' });
    expect(next.current).toBe('glitching');
    expect(next.activeAnomalyId).toBe('AN-01');
    expect(next.seen['AN-01']).toBe(true);
    expect(next.diagnosticsUnlocked).toBe(true);
  });

  it('triggers AN-02 on RESEARCH_TRACE_INSPECTED with deep-research and unlocks diagnostics', () => {
    const initial = createInitialNarrativeState();
    const next = narrativeReducer(initial, {
      type: 'RESEARCH_TRACE_INSPECTED',
      projectId: 'deep-research'
    });
    expect(next.current).toBe('glitching');
    expect(next.activeAnomalyId).toBe('AN-02');
    expect(next.seen['AN-02']).toBe(true);
    expect(next.diagnosticsUnlocked).toBe(true);
  });

  it('triggers AN-03 on HIDDEN_LOG_OPENED', () => {
    const initial = createInitialNarrativeState();
    const next = narrativeReducer(initial, { type: 'HIDDEN_LOG_OPENED' });
    expect(next.current).toBe('glitching');
    expect(next.activeAnomalyId).toBe('AN-03');
    expect(next.seen['AN-03']).toBe(true);
  });

  it('gates AN-04 until AN-01 or AN-02 is seen', () => {
    const initial = createInitialNarrativeState();
    // Prior to unlocking, DIAGNOSTICS_REQUESTED does not trigger AN-04
    const blocked = narrativeReducer(initial, { type: 'DIAGNOSTICS_REQUESTED' });
    expect(blocked.current).toBe('idle');
    expect(blocked.activeAnomalyId).toBeNull();

    // After AN-01 is seen
    const withAn01 = narrativeReducer(initial, { type: 'ASSISTANT_INSPECT_CLICKED' });
    const dismissed = narrativeReducer(withAn01, { type: 'DISMISS_ACTIVE_ANOMALY' });
    expect(dismissed.diagnosticsUnlocked).toBe(true);

    const diagnostics = narrativeReducer(dismissed, { type: 'DIAGNOSTICS_REQUESTED' });
    expect(diagnostics.current).toBe('diagnostics-open');
    expect(diagnostics.activeAnomalyId).toBe('AN-04');
    expect(diagnostics.seen['AN-04']).toBe(true);
  });

  it('disables triggers when effects are turned off (T-11)', () => {
    const initial = createInitialNarrativeState();
    const disabled = narrativeReducer(initial, { type: 'EFFECTS_CHANGED', enabled: false });
    expect(disabled.effectsEnabled).toBe(false);
    expect(disabled.current).toBe('disabled');

    const triggerAttempt = narrativeReducer(disabled, { type: 'ASSISTANT_INSPECT_CLICKED' });
    expect(triggerAttempt.current).toBe('disabled');
    expect(triggerAttempt.activeAnomalyId).toBeNull();
  });

  it('resets narrative progress cleanly (T-09/T-10)', () => {
    const initial = createInitialNarrativeState();
    const triggered = narrativeReducer(initial, { type: 'ASSISTANT_INSPECT_CLICKED' });
    expect(triggered.seen['AN-01']).toBe(true);
    expect(triggered.diagnosticsUnlocked).toBe(true);

    const reset = narrativeReducer(triggered, { type: 'NARRATIVE_RESET' });
    expect(reset.seen['AN-01']).toBe(false);
    expect(reset.diagnosticsUnlocked).toBe(false);
    expect(reset.activeAnomalyId).toBeNull();
    expect(reset.current).toBe('idle');
  });
});
