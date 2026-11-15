export interface StoredNarrative {
  version: 1;
  effectsEnabled: boolean;
  seen: {
    'AN-01': boolean;
    'AN-02': boolean;
    'AN-03': boolean;
    'AN-04': boolean;
  };
}

const STORAGE_KEY = 'human-protocol:narrative:v1';

const defaultData: StoredNarrative = {
  version: 1,
  effectsEnabled: true,
  seen: {
    'AN-01': false,
    'AN-02': false,
    'AN-03': false,
    'AN-04': false
  }
};

let memoryFallback: StoredNarrative = { ...defaultData, seen: { ...defaultData.seen } };

export function loadStoredNarrative(): StoredNarrative {
  if (typeof window === 'undefined') {
    return defaultData;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData, seen: { ...defaultData.seen } };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && typeof parsed.effectsEnabled === 'boolean' && parsed.seen) {
      return {
        version: 1,
        effectsEnabled: parsed.effectsEnabled,
        seen: {
          'AN-01': Boolean(parsed.seen['AN-01']),
          'AN-02': Boolean(parsed.seen['AN-02']),
          'AN-03': Boolean(parsed.seen['AN-03']),
          'AN-04': Boolean(parsed.seen['AN-04'])
        }
      };
    }
  } catch {
    // LocalStorage unavailable, quota exceeded, or corrupted. Use memory fallback safely.
  }
  return memoryFallback;
}

export function saveStoredNarrative(data: StoredNarrative): void {
  memoryFallback = { ...data, seen: { ...data.seen } };
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Fail silently to in-memory store; portfolio execution never halts.
  }
}

export function resetStoredNarrative(): StoredNarrative {
  const fresh: StoredNarrative = {
    version: 1,
    effectsEnabled: true,
    seen: {
      'AN-01': false,
      'AN-02': false,
      'AN-03': false,
      'AN-04': false
    }
  };
  saveStoredNarrative(fresh);
  return fresh;
}
