import { createInitialAlterState, toStoredAlterState } from './alterMachine';
import type { AlterState, AlterStoredState } from './alterTypes';

export const ALTER_STORAGE_KEY = 'human-protocol:alter:v1';

export interface AlterStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let memoryValue: string | null = null;

function defaultStorage(): AlterStorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(storage: AlterStorageLike | null): string | null {
  if (!storage) return memoryValue;
  try {
    return storage.getItem(ALTER_STORAGE_KEY);
  } catch {
    return memoryValue;
  }
}

function writeRaw(storage: AlterStorageLike | null, value: string | null): void {
  memoryValue = value;
  if (!storage) return;
  try {
    if (value === null) storage.removeItem(ALTER_STORAGE_KEY);
    else storage.setItem(ALTER_STORAGE_KEY, value);
  } catch {
    // Session storage can be blocked. The in-memory copy remains usable.
  }
}

function parseStored(raw: string | null): AlterStoredState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AlterStoredState>;
    if (parsed?.version !== 1 || !Array.isArray(parsed.discoveredClues)) return null;
    return parsed as AlterStoredState;
  } catch {
    return null;
  }
}

export function loadAlterState(storage: AlterStorageLike | null = defaultStorage()): AlterState {
  return createInitialAlterState(parseStored(readRaw(storage)));
}

export function saveAlterState(
  state: AlterState,
  storage: AlterStorageLike | null = defaultStorage()
): void {
  writeRaw(storage, JSON.stringify(toStoredAlterState(state)));
}

export function resetAlterState(storage: AlterStorageLike | null = defaultStorage()): AlterState {
  writeRaw(storage, null);
  return createInitialAlterState();
}
