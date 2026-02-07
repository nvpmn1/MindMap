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
  
  // Theme (always dark)
  theme: 'dark';
  
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
  
  openRightPanel: (content: UIState['rightPanelContent'], data?: Record<string, unknown> | null) => void;
  closeRightPanel: () => void;
  setAIChatOpen: (open: boolean) => void;
  
  openModal: (modalId: string, data?: Record<string, unknown> | null) => void;
  closeModal: () => void;
  
  openContextMenu: (x: number, y: number, type: 'node' | 'edge' | 'canvas', targetId?: string | null) => void;
  closeContextMenu: () => void;
  
  setTheme: (_theme: 'dark') => void;
  
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
  theme: 'dark',
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

  setTheme: () => {
    // Always dark mode
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
  },

  setSearchOpen: (searchOpen) => set({ searchOpen }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setShortcutsModalOpen: (shortcutsModalOpen) => set({ shortcutsModalOpen }),

  startTour: () => set({ tourActive: true, tourStep: 0 }),
  
  nextTourStep: () => set((state) => ({ tourStep: state.tourStep + 1 })),
  
  endTour: () => set({ tourActive: false, tourStep: 0 }),
}));

// Initialize dark theme on load
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}
