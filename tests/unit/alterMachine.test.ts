import { describe, expect, it } from 'vitest';
import {
  alterReducer,
  canDiscoverClue,
  canRunPassiveEffect,
  createInitialAlterState,
  hasClue,
  toStoredAlterState,
  uniqueCategoriesFor
} from '../../src/lib/alter/alterMachine';
import {
  ALTER_CLUES,
  PASSIVE_EFFECT_COOLDOWN_MS,
  type AlterClueId,
  type AlterEvent,
  type AlterState
} from '../../src/lib/alter/alterTypes';
import {
  ALTER_STORAGE_KEY,
  loadAlterState,
  resetAlterState,
  saveAlterState,
  type AlterStorageLike
} from '../../src/lib/alter/alterStorage';
import {
  archiveNoteEvent,
  moroActionEvent,
  researchCompletedEvent,
  researchInspectEvent,
  visualizeCommittedEvent
} from '../../src/lib/alter/alterBridge';

const discover = (state: AlterState, clueId: AlterClueId, at = 0): AlterState =>
  alterReducer(state, { type: 'anomaly.clue.discovered', clueId, discoveredAt: at });

const withClues = (...clueIds: AlterClueId[]): AlterState =>
  clueIds.reduce((state, clueId) => discover(state, clueId), createInitialAlterState());

const p2State = () => withClues('C01', 'C02', 'C03');

const p3State = (): AlterState =>
  alterReducer(p2State(), { type: 'alter.reveal.requested', at: 100 });

const p4State = (): AlterState =>
  alterReducer(p3State(), { type: 'alter.reveal.completed', at: 200 });

const p5State = (): AlterState =>
  alterReducer(p4State(), { type: 'alter.reconciliation.reached', at: 300 });

function memoryStorage(): AlterStorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key)
  };
}

