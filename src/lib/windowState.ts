export type WindowId =
  | 'welcome'
  | 'projects'
  | 'assistant'
  | 'case-study'
  | 'about'
  | 'contact'
  | 'settings'
  | 'diagnostics';

export interface WindowMeta {
  id: WindowId;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position?: { x: number; y: number };
}

export interface WindowManagerState {
  windows: Record<WindowId, WindowMeta>;
  activeWindowId: WindowId | null;
  highestZIndex: number;
}

export const initialWindows: Record<WindowId, WindowMeta> = {
  welcome: {
    id: 'welcome',
    title: 'portfolio.exe',
    icon: 'user',
    isOpen: true,
    isMinimized: false,
    zIndex: 10
  },
  projects: {
    id: 'projects',
    title: 'projects.exe',
    icon: 'folder',
    isOpen: false,
    isMinimized: false,
    zIndex: 5
  },
  assistant: {
    id: 'assistant',
    title: 'assistant.exe',
    icon: 'help',
    isOpen: true,
    isMinimized: false,
    zIndex: 12
  },
  'case-study': {
    id: 'case-study',
    title: 'case_study.exe',
    icon: 'document',
    isOpen: false,
    isMinimized: false,
    zIndex: 5
  },
  about: {
    id: 'about',
    title: 'about_developer.exe',
    icon: 'info',
    isOpen: false,
    isMinimized: false,
    zIndex: 5
  },
  contact: {
    id: 'contact',
    title: 'contact_channels.exe',
    icon: 'mail',
    isOpen: false,
    isMinimized: false,
    zIndex: 5
  },
  settings: {
    id: 'settings',
    title: 'system_settings.exe',
    icon: 'gear',
    isOpen: false,
    isMinimized: false,
    zIndex: 5
  },
  diagnostics: {
    id: 'diagnostics',
    title: 'system_diagnostics.exe',
    icon: 'terminal',
    isOpen: false,
    isMinimized: false,
    zIndex: 5
  }
};

export function createInitialWindowManager(): WindowManagerState {
  return {
    windows: { ...initialWindows },
    activeWindowId: 'welcome',
    highestZIndex: 12
  };
}

export function openWindow(state: WindowManagerState, id: WindowId): WindowManagerState {
  const current = state.windows[id];
  const newZ = state.highestZIndex + 1;

  // Enforce max 3 open overlays (excluding background welcome & assistant)
  const openOverlays = Object.values(state.windows).filter(
    (w) => w.isOpen && !w.isMinimized && w.id !== 'welcome' && w.id !== 'assistant' && w.id !== id
  );

  let updatedWindows = { ...state.windows };

  if (openOverlays.length >= 3) {
    // Minimize the oldest open overlay to avoid clutter and viewport overlap
    const oldest = openOverlays.sort((a, b) => a.zIndex - b.zIndex)[0];
    if (oldest) {
      updatedWindows[oldest.id] = { ...oldest, isMinimized: true };
    }
  }

  updatedWindows[id] = {
    ...current,
    isOpen: true,
    isMinimized: false,
    zIndex: newZ
  };

  return {
    windows: updatedWindows,
    activeWindowId: id,
    highestZIndex: newZ
  };
}

export function closeWindow(state: WindowManagerState, id: WindowId): WindowManagerState {
  const current = state.windows[id];
  const updatedWindows = {
    ...state.windows,
    [id]: {
      ...current,
      isOpen: false,
      isMinimized: false
    }
  };

  let nextActive: WindowId | null = null;
  if (state.activeWindowId === id) {
    const remainingOpen = Object.values(updatedWindows)
      .filter((w) => w.isOpen && !w.isMinimized && w.id !== id)
      .sort((a, b) => b.zIndex - a.zIndex);
    nextActive = remainingOpen.length > 0 ? remainingOpen[0].id : null;
  } else {
    nextActive = state.activeWindowId;
  }

  return {
    ...state,
    windows: updatedWindows,
    activeWindowId: nextActive
  };
}

export function minimizeWindow(state: WindowManagerState, id: WindowId): WindowManagerState {
  const current = state.windows[id];
  const updatedWindows = {
    ...state.windows,
    [id]: {
      ...current,
      isMinimized: true
    }
  };

  let nextActive: WindowId | null = null;
  if (state.activeWindowId === id) {
    const remaining = Object.values(updatedWindows)
      .filter((w) => w.isOpen && !w.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex);
    nextActive = remaining.length > 0 ? remaining[0].id : null;
  } else {
    nextActive = state.activeWindowId;
  }

  return {
    ...state,
    windows: updatedWindows,
    activeWindowId: nextActive
  };
}

export function restoreWindow(state: WindowManagerState, id: WindowId): WindowManagerState {
  return openWindow(state, id);
}

export function focusWindow(state: WindowManagerState, id: WindowId): WindowManagerState {
  if (state.activeWindowId === id && state.windows[id].isOpen && !state.windows[id].isMinimized) {
    return state;
  }
  const current = state.windows[id];
  const newZ = state.highestZIndex + 1;

  return {
    windows: {
      ...state.windows,
      [id]: {
        ...current,
        isOpen: true,
        isMinimized: false,
        zIndex: newZ
      }
    },
    activeWindowId: id,
    highestZIndex: newZ
  };
}
