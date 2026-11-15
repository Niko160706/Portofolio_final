import React, { useState } from 'react';
import { projects } from '../../data/projects';

interface LabSectionProps {
  hiddenFilesVisible: boolean;
  onToggleHiddenFiles: (enabled: boolean) => void;
  onOpenHiddenLog: () => void;
  diagnosticsUnlocked: boolean;
  onRunDiagnostics: () => void;
}

const statusTone = (status: string) => {
  if (status === 'Completed') return 'status-dot--green';
  if (status === 'In development') return 'status-dot--accent';
  return 'status-dot--gray';
};

export const LabSection: React.FC<LabSectionProps> = ({
  hiddenFilesVisible,
  onToggleHiddenFiles,
  onOpenHiddenLog,
  diagnosticsUnlocked,
  onRunDiagnostics
}) => {
  const [hint, setHint] = useState('');

  const handleDiagnostics = () => {
    if (!diagnosticsUnlocked) {
      setHint('No diagnostic entries. Inspect the assistant or trace first.');
      return;
    }
    setHint('');
    onRunDiagnostics();
  };

  return (
    <section id="lab" className="section section--lab">
      <div className="container">
        <header className="section-head">
          <div className="section-head-main">
            <span className="mono-label section-index">03 / Research &amp; lab</span>
            <h2 className="section-title">Research / Lab</h2>
          </div>
          <p className="section-intro">
            A working index of repositories, experiments, and technical notes. Real records only.
          </p>
        </header>

        <div className="lab-grid">
          <div className="lab-index">
            <div className="lab-index-head">
              <span className="bitmap-label">Project index</span>
              <span className="mono-label">Local data / {String(projects.length).padStart(2, '0')} records</span>
            </div>
            <table className="lab-table">
              <caption>Project records, newest update first.</caption>
              <thead>
                <tr>
                  <th scope="col">Record</th>
                  <th scope="col">Type</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Case study</span></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <th scope="row">
                      <a href={`/projects/${project.slug}/`}>{project.shortTitle}</a>
                    </th>
                    <td data-label="Type">{project.category}</td>
                    <td data-label="Updated">{project.updatedAt}</td>
                    <td data-label="Status">
                      <span className="lab-status">
                        <span className={`status-dot ${statusTone(project.status)}`} aria-hidden="true" />
                        {project.status}
                      </span>
                    </td>
                    <td className="lab-row-link"><a href={`/projects/${project.slug}/`} aria-label={`Open ${project.shortTitle} case study`}>↗</a></td>
                  </tr>
                ))}
                {hiddenFilesVisible && (
                  <tr className="hidden-row">
                    <th scope="row"><span className="anomaly-filename">observer.log</span></th>
                    <td data-label="Type">Hidden record</td>
                    <td data-label="Updated">unknown</td>
                    <td data-label="Status"><span className="artifact-badge">Fictional artifact</span></td>
                    <td><button type="button" className="retro-action" onClick={onOpenHiddenLog}>Inspect</button></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <aside className="retro-box lab-utility" aria-label="Lab utilities">
            <div className="fragment-head">
              <span className="bitmap-label">Lab utilities</span>
              <span className="mono-label">Local</span>
            </div>

            <dl className="fragment-rows">
              <div><dt>Records</dt><dd>{String(projects.length).padStart(2, '0')}</dd></div>
              <div><dt>Source</dt><dd>local project data</dd></div>
              <div><dt>Telemetry</dt><dd>off</dd></div>
            </dl>

            <div className="fragment-rule" aria-hidden="true" />

            <label className="retro-check">
              <input
                type="checkbox"
                checked={hiddenFilesVisible}
                onChange={(event) => onToggleHiddenFiles(event.target.checked)}
              />
              <span>Show hidden files</span>
            </label>

            <div className="diagnostics-row">
              <button type="button" id="run-diagnostics" className="retro-action" onClick={handleDiagnostics}>
                Run diagnostics
              </button>
              <span className="mono-label">{diagnosticsUnlocked ? 'available' : 'locked'}</span>
            </div>

            {hint && <p className="diagnostics-hint" role="status">{hint}</p>}

            <p className="retro-note">
              No telemetry. These utilities are part of the fictional interface layer.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
};
