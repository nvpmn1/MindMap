import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User store - manages current user and all users
export const useUserStore = create(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      onlineUsers: {},

      setCurrentUser: (user) => set({ currentUser: user }),
      
      setUsers: (users) => set({ users }),
      
      setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
      
      updateOnlineUser: (userId, data) => set((state) => ({
        onlineUsers: {
          ...state.onlineUsers,
          [userId]: data
        }
      })),
      
      removeOnlineUser: (userId) => set((state) => {
        const { [userId]: _, ...rest } = state.onlineUsers;
        return { onlineUsers: rest };
      }),

      getUserById: (id) => get().users.find(u => u.id === id),
      
      getUserColor: (userId) => {
        const colors = {
          default: '#64748b',
        };
        const user = get().users.find(u => u.id === userId);
        if (user) {
          const name = user.name.toLowerCase();
          if (name.includes('guilherme')) return '#8b5cf6';
          if (name.includes('helen')) return '#ec4899';
          if (name.includes('pablo')) return '#06b6d4';
        }
        return colors.default;
      }
    }),
    {
      name: 'mindmap-user-storage',
      partialize: (state) => ({ currentUser: state.currentUser })
    }
  )
);

// Mindmap store - manages mindmaps and nodes
export const useMindmapStore = create((set, get) => ({
  mindmaps: [],
  currentMindmap: null,
  nodes: [],
  links: [],
  selectedNodeId: null,
  editingNodeId: null,

  setMindmaps: (mindmaps) => set({ mindmaps }),
  
  setCurrentMindmap: (mindmap) => set({ 
    currentMindmap: mindmap,
    nodes: mindmap?.nodes || [],
    links: mindmap?.links || []
  }),
  
  setNodes: (nodes) => set({ nodes }),
  
  setLinks: (links) => set({ links }),
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  
  updateNode: (nodeId, updates) => set((state) => ({
    nodes: state.nodes.map(n => 
      n.id === nodeId ? { ...n, ...updates } : n
    )
  })),
  
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== nodeId),
    links: state.links.filter(l => 
      l.source_node_id !== nodeId && l.target_node_id !== nodeId
    )
  })),
  
  addLink: (link) => set((state) => ({
    links: [...state.links, link]
  })),
  
  removeLink: (linkId) => set((state) => ({
    links: state.links.filter(l => l.id !== linkId)
  })),
  
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  
  setEditingNodeId: (nodeId) => set({ editingNodeId: nodeId }),

  // Computed getters
  getRootNodes: () => get().nodes.filter(n => !n.parent_id),
  
  getChildNodes: (parentId) => get().nodes.filter(n => n.parent_id === parentId),
  
  getNodeById: (nodeId) => get().nodes.find(n => n.id === nodeId),
  
  getTaskNodes: () => get().nodes.filter(n => n.status),
  
  getNodesByStatus: (status) => get().nodes.filter(n => n.status === status),
  
  getNodesByAssignee: (userId) => get().nodes.filter(n => n.assigned_to === userId),

  // Build tree structure from flat nodes
  buildTree: () => {
    const nodes = get().nodes;
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));
    const tree = [];

    nodes.forEach(node => {
      const mappedNode = nodeMap.get(node.id);
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(mappedNode);
      } else {
        tree.push(mappedNode);
      }
    });

    // Sort by order_index
    const sortChildren = (nodes) => {
      nodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      nodes.forEach(n => sortChildren(n.children));
    };
    sortChildren(tree);

    return tree;
  }
}));

// View store - manages UI state
export const useViewStore = create(
  persist(
    (set, get) => ({
      currentView: 'mindmap', // 'mindmap' | 'list' | 'kanban'
      sidebarOpen: true,
      chatOpen: false,
      detailsPanelOpen: false,
      detailsPanelNodeId: null,
      theme: 'light', // 'light' | 'dark'
      zoom: 1,
      panPosition: { x: 0, y: 0 },

      setCurrentView: (view) => set({ currentView: view }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
      
      setChatOpen: (open) => set({ chatOpen: open }),
      
      openDetailsPanel: (nodeId) => set({ 
        detailsPanelOpen: true, 
        detailsPanelNodeId: nodeId 
      }),
      
      closeDetailsPanel: () => set({ 
        detailsPanelOpen: false, 
        detailsPanelNodeId: null 
      }),
      
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },
      
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(2, zoom)) }),
      
      setPanPosition: (position) => set({ panPosition: position }),

      resetView: () => set({ zoom: 1, panPosition: { x: 0, y: 0 } })
    }),
    {
      name: 'mindmap-view-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);

// Chat store - manages AI chat state
export const useChatStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...message
    }]
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearMessages: () => set({ messages: [] }),
  
  clearError: () => set({ error: null })
}));

// Notification store - manages notifications/toasts
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  pendingTasks: [],

  addNotification: (notification) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, ...notification }]
    }));

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  setPendingTasks: (tasks) => set({ pendingTasks: tasks }),

  clearAll: () => set({ notifications: [] })
}));

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('mindmap-view-storage');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }
}
