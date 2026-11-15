import { describe, it, expect } from 'vitest';
import {
  createInitialWindowManager,
  openWindow,
  closeWindow,
  minimizeWindow,
  restoreWindow,
  focusWindow
} from '../../src/lib/windowState';

describe('windowState manager', () => {
  it('initializes with welcome and assistant windows open', () => {
    const wm = createInitialWindowManager();
    expect(wm.windows.welcome.isOpen).toBe(true);
    expect(wm.windows.welcome.isMinimized).toBe(false);
    expect(wm.windows.assistant.isOpen).toBe(true);
    expect(wm.windows.projects.isOpen).toBe(false);
    expect(wm.activeWindowId).toBe('welcome');
  });

  it('opens and focuses a window with incremented zIndex', () => {
    const wm = createInitialWindowManager();
    const next = openWindow(wm, 'projects');
    expect(next.windows.projects.isOpen).toBe(true);
    expect(next.windows.projects.isMinimized).toBe(false);
    expect(next.activeWindowId).toBe('projects');
    expect(next.windows.projects.zIndex).toBeGreaterThan(wm.windows.welcome.zIndex);
  });

  it('minimizes a window and transfers focus to highest remaining open window', () => {
    const wm = createInitialWindowManager();
    const withProjects = openWindow(wm, 'projects');
    const minimized = minimizeWindow(withProjects, 'projects');

    expect(minimized.windows.projects.isMinimized).toBe(true);
    expect(minimized.activeWindowId).not.toBe('projects');
  });

  it('restores a minimized window correctly', () => {
    const wm = createInitialWindowManager();
    const withProjects = openWindow(wm, 'projects');
    const minimized = minimizeWindow(withProjects, 'projects');
    const restored = restoreWindow(minimized, 'projects');

    expect(restored.windows.projects.isOpen).toBe(true);
    expect(restored.windows.projects.isMinimized).toBe(false);
    expect(restored.activeWindowId).toBe('projects');
  });

  it('closes a window and cleans up activeWindowId', () => {
    const wm = createInitialWindowManager();
    const withProjects = openWindow(wm, 'projects');
    const closed = closeWindow(withProjects, 'projects');

    expect(closed.windows.projects.isOpen).toBe(false);
    expect(closed.activeWindowId).not.toBe('projects');
  });

  it('focuses an existing window and updates zIndex', () => {
    const wm = createInitialWindowManager();
    const withProjects = openWindow(wm, 'projects');
    const focusedWelcome = focusWindow(withProjects, 'welcome');

    expect(focusedWelcome.activeWindowId).toBe('welcome');
    expect(focusedWelcome.windows.welcome.zIndex).toBeGreaterThan(focusedWelcome.windows.projects.zIndex);
  });
});
