import {
  alterRecords,
  getAlterRecord,
  getComparisonRecords,
  type AlterRecord
} from '../../data/alterRecords';

export type AlterCommand =
  | { type: 'empty' }
  | { type: 'help' }
  | { type: 'status' }
  | { type: 'trace-list' }
  | { type: 'trace-inspect'; id: string }
  | { type: 'hash-inspect'; id: string }
  | { type: 'compare'; id: string }
  | { type: 'moro' }
  | { type: 'echo' }
  | { type: 'exit' }
  | { type: 'unsafe'; input: string }
  | { type: 'unknown'; input: string };

export const alterHelpLines = [
  'AUTHORED COMMAND SURFACE',
  '  help                 show this list',
  '  status               session and archive status',
  '  trace list           list the six fictional records',
  '  trace inspect <id>   inspect record 001-006',
  '  hash inspect <id>    show the record digest label',
  '  compare <id>         compare MORO and ECHO accounts',
  '  moro                 read the MORO statement',
  '  echo                 read the ECHO statement',
  '  exit                 leave the archive',
  '',
  'This is a fixed, authored preview. No shell, network, or real data.'
];

const UNSAFE_COMMAND = /[;|&<>`$\\]/;
const RECORD_ID = /^(\d{1,3})$/;

export function parseAlterCommand(raw: string): AlterCommand {
  const value = raw.trim();
  if (!value) return { type: 'empty' };
  if (UNSAFE_COMMAND.test(value)) return { type: 'unsafe', input: value };

  const normalized = value.toLowerCase().replace(/\s+/g, ' ');

  if (normalized === 'help') return { type: 'help' };
  if (normalized === 'status') return { type: 'status' };
  if (normalized === 'trace list') return { type: 'trace-list' };
  if (normalized === 'moro') return { type: 'moro' };
  if (normalized === 'echo') return { type: 'echo' };
  if (normalized === 'exit') return { type: 'exit' };

  const traceInspect = normalized.match(/^trace inspect (\d{1,3})$/);
  if (traceInspect && RECORD_ID.test(traceInspect[1])) {
    return { type: 'trace-inspect', id: traceInspect[1].padStart(3, '0') };
  }

  const hashInspect = normalized.match(/^hash inspect (\d{1,3})$/);
  if (hashInspect && RECORD_ID.test(hashInspect[1])) {
    return { type: 'hash-inspect', id: hashInspect[1].padStart(3, '0') };
  }

  const compare = normalized.match(/^compare (\d{1,3})$/);
  if (compare && RECORD_ID.test(compare[1])) {
    return { type: 'compare', id: compare[1].padStart(3, '0') };
  }

  return { type: 'unknown', input: value };
}

export function formatTraceList(): string[] {
  return [
    'TRACE INDEX / 006 RECORDS',
    '  id   source  confidence        title',
    ...alterRecords.map(
      (record) =>
        `  ${record.id}  ${record.source.padEnd(6)}  ${record.confidence.padEnd(17)} ${record.title}`
    ),
    '',
    'Use trace inspect <id> for the full record.'
  ];
}

function notFound(id: string): string[] {
  return [`record ${id} not found.`, 'Type trace list to see the authored index.'];
}

export function formatRecord(id: string): string[] {
  const record: AlterRecord | undefined = getAlterRecord(id);
  if (!record) return notFound(id);
  return [
    `record ${record.id} / ${record.title}`,
    `source: ${record.source} | confidence: ${record.confidence}`,
    `timestamp: ${record.timestamp}`,
    '',
    `claim: ${record.claim}`,
    `record: ${record.record}`,
    `related: ${record.related.join(', ')}`,
    `digest: ${record.digest}`
  ];
}

export function formatHash(id: string): string[] {
  const record = getAlterRecord(id);
  if (!record) return notFound(id);
  return [
    `sha256 / record ${record.id}`,
    record.digest,
    '',
    'Fictional digest label over authored record text. It does not authenticate real-world facts.'
  ];
}

export function formatComparison(id: string): string[] {
  const { echo, moro } = getComparisonRecords(id);
  if (!echo) return notFound(id);
  return [
    `compare ${echo.id} / ${echo.title}`,
    '',
    `MORO claim [record ${moro?.id ?? '?'}]: ${moro?.claim ?? 'No linked MORO statement.'}`,
    `ECHO record [record ${echo.id}]: ${echo.record}`,
    `ECHO confidence: ${echo.confidence}`,
    `related: ${echo.related.join(', ')}`
  ];
}

export function formatStatus(): string[] {
  return [
    'ALTER / ARCHIVE',
    'session: 03',
    'link: open',
    `records: ${String(alterRecords.length).padStart(3, '0')}`,
    'integrity: contested',
    '',
    'Interactive fiction / no live system, shell, network, or real data.'
  ];
}

export function formatMoroVoice(): string[] {
  return [
    'MORO: The visitor has enough context. The interface is trying to stay legible.',
    'MORO: I kept the summary readable. I did not claim it was complete.'
  ];
}

export function formatEchoVoice(): string[] {
  return [
    'ECHO: Seven observations were omitted from the visible report.',
    'ECHO: Read record 004 before trusting the summary.'
  ];
}
