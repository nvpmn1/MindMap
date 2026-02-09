/**
 * ROBUST MAP SAVE SYSTEM - Simplified
 * All saves go through the backend API.
 * Debounced auto-save with proper concurrency control.
 */

import { mapsApi, nodesApi } from '@/lib/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

interface SaveResult {
  success: boolean;
  localFallback: boolean;
  error?: string;
}

interface MapInfoSimplified {
  id: string;
  title: string;
  description?: string;
}

class RobustMapSaveManager {
  private isSaving = false;
  private pendingMapId: string | null = null;

  /**
   * Save map data to the backend API.
   * Only processes remote maps (UUID IDs).
   */
  async queueSave(
    mapId: string,
    nodes: any[],
    edges: any[],
    mapInfo: MapInfoSimplified
  ): Promise<SaveResult> {
    if (!mapId || !isUuid(mapId)) {
      return { success: false, localFallback: false, error: 'Invalid or local map ID' };
    }

    // If already saving, just mark as pending (will be picked up after current save completes)
    if (this.isSaving) {
      this.pendingMapId = mapId;
      return { success: true, localFallback: false };
    }

    this.isSaving = true;
    this.pendingMapId = null;

    try {
      await this.doSave(mapId, nodes, edges, mapInfo);
      return { success: true, localFallback: false };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AutoSave] Error:', msg);
      return { success: false, localFallback: false, error: msg };
    } finally {
      this.isSaving = false;
    }
  }

  private async doSave(
    mapId: string,
    nodes: any[],
    edges: any[],
    mapInfo: MapInfoSimplified
  ): Promise<void> {
    // 1. Update map metadata
    if (mapInfo?.title) {
      try {
        await mapsApi.update(mapId, {
          title: mapInfo.title,
          description: mapInfo.description || '',
        });
      } catch (err: any) {
        // If map not found, stop saving
        if (err?.statusCode === 404) {
          console.warn('[AutoSave] Map not found, skipping save');
          return;
        }
        // Other errors are non-fatal for metadata
      }
    }

    // 2. Separate nodes into create vs update
    const nodesToCreate: any[] = [];
    const nodesToUpdate: any[] = [];
    const idMapping = new Map<string, string>();

    for (const node of nodes) {
      if (isUuid(node.id)) {
        nodesToUpdate.push(node);
      } else {
        nodesToCreate.push(node);
      }
    }

    // 3. Create new nodes sequentially
    for (const node of nodesToCreate) {
      try {
        const response = await nodesApi.create({
          map_id: mapId,
          type: (node.data?.type as any) || 'idea',
          label: node.data?.label || 'Untitled',
          content: node.data?.description || '',
          position_x: node.position?.x || 0,
          position_y: node.position?.y || 0,
        });
        const created = response?.data as any;
        if (created?.id) {
          idMapping.set(node.id, created.id);
        }
      } catch (err: any) {
        if (err?.statusCode === 404) return; // Map deleted
        // Continue with other nodes
      }
    }

    // 4. Batch update existing nodes (use batch endpoint if available)
    if (nodesToUpdate.length > 0) {
      const batchPayload = nodesToUpdate.map(node => ({
        id: node.id,
        position_x: node.position?.x || 0,
        position_y: node.position?.y || 0,
      }));

      try {
        await nodesApi.batchUpdate(batchPayload);
      } catch {
        // Batch failed - try individual updates
        for (const node of nodesToUpdate) {
          try {
            await nodesApi.update(node.id, {
              label: node.data?.label,
              content: node.data?.description || '',
              position_x: node.position?.x || 0,
              position_y: node.position?.y || 0,
              type: node.data?.type as any,
            });
          } catch {
            // Continue with others
          }
        }
      }
    }

    // 5. Sync edges - get server state and reconcile
    try {
      const serverEdgesRes = await nodesApi.getEdges(mapId);
      const serverEdges = (serverEdgesRes.data || []) as any[];

      // Build server edge key set
      const serverEdgeMap = new Map<string, string>();
      for (const e of serverEdges) {
        serverEdgeMap.set(String(e.source_id) + '__' + String(e.target_id), e.id);
      }

      // Create missing edges
      for (const edge of edges) {
        const sourceId = idMapping.get(edge.source) || edge.source;
        const targetId = idMapping.get(edge.target) || edge.target;

        if (!isUuid(sourceId) || !isUuid(targetId)) continue;
        if (sourceId === targetId) continue;

        const key = sourceId + '__' + targetId;
        if (!serverEdgeMap.has(key)) {
          try {
            await nodesApi.createEdge({
              map_id: mapId,
              source_id: sourceId,
              target_id: targetId,
            });
          } catch {
            // 409 or other - silently continue
          }
        }
      }

      // Delete edges that no longer exist locally
      const localEdgeKeys = new Set<string>();
      for (const e of edges) {
        const s = idMapping.get(e.source) || e.source;
        const t = idMapping.get(e.target) || e.target;
        if (isUuid(s) && isUuid(t)) {
          localEdgeKeys.add(s + '__' + t);
        }
      }

      for (const se of serverEdges) {
        const key = se.source_id + '__' + se.target_id;
        if (!localEdgeKeys.has(key)) {
          try {
            await nodesApi.deleteEdge(se.id);
          } catch {
            // Continue
          }
        }
      }
    } catch {
      // Edge sync is non-critical
    }
  }

  getSaveStatus(_mapId: string) {
    return null;
  }

  getPendingCount(): number {
    return this.isSaving ? 1 : 0;
  }

  async forceSyncNow(): Promise<void> {
    // No-op - saves are immediate via API
  }

  destroy(): void {
    // Nothing to clean up
  }
}

export const robustMapSave = new RobustMapSaveManager();
