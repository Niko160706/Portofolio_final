import React from 'react';
import { profile } from '../../data/profile';

interface SiteFooterProps {
  effectsEnabled: boolean;
  onToggleEffects: () => void;
  onOpenSettings: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  effectsEnabled,
  onToggleEffects,
  onOpenSettings
}) => (
  <footer className="site-footer">
    <div className="container site-footer-inner">
      <p className="footer-copy">© 2026 {profile.name}. Built with Astro.</p>

      <div className="footer-links">
        <span className="mono-label footer-note">Local / no tracking</span>
        <button type="button" className="text-button" onClick={onOpenSettings}>
          About this fictional experience
        </button>
        <button
          type="button"
          id="effects-toggle-button"
          className="text-button"
          onClick={onToggleEffects}
          aria-pressed={effectsEnabled}
        >
          Effects: {effectsEnabled ? 'On' : 'Off'}
        </button>
        <button type="button" id="preferences-button" className="text-button" onClick={onOpenSettings}>
          Preferences
        </button>
      </div>
    </div>
  </footer>
);
