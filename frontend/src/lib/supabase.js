import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mvkrlvjyocynmwslklzu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12a3Jsdmp5b2N5bm13c2xrbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjYzMTksImV4cCI6MjA4NTMwMjMxOX0.WDM7ZVVoGmi54T3aBGONWhSzgTvWHeS-ZzARg6q4eAc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Realtime subscription helpers
export const subscribeToNodes = (mindmapId, callbacks) => {
  const channel = supabase
    .channel(`nodes:${mindmapId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'nodes',
        filter: `mindmap_id=eq.${mindmapId}`
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
          case 'INSERT':
            callbacks.onInsert?.(newRecord);
            break;
          case 'UPDATE':
            callbacks.onUpdate?.(newRecord, oldRecord);
            break;
          case 'DELETE':
            callbacks.onDelete?.(oldRecord);
            break;
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Presence channel for online users
export const subscribeToPresence = (mindmapId, userId, userName, callbacks) => {
  const channel = supabase.channel(`presence:${mindmapId}`, {
    config: {
      presence: {
        key: userId
      }
    }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      callbacks.onSync?.(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      callbacks.onJoin?.(key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      callbacks.onLeave?.(key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: userId,
          name: userName,
          online_at: new Date().toISOString()
        });
      }
    });

  return () => {
    channel.untrack();
    supabase.removeChannel(channel);
  };
};

// Broadcast channel for cursor positions and other real-time events
export const subscribeToBroadcast = (mindmapId, callbacks) => {
  const channel = supabase
    .channel(`broadcast:${mindmapId}`)
    .on('broadcast', { event: 'cursor_move' }, (payload) => {
      callbacks.onCursorMove?.(payload.payload);
    })
    .on('broadcast', { event: 'node_editing' }, (payload) => {
      callbacks.onNodeEditing?.(payload.payload);
    })
    .subscribe();

  const broadcastCursor = (position, userId) => {
    channel.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { userId, position, timestamp: Date.now() }
    });
  };

  const broadcastEditing = (nodeId, userId, isEditing) => {
    channel.send({
      type: 'broadcast',
      event: 'node_editing',
      payload: { nodeId, userId, isEditing, timestamp: Date.now() }
    });
  };

  return {
    unsubscribe: () => supabase.removeChannel(channel),
    broadcastCursor,
    broadcastEditing
  };
};

export default supabase;
