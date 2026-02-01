import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: Date;
}

interface CursorInfo {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

interface CollaborationState {
  // State
  collaborators: Map<string, Collaborator>;
  onlineUsers: Collaborator[];
  cursors: Map<string, CursorInfo>;
  isConnected: boolean;
  currentMapId: string | null;
  
  // Presence
  localCursor: { x: number; y: number } | null;
  
  // Channel
  channel: ReturnType<typeof supabase.channel> | null;
  
  // Actions
  connect: (mapId: string, userId: string, userName: string, userAvatar?: string) => void;
  disconnect: () => void;
  updateCursor: (x: number, y: number) => void;
  broadcastCursor: (x: number, y: number) => void;
  broadcastNodeChange: (type: 'create' | 'update' | 'delete', nodeData: any) => void;
  
  // Internal
  setCollaborators: (collaborators: Map<string, Collaborator>) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  updateCollaboratorCursor: (id: string, cursor: { x: number; y: number }) => void;
}

// Color palette for collaborator cursors
const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6366f1',
];

let colorIndex = 0;
function getNextColor() {
  const color = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length];
  colorIndex++;
  return color;
}

export const useCollaborationStore = create<CollaborationState>()(
  devtools(
    (set, get) => ({
      // Initial State
      collaborators: new Map(),
      onlineUsers: [],
      cursors: new Map(),
      isConnected: false,
      currentMapId: null,
      localCursor: null,
      channel: null,

      connect: (mapId, userId, userName, userAvatar) => {
        const { channel: existingChannel, disconnect } = get();
        
        // Disconnect from existing channel if any
        if (existingChannel) {
          disconnect();
        }

        // Create new channel for this map
        const channel = supabase.channel(`map:${mapId}`, {
          config: {
            presence: {
              key: userId,
            },
          },
        });

        // Handle presence sync
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const newCollaborators = new Map<string, Collaborator>();

          Object.entries(state).forEach(([key, presences]) => {
            const presence = presences[0] as any;
            if (key !== userId) {
              newCollaborators.set(key, {
                id: key,
                name: presence.name,
                email: presence.email || '',
                avatar_url: presence.avatar_url,
                color: presence.color || getNextColor(),
                cursor: presence.cursor,
                lastSeen: new Date(),
              });
            }
          });

          set({ collaborators: newCollaborators });
        });

        // Handle presence join
        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key === userId) return;
          
          const presence = newPresences[0] as any;
          const { collaborators } = get();
          
          const newCollaborators = new Map(collaborators);
          newCollaborators.set(key, {
            id: key,
            name: presence.name,
            email: presence.email || '',
            avatar_url: presence.avatar_url,
            color: presence.color || getNextColor(),
            cursor: presence.cursor,
            lastSeen: new Date(),
          });
          
          set({ collaborators: newCollaborators });
        });

        // Handle presence leave
        channel.on('presence', { event: 'leave' }, ({ key }) => {
          const { collaborators } = get();
          const newCollaborators = new Map(collaborators);
          newCollaborators.delete(key);
          set({ collaborators: newCollaborators });
        });

        // Handle cursor updates
        channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
          if (payload.userId === userId) return;
          
          const { collaborators } = get();
          const collaborator = collaborators.get(payload.userId);
          
          if (collaborator) {
            const newCollaborators = new Map(collaborators);
            newCollaborators.set(payload.userId, {
              ...collaborator,
              cursor: payload.cursor,
              lastSeen: new Date(),
            });
            set({ collaborators: newCollaborators });
          }
        });

        // Handle node changes
        channel.on('broadcast', { event: 'node_change' }, ({ payload }) => {
          // This will be handled by the node store
          console.log('Node change received:', payload);
        });

        // Subscribe and track presence
        channel
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({
                name: userName,
                avatar_url: userAvatar,
                color: getNextColor(),
                online_at: new Date().toISOString(),
              });
              
              set({ isConnected: true });
            }
          });

        set({ channel, currentMapId: mapId });
      },

      disconnect: () => {
        const { channel } = get();
        
        if (channel) {
          channel.unsubscribe();
        }

        set({
          channel: null,
          currentMapId: null,
          isConnected: false,
          collaborators: new Map(),
          localCursor: null,
        });
      },

      updateCursor: (x, y) => {
        const { channel, isConnected } = get();
        
        set({ localCursor: { x, y } });
        
        if (channel && isConnected) {
          channel.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
              userId: channel.topic.split(':')[1], // Extract user ID from topic
              cursor: { x, y },
            },
          });
        }
      },

      broadcastCursor: (x, y) => {
        // Alias for updateCursor
        get().updateCursor(x, y);
      },

      broadcastNodeChange: (type, nodeData) => {
        const { channel, isConnected } = get();
        
        if (channel && isConnected) {
          channel.send({
            type: 'broadcast',
            event: 'node_change',
            payload: {
              type,
              node: nodeData,
              timestamp: new Date().toISOString(),
            },
          });
        }
      },

      setCollaborators: (collaborators) => {
        const onlineUsers = Array.from(collaborators.values());
        set({ collaborators, onlineUsers });
      },
      
      addCollaborator: (collaborator) => {
        const { collaborators } = get();
        const newCollaborators = new Map(collaborators);
        newCollaborators.set(collaborator.id, collaborator);
        const onlineUsers = Array.from(newCollaborators.values());
        set({ collaborators: newCollaborators, onlineUsers });
      },
      
      removeCollaborator: (id) => {
        const { collaborators } = get();
        const newCollaborators = new Map(collaborators);
        newCollaborators.delete(id);
        const onlineUsers = Array.from(newCollaborators.values());
        set({ collaborators: newCollaborators, onlineUsers });
      },
      
      updateCollaboratorCursor: (id, cursor) => {
        const { collaborators, cursors } = get();
        const collaborator = collaborators.get(id);
        
        if (collaborator) {
          const newCollaborators = new Map(collaborators);
          newCollaborators.set(id, {
            ...collaborator,
            cursor,
            lastSeen: new Date(),
          });
          
          // Update cursors map
          const newCursors = new Map(cursors);
          newCursors.set(id, {
            x: cursor.x,
            y: cursor.y,
            userId: id,
            userName: collaborator.name,
            color: collaborator.color,
          });
          
          const onlineUsers = Array.from(newCollaborators.values());
          set({ collaborators: newCollaborators, onlineUsers, cursors: newCursors });
        }
      },
    }),
    { name: 'CollaborationStore' }
  )
);
