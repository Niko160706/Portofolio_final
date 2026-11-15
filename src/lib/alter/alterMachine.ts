import {
  ALTER_CLUES,
  PASSIVE_EFFECT_COOLDOWN_MS,
  REQUIRED_UNIQUE_CATEGORIES,
  alterClueIds,
  alterPhases,
  type AlterClueId,
  type AlterClueRecord,
  type AlterEvent,
  type AlterPhase,
  type AlterState,
  type AlterStoredState
} from './alterTypes';

const emptyState = (): AlterState => ({
  phase: 'P0',
  discoveredClues: [],
  uniqueCategories: 0,
  lastPassiveEffectAt: null,
  revealRequestedAt: null,
  terminalEnteredAt: null,
  reconciliationAt: null,
  exitedAt: null
});

const isKnownClue = (value: string): value is AlterClueId =>
  (alterClueIds as readonly string[]).includes(value);

const isKnownPhase = (value: string): value is AlterPhase =>
  (alterPhases as readonly string[]).includes(value);

export function uniqueCategoriesFor(clues: AlterClueRecord[]): number {
  return new Set(clues.map((clue) => clue.category)).size;
}

export function toStoredAlterState(state: AlterState): AlterStoredState {
  return {
    version: 1,
    phase: state.phase,
    discoveredClues: state.discoveredClues.map((clue) => ({ ...clue })),
    lastPassiveEffectAt: state.lastPassiveEffectAt,
    revealRequestedAt: state.revealRequestedAt,
    terminalEnteredAt: state.terminalEnteredAt,
    reconciliationAt: state.reconciliationAt,
    exitedAt: state.exitedAt
  };
}

export function createInitialAlterState(stored?: AlterStoredState | null): AlterState {
  if (!stored) return emptyState();

  const seen = new Set<AlterClueId>();
  const discoveredClues: AlterClueRecord[] = [];
  for (const clue of stored.discoveredClues ?? []) {
    if (!clue || !isKnownClue(clue.id) || seen.has(clue.id)) continue;
    const definition = ALTER_CLUES[clue.id];
    seen.add(clue.id);
    discoveredClues.push({
      id: clue.id,
      category: definition.category,
      discoveredAt: Number.isFinite(clue.discoveredAt) ? clue.discoveredAt : 0
    });
  }

  const uniqueCategories = uniqueCategoriesFor(discoveredClues);
  let phase: AlterPhase = isKnownPhase(stored.phase) ? stored.phase : 'P0';
  if (phase === 'P2' && uniqueCategories < REQUIRED_UNIQUE_CATEGORIES) phase = 'P1';
  if (phase === 'P1' && discoveredClues.length === 0) phase = 'P0';

  return {
    phase,
    discoveredClues,
    uniqueCategories,
    lastPassiveEffectAt: stored.lastPassiveEffectAt ?? null,
    revealRequestedAt: stored.revealRequestedAt ?? null,
    terminalEnteredAt: stored.terminalEnteredAt ?? null,
    reconciliationAt: stored.reconciliationAt ?? null,
    exitedAt: stored.exitedAt ?? null
  };
}

export function canRunPassiveEffect(state: AlterState, at: number): boolean {
  if (state.phase === 'P3' || state.phase === 'P4' || state.phase === 'P5') return false;
  if (state.lastPassiveEffectAt === null) return true;
  return at - state.lastPassiveEffectAt >= PASSIVE_EFFECT_COOLDOWN_MS;
}

function addClue(state: AlterState, clueId: AlterClueId, discoveredAt: number): AlterState {
  if (state.discoveredClues.some((clue) => clue.id === clueId)) return state;
  const definition = ALTER_CLUES[clueId];
  if (!definition) return state;

  const discoveredClues = [
    ...state.discoveredClues,
    { id: clueId, category: definition.category, discoveredAt }
  ];
  const uniqueCategories = uniqueCategoriesFor(discoveredClues);
  let phase = state.phase;
  if (phase === 'P0') phase = 'P1';
  if (phase === 'P1' && uniqueCategories >= REQUIRED_UNIQUE_CATEGORIES) phase = 'P2';

  return {
    ...state,
    phase,
    discoveredClues,
    uniqueCategories
  };
}

export function alterReducer(state: AlterState, event: AlterEvent): AlterState {
  switch (event.type) {
    case 'anomaly.clue.discovered':
      return addClue(state, event.clueId, event.discoveredAt ?? 0);

    case 'alter.passive.effect': {
      if (!canRunPassiveEffect(state, event.at)) return state;
      return { ...state, lastPassiveEffectAt: event.at };
    }

    case 'alter.reveal.requested': {
      if (state.phase !== 'P2') return state;
      return {
        ...state,
        phase: 'P3',
        revealRequestedAt: event.at ?? 0
      };
    }

    case 'alter.reveal.completed': {
      if (state.phase !== 'P3') return state;
      return {
        ...state,
        phase: 'P4',
        terminalEnteredAt: event.at ?? 0
      };
    }

    case 'alter.reconciliation.reached': {
      if (state.phase !== 'P4') return state;
      return {
        ...state,
        phase: 'P5',
        reconciliationAt: event.at ?? 0
      };
    }

    case 'alter.exit.requested': {
      if (state.phase !== 'P3' && state.phase !== 'P4' && state.phase !== 'P5') return state;
      return {
        ...state,
        phase: 'P6',
        exitedAt: event.at ?? 0
      };
    }

    case 'alter.restore':
      return createInitialAlterState(event.stored);

    case 'alter.reset.requested':
      return emptyState();

    // Semantic Normal Experience events are intentionally recorded by the
    // bridge and debug log, but they do not advance the story by themselves.
    case 'portfolio.section.enter':
    case 'research.trace.inspect':
    case 'research.command.completed':
    case 'visualize.transform.committed':
    case 'moro.dialogue.action':
    case 'archive.note.inspected':
    default:
      return state;
  }
}
