import React from 'react';

interface AlterAfterimageProps {
  onReplay: () => void;
}

export function AlterAfterimage({ onReplay }: AlterAfterimageProps) {
  return (
    <aside className="alter-afterimage" aria-label="Archive afterimage" data-alter-afterimage="true">
      <span>ARCHIVE RESIDUE / SESSION 03</span>
      <p>The record remains open. Interactive fiction.</p>
      <button type="button" onClick={onReplay}>
        Replay story
      </button>
    </aside>
  );
}
