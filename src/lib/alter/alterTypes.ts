export const alterPhases = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as const;

export type AlterPhase = (typeof alterPhases)[number];

export const alterClueIds = ['C01', 'C02', 'C03', 'C04', 'C05'] as const;

export type AlterClueId = (typeof alterClueIds)[number];

export type AlterClueCategory =
  | 'moro-status'
  | 'research-provenance'
  | 'visualize-orientation'
  | 'archive-note'
  | 'moro-contradiction';

export interface AlterClueDefinition {
  id: AlterClueId;
  category: AlterClueCategory;
  label: string;
  sourceSurface: string;
}

export const ALTER_CLUES: Record<AlterClueId, AlterClueDefinition> = {
  C01: {
    id: 'C01',
    category: 'moro-status',
    label: 'MORO status hesitation',
    sourceSurface: 'hero / MORO'
  },
  C02: {
    id: 'C02',
    category: 'research-provenance',
    label: 'Contradictory research provenance',
    sourceSurface: 'Deep Research'
  },
  C03: {
    id: 'C03',
    category: 'visualize-orientation',
    label: 'Reflection orientation inspection',
    sourceSurface: 'Visualize'
  },
  C04: {
    id: 'C04',
    category: 'archive-note',
    label: 'Archive footnote',
    sourceSurface: 'project notes'
  },
  C05: {
    id: 'C05',
    category: 'moro-contradiction',
    label: 'MORO contradiction query',
    sourceSurface: 'MORO dialogue'
  }
};

export interface AlterClueRecord {
  id: AlterClueId;
  category: AlterClueCategory;
  discoveredAt: number;
}

export interface AlterState {
  phase: AlterPhase;
  discoveredClues: AlterClueRecord[];
  uniqueCategories: number;
  lastPassiveEffectAt: number | null;
  revealRequestedAt: number | null;
  terminalEnteredAt: number | null;
  reconciliationAt: number | null;
  exitedAt: number | null;
}

export interface AlterStoredState {
  version: 1;
  phase: AlterPhase;
  discoveredClues: AlterClueRecord[];
  lastPassiveEffectAt: number | null;
  revealRequestedAt: number | null;
  terminalEnteredAt: number | null;
  reconciliationAt: number | null;
  exitedAt: number | null;
}

export type AlterEvent =
  | { type: 'portfolio.section.enter'; sectionId: string }
  | { type: 'research.trace.inspect'; evidenceId: string }
  | { type: 'research.command.completed'; command: string; success: boolean }
  | { type: 'visualize.transform.committed'; transformId: string; determinant: number }
  | { type: 'moro.dialogue.action'; actionId: string }
  | { type: 'archive.note.inspected'; noteId: string }
  | { type: 'anomaly.clue.discovered'; clueId: AlterClueId; discoveredAt?: number }
  | { type: 'alter.passive.effect'; at: number }
  | { type: 'alter.reveal.requested'; at?: number }
  | { type: 'alter.reveal.completed'; at?: number }
  | { type: 'alter.reconciliation.reached'; at?: number }
  | { type: 'alter.exit.requested'; at?: number }
  | { type: 'alter.restore'; stored: AlterStoredState }
  | { type: 'alter.reset.requested' };

export const PASSIVE_EFFECT_COOLDOWN_MS = 30_000;

export const REQUIRED_UNIQUE_CATEGORIES = 3;