describe('alterMachine', () => {
  it('1. starts in P0 with no clues', () => {
    const state = createInitialAlterState();
    expect(state.phase).toBe('P0');
    expect(state.discoveredClues).toHaveLength(0);
    expect(state.uniqueCategories).toBe(0);
  });

  it('2. first clue moves P0 to P1', () => {
    const state = discover(createInitialAlterState(), 'C01', 10);
    expect(state.phase).toBe('P1');
    expect(state.uniqueCategories).toBe(1);
    expect(state.discoveredClues[0]).toMatchObject({ id: 'C01', category: 'moro-status', discoveredAt: 10 });
  });

  it('3. duplicate clue does not increment or duplicate the record', () => {
    const first = discover(createInitialAlterState(), 'C01', 10);
    const second = discover(first, 'C01', 20);
    expect(second).toBe(first);
    expect(second.discoveredClues).toHaveLength(1);
    expect(second.uniqueCategories).toBe(1);
  });

  it('4. three distinct categories unlock P2', () => {
    const state = p2State();
    expect(state.phase).toBe('P2');
    expect(state.uniqueCategories).toBe(3);
  });

  it('5. the same clue three times does not unlock P2', () => {
    let state = createInitialAlterState();
    state = discover(state, 'C01', 1);
    state = discover(state, 'C01', 2);
    state = discover(state, 'C01', 3);
    expect(state.phase).toBe('P1');
    expect(state.uniqueCategories).toBe(1);
  });

  it('6. a fourth distinct clue stays in P2', () => {
    const state = discover(p2State(), 'C04', 4);
    expect(state.phase).toBe('P2');
    expect(state.uniqueCategories).toBe(4);
  });

  it('7. reveal is rejected in P0', () => {
    const state = createInitialAlterState();
    expect(alterReducer(state, { type: 'alter.reveal.requested', at: 1 })).toBe(state);
  });

  it('8. reveal is rejected in P1', () => {
    const state = discover(createInitialAlterState(), 'C01', 1);
    expect(alterReducer(state, { type: 'alter.reveal.requested', at: 2 })).toBe(state);
  });

  it('9. reveal from P2 enters P3 once', () => {
    const state = alterReducer(p2State(), { type: 'alter.reveal.requested', at: 100 });
    expect(state.phase).toBe('P3');
    expect(state.revealRequestedAt).toBe(100);
  });

  it('10. rapid reveal requests do not retrigger P3', () => {
    const first = p3State();
    const second = alterReducer(first, { type: 'alter.reveal.requested', at: 150 });
    expect(second).toBe(first);
    expect(second.phase).toBe('P3');
  });

  it('11. reveal completion moves P3 to P4', () => {
    const state = alterReducer(p3State(), { type: 'alter.reveal.completed', at: 200 });
    expect(state.phase).toBe('P4');
    expect(state.terminalEnteredAt).toBe(200);
  });

  it('12. reveal completion is rejected outside P3', () => {
    const state = p2State();
    expect(alterReducer(state, { type: 'alter.reveal.completed', at: 200 })).toBe(state);
  });

  it('13. reconciliation moves P4 to P5', () => {
    const state = alterReducer(p4State(), { type: 'alter.reconciliation.reached', at: 300 });
    expect(state.phase).toBe('P5');
    expect(state.reconciliationAt).toBe(300);
  });

  it('14. reconciliation is rejected outside P4', () => {
    const state = p3State();
    expect(alterReducer(state, { type: 'alter.reconciliation.reached', at: 300 })).toBe(state);
  });

  it('15. exit from P3 enters P6', () => {
    const state = alterReducer(p3State(), { type: 'alter.exit.requested', at: 400 });
    expect(state.phase).toBe('P6');
    expect(state.exitedAt).toBe(400);
  });

  it('16. exit from P4 enters P6', () => {
    const state = alterReducer(p4State(), { type: 'alter.exit.requested', at: 400 });
    expect(state.phase).toBe('P6');
  });

  it('17. exit from P5 enters P6', () => {
    const state = alterReducer(p5State(), { type: 'alter.exit.requested', at: 400 });
    expect(state.phase).toBe('P6');
  });

  it('18. exit is rejected from P2', () => {
    const state = p2State();
    expect(alterReducer(state, { type: 'alter.exit.requested', at: 400 })).toBe(state);
  });

  it('19. reset clears phase and clue state', () => {
    const state = alterReducer(p4State(), { type: 'alter.reset.requested' });
    expect(state.phase).toBe('P0');
    expect(state.discoveredClues).toHaveLength(0);
    expect(state.uniqueCategories).toBe(0);
    expect(state.terminalEnteredAt).toBeNull();
  });

  it('20. semantic Normal events are no-ops for story progression', () => {
    const state = p2State();
    const events: AlterEvent[] = [
      { type: 'portfolio.section.enter', sectionId: 'work' },
      { type: 'research.trace.inspect', evidenceId: 'trace-04' },
      { type: 'research.command.completed', command: 'research', success: true },
      { type: 'visualize.transform.committed', transformId: 'Reflect Y', determinant: -1 },
      { type: 'moro.dialogue.action', actionId: 'inspect-signal' },
      { type: 'archive.note.inspected', noteId: 'observer-log' }
    ];
    for (const event of events) {
      expect(alterReducer(state, event)).toBe(state);
    }
  });

  it('21. passive effects respect the 30 second cooldown and phase guards', () => {
    const p1 = discover(createInitialAlterState(), 'C01', 1);
    expect(canRunPassiveEffect(p1, 1000)).toBe(true);
    const first = alterReducer(p1, { type: 'alter.passive.effect', at: 1000 });
    expect(first.lastPassiveEffectAt).toBe(1000);
    expect(canRunPassiveEffect(first, 1000 + PASSIVE_EFFECT_COOLDOWN_MS - 1)).toBe(false);
    expect(alterReducer(first, { type: 'alter.passive.effect', at: 2000 })).toBe(first);
    expect(canRunPassiveEffect(first, 1000 + PASSIVE_EFFECT_COOLDOWN_MS)).toBe(true);
    const second = alterReducer(first, {
      type: 'alter.passive.effect',
      at: 1000 + PASSIVE_EFFECT_COOLDOWN_MS
    });
    expect(second.lastPassiveEffectAt).toBe(1000 + PASSIVE_EFFECT_COOLDOWN_MS);
    expect(canRunPassiveEffect(p4State(), 5000)).toBe(false);
  });

  it('22. direct clue discovery is not blocked by the passive cooldown', () => {
    const first = alterReducer(discover(createInitialAlterState(), 'C01', 1), {
      type: 'alter.passive.effect',
      at: 1000
    });
    const withSecondClue = discover(first, 'C02', 1001);
    expect(withSecondClue.phase).toBe('P1');
    expect(withSecondClue.discoveredClues).toHaveLength(2);
  });

  it('23. stored state restores without duplicating clues or categories', () => {
    const state = p2State();
    const stored = toStoredAlterState(state);
    stored.discoveredClues = [...stored.discoveredClues, stored.discoveredClues[0]];
    const restored = createInitialAlterState(stored);
    expect(restored.phase).toBe('P2');
    expect(restored.discoveredClues).toHaveLength(3);
    expect(restored.uniqueCategories).toBe(3);
  });

  it('24. a stored P2 with fewer than three categories is downgraded to P1', () => {
    const stored = toStoredAlterState(withClues('C01', 'C02'));
    stored.phase = 'P2';
    const restored = createInitialAlterState(stored);
    expect(restored.phase).toBe('P1');
    expect(restored.uniqueCategories).toBe(2);
  });

  it('25. session storage round-trips and reset clears the key', () => {
    const storage = memoryStorage();
    const state = p2State();
    saveAlterState(state, storage);
    expect(storage.getItem(ALTER_STORAGE_KEY)).toContain('C01');
    const restored = loadAlterState(storage);
    expect(restored.phase).toBe('P2');
    expect(restored.uniqueCategories).toBe(3);
    const cleared = resetAlterState(storage);
    expect(cleared.phase).toBe('P0');
    expect(storage.getItem(ALTER_STORAGE_KEY)).toBeNull();
    expect(loadAlterState(storage).phase).toBe('P0');
  });

  it('26. event bridge emits typed semantic events', () => {
    expect(researchInspectEvent('trace-04')).toEqual({
      type: 'research.trace.inspect',
      evidenceId: 'trace-04'
    });
    expect(researchCompletedEvent('research', true)).toEqual({
      type: 'research.command.completed',
      command: 'research',
      success: true
    });
    expect(
      visualizeCommittedEvent({ type: 'preset', preset: 'Reflect Y', determinant: -1 })
    ).toEqual({
      type: 'visualize.transform.committed',
      transformId: 'Reflect Y',
      determinant: -1
    });
    expect(moroActionEvent('inspect-signal')).toEqual({
      type: 'moro.dialogue.action',
      actionId: 'inspect-signal'
    });
    expect(archiveNoteEvent('observer-log')).toEqual({
      type: 'archive.note.inspected',
      noteId: 'observer-log'
    });
  });

  it('28. canDiscoverClue rejects an already discovered clue', () => {
    const state = discover(createInitialAlterState(), 'C01', 1);
    expect(hasClue(state, 'C01')).toBe(true);
    expect(canDiscoverClue(state, 'C01')).toBe(false);
    expect(canDiscoverClue(state, 'C02')).toBe(true);
  });

  it('29. three distinct clue categories are the only P2 gate', () => {
    const two = withClues('C01', 'C02');
    expect(canDiscoverClue(two, 'C03')).toBe(true);
    const three = discover(two, 'C03', 3);
    expect(three.phase).toBe('P2');
    const fourth = discover(three, 'C04', 4);
    expect(fourth.phase).toBe('P2');
    expect(fourth.uniqueCategories).toBe(4);
  });

  it('27. uniqueCategoriesFor counts categories, not clue records', () => {
    const clues = [
      { id: 'C01' as const, category: ALTER_CLUES.C01.category, discoveredAt: 1 },
      { id: 'C02' as const, category: ALTER_CLUES.C02.category, discoveredAt: 2 }
    ];
    expect(uniqueCategoriesFor(clues)).toBe(2);
  });
});
