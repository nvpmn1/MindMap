import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges, addEdge, type Node, type Edge, type NodeChange, type EdgeChange, type Connection } from '@xyflow/react';
import { api } from '@/lib/api';
import type { MindMapNode, NodeType, CreateNodeInput, UpdateNodeInput } from '@/types';

interface NodeState {
  // React Flow State
  nodes: Node[];
  edges: Edge[];
  
  // Selected
  selectedNodeIds: string[];
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // History (Undo/Redo)
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;
  
  // Actions - React Flow
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Actions - Nodes
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNodeLocal: (id: string, data: Partial<MindMapNode>) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  
  // Actions - Edges
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
  
  // Actions - Selection
  selectNode: (id: string) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  clearNodeSelection: () => void;
  setFocusedNode: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  
  // Actions - History
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  fetchNodes: (mapId: string) => Promise<void>;
  createNode: (mapId: string, data: CreateNodeInput) => Promise<MindMapNode>;
  updateNode: (id: string, data: UpdateNodeInput) => Promise<MindMapNode>;
  deleteNode: (id: string) => Promise<void>;
  
  // Computed
  getNodeById: (id: string) => Node | undefined;
  getChildNodes: (parentId: string) => Node[];
  getRootNodes: () => Node[];
}

const MAX_HISTORY_SIZE = 50;

