import { useCallback, useEffect, useReducer, useState } from 'react';
import { alterReducer, createInitialAlterState, toStoredAlterState } from './alterMachine';
import { loadAlterState, resetAlterState, saveAlterState } from './alterStorage';
import type { AlterEvent } from './alterTypes';

export interface AlterExperienceController {
  state: ReturnType<typeof createInitialAlterState>;
  dispatch: (event: AlterEvent) => void;
  eventLog: AlterEvent[];
  reset: () => void;
  hydrated: boolean;
}

export function useAlterExperience(): AlterExperienceController {
  const [state, dispatch] = useReducer(alterReducer, undefined, () => createInitialAlterState());
  const [eventLog, setEventLog] = useState<AlterEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restored = loadAlterState();
    dispatch({ type: 'alter.restore', stored: toStoredAlterState(restored) });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Do not write a P0/no-clue state in ordinary Normal mode.
    if (state.phase === 'P0' && state.discoveredClues.length === 0) return;
    saveAlterState(state);
  }, [hydrated, state]);

  const dispatchEvent = useCallback((event: AlterEvent) => {
    setEventLog((items) => [event, ...items].slice(0, 20));
    dispatch(event);
  }, []);

  const reset = useCallback(() => {
    resetAlterState();
    dispatch({ type: 'alter.reset.requested' });
    setEventLog([]);
  }, []);

  return { state, dispatch: dispatchEvent, eventLog, reset, hydrated };
}
