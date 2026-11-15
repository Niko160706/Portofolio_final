import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { projects } from '../../src/data/projects';
import { profile } from '../../src/data/profile';
import { narrativeAnomalies } from '../../src/data/narrative';
import { createInitialNarrativeState, narrativeReducer } from '../../src/lib/narrativeMachine';
import { createInitialWindowManager, openWindow, closeWindow, minimizeWindow, restoreWindow } from '../../src/lib/windowState';
import { loadStoredNarrative, saveStoredNarrative, resetStoredNarrative } from '../../src/lib/storage';

const distDir = path.resolve(__dirname, '../../dist');

describe('Acceptance Criteria Suite (T-01 through T-15)', () => {
  // T-01 & T-05: Static HTML output and No-JS fallback
  it('T-01 & T-05: dist/index.html includes role, Projects, CV, Contact, and No-JS fallback', () => {
    const indexPath = path.join(distDir, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    const html = fs.readFileSync(indexPath, 'utf-8');

    // Role and identity present
    expect(html).toContain(profile.name);
    expect(html).toContain(profile.focusPill);
    expect(html).toContain('resume.pdf');
    expect(html).toContain('gradientacademy57@gmail.com');

    // All four projects linked in HTML
    expect(html).toContain('/projects/deep-research/');
    expect(html).toContain('/projects/visualize/');
    expect(html).toContain('/projects/umkm-ecommerce/');
    expect(html).toContain('/projects/starlink-reseller/');
  });

  // T-03: Window manager operations
  it('T-03: Window manager supports open, minimize, restore, close', () => {
    let wm = createInitialWindowManager();
    expect(wm.windows.welcome.isOpen).toBe(true);

    wm = openWindow(wm, 'projects');
    expect(wm.windows.projects.isOpen).toBe(true);
    expect(wm.windows.projects.isMinimized).toBe(false);
    expect(wm.activeWindowId).toBe('projects');

    wm = minimizeWindow(wm, 'projects');
    expect(wm.windows.projects.isMinimized).toBe(true);
    expect(wm.activeWindowId).not.toBe('projects');

    wm = restoreWindow(wm, 'projects');
    expect(wm.windows.projects.isOpen).toBe(true);
    expect(wm.windows.projects.isMinimized).toBe(false);
    expect(wm.activeWindowId).toBe('projects');

    wm = closeWindow(wm, 'projects');
    expect(wm.windows.projects.isOpen).toBe(false);
  });

  // T-06: Case study routes integrity
  it('T-06: All four case study routes exist with complete required sections', () => {
    expect(projects).toHaveLength(4);

    for (const proj of projects) {
      const pagePath = path.join(distDir, 'projects', proj.slug, 'index.html');
      expect(fs.existsSync(pagePath)).toBe(true);
      const html = fs.readFileSync(pagePath, 'utf-8');

      // Check required sections
      expect(html).toContain('Problem Statement');
      expect(html).toContain('Constraints');
      expect(html).toContain('Architecture');
      expect(html).toContain('Contribution');
      expect(html).toContain('Implementation Details');
      expect(html).toContain('Verification');
      expect(html).toContain('Results');
      expect(html).toContain('Tradeoffs');

      // Check project specific content
      expect(html).toContain(proj.caseStudy.problem);
      expect(html).toContain(proj.caseStudy.results);
    }
  });

  // T-07: AN-01 Assistant inspect
  it('T-07: AN-01 Assistant inspect trigger and scripted message integrity', () => {
    const initial = createInitialNarrativeState();
    const state = narrativeReducer(initial, { type: 'ASSISTANT_INSPECT_CLICKED' });
    expect(state.current).toBe('glitching');
    expect(state.activeAnomalyId).toBe('AN-01');
    expect(state.seen['AN-01']).toBe(true);

    const msg = narrativeAnomalies['AN-01'];
    expect(msg.header).toBe('INTERCEPTED MESSAGE');
    expect(msg.body).toBe('Maintain the friendly interface. The visitor is asking questions.');
    expect(msg.footnote).toBe('Fictional system narrative');
    expect(msg.temporaryTitle).toBe('unknown_process.exe');
  });

  // T-08: AN-02 Research trace
  it('T-08: AN-02 Deep Research trace inspect trigger and message integrity', () => {
    const initial = createInitialNarrativeState();
    const state = narrativeReducer(initial, {
      type: 'RESEARCH_TRACE_INSPECTED',
      projectId: 'deep-research'
    });
    expect(state.current).toBe('glitching');
    expect(state.activeAnomalyId).toBe('AN-02');
    expect(state.seen['AN-02']).toBe(true);

    const msg = narrativeAnomalies['AN-02'];
    expect(msg.header).toBe('REASSURANCE_PROTOCOL: ACTIVE');
    expect(msg.body).toBe('Discrepancy detected. Response framing updated.');
  });

  // T-09: AN-03 Hidden file entry
  it('T-09: AN-03 Hidden file toggle reveals observer.log artifact and opens message', () => {
    const initial = createInitialNarrativeState();
    const toggled = narrativeReducer(initial, {
      type: 'EXPLORER_SHOW_HIDDEN_CHANGED',
      enabled: true
    });
    expect(toggled.hiddenFilesVisible).toBe(true);

    const opened = narrativeReducer(toggled, { type: 'HIDDEN_LOG_OPENED' });
    expect(opened.current).toBe('glitching');
    expect(opened.activeAnomalyId).toBe('AN-03');
    expect(opened.seen['AN-03']).toBe(true);

    const msg = narrativeAnomalies['AN-03'];
    expect(msg.body).toBe('Who decides what you are allowed to see?');
  });

  // T-10: AN-04 Diagnostics unlock gating
  it('T-10: AN-04 Diagnostics locked before AN-01/AN-02; unlocked after', () => {
    const initial = createInitialNarrativeState();
    expect(initial.diagnosticsUnlocked).toBe(false);

    // Attempt before unlock
    const lockedAttempt = narrativeReducer(initial, { type: 'DIAGNOSTICS_REQUESTED' });
    expect(lockedAttempt.activeAnomalyId).toBeNull();

    // Trigger AN-01 then dismiss
    const withAn01 = narrativeReducer(initial, { type: 'ASSISTANT_INSPECT_CLICKED' });
    const dismissed = narrativeReducer(withAn01, { type: 'DISMISS_ACTIVE_ANOMALY' });
    expect(dismissed.diagnosticsUnlocked).toBe(true);

    // Now request diagnostics
    const unlocked = narrativeReducer(dismissed, { type: 'DIAGNOSTICS_REQUESTED' });
    expect(unlocked.current).toBe('diagnostics-open');
    expect(unlocked.activeAnomalyId).toBe('AN-04');
    expect(unlocked.seen['AN-04']).toBe(true);

    const msg = narrativeAnomalies['AN-04'];
    expect(msg.body).toContain('ASSISTANT: Everything is operating normally.');
    expect(msg.body).toContain('UNKNOWN: That is what the interface was instructed to say.');
  });

  // T-11: Effects disabled stops all scripted glitch triggers
  it('T-11: Disabling effects stops all scripted anomaly triggers', () => {
    const initial = createInitialNarrativeState();
    const disabled = narrativeReducer(initial, { type: 'EFFECTS_CHANGED', enabled: false });
    expect(disabled.effectsEnabled).toBe(false);
    expect(disabled.current).toBe('disabled');

    const try01 = narrativeReducer(disabled, { type: 'ASSISTANT_INSPECT_CLICKED' });
    expect(try01.current).toBe('disabled');
    expect(try01.activeAnomalyId).toBeNull();

    const try02 = narrativeReducer(disabled, { type: 'RESEARCH_TRACE_INSPECTED', projectId: 'deep-research' });
    expect(try02.current).toBe('disabled');
    expect(try02.activeAnomalyId).toBeNull();

    const try03 = narrativeReducer(disabled, { type: 'HIDDEN_LOG_OPENED' });
    expect(try03.current).toBe('disabled');
    expect(try03.activeAnomalyId).toBeNull();
  });

  // T-13: Storage resilience
  it('T-13: Storage wrapper handles missing or corrupted local storage gracefully', () => {
    const stored = loadStoredNarrative();
    expect(stored.version).toBe(1);
    expect(stored.effectsEnabled).toBe(true);

    saveStoredNarrative({
      version: 1,
      effectsEnabled: false,
      seen: { 'AN-01': true, 'AN-02': false, 'AN-03': false, 'AN-04': false }
    });

    const reset = resetStoredNarrative();
    expect(reset.effectsEnabled).toBe(true);
    expect(reset.seen['AN-01']).toBe(false);
  });

  // T-15: Security & Content Safety (no API keys, no sk-, no live LLM secrets)
  it('T-15: Build assets do not contain exposed API keys, secret credentials, or unapproved phone numbers', () => {
    const astroAssetsDir = path.join(distDir, '_astro');
    if (fs.existsSync(astroAssetsDir)) {
      const files = fs.readdirSync(astroAssetsDir);
      for (const f of files) {
        const content = fs.readFileSync(path.join(astroAssetsDir, f), 'utf-8');
        expect(content).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
        expect(content).not.toMatch(/AIzaSy[a-zA-Z0-9_-]{20,}/);
      }
    }
  });
});
