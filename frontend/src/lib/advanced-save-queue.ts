/**
 * ADVANCED SAVE QUEUE SYSTEM
 * ============================================================================
 * Production-grade persistence layer with:
 * - Smart operation queueing
 * - Exponential backoff retry logic
 * - Operation consolidation
 * - IndexedDB persistence for recovery
 * - Real-time status tracking
 * ============================================================================
 */

import { mapsApi, nodesApi } from '@/lib/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

const BACKEND_NODE_TYPES = new Set([
  'idea',
  'task',
  'note',
  'reference',
  'image',
  'group',
  'research',
  'data',
  'question',
]);

const NODE_TYPE_ALIASES: Record<string, string> = {
  decision: 'question',
  milestone: 'task',
  resource: 'reference',
  process: 'note',
  risk: 'question',
  opportunity: 'idea',
};

function normalizeNodeType(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (BACKEND_NODE_TYPES.has(normalized)) {
    return normalized;
  }

  return NODE_TYPE_ALIASES[normalized];
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface QueuedOperation {
  id: string;
  mapId: string;
  type:
    | 'map-update'
    | 'node-create'
    | 'node-update'
    | 'node-delete'
    | 'edge-create'
    | 'edge-delete';
  payload: Record<string, any>;
  retries: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
  nextRetryAt?: number;
  dependencyAttempts?: number;
  localId?: string; // For tracking local node IDs to UUID mapping
}

export interface SaveStatus {
  queueLength: number;
  isSaving: boolean;
  lastSuccessfulSave: number | null;
  pendingByType: Record<string, number>;
  activeRetries: number;
  failedOperations: QueuedOperation[];
}

export interface ForceSyncResult {
  drained: boolean;
  remaining: number;
  timedOut: boolean;
  failed: number;
}

// ─── Queue Manager ──────────────────────────────────────────────────────

class AdvancedSaveQueue {
  private queue: Map<string, QueuedOperation> = new Map();
  private isSaving = false;
  private lastSuccessfulSave: number | null = null;
  private deadLetter: QueuedOperation[] = [];
  private processIntervalId: NodeJS.Timeout | null = null;
  private PROCESS_INTERVAL = 1200; // 1.2 seconds base interval for snappier autosave
  private MAX_RETRIES = 4;
  private BATCH_SIZE = 50;
  private idMappings = new Map<string, Map<string, string>>(); // mapId -> localId -> serverId
  private syncedEdgeKeys = new Map<string, Set<string>>(); // mapId -> source__target
  private nodeVersions = new Map<string, Map<string, number>>(); // mapId -> nodeId -> version

  // IndexedDB for persistence
  private dbName = 'mindmap-save-queue';
  private storeName = 'operations';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
    this.startProcessor();
  }

  /**
   * Initialize IndexedDB for queue persistence
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        console.warn('[SaveQueue] IndexedDB not available');
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('mapId', 'mapId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Load persisted operations
        this.loadPersistedOperations();
        resolve();
      };

      request.onerror = () => {
        console.warn('[SaveQueue] Failed to initialize IndexedDB');
        resolve();
      };
    });
  }

  /**
   * Load and restore persisted operations from IndexedDB
   */
  private async loadPersistedOperations(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result as QueuedOperation[];
        for (const op of operations) {
          this.queue.set(op.id, op);
        }
        console.log(`[SaveQueue] Restored ${operations.length} persisted operations`);
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Start background queue processor
   */
  private startProcessor(): void {
    if (this.processIntervalId) return;

    this.processIntervalId = setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL);
  }

  /**
   * Queue a new operation
   */
  enqueueOperation(
    op: Omit<QueuedOperation, 'id' | 'retries' | 'maxRetries' | 'createdAt'>
  ): string {
    if (op.type === 'node-delete') {
      const nodeId = String(op.payload.id || '');
      if (nodeId) {
        this.clearNodeVersion(op.mapId, nodeId);
        const mappedNodeId = this.resolveNodeId(op.mapId, nodeId);
        if (mappedNodeId && mappedNodeId !== nodeId) {
          this.clearNodeVersion(op.mapId, mappedNodeId);
        }

        for (const [existingId, existing] of this.queue) {
          if (existing.mapId !== op.mapId) continue;

          if (
            existing.type === 'node-delete' &&
            String(existing.payload.id || existing.localId || '') === nodeId
          ) {
            return existing.id;
          }

          if (
            (existing.type === 'node-create' || existing.type === 'node-update') &&
            String(existing.payload.id || existing.localId || '') === nodeId
          ) {
            this.queue.delete(existingId);
            this.deletePersistedOperation(existingId);
            continue;
          }

          if (existing.type === 'edge-create' || existing.type === 'edge-delete') {
            const source = String(existing.payload.source_id || '');
            const target = String(existing.payload.target_id || '');
            if (source === nodeId || target === nodeId) {
              this.queue.delete(existingId);
              this.deletePersistedOperation(existingId);
            }
          }
        }
      }
    }

    if (op.type === 'node-update') {
      let nodeId = String(op.payload.id || '');
      const mappedNodeId = this.resolveNodeId(op.mapId, nodeId);
      if (mappedNodeId && mappedNodeId !== nodeId) {
        op.payload.id = mappedNodeId;
        nodeId = mappedNodeId;
      }

      if (nodeId) {
        const knownVersion = this.getNodeVersion(op.mapId, nodeId);
        const incomingVersion = Number(op.payload.expected_version);
        if (
          knownVersion !== null &&
          knownVersion > 0 &&
          (!Number.isFinite(incomingVersion) || knownVersion > incomingVersion)
        ) {
          op.payload.expected_version = knownVersion;
        }
      }

      if (nodeId) {
        for (const [existingId, existing] of this.queue) {
          if (
            existing.mapId === op.mapId &&
            existing.type === 'node-delete' &&
            String(existing.payload.id || '') === nodeId
          ) {
            return existing.id;
          }

          // If node is not persisted yet, fold update into pending create operation.
          if (
            existing.mapId === op.mapId &&
            existing.type === 'node-create' &&
            String(existing.localId || existing.payload.id || '') === nodeId
          ) {
            existing.payload = { ...existing.payload, ...op.payload };
            this.queue.set(existingId, existing);
            this.persistOperation(existing);
            return existingId;
          }
        }
      }
    }

    // Coalesce map updates: keep only the latest metadata write for each map
    if (op.type === 'map-update') {
      for (const [existingId, existing] of this.queue) {
        if (existing.mapId === op.mapId && existing.type === 'map-update') {
          this.queue.delete(existingId);
          this.deletePersistedOperation(existingId);
        }
      }
    }

    // Coalesce node updates by node id: keep only the most recent state
    if (op.type === 'node-update') {
      const nodeId = String(op.payload.id || '');
      if (nodeId) {
        for (const [existingId, existing] of this.queue) {
          if (
            existing.mapId === op.mapId &&
            existing.type === 'node-update' &&
            String(existing.payload.id || '') === nodeId
          ) {
            this.queue.delete(existingId);
            this.deletePersistedOperation(existingId);
          }
        }
      }
    }

    // Coalesce local node creates by local id to avoid duplicate create attempts
    if (op.type === 'node-create') {
      const localId = String(op.localId || op.payload.id || '');
      if (localId) {
        for (const [, existing] of this.queue) {
          if (
            existing.mapId === op.mapId &&
            existing.type === 'node-delete' &&
            String(existing.payload.id || '') === localId
          ) {
            return existing.id;
          }
        }

        for (const [existingId, existing] of this.queue) {
          const existingLocalId = String(existing.localId || existing.payload.id || '');
          if (
            existing.mapId === op.mapId &&
            existing.type === 'node-create' &&
            existingLocalId === localId
          ) {
            this.queue.delete(existingId);
            this.deletePersistedOperation(existingId);
          }
        }
      }
    }

    if (op.type === 'edge-delete') {
      const edgeId = String(op.payload.id || '');
      const sourceId = String(op.payload.source_id || '');
      const targetId = String(op.payload.target_id || '');
      let removedPendingCreate = false;

      for (const [existingId, existing] of this.queue) {
        if (existing.mapId !== op.mapId) continue;

        if (existing.type === 'edge-delete') {
          const existingEdgeId = String(existing.payload.id || '');
          const existingSource = String(existing.payload.source_id || '');
          const existingTarget = String(existing.payload.target_id || '');
          const isSameById = edgeId && existingEdgeId && edgeId === existingEdgeId;
          const isSameByConnection =
            sourceId && targetId && existingSource === sourceId && existingTarget === targetId;
          if (isSameById || isSameByConnection) {
            return existing.id;
          }
        }

        if (existing.type === 'edge-create') {
          const existingEdgeId = String(existing.payload.id || '');
          const existingSource = String(existing.payload.source_id || '');
          const existingTarget = String(existing.payload.target_id || '');
          const isSameById = edgeId && existingEdgeId && edgeId === existingEdgeId;
          const isSameByConnection =
            sourceId && targetId && existingSource === sourceId && existingTarget === targetId;
          if (isSameById || isSameByConnection) {
            removedPendingCreate = true;
            this.queue.delete(existingId);
            this.deletePersistedOperation(existingId);
          }
        }
      }

      // Edge was created and removed before reaching backend.
      if (removedPendingCreate && (!edgeId || !isUuid(edgeId))) {
        return `op_skipped_${Date.now()}`;
      }
    }

    if (op.type === 'edge-create') {
      const source = String(op.payload.source_id || '');
      const target = String(op.payload.target_id || '');
      if (source && target) {
        for (const [, existing] of this.queue) {
          if (
            existing.mapId === op.mapId &&
            existing.type === 'node-delete' &&
            (String(existing.payload.id || '') === source ||
              String(existing.payload.id || '') === target)
          ) {
            return existing.id;
          }
        }

        const key = `${source}__${target}`;
        const synced = this.syncedEdgeKeys.get(op.mapId);
        if (synced?.has(key)) {
          return `op_skipped_${Date.now()}`;
        }

        // Skip if same edge is already queued and pending
        for (const [, existing] of this.queue) {
          if (existing.mapId !== op.mapId || existing.type !== 'edge-create') continue;
          const existingSource = String(existing.payload.source_id || '');
          const existingTarget = String(existing.payload.target_id || '');
          if (`${existingSource}__${existingTarget}` === key) {
            return existing.id;
          }
        }
      }
    }

    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedOp: QueuedOperation = {
      ...op,
      id,
      retries: 0,
      createdAt: Date.now(),
      maxRetries: this.MAX_RETRIES,
    };

    this.queue.set(id, queuedOp);
    this.persistOperation(queuedOp);

    // Trigger immediate processing if queue was empty
    if (this.queue.size === 1) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Consolidate operations - merge related updates
   */
  private consolidateOperations(): Map<string, QueuedOperation[]> {
    const consolidated = new Map<string, QueuedOperation[]>();

    for (const [, op] of this.queue) {
      const key = `${op.mapId}_${op.type}`;
      if (!consolidated.has(key)) {
        consolidated.set(key, []);
      }
      consolidated.get(key)!.push(op);
    }

    return consolidated;
  }

  /**
   * Main queue processor
   */
  private async processQueue(): Promise<void> {
    if (this.isSaving || this.queue.size === 0) return;

    this.isSaving = true;

    try {
      const consolidated = this.consolidateOperations();
      const mapGroups = new Map<string, QueuedOperation[]>();

      // Group by mapId
      for (const [, ops] of consolidated) {
        for (const op of ops) {
          if (!mapGroups.has(op.mapId)) {
            mapGroups.set(op.mapId, []);
          }
          mapGroups.get(op.mapId)!.push(op);
        }
      }

      console.log(
        `[SaveQueue] Processing ${this.queue.size} operations across ${mapGroups.size} maps`
      );

      // Process each map
      for (const [mapId, ops] of mapGroups) {
        try {
          await this.processMapOperations(mapId, ops);
        } catch (err) {
          console.error(`[SaveQueue] Failed to process operations for map ${mapId}:`, err);
        }
      }
    } finally {
      this.isSaving = false;

      // Check if there are still pending operations and log retry schedule
      if (this.queue.size > 0) {
        const pendingOps = Array.from(this.queue.values());
        const pendingForRetry = pendingOps.filter((op) => op.nextRetryAt);
        console.log(
          `[SaveQueue] Still ${pendingOps.length} operations pending (${pendingForRetry.length} waiting for retry)`
        );
      }
    }
  }

  /**
   * Process all operations for a specific map
   */
  private async processMapOperations(mapId: string, operations: QueuedOperation[]): Promise<void> {
    // Separate by type for batch processing
    const mapUpdates = operations.filter((op) => op.type === 'map-update');
    const nodeCreates = operations.filter((op) => op.type === 'node-create');
    const nodeUpdates = operations.filter((op) => op.type === 'node-update');
    const nodeDeletes = operations.filter((op) => op.type === 'node-delete');
    const edgeCreates = operations.filter((op) => op.type === 'edge-create');
    const edgeDeletes = operations.filter((op) => op.type === 'edge-delete');

    const processed: QueuedOperation[] = [];

    try {
      // Step 1: Update map metadata (consolidate all to last one)
      if (mapUpdates.length > 0) {
        const lastMapUpdate = mapUpdates[mapUpdates.length - 1];
        try {
          const result = await this.executeWithRetry(lastMapUpdate);
          if (result.success) {
            processed.push(lastMapUpdate);
          }
        } catch (err) {
          console.warn(`[SaveQueue] Failed to update map metadata:`, err);
        }
      }

      // Step 2: Create new nodes in batch
      if (nodeCreates.length > 0) {
        const orderedNodeCreates = this.sortNodeCreateOperations(mapId, nodeCreates);
        for (let i = 0; i < orderedNodeCreates.length; i += this.BATCH_SIZE) {
          const batch = orderedNodeCreates.slice(i, i + this.BATCH_SIZE);
          for (const op of batch) {
            try {
              const result = await this.executeWithRetry(op);
              if (result.success) {
                if (result.serverId) {
                  // Store ID mapping for future edge creation
                  if (!this.idMappings.has(mapId)) {
                    this.idMappings.set(mapId, new Map());
                  }
                  const mappingKey = String(op.localId || op.payload.id || '');
                  if (mappingKey) {
                    this.idMappings.get(mapId)!.set(mappingKey, result.serverId);
                    this.remapNodeVersion(mapId, mappingKey, result.serverId);
                  }
                  if (typeof result.serverVersion === 'number' && result.serverVersion > 0) {
                    this.setNodeVersion(mapId, result.serverId, result.serverVersion);
                  }
                }
                processed.push(op);
              }
            } catch (err) {
              console.warn(`[SaveQueue] Failed to create node ${op.payload.id}:`, err);
            }
          }
        }
      }

      // Step 3: Update existing nodes in batch
      if (nodeUpdates.length > 0) {
        // Consolidate updates to same node (keep last one)
        const nodeUpdateMap = new Map<string, QueuedOperation>();
        for (const op of nodeUpdates) {
          nodeUpdateMap.set(op.payload.id, op);
        }

        for (let i = 0; i < nodeUpdateMap.size; i += this.BATCH_SIZE) {
          const batch = Array.from(nodeUpdateMap.values()).slice(i, i + this.BATCH_SIZE);
          try {
            const processedBatch = await this.executeBatchNodeUpdate(batch);
            processed.push(...processedBatch);
          } catch (err) {
            console.warn(
              `[SaveQueue] Batch node update failed, falling back to individual updates:`,
              err
            );
            // Fallback: Individual updates
            for (const op of batch) {
              try {
                const result = await this.executeWithRetry(op);
                if (result.success) {
                  processed.push(op);
                }
              } catch (innerErr) {
                console.warn(
                  `[SaveQueue] Individual node update failed for ${op.payload.id}:`,
                  innerErr
                );
              }
            }
          }
        }
      }

      // Step 4: Create edges (after node IDs are resolved)
      if (edgeCreates.length > 0) {
        const edgeCreateMap = new Map<string, QueuedOperation>();
        for (const op of edgeCreates) {
          const sourceId = String(op.payload.source_id || '');
          const targetId = String(op.payload.target_id || '');
          if (!sourceId || !targetId || sourceId === targetId) {
            continue;
          }
          edgeCreateMap.set(`${sourceId}__${targetId}`, op);
        }

        for (const op of edgeCreateMap.values()) {
          const sourceId = String(op.payload.source_id || '');
          const targetId = String(op.payload.target_id || '');
          let edgeKey = `${sourceId}__${targetId}`;
          const synced = this.syncedEdgeKeys.get(mapId);

          if (synced?.has(edgeKey)) {
            processed.push(op);
            continue;
          }

          try {
            const result = await this.executeWithRetry(op);
            if (result.success) {
              const resolvedSource = String(op.payload.source_id || sourceId);
              const resolvedTarget = String(op.payload.target_id || targetId);
              edgeKey = `${resolvedSource}__${resolvedTarget}`;
              if (!this.syncedEdgeKeys.has(mapId)) {
                this.syncedEdgeKeys.set(mapId, new Set());
              }
              this.syncedEdgeKeys.get(mapId)!.add(edgeKey);
              processed.push(op);
            }
          } catch (err: any) {
            // 409 conflict usually means edge already exists - safe to ignore
            if (err?.statusCode === 409) {
              console.log(`[SaveQueue] Edge already exists (409), skipping:`, op.payload);
              if (!this.syncedEdgeKeys.has(mapId)) {
                this.syncedEdgeKeys.set(mapId, new Set());
              }
              this.syncedEdgeKeys.get(mapId)!.add(edgeKey);
              processed.push(op); // Still mark as processed
            } else {
              console.warn(`[SaveQueue] Failed to create edge:`, err);
            }
          }
        }
      }

      // Step 5: Delete edges
      if (edgeDeletes.length > 0) {
        for (const op of edgeDeletes) {
          try {
            const result = await this.executeWithRetry(op);
            if (result.success) {
              processed.push(op);
            }
          } catch (err) {
            console.warn(`[SaveQueue] Failed to delete edge:`, err);
          }
        }
      }

      // Step 6: Delete nodes after edge cleanup
      if (nodeDeletes.length > 0) {
        const nodeDeleteMap = new Map<string, QueuedOperation>();
        for (const op of nodeDeletes) {
          const nodeId = String(op.payload.id || '');
          if (!nodeId) continue;
          nodeDeleteMap.set(nodeId, op);
        }

        for (const op of nodeDeleteMap.values()) {
          try {
            const result = await this.executeWithRetry(op);
            if (result.success) {
              const deletedNodeId = String(op.payload.id || '');
              if (deletedNodeId) {
                this.clearNodeVersion(mapId, deletedNodeId);
              }
              processed.push(op);
            }
          } catch (err) {
            console.warn(`[SaveQueue] Failed to delete node:`, err);
          }
        }
      }

      // Mark successful operations as complete
      for (const op of processed) {
        this.queue.delete(op.id);
        this.deletePersistedOperation(op.id);
      }

      if (processed.length > 0) {
        this.lastSuccessfulSave = Date.now();
        console.log(
          `[SaveQueue] Processed ${processed.length}/${operations.length} operations for map ${mapId}`
        );
      }
    } catch (err) {
      console.error('[SaveQueue] Error processing map operations:', err);
      // Operations will retry based on their nextRetryAt
    }
  }

  /**
   * Execute operation with exponential backoff retry
   */
  private async executeWithRetry(
    op: QueuedOperation
  ): Promise<{ success: boolean; serverId?: string; serverVersion?: number }> {
    // Check if should retry
    if (op.retries >= op.maxRetries) {
      console.warn(`[SaveQueue] Max retries exceeded for operation ${op.id}`);
      op.lastError = op.lastError || 'Max retries exceeded';
      this.moveToDeadLetter(op);
      return { success: false };
    }

    // Check if enough time has passed for retry
    if (op.nextRetryAt && Date.now() < op.nextRetryAt) {
      return { success: false };
    }

    try {
      let result: any;

      switch (op.type) {
        case 'map-update':
          console.log('[SaveQueue] Updating map:', op.payload);
          result = await mapsApi.update(op.mapId, op.payload);
          this.assertApiSuccess(result, op.type);
          break;

        case 'node-create': {
          console.log('[SaveQueue] Creating node:', op.payload.id);
          {
            const payload = { ...op.payload } as Record<string, any>;
            const normalizedPayloadType = normalizeNodeType(payload.type);
            const normalizedDataType = normalizeNodeType(payload?.data?.type);

            if (normalizedPayloadType) {
              payload.type = normalizedPayloadType;
            } else if (payload.type !== undefined) {
              payload.type = 'idea';
            }

            if (payload.data && typeof payload.data === 'object') {
              if (normalizedDataType) {
                payload.data.type = normalizedDataType;
              } else if (payload.data.type !== undefined) {
                payload.data.type = payload.type || 'idea';
              }
            }

            if (payload.parent_id) {
              const resolvedParentId = this.resolveNodeId(op.mapId, String(payload.parent_id));
              if (!resolvedParentId) {
                this.deferOperation(op, 250);
                return { success: false };
              }
              payload.parent_id = resolvedParentId;
            }

            // Temporary client ids are not valid UUIDs for server-side primary key usage.
            if (payload.id && !isUuid(String(payload.id))) {
              delete payload.id;
            }

            result = await nodesApi.create(payload as any);
          }
          this.assertApiSuccess(result, op.type);
          if (!result?.data?.id || !isUuid(String(result.data.id))) {
            throw new Error('Node create returned invalid server id');
          }
          const createdNodeId = String(result.data.id);
          const createdNodeVersion = Number(result?.data?.version);
          if (Number.isFinite(createdNodeVersion) && createdNodeVersion > 0) {
            this.setNodeVersion(op.mapId, createdNodeId, createdNodeVersion);
          }
          return {
            success: true,
            serverId: createdNodeId,
            serverVersion:
              Number.isFinite(createdNodeVersion) && createdNodeVersion > 0
                ? createdNodeVersion
                : undefined,
          };
        }

        case 'node-update':
          {
            const rawNodeId = String(op.payload.id || '');
            if (!rawNodeId) {
              return { success: true };
            }

            const resolvedNodeId = this.resolveNodeId(op.mapId, rawNodeId);
            if (!resolvedNodeId) {
              this.deferOperation(op, 250);
              return { success: false };
            }

            const payload = { ...op.payload, id: resolvedNodeId } as Record<string, any>;
            const normalizedPayloadType = normalizeNodeType(payload.type);
            const normalizedDataType = normalizeNodeType(payload?.data?.type);
            const knownVersion = this.getNodeVersion(op.mapId, resolvedNodeId);
            const incomingExpectedVersion = Number(payload.expected_version);

            if (
              knownVersion !== null &&
              knownVersion > 0 &&
              (!Number.isFinite(incomingExpectedVersion) || knownVersion > incomingExpectedVersion)
            ) {
              payload.expected_version = knownVersion;
            }

            if (normalizedPayloadType) {
              payload.type = normalizedPayloadType;
            } else if (payload.type !== undefined) {
              delete payload.type;
            }

            if (payload.data && typeof payload.data === 'object') {
              if (normalizedDataType) {
                payload.data.type = normalizedDataType;
              } else if (payload.data.type !== undefined && payload.type) {
                payload.data.type = payload.type;
              }
            }

            if (payload.parent_id !== undefined && payload.parent_id !== null) {
              const resolvedParentId = this.resolveNodeId(op.mapId, String(payload.parent_id));
              if (!resolvedParentId) {
                this.deferOperation(op, 250);
                return { success: false };
              }
              payload.parent_id = resolvedParentId;
              op.payload.parent_id = resolvedParentId;
            }

            op.payload.id = resolvedNodeId;
            op.payload.expected_version = payload.expected_version;
            result = await nodesApi.update(resolvedNodeId, payload as any);
            this.assertApiSuccess(result, op.type);

            const returnedVersion = Number(result?.data?.version);
            const expectedVersion = Number(payload.expected_version);
            const nextVersion =
              Number.isFinite(returnedVersion) && returnedVersion > 0
                ? returnedVersion
                : Number.isFinite(expectedVersion) && expectedVersion > 0
                  ? expectedVersion + 1
                  : null;

            if (nextVersion) {
              this.setNodeVersion(op.mapId, resolvedNodeId, nextVersion);
              op.payload.expected_version = nextVersion;
            }
          }
          break;

        case 'node-delete':
          {
            let nodeId = String(op.payload.id || '');
            if (!nodeId) {
              return { success: true };
            }
            if (!isUuid(nodeId)) {
              const resolvedNodeId = this.resolveNodeId(op.mapId, nodeId);
              if (!resolvedNodeId) {
                // Node never reached server (or mapping unavailable) - treat as reconciled locally.
                return { success: true };
              }
              nodeId = resolvedNodeId;
            }
            result = await nodesApi.delete(nodeId, op.payload.cascade !== false);
          }
          this.assertApiSuccess(result, op.type);
          break;

        case 'edge-create':
          console.log(
            '[SaveQueue] Creating edge:',
            op.payload.source_id,
            '->',
            op.payload.target_id
          );
          {
            const payload = { ...op.payload } as Record<string, any>;
            const sourceId = this.resolveNodeId(op.mapId, String(payload.source_id || ''));
            const targetId = this.resolveNodeId(op.mapId, String(payload.target_id || ''));

            if (!sourceId || !targetId) {
              this.deferOperation(op, 250);
              return { success: false };
            }

            if (sourceId === targetId) {
              return { success: true };
            }

            payload.source_id = sourceId;
            payload.target_id = targetId;

            if (payload.id && !isUuid(String(payload.id))) {
              delete payload.id;
            }

            // Persist resolved ids back into operation payload for dedupe/status accounting.
            op.payload.source_id = sourceId;
            op.payload.target_id = targetId;

            result = await nodesApi.createEdge(payload as any);
          }
          if (result?.success === false) {
            const maybeConflict =
              (result as any)?.error?.code === 'CONFLICT' ||
              (result as any)?.error?.message === 'Edge already exists' ||
              (result as any)?.error === 'Edge already exists';
            if (maybeConflict) {
              return { success: true };
            }
            this.assertApiSuccess(result, op.type);
          }
          return {
            success: true,
            serverId: result?.data?.id,
          };

        case 'edge-delete': {
          const edgeId = String(op.payload.id || '');
          if (edgeId && isUuid(edgeId)) {
            result = await nodesApi.deleteEdge(edgeId);
            this.assertApiSuccess(result, op.type);
            break;
          }

          const rawSource = String(op.payload.source_id || '');
          const rawTarget = String(op.payload.target_id || '');
          const sourceId = this.resolveNodeId(op.mapId, rawSource) || rawSource;
          const targetId = this.resolveNodeId(op.mapId, rawTarget) || rawTarget;
          const mapId = String(op.payload.map_id || op.mapId || '');

          if (mapId && sourceId && targetId && isUuid(sourceId) && isUuid(targetId)) {
            result = await nodesApi.deleteEdgeByConnection({
              map_id: mapId,
              source_id: sourceId,
              target_id: targetId,
            });
            this.assertApiSuccess(result, op.type);
            break;
          }

          // Edge could not be resolved to a persistent identifier.
          return { success: true };
        }

        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }

      // Clear error and remove from queue
      op.lastError = undefined;
      op.nextRetryAt = undefined;
      op.dependencyAttempts = 0;
      return { success: true };
    } catch (err: any) {
      // Handle specific errors
      const statusCode = err?.statusCode || err?.status;
      const errorMessage = err?.message || 'Unknown error';
      const normalizedErrorMessage = String(errorMessage).toLowerCase();

      console.error(`[SaveQueue] Operation error (${op.type}):`, {
        statusCode,
        message: errorMessage,
      });

      if (
        statusCode === 400 &&
        op.type === 'node-create' &&
        normalizedErrorMessage.includes('invalid enum value')
      ) {
        op.lastError = `Non-retryable node type error: ${errorMessage}`;
        this.moveToDeadLetter(op);
        return { success: false };
      }

      if (
        statusCode === 400 &&
        op.type === 'node-create' &&
        normalizedErrorMessage.includes('parent node does not belong to the same map')
      ) {
        this.deferOperation(op, 400);
        return { success: false };
      }

      if (
        statusCode === 400 &&
        op.type === 'edge-create' &&
        normalizedErrorMessage.includes('one or both nodes do not exist in this map')
      ) {
        this.deferOperation(op, 400);
        return { success: false };
      }

      // 409 = conflict - could be duplicate (especially for edges)
      if (statusCode === 409 && op.type === 'edge-create') {
        console.log(`[SaveQueue] Conflict (409) for operation ${op.id} - treating as duplicate`);
        return { success: true };
      }

      if (statusCode === 409 && op.type === 'node-create') {
        const existingNodeId = String(op.payload.id || '');
        if (isUuid(existingNodeId)) {
          return { success: true, serverId: existingNodeId };
        }
      }

      if (statusCode === 409 && op.type === 'node-update') {
        const resolvedNodeId = this.resolveNodeId(op.mapId, String(op.payload.id || ''));

        if (resolvedNodeId) {
          try {
            const latestResponse = await nodesApi.get(resolvedNodeId);
            const latestNode = latestResponse?.data as Record<string, any> | undefined;

            if (latestNode) {
              const latestVersion = Number(latestNode.version);
              if (Number.isFinite(latestVersion) && latestVersion > 0) {
                this.setNodeVersion(op.mapId, resolvedNodeId, latestVersion);
              }

              if (this.isNodeStateSatisfied(latestNode, op.payload, op.mapId)) {
                return {
                  success: true,
                  serverId: resolvedNodeId,
                  serverVersion:
                    Number.isFinite(latestVersion) && latestVersion > 0
                      ? latestVersion
                      : undefined,
                };
              }

              const retryPayload = { ...op.payload } as Record<string, any>;
              if (Number.isFinite(latestVersion) && latestVersion > 0) {
                retryPayload.expected_version = latestVersion;
              } else {
                delete retryPayload.expected_version;
              }

              try {
                const retryResult = await nodesApi.update(resolvedNodeId, retryPayload as any);
                this.assertApiSuccess(retryResult, op.type);

                const retryVersion = Number((retryResult as any)?.data?.version);
                if (Number.isFinite(retryVersion) && retryVersion > 0) {
                  this.setNodeVersion(op.mapId, resolvedNodeId, retryVersion);
                  op.payload.expected_version = retryVersion;
                } else if (Number.isFinite(latestVersion) && latestVersion > 0) {
                  const nextVersion = latestVersion + 1;
                  this.setNodeVersion(op.mapId, resolvedNodeId, nextVersion);
                  op.payload.expected_version = nextVersion;
                }

                return {
                  success: true,
                  serverId: resolvedNodeId,
                  serverVersion:
                    Number.isFinite(retryVersion) && retryVersion > 0
                      ? retryVersion
                      : Number.isFinite(latestVersion) && latestVersion > 0
                        ? latestVersion + 1
                        : undefined,
                };
              } catch (retryErr: any) {
                const retryStatus = retryErr?.statusCode || retryErr?.status;
                if (retryStatus === 409 && Number.isFinite(latestVersion) && latestVersion > 0) {
                  const forcePayload = { ...op.payload } as Record<string, any>;
                  delete forcePayload.expected_version;

                  const forceResult = await nodesApi.update(resolvedNodeId, forcePayload as any);
                  this.assertApiSuccess(forceResult, op.type);

                  const forceVersion = Number((forceResult as any)?.data?.version);
                  if (Number.isFinite(forceVersion) && forceVersion > 0) {
                    this.setNodeVersion(op.mapId, resolvedNodeId, forceVersion);
                    op.payload.expected_version = forceVersion;
                  } else {
                    const nextVersion = latestVersion + 1;
                    this.setNodeVersion(op.mapId, resolvedNodeId, nextVersion);
                    op.payload.expected_version = nextVersion;
                  }

                  return {
                    success: true,
                    serverId: resolvedNodeId,
                    serverVersion:
                      Number.isFinite(forceVersion) && forceVersion > 0
                        ? forceVersion
                        : latestVersion + 1,
                  };
                }
              }
            }
          } catch (lookupErr) {
            console.warn('[SaveQueue] Failed to fetch latest node during conflict handling:', lookupErr);
          }
        }

        // Conflict without enough context: retry quickly without exponential backoff.
        this.deferOperation(op, 250);
        return { success: false };
      }

      // Treat only idempotent delete/update cleanup operations as reconciled on 404.
      if (statusCode === 404) {
        if (
          op.type === 'node-delete' ||
          op.type === 'edge-delete' ||
          op.type === 'map-update' ||
          op.type === 'node-update'
        ) {
          console.log(
            `[SaveQueue] Resource not found (404) for ${op.type}; treating as already reconciled`
          );
          return { success: true };
        }

        op.lastError = `Resource not found for ${op.type}: ${errorMessage}`;
        this.moveToDeadLetter(op);
        return { success: false };
      }

      // 401/403 = auth errors - don't retry, fail immediately
      if (statusCode === 401 || statusCode === 403) {
        console.error('[SaveQueue] Authentication error - user may not be logged in');
        op.lastError = 'Authentication failed: ' + errorMessage;
        this.moveToDeadLetter(op);
        return { success: false };
      }

      // Network/server error - retry with backoff
      op.retries++;
      op.lastError = errorMessage;
      op.nextRetryAt = Date.now() + this.calculateBackoff(op.retries);

      this.persistOperation(op);

      throw err;
    }
  }

  /**
   * Execute batch node update with better error handling
   */
  private async executeBatchNodeUpdate(ops: QueuedOperation[]): Promise<QueuedOperation[]> {
    const BATCH_TIMEOUT = 15000; // 15 seconds timeout

    try {
      const latestByResolvedNodeId = new Map<string, QueuedOperation>();

      for (const op of ops) {
        const rawNodeId = String(op.payload.id || '');
        const resolvedNodeId = this.resolveNodeId(op.mapId, rawNodeId);
        if (!resolvedNodeId) {
          this.deferOperation(op, 250);
          continue;
        }

        const resolvedPayload = { ...op.payload, id: resolvedNodeId } as Record<string, any>;
        const knownVersion = this.getNodeVersion(op.mapId, resolvedNodeId);
        const incomingExpectedVersion = Number(resolvedPayload.expected_version);
        if (
          knownVersion !== null &&
          knownVersion > 0 &&
          (!Number.isFinite(incomingExpectedVersion) || knownVersion > incomingExpectedVersion)
        ) {
          resolvedPayload.expected_version = knownVersion;
        }

        if (resolvedPayload.parent_id !== undefined && resolvedPayload.parent_id !== null) {
          const resolvedParentId = this.resolveNodeId(op.mapId, String(resolvedPayload.parent_id));
          if (!resolvedParentId) {
            this.deferOperation(op, 250);
            continue;
          }
          resolvedPayload.parent_id = resolvedParentId;
        }

        op.payload = resolvedPayload;
        // Deduplicate after ID resolution to avoid self-conflicts in the same batch.
        if (latestByResolvedNodeId.has(resolvedNodeId)) {
          latestByResolvedNodeId.delete(resolvedNodeId);
        }
        latestByResolvedNodeId.set(resolvedNodeId, op);
      }

      const readyOps = Array.from(latestByResolvedNodeId.values());
      if (readyOps.length === 0) {
        return [];
      }

      const payload = readyOps.map((op) => ({
        ...(normalizeNodeType(op.payload.type) && { type: normalizeNodeType(op.payload.type) }),
        id: op.payload.id,
        ...(op.payload.parent_id !== undefined && { parent_id: op.payload.parent_id }),
        position_x: op.payload.position_x,
        position_y: op.payload.position_y,
        ...(op.payload.label && { label: op.payload.label }),
        ...(op.payload.content !== undefined && { content: op.payload.content }),
        ...(op.payload.width !== undefined && { width: op.payload.width }),
        ...(op.payload.height !== undefined && { height: op.payload.height }),
        ...(op.payload.collapsed !== undefined && { collapsed: op.payload.collapsed }),
        ...(op.payload.style !== undefined && { style: op.payload.style }),
        ...(op.payload.data !== undefined && { data: op.payload.data }),
        ...(Number.isFinite(Number(op.payload.expected_version)) && {
          expected_version: Number(op.payload.expected_version),
        }),
      }));

      console.log('[SaveQueue] Attempting batch node update with', payload.length, 'nodes');

      // Set a timeout for the batch operation
      const batchPromise = nodesApi.batchUpdate(payload);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Batch update timeout')), BATCH_TIMEOUT);
      });

      const result = await Promise.race([batchPromise, timeoutPromise]);
      this.assertApiSuccess(result, 'node-update-batch');

      const failedCount = Number((result as any)?.data?.failed || 0);
      if (failedCount > 0) {
        throw new Error(
          `Batch update returned partial failure (${failedCount}/${payload.length} failed)`
        );
      }

      const returnedItems = Array.isArray((result as any)?.data?.items)
        ? ((result as any).data.items as any[])
        : [];
      const returnedVersionById = new Map<string, number>();
      for (const item of returnedItems) {
        const itemId = String(item?.id || '');
        const itemVersion = Number(item?.version);
        if (itemId && Number.isFinite(itemVersion) && itemVersion > 0) {
          returnedVersionById.set(itemId, itemVersion);
        }
      }

      for (const op of readyOps) {
        const nodeId = String(op.payload.id || '');
        if (!nodeId) continue;

        const returnedVersion = returnedVersionById.get(nodeId);
        if (typeof returnedVersion === 'number' && returnedVersion > 0) {
          this.setNodeVersion(op.mapId, nodeId, returnedVersion);
          op.payload.expected_version = returnedVersion;
          continue;
        }

        const expectedVersion = Number(op.payload.expected_version);
        if (Number.isFinite(expectedVersion) && expectedVersion > 0) {
          const nextVersion = expectedVersion + 1;
          this.setNodeVersion(op.mapId, nodeId, nextVersion);
          op.payload.expected_version = nextVersion;
        }
      }

      console.log('[SaveQueue] Batch node update succeeded');
      return readyOps;
    } catch (err: any) {
      console.warn('[SaveQueue] Batch update failed, will retry individual updates:', err?.message);
      throw err;
    }
  }

  private assertApiSuccess(result: any, operation: string): void {
    if (result?.success === false) {
      const message =
        result?.error?.message ||
        result?.message ||
        `Operation ${operation} returned success=false`;
      const code = result?.error?.code || 'API_ERROR';
      const err: any = new Error(message);
      err.code = code;
      err.statusCode = code === 'CONFLICT' ? 409 : 400;
      throw err;
    }
  }

  private getNodeVersion(mapId: string, nodeId: string): number | null {
    if (!mapId || !nodeId) return null;
    return this.nodeVersions.get(mapId)?.get(nodeId) ?? null;
  }

  private setNodeVersion(mapId: string, nodeId: string, version: number): void {
    if (!mapId || !nodeId || !Number.isFinite(version) || version <= 0) return;
    if (!this.nodeVersions.has(mapId)) {
      this.nodeVersions.set(mapId, new Map());
    }

    const versionMap = this.nodeVersions.get(mapId)!;
    const current = versionMap.get(nodeId);
    if (current === undefined || version >= current) {
      versionMap.set(nodeId, Math.floor(version));
    }
  }

  private clearNodeVersion(mapId: string, nodeId: string): void {
    if (!mapId || !nodeId) return;
    this.nodeVersions.get(mapId)?.delete(nodeId);
  }

  private remapNodeVersion(mapId: string, fromNodeId: string, toNodeId: string): void {
    if (!mapId || !fromNodeId || !toNodeId || fromNodeId === toNodeId) return;
    const versionMap = this.nodeVersions.get(mapId);
    if (!versionMap) return;

    const fromVersion = versionMap.get(fromNodeId);
    if (fromVersion !== undefined) {
      this.setNodeVersion(mapId, toNodeId, fromVersion);
      versionMap.delete(fromNodeId);
    }
  }

  private normalizeComparable(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeComparable(item));
    }

    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(value as Record<string, unknown>).sort()) {
        out[key] = this.normalizeComparable((value as Record<string, unknown>)[key]);
      }
      return out;
    }

    return value;
  }

  private isValueEqual(left: unknown, right: unknown): boolean {
    return JSON.stringify(this.normalizeComparable(left)) === JSON.stringify(this.normalizeComparable(right));
  }

  private isNodeStateSatisfied(
    serverNode: Record<string, any>,
    payload: Record<string, any>,
    mapId: string
  ): boolean {
    if (payload.label !== undefined && !this.isValueEqual(serverNode.label, payload.label)) {
      return false;
    }
    if (payload.content !== undefined && !this.isValueEqual(serverNode.content, payload.content)) {
      return false;
    }
    if (payload.type !== undefined && !this.isValueEqual(serverNode.type, payload.type)) {
      return false;
    }
    if (
      payload.position_x !== undefined &&
      !this.isValueEqual(serverNode.position_x, payload.position_x)
    ) {
      return false;
    }
    if (
      payload.position_y !== undefined &&
      !this.isValueEqual(serverNode.position_y, payload.position_y)
    ) {
      return false;
    }
    if (
      payload.collapsed !== undefined &&
      !this.isValueEqual(Boolean(serverNode.collapsed), Boolean(payload.collapsed))
    ) {
      return false;
    }

    if (payload.parent_id !== undefined) {
      const expectedParentRaw = payload.parent_id === null ? null : String(payload.parent_id);
      const expectedParent =
        expectedParentRaw === null
          ? null
          : this.resolveNodeId(mapId, expectedParentRaw) || expectedParentRaw;
      const serverParent = serverNode.parent_id === null ? null : String(serverNode.parent_id);
      if (!this.isValueEqual(serverParent, expectedParent)) {
        return false;
      }
    }

    if (payload.style !== undefined && !this.isValueEqual(serverNode.style, payload.style)) {
      return false;
    }
    if (payload.data !== undefined && !this.isValueEqual(serverNode.data, payload.data)) {
      return false;
    }

    return true;
  }

  private resolveNodeId(mapId: string, nodeId: string): string | null {
    if (!nodeId) return null;
    if (isUuid(nodeId)) return nodeId;
    return this.idMappings.get(mapId)?.get(nodeId) || null;
  }

  private deferOperation(op: QueuedOperation, delayMs: number): void {
    op.dependencyAttempts = (op.dependencyAttempts || 0) + 1;
    op.lastError = 'Waiting for dependency';
    if (op.dependencyAttempts >= op.maxRetries * 10) {
      this.moveToDeadLetter(op);
      return;
    }
    op.nextRetryAt = Date.now() + delayMs;
    this.persistOperation(op);
  }

  private moveToDeadLetter(op: QueuedOperation): void {
    this.deadLetter.push({
      ...op,
      nextRetryAt: undefined,
    });
    if (this.deadLetter.length > 100) {
      this.deadLetter = this.deadLetter.slice(this.deadLetter.length - 100);
    }
    this.queue.delete(op.id);
    this.deletePersistedOperation(op.id);
  }

  /**
   * Calculate exponential backoff
   */
  private calculateBackoff(retryCount: number): number {
    // 500ms, 1s, 2s, 4s
    return Math.min(500 * Math.pow(2, retryCount - 1), 5000);
  }

  /**
   * Persist operation to IndexedDB
   */
  private persistOperation(op: QueuedOperation): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.put(op);
  }

  /**
   * Delete operation from IndexedDB
   */
  private deletePersistedOperation(opId: string): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.delete(opId);
  }

  /**
   * Get current queue status
   */
  getStatus(mapId?: string): SaveStatus {
    const pendingByType: Record<string, number> = {
      'map-update': 0,
      'node-create': 0,
      'node-update': 0,
      'node-delete': 0,
      'edge-create': 0,
      'edge-delete': 0,
    };

    let activeRetries = 0;
    const failedOperations: QueuedOperation[] = [];
    const queueOps = this.getQueueOperations(mapId);
    const deadLetterOps = this.getDeadLetterOperations(mapId);

    for (const op of queueOps) {
      pendingByType[op.type]++;

      if (op.retries > 0) {
        activeRetries++;
      }

      if (op.retries >= op.maxRetries) {
        failedOperations.push(op);
      }
    }

    // Include dead-letter failures so UI can surface hard failures without blocking queue forever
    failedOperations.push(...deadLetterOps);

    return {
      queueLength: queueOps.length,
      isSaving: this.isSaving && (mapId ? queueOps.length > 0 : true),
      lastSuccessfulSave: this.lastSuccessfulSave,
      pendingByType,
      activeRetries,
      failedOperations,
    };
  }

  /**
   * Get ID mapping for a map
   */
  getIdMapping(mapId: string): Map<string, string> {
    return this.idMappings.get(mapId) || new Map();
  }

  requeueFailedOperations(mapId?: string): number {
    const toRequeue = this.getDeadLetterOperations(mapId);
    if (toRequeue.length === 0) return 0;

    this.deadLetter = this.deadLetter.filter((op) => {
      if (!mapId) return false;
      return op.mapId !== mapId;
    });

    for (const op of toRequeue) {
      const requeued: QueuedOperation = {
        ...op,
        id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        retries: 0,
        createdAt: Date.now(),
        lastError: undefined,
        nextRetryAt: undefined,
        dependencyAttempts: 0,
      };
      this.queue.set(requeued.id, requeued);
      this.persistOperation(requeued);
    }

    void this.processQueue();
    return toRequeue.length;
  }

  clearFailedOperations(mapId?: string): number {
    const before = this.deadLetter.length;
    this.deadLetter = this.deadLetter.filter((op) => {
      if (!mapId) return false;
      return op.mapId !== mapId;
    });
    return before - this.deadLetter.length;
  }

  /**
   * Force immediate processing (for Ctrl+S or unload)
   */
  async forceSync(
    options: { timeoutMs?: number; mapId?: string; includeDeadLetter?: boolean } = {}
  ): Promise<ForceSyncResult> {
    const timeoutMs = options.timeoutMs ?? 8000;
    const startedAt = Date.now();
    const mapId = options.mapId;

    if (options.includeDeadLetter) {
      this.requeueFailedOperations(mapId);
    }

    while (Date.now() - startedAt < timeoutMs) {
      if (!this.isSaving) {
        await this.processQueue();
      }

      const queueOps = this.getQueueOperations(mapId);
      if (queueOps.length === 0) {
        return {
          drained: true,
          remaining: 0,
          timedOut: false,
          failed: this.getDeadLetterOperations(mapId).length,
        };
      }

      const nextRetryAt = queueOps
        .map((op) => op.nextRetryAt || 0)
        .filter((ts) => ts > Date.now())
        .sort((a, b) => a - b)[0];

      const waitMs = nextRetryAt ? Math.min(Math.max(nextRetryAt - Date.now(), 100), 750) : 150;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    return {
      drained: this.getQueueOperations(mapId).length === 0,
      remaining: this.getQueueOperations(mapId).length,
      timedOut: true,
      failed: this.getDeadLetterOperations(mapId).length,
    };
  }

  /**
   * Cancel all pending operations for a specific map
   * Call this when a map is deleted to prevent orphaned operations
   */
  cancelMapQueue(mapId: string): number {
    let canceledCount = 0;

    // Remove from in-memory queue
    for (const [opId, op] of this.queue) {
      if (op.mapId === mapId) {
        this.queue.delete(opId);
        canceledCount++;
        this.deletePersistedOperation(opId);
      }
    }

    this.syncedEdgeKeys.delete(mapId);
    this.idMappings.delete(mapId);
    this.nodeVersions.delete(mapId);
    this.deadLetter = this.deadLetter.filter((op) => op.mapId !== mapId);

    return canceledCount;
  }

  /**
   * Clear queue (only for development/testing)
   */
  clear(): void {
    this.queue.clear();
    this.syncedEdgeKeys.clear();
    this.idMappings.clear();
    this.nodeVersions.clear();
    this.deadLetter = [];
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
    }
  }

  private getQueueOperations(mapId?: string): QueuedOperation[] {
    const values = Array.from(this.queue.values());
    if (!mapId) return values;
    return values.filter((op) => op.mapId === mapId);
  }

  private getDeadLetterOperations(mapId?: string): QueuedOperation[] {
    if (!mapId) return [...this.deadLetter];
    return this.deadLetter.filter((op) => op.mapId === mapId);
  }

  private getNodeOperationKey(op: QueuedOperation): string {
    return String(op.localId || op.payload.id || '');
  }

  private sortNodeCreateOperations(
    mapId: string,
    operations: QueuedOperation[]
  ): QueuedOperation[] {
    const operationByNodeId = new Map<string, QueuedOperation>();
    for (const op of operations) {
      const key = this.getNodeOperationKey(op);
      if (key) {
        operationByNodeId.set(key, op);
      }
    }

    const depthCache = new Map<string, number>();
    const activePath = new Set<string>();

    const getDepth = (op: QueuedOperation): number => {
      const key = this.getNodeOperationKey(op);
      if (!key) return 0;

      const cached = depthCache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      if (activePath.has(key)) {
        return 0;
      }

      activePath.add(key);

      const parentRaw = String(op.payload.parent_id || '');
      let depth = 0;
      if (parentRaw) {
        const mappedParentId = this.resolveNodeId(mapId, parentRaw) || parentRaw;
        const parentOp = operationByNodeId.get(mappedParentId);
        depth = parentOp ? getDepth(parentOp) + 1 : 1;
      }

      activePath.delete(key);
      depthCache.set(key, depth);
      return depth;
    };

    return [...operations].sort((a, b) => {
      const depthDiff = getDepth(a) - getDepth(b);
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.processIntervalId) {
      clearInterval(this.processIntervalId);
      this.processIntervalId = null;
    }
    if (this.db) {
      this.db.close();
    }
  }
}

export const advancedSaveQueue = new AdvancedSaveQueue();
