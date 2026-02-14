/**
 * useAdvancedSave Hook
 * ============================================================================
 * High-performance save hook using the advanced queue system
 * Handles automatic batching, retries, and persistence
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  advancedSaveQueue,
  type SaveStatus,
  type QueuedOperation,
} from '@/lib/advanced-save-queue';
import type { PowerNode, PowerEdge, MapInfo } from '@/components/mindmap/editor/types';

interface UseAdvancedSaveOptions {
  mapId?: string;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

export function useAdvancedSave(options: UseAdvancedSaveOptions) {
  const { mapId, onSaveStatusChange } = options;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(advancedSaveQueue.getStatus(mapId));
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout>();
  const isRemoteMap = mapId && mapId !== 'new' && mapId !== 'local' && !mapId.startsWith('local_');

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = useCallback((id: string) => UUID_RE.test(id), []);

  /**
   * Queue a map update
   */
  const queueMapUpdate = useCallback(
    (mapInfo: Partial<MapInfo>) => {
      if (!mapId || !isRemoteMap) return;

      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'map-update',
        payload: {
          title: mapInfo.title || '',
          description: mapInfo.description || '',
        },
      });
    },
    [mapId, isRemoteMap]
  );

  /**
   * Queue node creation
   */
  const queueNodeCreate = useCallback(
    (node: PowerNode) => {
      if (!mapId || !isRemoteMap) return;

      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'node-create',
        localId: node.id,
        payload: {
          id: node.id,
          map_id: mapId,
          type: node.data.type || 'idea',
          label: node.data.label || 'Untitled',
          content: node.data.description || '',
          position_x: node.position.x || 0,
          position_y: node.position.y || 0,
        },
      });
    },
    [mapId, isRemoteMap]
  );

  /**
   * Queue node update (position, label, content, etc)
   */
  const queueNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<PowerNode>) => {
      if (!mapId || !isRemoteMap || !isUuid(nodeId)) return;
      const expectedVersionRaw = Number((updates.data as any)?.version);
      const expectedVersion =
        Number.isFinite(expectedVersionRaw) && expectedVersionRaw > 0
          ? Math.floor(expectedVersionRaw)
          : undefined;

      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'node-update',
        payload: {
          id: nodeId,
          position_x: updates.position?.x,
          position_y: updates.position?.y,
          label: updates.data?.label,
          content: updates.data?.description,
          type: updates.data?.type,
          ...(expectedVersion ? { expected_version: expectedVersion } : {}),
        },
      });
    },
    [mapId, isRemoteMap, isUuid]
  );

  /**
   * Queue multiple node updates (batch)
   */
  const queueNodeUpdates = useCallback(
    (nodes: PowerNode[]) => {
      if (!mapId || !isRemoteMap) return;

      for (const node of nodes) {
        if (isUuid(node.id)) {
          const expectedVersionRaw = Number((node.data as any)?.version);
          const expectedVersion =
            Number.isFinite(expectedVersionRaw) && expectedVersionRaw > 0
              ? Math.floor(expectedVersionRaw)
              : undefined;

          advancedSaveQueue.enqueueOperation({
            mapId,
            type: 'node-update',
            payload: {
              id: node.id,
              position_x: node.position.x,
              position_y: node.position.y,
              label: node.data.label,
              content: node.data.description,
              type: node.data.type,
              ...(expectedVersion ? { expected_version: expectedVersion } : {}),
            },
          });
        }
      }
    },
    [mapId, isRemoteMap, isUuid]
  );

  /**
   * Queue edge creation
   */
  const queueEdgeCreate = useCallback(
    (edge: PowerEdge) => {
      if (!mapId || !isRemoteMap) return;

      // Only queue if both nodes are UUIDs
      if (!isUuid(edge.source) || !isUuid(edge.target)) return;

      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'edge-create',
        payload: {
          map_id: mapId,
          source_id: edge.source,
          target_id: edge.target,
        },
      });
    },
    [mapId, isRemoteMap, isUuid]
  );

  /**
   * Queue edge deletion
   */
  const queueEdgeDelete = useCallback(
    (edgeId: string) => {
      if (!mapId || !isRemoteMap) return;

      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'edge-delete',
        payload: {
          id: edgeId,
        },
      });
    },
    [mapId, isRemoteMap]
  );

  /**
   * Manually queue multiple operations
   */
  const queueOperations = useCallback(
    (operations: Array<Omit<QueuedOperation, 'id' | 'retries' | 'maxRetries' | 'createdAt'>>) => {
      if (!mapId || !isRemoteMap) return;

      for (const op of operations) {
        advancedSaveQueue.enqueueOperation({
          ...op,
          mapId,
        });
      }
    },
    [mapId, isRemoteMap]
  );

  /**
   * Force immediate sync (for Ctrl+S, page unload, etc)
   */
  const forceSyncNow = useCallback(async () => {
    await advancedSaveQueue.forceSync({ mapId, includeDeadLetter: true });
    const status = advancedSaveQueue.getStatus(mapId);
    setSaveStatus(status);
    onSaveStatusChange?.(status);

    if (status.queueLength === 0) {
      setLastSaved(new Date());
      toast.success('Todos os dados sincronizados!', { duration: 2000 });
    }
  }, [mapId, onSaveStatusChange]);

  /**
   * Get ID mapping (for resolving local IDs to server IDs)
   */
  const getIdMapping = useCallback(() => {
    if (!mapId) return new Map();
    return advancedSaveQueue.getIdMapping(mapId);
  }, [mapId]);

  /**
   * Monitor queue status
   */
  useEffect(() => {
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

    // Poll status every 500ms
    statusCheckIntervalRef.current = setInterval(() => {
      const scopedStatus = advancedSaveQueue.getStatus(mapId);
      setSaveStatus(scopedStatus);
      onSaveStatusChange?.(scopedStatus);

      // Update lastSaved timestamp
      if (scopedStatus.lastSuccessfulSave) {
        setLastSaved(new Date(scopedStatus.lastSuccessfulSave));
      }
    }, 500);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, [mapId, onSaveStatusChange]);

  return {
    // Queue operations
    queueMapUpdate,
    queueNodeCreate,
    queueNodeUpdate,
    queueNodeUpdates,
    queueEdgeCreate,
    queueEdgeDelete,
    queueOperations,

    // Status
    saveStatus,
    lastSaved,
    isSaving: saveStatus.isSaving,
    queueLength: saveStatus.queueLength,

    // Utilities
    forceSyncNow,
    getIdMapping,
  };
}

