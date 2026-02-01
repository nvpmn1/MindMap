import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

export interface MapNode extends Node {
  data: {
    label: string;
    content?: string;
    type: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
    collapsed?: boolean;
    creator?: {
      id: string;
      display_name: string;
      avatar_url?: string;
      color: string;
    };
    tasks?: Array<{
      id: string;
      title: string;
      status: string;
    }>;
    commentsCount?: number;
  };
}

export interface MapEdge extends Edge {
  data?: {
    label?: string;
  };
}

interface MapMeta {
  id: string;
  title: string;
  description?: string;
  workspace_id: string;
  created_by: string;
  updated_at: string;
}

interface MapState {
  // Map data
  map: MapMeta | null;
  nodes: MapNode[];
  edges: MapEdge[];
  
  // Selection
  selectedNodes: string[];
  selectedEdges: string[];
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  viewMode: 'map' | 'list' | 'kanban';
  
  // Collaboration
  activeUsers: Array<{
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
  }>;
  
  // History for undo/redo
  history: Array<{ nodes: MapNode[]; edges: MapEdge[] }>;
  historyIndex: number;

  // Actions
  setMap: (map: MapMeta | null) => void;
  setNodes: (nodes: MapNode[]) => void;
  setEdges: (edges: MapEdge[]) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setViewMode: (mode: 'map' | 'list' | 'kanban') => void;
  
  // Node operations
  onNodesChange: (changes: NodeChange[]) => void;
  addNode: (node: MapNode) => void;
  updateNode: (nodeId: string, data: Partial<MapNode['data']>) => void;
  deleteNodes: (nodeIds: string[]) => void;
  toggleNodeCollapse: (nodeId: string) => void;
  
  // Edge operations
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  deleteEdges: (edgeIds: string[]) => void;
  
  // Selection
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Collaboration
  setActiveUsers: (users: MapState['activeUsers']) => void;
  updateUserCursor: (userId: string, cursor: { x: number; y: number }) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  map: null,
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,
  viewMode: 'map' as const,
  activeUsers: [],
  history: [],
  historyIndex: -1,
};

export const useMapStore = create<MapState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setMap: (map) => set({ map }),
    setNodes: (nodes) => set({ nodes, hasUnsavedChanges: false }),
    setEdges: (edges) => set({ edges, hasUnsavedChanges: false }),
    setLoading: (isLoading) => set({ isLoading }),
    setSaving: (isSaving) => set({ isSaving }),
    setViewMode: (viewMode) => set({ viewMode }),

    // Node operations
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes) as MapNode[],
        hasUnsavedChanges: true,
      });
    },

    addNode: (node) => {
      get().saveToHistory();
      set({
        nodes: [...get().nodes, node],
        hasUnsavedChanges: true,
      });
    },

    updateNode: (nodeId, data) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        ),
        hasUnsavedChanges: true,
      });
    },

    deleteNodes: (nodeIds) => {
      get().saveToHistory();
      const nodesToDelete = new Set(nodeIds);
      
      // Also delete child nodes
      const findDescendants = (parentId: string): string[] => {
        const children = get().nodes.filter(
          (n) => get().edges.some((e) => e.source === parentId && e.target === n.id)
        );
        return children.flatMap((c) => [c.id, ...findDescendants(c.id)]);
      };

      nodeIds.forEach((id) => {
        findDescendants(id).forEach((descendantId) => nodesToDelete.add(descendantId));
      });

      set({
        nodes: get().nodes.filter((n) => !nodesToDelete.has(n.id)),
        edges: get().edges.filter(
          (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)
        ),
        selectedNodes: [],
        hasUnsavedChanges: true,
      });
    },

    toggleNodeCollapse: (nodeId) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } }
            : node
        ),
      });
    },

    // Edge operations
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges) as MapEdge[],
        hasUnsavedChanges: true,
      });
    },

    onConnect: (connection) => {
      get().saveToHistory();
      set({
        edges: addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: false,
          },
          get().edges
        ) as MapEdge[],
        hasUnsavedChanges: true,
      });
    },

    deleteEdges: (edgeIds) => {
      get().saveToHistory();
      set({
        edges: get().edges.filter((e) => !edgeIds.includes(e.id)),
        selectedEdges: [],
        hasUnsavedChanges: true,
      });
    },

    // Selection
    setSelectedNodes: (selectedNodes) => set({ selectedNodes }),
    setSelectedEdges: (selectedEdges) => set({ selectedEdges }),
    clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),
    selectAll: () =>
      set({
        selectedNodes: get().nodes.map((n) => n.id),
        selectedEdges: get().edges.map((e) => e.id),
      }),

    // History
    saveToHistory: () => {
      const { nodes, edges, history, historyIndex } = get();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ nodes: [...nodes], edges: [...edges] });
      
      // Limit history to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const prevState = history[historyIndex - 1];
        set({
          nodes: prevState.nodes,
          edges: prevState.edges,
          historyIndex: historyIndex - 1,
          hasUnsavedChanges: true,
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        set({
          nodes: nextState.nodes,
          edges: nextState.edges,
          historyIndex: historyIndex + 1,
          hasUnsavedChanges: true,
        });
      }
    },

    // Collaboration
    setActiveUsers: (activeUsers) => set({ activeUsers }),
    
    updateUserCursor: (userId, cursor) => {
      set({
        activeUsers: get().activeUsers.map((user) =>
          user.id === userId ? { ...user, cursor } : user
        ),
      });
    },

    // Reset
    reset: () => set(initialState),
  }))
);

// Selectors
export const selectNodeById = (id: string) => (state: MapState) =>
  state.nodes.find((n) => n.id === id);

export const selectSelectedNodes = (state: MapState) =>
  state.nodes.filter((n) => state.selectedNodes.includes(n.id));

export const selectChildNodes = (parentId: string) => (state: MapState) =>
  state.nodes.filter((n) =>
    state.edges.some((e) => e.source === parentId && e.target === n.id)
  );

export const selectCanUndo = (state: MapState) => state.historyIndex > 0;
export const selectCanRedo = (state: MapState) =>
  state.historyIndex < state.history.length - 1;
