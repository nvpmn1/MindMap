import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Language = 'pt-BR' | 'en-US' | 'es';

interface UIState {
  // Theme
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  
  // Language
  language: Language;
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  
  // Right Panel (Editor)
  rightPanelOpen: boolean;
  rightPanelTab: 'details' | 'ai' | 'settings';
  rightPanelWidth: number;
  
  // Modals
  modals: {
    createMap: boolean;
    editMap: boolean;
    deleteMap: boolean;
    settings: boolean;
    shortcuts: boolean;
    share: boolean;
  };
  
  // Notifications
  notifications: boolean;
  
  // Canvas Settings
  canvasSettings: {
    snapToGrid: boolean;
    gridSize: number;
    showMinimap: boolean;
    showControls: boolean;
    animateEdges: boolean;
  };
  
  // Actions - Theme
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
  
  // Actions - Language
  setLanguage: (language: Language) => void;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  
  // Actions - Right Panel
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: 'details' | 'ai' | 'settings') => void;
  setRightPanelWidth: (width: number) => void;
  
  // Actions - Modals
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Actions - Canvas Settings
  updateCanvasSettings: (settings: Partial<UIState['canvasSettings']>) => void;
  resetCanvasSettings: () => void;
}

const defaultCanvasSettings = {
  snapToGrid: true,
  gridSize: 20,
  showMinimap: true,
  showControls: true,
  animateEdges: false,
};

const defaultModals = {
  createMap: false,
  editMap: false,
  deleteMap: false,
  settings: false,
  shortcuts: false,
  share: false,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial State
        theme: 'system',
        resolvedTheme: 'light',
        language: 'pt-BR',
        sidebarOpen: true,
        sidebarWidth: 280,
        rightPanelOpen: false,
        rightPanelTab: 'details',
        rightPanelWidth: 360,
        modals: defaultModals,
        notifications: true,
        canvasSettings: defaultCanvasSettings,

        // Theme Actions
        setTheme: (theme) => {
          set({ theme });
          
          // Calculate resolved theme
          let resolved: 'light' | 'dark';
          if (theme === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
          } else {
            resolved = theme;
          }
          
          set({ resolvedTheme: resolved });
          
          // Apply to document
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
        },
        
        setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),

        // Language Actions
        setLanguage: (language) => set({ language }),

        // Sidebar Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

        // Right Panel Actions
        toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
        setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
        setRightPanelTab: (rightPanelTab) => set({ rightPanelTab, rightPanelOpen: true }),
        setRightPanelWidth: (rightPanelWidth) => set({ rightPanelWidth }),

        // Modal Actions
        openModal: (modal) => set((state) => ({
          modals: { ...state.modals, [modal]: true },
        })),
        
        closeModal: (modal) => set((state) => ({
          modals: { ...state.modals, [modal]: false },
        })),
        
        closeAllModals: () => set({ modals: defaultModals }),

        // Canvas Settings Actions
        updateCanvasSettings: (settings) => set((state) => ({
          canvasSettings: { ...state.canvasSettings, ...settings },
        })),
        
        resetCanvasSettings: () => set({ canvasSettings: defaultCanvasSettings }),
      }),
      {
        name: 'mindmap-ui',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          sidebarWidth: state.sidebarWidth,
          rightPanelWidth: state.rightPanelWidth,
          canvasSettings: state.canvasSettings,
          notifications: state.notifications,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const { theme, setResolvedTheme } = useUIStore.getState();
    
    if (theme === 'system') {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    }
  });
}