/**
 * Batch save function for complete map saves
 * Used when user manually saves or map needs to be fully synced
 */
export async function batchSaveMap(
  mapId: string,
  mapInfo: MapInfo | null,
  nodes: PowerNode[],
  edges: PowerEdge[]
): Promise<void> {
  const isUuid = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Queue all operations
  if (mapInfo && mapInfo.title) {
    advancedSaveQueue.enqueueOperation({
      mapId,
      type: 'map-update',
      payload: {
        title: mapInfo.title,
        description: mapInfo.description || '',
      },
    });
  }

  // Queue node creates and updates
  for (const node of nodes) {
    if (!isUuid(node.id)) {
      // New node - queue create
      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'node-create',
        localId: node.id,
        payload: {
          id: node.id,
          map_id: mapId,
          type: node.data.type || 'idea',
          label: node.data.label || 'Untitled',
          content: node.data.description || '',
          position_x: node.position.x || 0,
          position_y: node.position.y || 0,
        },
      });
    } else {
      // Existing node - queue update
      const expectedVersionRaw = Number((node.data as any)?.version);
      const expectedVersion =
        Number.isFinite(expectedVersionRaw) && expectedVersionRaw > 0
          ? Math.floor(expectedVersionRaw)
          : undefined;

      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'node-update',
        payload: {
          id: node.id,
          position_x: node.position.x,
          position_y: node.position.y,
          label: node.data.label,
          content: node.data.description,
          type: node.data.type,
          ...(expectedVersion ? { expected_version: expectedVersion } : {}),
        },
      });
    }
  }

  // Queue edge creates
  for (const edge of edges) {
    if (isUuid(edge.source) && isUuid(edge.target)) {
      advancedSaveQueue.enqueueOperation({
        mapId,
        type: 'edge-create',
        payload: {
          map_id: mapId,
          source_id: edge.source,
          target_id: edge.target,
        },
      });
    }
  }

  // Force immediate processing
  await advancedSaveQueue.forceSync();
}
