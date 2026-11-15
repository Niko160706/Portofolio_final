import type { VectorDemoEvent } from '../../components/v3/VectorDemo';
import type { AlterEvent } from './alterTypes';

export function researchInspectEvent(evidenceId = 'trace-04'): AlterEvent {
  return { type: 'research.trace.inspect', evidenceId };
}

export function researchCompletedEvent(command: string, success: boolean): AlterEvent {
  return { type: 'research.command.completed', command, success };
}

export function visualizeCommittedEvent(
  event: Pick<VectorDemoEvent, 'type' | 'preset' | 'determinant'>
): AlterEvent {
  const transformId = event.type === 'reset' ? 'identity' : event.preset;
  return {
    type: 'visualize.transform.committed',
    transformId,
    determinant: event.determinant
  };
}

export function moroActionEvent(actionId: string): AlterEvent {
  return { type: 'moro.dialogue.action', actionId };
}

export function archiveNoteEvent(noteId: string): AlterEvent {
  return { type: 'archive.note.inspected', noteId };
}
