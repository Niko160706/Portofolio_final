import { describe, expect, it } from 'vitest';
import {
  getEchoVoiceLines,
  getMoroPhaseLine,
  getMoroVoiceLines
} from '../../src/data/alterNarrative';
import type { AlterPhase } from '../../src/lib/alter/alterTypes';

describe('alterNarrative', () => {
  it('keeps P0 free of phase-specific MORO story', () => {
    expect(getMoroPhaseLine({ phase: 'P0', clues: [] })).toBeNull();
  });

  it('provides a hesitant P1 line when the trace contradiction is open', () => {
    const line = getMoroPhaseLine({ phase: 'P1', clues: ['C02'] });
    expect(line).toContain('trace');
    expect(line).toContain('readable');
    expect(getMoroPhaseLine({ phase: 'P1', clues: ['C01'] })).toContain('One discrepancy');
  });

  it('provides the P2 redirection line', () => {
    expect(getMoroPhaseLine({ phase: 'P2', clues: ['C01', 'C02', 'C03'] })).toContain('Three discrepancies');
  });

  it('provides P3, P4, P5, and P6 lines', () => {
    const phases: AlterPhase[] = ['P3', 'P4', 'P5', 'P6'];
    for (const phase of phases) {
      const line = getMoroPhaseLine({ phase, clues: ['C01', 'C02', 'C03'] });
      expect(line).toBeTruthy();
      expect(line).not.toContain('evil');
    }
  });

  it('grounds the MORO voice in record 005', () => {
    const lines = getMoroVoiceLines({ phase: 'P4', clues: ['C01', 'C02', 'C03'] }).join('\n');
    expect(lines).toContain('record 005');
    expect(lines).toContain('Reassurance protocol');
  });

  it('grounds the ECHO voice in records 003, 004, and 006', () => {
    const lines = getEchoVoiceLines({ phase: 'P4', clues: ['C01', 'C02', 'C03'] }).join('\n');
    expect(lines).toContain('Record 003');
    expect(lines).toContain('Record 004');
    expect(lines).toContain('Record 006');
    expect(lines).toContain('omitted');
  });

  it('keeps ECHO dormant before a contradiction', () => {
    const lines = getEchoVoiceLines({ phase: 'P0', clues: [] }).join('\n');
    expect(lines).toContain('dormant');
  });

  it('does not label either voice as villainous or heroic', () => {
    const all = [
      ...getMoroVoiceLines({ phase: 'P5', clues: ['C01', 'C02', 'C03'] }),
      ...getEchoVoiceLines({ phase: 'P5', clues: ['C01', 'C02', 'C03'] })
    ].join('\n').toLowerCase();
    expect(all).not.toContain('evil');
    expect(all).not.toContain('villain');
    expect(all).not.toContain('hero');
    expect(all).not.toContain('hacker');
  });
});
