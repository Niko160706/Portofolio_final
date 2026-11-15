import React, { useState } from 'react';

interface SettingsPanelProps {
  effectsEnabled: boolean;
  onToggleEffects: (enabled: boolean) => void;
  onResetNarrative: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  effectsEnabled,
  onToggleEffects,
  onResetNarrative
}) => {
  const [resetNotice, setResetNotice] = useState('');

  return (
    <div className="settings-panel">
      <section className="settings-section">
        <h3 className="settings-title">Visual &amp; narrative effects</h3>
        <p className="settings-copy">
          Controls optional scripted micro-glitches and the four embedded narrative fragments.
        </p>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={effectsEnabled}
            onChange={(event) => onToggleEffects(event.target.checked)}
          />
          <span>Enable optional effects</span>
        </label>
        <p className="settings-note">
          When off, scripted effects and anomaly notes stop immediately. Portfolio content stays fully accessible.
        </p>
      </section>

      <section className="settings-section">
        <h3 className="settings-title">Narrative progress</h3>
        <p className="settings-copy">Reset local discovery flags for the hidden system notes.</p>
        <button
          type="button"
          className="btn btn--outline btn--small"
          onClick={() => {
            onResetNarrative();
            setResetNotice('Local narrative flags reset.');
          }}
        >
          Reset narrative
        </button>
        {resetNotice && <p className="settings-reset" role="status">{resetNotice}</p>}
      </section>

      <section className="settings-section">
        <h3 className="settings-title">About this fictional experience</h3>
        <p className="settings-note">
          The Human Protocol is a portfolio with a small fictional interface layer. The retro fragments
          are visual references, not a real operating system. The anomaly copy is scripted, deterministic,
          and stored only in local storage. No telemetry is collected.
        </p>
      </section>
    </div>
  );
};
