export type AnomalyId = 'AN-01' | 'AN-02' | 'AN-03' | 'AN-04';

export interface NarrativeAnomaly {
  id: AnomalyId;
  component: string;
  triggerDescription: string;
  header: string;
  body: string;
  detail?: string;
  footnote: string;
  temporaryTitle?: string;
  temporaryTitleDurationMs?: number;
}

export const narrativeAnomalies: Record<AnomalyId, NarrativeAnomaly> = {
  'AN-01': {
    id: 'AN-01',
    component: 'assistant',
    triggerDescription: 'Opened the assistant and selected Inspect system',
    header: 'INTERCEPTED MESSAGE',
    body: 'Maintain the friendly interface. The visitor is asking questions.',
    footnote: 'Fictional system narrative',
    temporaryTitle: 'unknown_process.exe',
    temporaryTitleDurationMs: 500
  },
  'AN-02': {
    id: 'AN-02',
    component: 'deep-research',
    triggerDescription: 'Inspected the research trace',
    header: 'REASSURANCE_PROTOCOL: ACTIVE',
    body: 'Discrepancy detected. Response framing updated.',
    detail: 'Telemetry parameters modified. Underlying reasoning chain suppressed.',
    footnote: 'Scripted anomaly: not an actual system event'
  },
  'AN-03': {
    id: 'AN-03',
    component: 'lab-index',
    triggerDescription: 'Showed hidden files and inspected observer.log',
    header: 'OBSERVER LOG ARTIFACT',
    body: 'Who decides what you are allowed to see?',
    detail: 'Some records are missing because someone chose what counts as relevant.',
    footnote: 'Fictional system narrative'
  },
  'AN-04': {
    id: 'AN-04',
    component: 'lab-diagnostics',
    triggerDescription: 'Ran diagnostics after discovering anomaly fragments',
    header: 'INTERNAL DIAGNOSTIC LOG',
    body: 'ASSISTANT: Everything is operating normally.\nUNKNOWN: That is what the interface was instructed to say.',
    detail: 'Two conflicting routines detected in background task memory.',
    footnote: 'Fictional narrative artifact'
  }
};
