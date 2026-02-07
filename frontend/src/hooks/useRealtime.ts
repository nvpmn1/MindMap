import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useMapStore } from '@/stores/mapStore';
import { useAuthStore } from '@/stores/authStore';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  mapId: string;
  enabled?: boolean;
}

/**
 * Hook for real-time collaboration features
 */
export function useRealtime({ mapId, enabled = true }: UseRealtimeOptions) {
  const { profile } = useAuthStore();
  const setActiveUsers = useMapStore((state) => state.setActiveUsers);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Handle node changes from other users
  const handleNodeChange = useCallback(
    (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const { nodes, setNodes } = useMapStore.getState();

      switch (eventType) {
        case 'INSERT': {
          const newNode = transformNodeFromDB(newRecord as any);
          setNodes([...nodes, newNode]);
          break;
        }
        case 'UPDATE': {
          const updatedNode = transformNodeFromDB(newRecord as any);
          setNodes(nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
          break;
        }
        case 'DELETE': {
          const deletedId = (oldRecord as any).id;
          setNodes(nodes.filter((n) => n.id !== deletedId));
          break;
        }
      }
    },
    []
  );

  // Handle edge changes from other users
  const handleEdgeChange = useCallback(
    (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const { edges, setEdges } = useMapStore.getState();

      switch (eventType) {
        case 'INSERT': {
          const newEdge = transformEdgeFromDB(newRecord as any);
          setEdges([...edges, newEdge]);
          break;
        }
        case 'UPDATE': {
          const updatedEdge = transformEdgeFromDB(newRecord as any);
          setEdges(edges.map((e) => (e.id === updatedEdge.id ? updatedEdge : e)));
          break;
        }
        case 'DELETE': {
          const deletedId = (oldRecord as any).id;
          setEdges(edges.filter((e) => e.id !== deletedId));
          break;
        }
      }
    },
    []
  );

  // Handle presence (user cursors, who's online)
  const handlePresenceSync = useCallback(
    (state: Record<string, any[]>) => {
      const users = Object.values(state)
        .flat()
        .filter((user) => user.user_id !== profile?.id)
        .map((user) => ({
          id: user.user_id,
          name: user.display_name,
          color: user.color,
          cursor: user.cursor,
        }));

      setActiveUsers(users);
    },
    [profile?.id, setActiveUsers]
  );

  useEffect(() => {
    if (!enabled || !mapId) return;

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // Create channel for this map
      channel = supabase.channel(`map:${mapId}`, {
        config: {
          presence: {
            key: profile?.id || 'anonymous',
          },
        },
      });
      channelRef.current = channel;

      // Subscribe to node changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `map_id=eq.${mapId}`,
        },
        handleNodeChange
      );

      // Subscribe to edge changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'edges',
          filter: `map_id=eq.${mapId}`,
        },
        handleEdgeChange
      );

      // Subscribe to presence
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        handlePresenceSync(state);
      });

      // Track own presence
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && profile) {
          await channel.track({
            user_id: profile.id,
            display_name: profile.display_name || profile.email,
            color: profile.color,
            cursor: null,
            online_at: new Date().toISOString(),
          });
        }
      });
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, mapId, profile, handleNodeChange, handleEdgeChange, handlePresenceSync]);

  // Broadcast cursor position
  const broadcastCursor = useCallback(
    async (cursor: { x: number; y: number } | null) => {
      if (!profile || !mapId) return;

      const channel = channelRef.current;
      if (!channel) return;

      await channel.track({
        user_id: profile.id,
        display_name: profile.display_name || profile.email,
        color: profile.color,
        cursor,
        online_at: new Date().toISOString(),
      });
    },
    [mapId, profile]
  );

  return {
    broadcastCursor,
  };
}

// Helper functions to transform database records to app format
function transformNodeFromDB(record: any) {
  return {
    id: record.id,
    type: 'custom',
    position: { x: record.position_x, y: record.position_y },
    data: {
      label: record.label,
      content: record.content,
      type: record.type,
      collapsed: record.collapsed,
    },
    style: record.style,
    width: record.width,
    height: record.height,
  };
}

function transformEdgeFromDB(record: any) {
  return {
    id: record.id,
    source: record.source_id,
    target: record.target_id,
    type: record.type || 'smoothstep',
    label: record.label,
    style: record.style,
    animated: record.animated,
  };
}
