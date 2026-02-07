/**
 * Real-time Collaboration Store
 * Manages presence, cursors, and collaborative editing state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Collaborator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNodeId?: string;
  lastActive: Date;
  isOnline: boolean;
  isTyping?: boolean;
}

export interface NodeEdit {
  nodeId: string;
  userId: string;
  userName: string;
  userColor: string;
  timestamp: Date;
  field: 'label' | 'description' | 'type' | 'position' | 'data';
  oldValue?: any;
  newValue?: any;
}

export interface CollaborationState {
  // Current user
  currentUserId: string | null;
  currentUser: Collaborator | null;
  
  // Collaborators
  collaborators: Map<string, Collaborator>;
  
  // Edit history
  editHistory: NodeEdit[];
  
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // UI State
  showCursors: boolean;
  showPresence: boolean;
  
  // Actions
  setCurrentUser: (user: Collaborator) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => void;
  updateCursor: (userId: string, cursor: { x: number; y: number }) => void;
  updateSelection: (userId: string, nodeId: string | null) => void;
  addNodeEdit: (edit: NodeEdit) => void;
  clearEditHistory: () => void;
  setConnected: (isConnected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  toggleCursors: () => void;
  togglePresence: () => void;
  getCollaboratorForNode: (nodeId: string) => Collaborator | undefined;
  getRecentEditsForNode: (nodeId: string, limit?: number) => NodeEdit[];
}

// Color palette for collaborators
const COLLABORATOR_COLORS = [
  '#00FFC8', // Cyan
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#FBBF24', // Yellow
  '#34D399', // Green
  '#60A5FA', // Blue
  '#F97316', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
];

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector((set, get) => ({
    currentUserId: null,
    currentUser: null,
    collaborators: new Map(),
    editHistory: [],
    isConnected: false,
    connectionError: null,
    showCursors: true,
    showPresence: true,

    setCurrentUser: (user) => set({ 
      currentUserId: user.id, 
      currentUser: user 
    }),

    addCollaborator: (collaborator) => set((state) => {
      const newCollaborators = new Map(state.collaborators);
      // Assign color if not provided
      if (!collaborator.color) {
        const usedColors = Array.from(state.collaborators.values()).map(c => c.color);
        const availableColors = COLLABORATOR_COLORS.filter(c => !usedColors.includes(c));
        collaborator.color = availableColors[0] || COLLABORATOR_COLORS[state.collaborators.size % COLLABORATOR_COLORS.length];
      }
      newCollaborators.set(collaborator.id, collaborator);
      return { collaborators: newCollaborators };
    }),

    removeCollaborator: (id) => set((state) => {
      const newCollaborators = new Map(state.collaborators);
      newCollaborators.delete(id);
      return { collaborators: newCollaborators };
    }),

    updateCollaborator: (id, updates) => set((state) => {
      const collaborator = state.collaborators.get(id);
      if (!collaborator) return state;
      
      const newCollaborators = new Map(state.collaborators);
      newCollaborators.set(id, { ...collaborator, ...updates });
      return { collaborators: newCollaborators };
    }),

    updateCursor: (userId, cursor) => set((state) => {
      const collaborator = state.collaborators.get(userId);
      if (!collaborator) return state;
      
      const newCollaborators = new Map(state.collaborators);
      newCollaborators.set(userId, { 
        ...collaborator, 
        cursor, 
        lastActive: new Date() 
      });
      return { collaborators: newCollaborators };
    }),

    updateSelection: (userId, nodeId) => set((state) => {
      const collaborator = state.collaborators.get(userId);
      if (!collaborator) return state;
      
      const newCollaborators = new Map(state.collaborators);
      newCollaborators.set(userId, { 
        ...collaborator, 
        selectedNodeId: nodeId || undefined,
        lastActive: new Date() 
      });
      return { collaborators: newCollaborators };
    }),

    addNodeEdit: (edit) => set((state) => ({
      editHistory: [edit, ...state.editHistory].slice(0, 1000) // Keep last 1000 edits
    })),

    clearEditHistory: () => set({ editHistory: [] }),

    setConnected: (isConnected) => set({ isConnected }),

    setConnectionError: (error) => set({ connectionError: error }),

    toggleCursors: () => set((state) => ({ showCursors: !state.showCursors })),

    togglePresence: () => set((state) => ({ showPresence: !state.showPresence })),

    getCollaboratorForNode: (nodeId) => {
      const state = get();
      return Array.from(state.collaborators.values()).find(
        c => c.selectedNodeId === nodeId && c.id !== state.currentUserId
      );
    },

    getRecentEditsForNode: (nodeId, limit = 5) => {
      return get().editHistory
        .filter(e => e.nodeId === nodeId)
        .slice(0, limit);
    },
  }))
);

// Hooks for common patterns
export function useCollaborators() {
  return useCollaborationStore((state) => 
    Array.from(state.collaborators.values())
  );
}

export function useOnlineCollaborators() {
  return useCollaborationStore((state) => 
    Array.from(state.collaborators.values()).filter(c => c.isOnline)
  );
}

export function useNodeEditor(nodeId: string) {
  return useCollaborationStore((state) => 
    state.getCollaboratorForNode(nodeId)
  );
}

export function useRecentNodeEdits(nodeId: string, limit?: number) {
  return useCollaborationStore((state) => 
    state.getRecentEditsForNode(nodeId, limit)
  );
}

export default useCollaborationStore;
