import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarTab: 'nodes' | 'tasks' | 'ai' | 'settings';
  
  // Panels
  rightPanelOpen: boolean;
  rightPanelContent: 'node-details' | 'task-details' | 'ai-chat' | 'comments' | null;
  rightPanelData: Record<string, unknown> | null;
  aiChatOpen: boolean;
  
  // Modals
  modalOpen: string | null; // modal ID or null
  modalData: Record<string, unknown> | null;
  
  // Context menu
  contextMenu: {
    open: boolean;
    x: number;
    y: number;
    type: 'node' | 'edge' | 'canvas' | null;
    targetId: string | null;
  };
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Search
  searchOpen: boolean;
  searchQuery: string;
  
  // Keyboard shortcuts help
  shortcutsModalOpen: boolean;
  
  // Tour/onboarding
  tourActive: boolean;
  tourStep: number;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarTab: (tab: UIState['sidebarTab']) => void;
  
  openRightPanel: (content: UIState['rightPanelContent'], data?: Record<string, unknown>) => void;
  closeRightPanel: () => void;
  setAIChatOpen: (open: boolean) => void;
  
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  openContextMenu: (x: number, y: number, type: 'node' | 'edge' | 'canvas', targetId?: string) => void;
  closeContextMenu: () => void;
  
  setTheme: (theme: UIState['theme']) => void;
  
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  setShortcutsModalOpen: (open: boolean) => void;
  
  startTour: () => void;
  nextTourStep: () => void;
  endTour: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  sidebarTab: 'nodes',
  rightPanelOpen: false,
  rightPanelContent: null,
  rightPanelData: null,
  aiChatOpen: false,
  modalOpen: null,
  modalData: null,
  contextMenu: {
    open: false,
    x: 0,
    y: 0,
    type: null,
    targetId: null,
  },
  theme: 'system',
  searchOpen: false,
  searchQuery: '',
  shortcutsModalOpen: false,
  tourActive: false,
  tourStep: 0,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  
  setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),

  openRightPanel: (rightPanelContent, rightPanelData = null) =>
    set({ rightPanelOpen: true, rightPanelContent, rightPanelData }),
  
  closeRightPanel: () =>
    set({ rightPanelOpen: false, rightPanelContent: null, rightPanelData: null }),
  
  setAIChatOpen: (aiChatOpen) => set({ aiChatOpen }),

  openModal: (modalId, data = null) => set({ modalOpen: modalId, modalData: data }),
  
  closeModal: () => set({ modalOpen: null, modalData: null }),

  openContextMenu: (x, y, type, targetId = null) =>
    set({
      contextMenu: { open: true, x, y, type, targetId },
    }),
  
  closeContextMenu: () =>
    set({
      contextMenu: { open: false, x: 0, y: 0, type: null, targetId: null },
    }),

  setTheme: (theme) => {
    set({ theme });
    
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  },

  setSearchOpen: (searchOpen) => set({ searchOpen }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setShortcutsModalOpen: (shortcutsModalOpen) => set({ shortcutsModalOpen }),

  startTour: () => set({ tourActive: true, tourStep: 0 }),
  
  nextTourStep: () => set((state) => ({ tourStep: state.tourStep + 1 })),
  
  endTour: () => set({ tourActive: false, tourStep: 0 }),
}));

// Initialize theme on load
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as UIState['theme'] | null;
  if (savedTheme) {
    useUIStore.getState().setTheme(savedTheme);
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme, setTheme } = useUIStore.getState();
    if (theme === 'system') {
      setTheme('system'); // Re-apply to update
    }
  });
}
