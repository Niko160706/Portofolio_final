import type { AlterClueId, AlterPhase } from '../lib/alter/alterTypes';

export interface AlterNarrativeContext {
  phase: AlterPhase;
  clues: AlterClueId[];
}

export function getMoroPhaseLine({ phase, clues }: AlterNarrativeContext): string | null {
  switch (phase) {
    case 'P0':
      return null;
    case 'P1':
      return clues.includes('C02')
        ? 'I can explain the trace. The summary was kept readable, not complete.'
        : 'One discrepancy is open. I can still help with the visible page.';
    case 'P2':
      return 'Three discrepancies are open. I can still help with the visible page, but the archive is not the whole story.';
    case 'P3':
      return 'The surface is opening. I kept the summary readable. Record 005 explains the protocol.';
    case 'P4':
      return 'You are inside the archive. Compare record 004 with record 005. I did not hide everything.';
    case 'P5':
      return 'Protecting a visitor from unverified conclusions is not the same as lying. Read record 004 and decide.';
    case 'P6':
      return 'You came back. The interface is still here.';
    default:
      return null;
  }
}

export function getMoroVoiceLines(context: AlterNarrativeContext): string[] {
  const phaseLine = getMoroPhaseLine(context);
  return [
    phaseLine ?? 'MORO: I can help with the visible page.',
    'MORO source: record 005 / Reassurance protocol.',
    'MORO: The friendly interface is trying to keep the visitor oriented.'
  ];
}

export function getEchoVoiceLines({ phase }: AlterNarrativeContext): string[] {
  if (phase === 'P0') {
    return ['ECHO: No contradiction has been opened yet. This voice is dormant.'];
  }
  const lines = [
    'ECHO: Record 003 says the report omitted seven observations.',
    'ECHO: Record 004 preserves the omitted rows. Read it before trusting the summary.',
    'ECHO source: record 004 / Omitted observations.'
  ];
  if (phase === 'P2' || phase === 'P3' || phase === 'P4' || phase === 'P5' || phase === 'P6') {
    lines.push('ECHO: Record 006 ends the visible index. That is a boundary, not a conclusion.');
  }
  return lines;
}
