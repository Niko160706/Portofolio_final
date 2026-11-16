import { describe, expect, it } from 'vitest';
import {
  alterHelpLines,
  formatComparison,
  formatHash,
  formatMoroVoice,
  formatEchoVoice,
  formatReconciliation,
  formatRecord,
  formatStatus,
  formatTraceList,
  parseAlterCommand
} from '../../src/lib/alter/alterParser';
import { alterRecords, getComparisonRecords, getAlterRecord } from '../../src/data/alterRecords';

describe('alterParser', () => {
  it('parses the allowlisted commands', () => {
    expect(parseAlterCommand('help')).toEqual({ type: 'help' });
    expect(parseAlterCommand('status')).toEqual({ type: 'status' });
    expect(parseAlterCommand('trace list')).toEqual({ type: 'trace-list' });
    expect(parseAlterCommand('moro')).toEqual({ type: 'moro' });
    expect(parseAlterCommand('echo')).toEqual({ type: 'echo' });
    expect(parseAlterCommand('exit')).toEqual({ type: 'exit' });
  });

  it('normalizes record ids for inspect, hash, and compare', () => {
    expect(parseAlterCommand('trace inspect 004')).toEqual({ type: 'trace-inspect', id: '004' });
    expect(parseAlterCommand('trace inspect 4')).toEqual({ type: 'trace-inspect', id: '004' });
    expect(parseAlterCommand('hash inspect 006')).toEqual({ type: 'hash-inspect', id: '006' });
    expect(parseAlterCommand('compare 004')).toEqual({ type: 'compare', id: '004' });
  });

  it('parses the user-facing reconcile command', () => {
    expect(parseAlterCommand('reconcile')).toEqual({ type: 'reconcile' });
    expect(alterHelpLines.join('\n')).toContain('reconcile');
    const lines = formatReconciliation().join('\n');
    expect(lines).toContain('RECORD 004');
    expect(lines).toContain('seven omitted observations');
    expect(lines).toContain('disagreement is the record');
  });

  it('rejects shell syntax without executing it', () => {
    for (const input of [
      'trace inspect 004; rm -rf /',
      'trace list | cat',
      'help && whoami',
      '$(id)',
      '`uname -a`',
      'trace inspect 004 > out',
      'help & echo'
    ]) {
      expect(parseAlterCommand(input)).toMatchObject({ type: 'unsafe' });
    }
  });

  it('returns unknown for unsupported commands and empty for blank input', () => {
    expect(parseAlterCommand('whoami')).toMatchObject({ type: 'unknown' });
    expect(parseAlterCommand('   ')).toEqual({ type: 'empty' });
  });

  it('uses a six-record fictional archive', () => {
    expect(alterRecords).toHaveLength(6);
    expect(new Set(alterRecords.map((record) => record.id)).size).toBe(6);
    expect(new Set(alterRecords.map((record) => record.source))).toEqual(new Set(['MORO', 'ECHO']));
  });

  it('keeps every related id inside the archive', () => {
    const ids = new Set(alterRecords.map((record) => record.id));
    for (const record of alterRecords) {
      for (const related of record.related) expect(ids.has(related)).toBe(true);
    }
  });

  it('uses 64 hexadecimal characters for every digest label', () => {
    for (const record of alterRecords) {
      expect(record.digest).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('formats a record with claim, evidence, related ids, and digest', () => {
    const lines = formatRecord('004');
    expect(lines.join('\n')).toContain('record 004');
    expect(lines.join('\n')).toContain('Omitted observations');
    expect(lines.join('\n')).toContain('ECHO');
    expect(lines.join('\n')).toContain('004');
    expect(lines.join('\n')).toContain(getAlterRecord('004')!.digest);
  });

  it('formats hash labels and comparison voices', () => {
    const hash = formatHash('004').join('\n');
    expect(hash).toContain(getAlterRecord('004')!.digest);
    expect(hash).toContain('does not authenticate');
    const comparison = formatComparison('004').join('\n');
    expect(comparison).toContain('MORO claim');
    expect(comparison).toContain('ECHO record');
    const pair = getComparisonRecords('004');
    expect(pair.echo?.source).toBe('ECHO');
    expect(pair.moro?.source).toBe('MORO');
  });

  it('formats status, trace list, and help without external data', () => {
    expect(formatStatus().join('\n')).toContain('records: 006');
    expect(formatTraceList().join('\n')).toContain('TRACE INDEX');
    expect(alterHelpLines.join('\n')).toContain('No shell, network, or real data.');
  });

  it('formats both authored voices', () => {
    expect(formatMoroVoice().join('\n')).toContain('MORO:');
    expect(formatEchoVoice().join('\n')).toContain('ECHO:');
  });

  it('reports missing records safely', () => {
    expect(formatRecord('999').join('\n')).toContain('not found');
    expect(formatHash('999').join('\n')).toContain('not found');
    expect(formatComparison('999').join('\n')).toContain('not found');
  });
});