export const useNodeStore = create<NodeState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedNodeId: null,
      focusedNodeId: null,
      isLoading: false,
      isSaving: false,
      error: null,
      history: [],
      historyIndex: -1,

      // React Flow Actions
      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
        }));
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        }));
      },

      onConnect: (connection) => {
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
              type: 'smoothstep',
              animated: false,
              style: { stroke: 'var(--border)', strokeWidth: 2 },
            },
            state.edges
          ),
        }));
        get().saveToHistory();
      },

      // Node Actions
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      addNode: (node) => {
        set((state) => ({ nodes: [...state.nodes, node] }));
        get().saveToHistory();
      },

      updateNodeLocal: (id, data) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, ...data } }
              : n
          ),
        }));
      },

      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter(
            (e) => e.source !== id && e.target !== id
          ),
          selectedNodeIds: state.selectedNodeIds.filter((i) => i !== id),
          focusedNodeId: state.focusedNodeId === id ? null : state.focusedNodeId,
        }));
        get().saveToHistory();
      },

      duplicateNode: (id) => {
        const node = get().nodes.find((n) => n.id === id);
        if (!node) return;

        const newId = `node-${Date.now()}`;
        const newNode: Node = {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          data: {
            ...node.data,
            label: `${node.data.label} (cópia)`,
          },
          selected: false,
        };

        get().addNode(newNode);
      },

      // Edge Actions
      addEdge: (edge) => {
        set((state) => ({ edges: [...state.edges, edge] }));
        get().saveToHistory();
      },

      removeEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
        }));
        get().saveToHistory();
      },

      // Selection Actions
      selectNode: (id) => {
        set((state) => ({
          selectedNodeIds: state.selectedNodeIds.includes(id)
            ? state.selectedNodeIds
            : [...state.selectedNodeIds, id],
          selectedNodeId: id,
        }));
      },

      deselectNode: (id) => {
        set((state) => ({
          selectedNodeIds: state.selectedNodeIds.filter((i) => i !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
      },

      toggleNodeSelection: (id) => {
        set((state) => ({
          selectedNodeIds: state.selectedNodeIds.includes(id)
            ? state.selectedNodeIds.filter((i) => i !== id)
            : [...state.selectedNodeIds, id],
        }));
      },

      clearNodeSelection: () => set({ selectedNodeIds: [], selectedNodeId: null }),
      
      setFocusedNode: (focusedNodeId) => set({ focusedNodeId }),
      
      setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),

      // History Actions
      saveToHistory: () => {
        const { nodes, edges, history, historyIndex } = get();
        
        // Remove future history if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1);
        
        // Add current state
        newHistory.push({
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        });
        
        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;

        const prevState = history[historyIndex - 1];
        set({
          nodes: prevState.nodes,
          edges: prevState.edges,
          historyIndex: historyIndex - 1,
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const nextState = history[historyIndex + 1];
        set({
          nodes: nextState.nodes,
          edges: nextState.edges,
          historyIndex: historyIndex + 1,
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setError: (error) => set({ error }),

      // API Actions
      fetchNodes: async (mapId: string) => {
        try {
          set({ isLoading: true, error: null });
          const nodesData = await api.get<MindMapNode[]>(`/maps/${mapId}/nodes`);
          // Convert MindMapNode[] to Node[]
          const nodes = nodesData.map((node) => ({
            id: node.id,
            type: node.node_type,
            position: { x: node.position_x, y: node.position_y },
            data: node as unknown as Record<string, unknown>,
          })) as Node[];
          // Create edges from parent relationships
          const edges: Edge[] = nodesData
            .filter((node) => node.parent_id)
            .map((node) => ({
              id: `${node.parent_id}-${node.id}`,
              source: node.parent_id!,
              target: node.id,
              type: 'smoothstep',
            }));
          set({ nodes, edges, isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch nodes', isLoading: false });
        }
      },

      createNode: async (mapId: string, data: CreateNodeInput) => {
        try {
          set({ isSaving: true, error: null });
          const newNode = await api.post<MindMapNode>(`/maps/${mapId}/nodes`, data);
          const node = {
            id: newNode.id,
            type: newNode.node_type,
            position: { x: newNode.position_x, y: newNode.position_y },
            data: newNode as unknown as Record<string, unknown>,
          } as Node;
          get().addNode(node);
          
          // Add edge if has parent
          if (newNode.parent_id) {
            get().addEdge({
              id: `${newNode.parent_id}-${newNode.id}`,
              source: newNode.parent_id,
              target: newNode.id,
              type: 'smoothstep',
            });
          }
          
          set({ isSaving: false });
          return newNode;
        } catch (error: any) {
          set({ error: error.message || 'Failed to create node', isSaving: false });
          throw error;
        }
      },

      updateNode: async (id: string, data: UpdateNodeInput) => {
        try {
          set({ isSaving: true, error: null });
          const updatedNode = await api.patch<MindMapNode>(`/nodes/${id}`, data);
          get().updateNodeLocal(id, updatedNode);
          set({ isSaving: false });
          return updatedNode;
        } catch (error: any) {
          set({ error: error.message || 'Failed to update node', isSaving: false });
          throw error;
        }
      },

      deleteNode: async (id: string) => {
        try {
          set({ isSaving: true, error: null });
          await api.delete(`/nodes/${id}`);
          get().removeNode(id);
          set({ isSaving: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete node', isSaving: false });
          throw error;
        }
      },

      // Computed
      getNodeById: (id) => get().nodes.find((n) => n.id === id),
      
      getChildNodes: (parentId) => {
        const { nodes, edges } = get();
        const childIds = edges
          .filter((e) => e.source === parentId)
          .map((e) => e.target);
        return nodes.filter((n) => childIds.includes(n.id));
      },

      getRootNodes: () => {
        const { nodes, edges } = get();
        const targetIds = new Set(edges.map((e) => e.target));
        return nodes.filter((n) => !targetIds.has(n.id));
      },
    })),
    { name: 'NodeStore' }
  )
);

// Helper function to create a new node
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
  data: Partial<MindMapNode> = {}
): Node {
  const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const defaultData: Partial<MindMapNode> = {
    id,
    map_id: '',
    parent_id: null,
    node_type: type,
    content: type === 'idea' ? 'Nova Ideia' : type === 'task' ? 'Nova Tarefa' : 'Nova Nota',
    color: type === 'idea' ? '#3b82f6' : type === 'task' ? '#22c55e' : '#f59e0b',
    emoji: type === 'idea' ? '💡' : type === 'task' ? '✅' : '📝',
    position_x: position.x,
    position_y: position.y,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    id,
    type: `${type}Node`,
    position,
    data: { ...defaultData, ...data } as unknown as Record<string, unknown>,
  } as Node;
}
