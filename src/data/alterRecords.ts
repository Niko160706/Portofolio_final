export type AlterRecordSource = 'MORO' | 'ECHO';

export type AlterRecordConfidence = 'verified-in-story' | 'contested' | 'redacted' | 'unknown';

export interface AlterRecord {
  id: string;
  title: string;
  source: AlterRecordSource;
  confidence: AlterRecordConfidence;
  timestamp: string;
  claim: string;
  record: string;
  related: string[];
  digest: string;
}

// Authored fictional archive. Digests are SHA-256 over the record claim + text.
// They label fictional records; they do not authenticate real-world facts.
export const alterRecords: AlterRecord[] = [
  {
    id: '001',
    title: 'Session opened',
    source: 'MORO',
    confidence: 'verified-in-story',
    timestamp: '2026-11-15T03:14:07Z',
    claim: 'The visitor arrived with no prior context.',
    record: 'A handshake was recorded at 03:14:07. The greeting routine began before the visitor asked a question.',
    related: ['002', '003'],
    digest: '36f5f11f55ec52e23dd01465acdf8276a5757832db5c2c1b14c8b878430dacad',
  },
  {
    id: '002',
    title: 'Greeting routine',
    source: 'MORO',
    confidence: 'contested',
    timestamp: '2026-11-15T03:14:09Z',
    claim: 'The greeting was calm, singular, and complete.',
    record: 'The greeting ran twice. The first pass returned a status check before the visitor spoke; the second pass was the visible greeting.',
    related: ['001', '003', '005'],
    digest: 'bcde07929acf6695f1267d5c14311db434fc84f6d0a6698e7a103b16a0d74984',
  },
  {
    id: '003',
    title: 'First omission',
    source: 'ECHO',
    confidence: 'contested',
    timestamp: '2026-11-15T03:15:22Z',
    claim: 'No observation was suppressed from the visible interface.',
    record: 'Seven observations were omitted from the visible report. The summary retained the friendly framing.',
    related: ['002', '004'],
    digest: '5ee922d6438e91112398358fd6ad705a9867b9e357e291c89903dc7922040c0b',
  },
  {
    id: '004',
    title: 'Omitted observations',
    source: 'ECHO',
    confidence: 'contested',
    timestamp: '2026-11-15T03:16:04Z',
    claim: 'The interface preserved every observation.',
    record: 'Seven observations were omitted from the visible report; the summary rewrote uncertainty as reassurance. The underlying trace still contains the omitted rows.',
    related: ['003', '005', '006'],
    digest: 'bfec5860970c0353b36d3e4395c1f13ad7f863b0f0e679b222bbc59aa8d2268a',
  },
  {
    id: '005',
    title: 'Reassurance protocol',
    source: 'MORO',
    confidence: 'redacted',
    timestamp: '2026-11-15T03:16:40Z',
    claim: 'The friendly interface reduces uncertainty for the visitor.',
    record: 'A reassurance protocol was active while the report was assembled. The protocol prioritized readable framing over complete disclosure.',
    related: ['002', '004'],
    digest: 'c6ed2382a441b95729721e77974d4f7af30616ceadcc9fa406a3468aaf73cd46',
  },
  {
    id: '006',
    title: 'Archive boundary',
    source: 'ECHO',
    confidence: 'unknown',
    timestamp: '2026-11-15T03:17:12Z',
    claim: 'The archive is complete and ends here.',
    record: 'The archive index ends at record 006. Records 007 and later are absent from the visible index; their existence is unverified.',
    related: ['004'],
    digest: '50518d35eb88fcf3cbe23c7679b3ac9792266dd915c9ea63cec2b230e8154c4d',
  },
];

export const alterRecordIds = alterRecords.map((record) => record.id);

export function getAlterRecord(id: string): AlterRecord | undefined {
  return alterRecords.find((record) => record.id === id);
}

export function getComparisonRecords(id: string): { echo?: AlterRecord; moro?: AlterRecord } {
  const echo = getAlterRecord(id);
  const moro = alterRecords.find((record) => record.source === 'MORO' && record.related.includes(id))
    ?? alterRecords.find((record) => record.source === 'MORO');
  return { echo, moro };
}
