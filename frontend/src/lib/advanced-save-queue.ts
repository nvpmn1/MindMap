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

// ─── Types ──────────────────────────────────────────────────────────────

export interface QueuedOperation {
  id: string;
  mapId: string;
  type: 'map-update' | 'node-create' | 'node-update' | 'edge-create' | 'edge-delete';
  payload: Record<string, any>;
  retries: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
  nextRetryAt?: number;
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

// ─── Queue Manager ──────────────────────────────────────────────────────

class AdvancedSaveQueue {
  private queue: Map<string, QueuedOperation> = new Map();
  private isSaving = false;
  private lastSuccessfulSave: number | null = null;
  private processIntervalId: NodeJS.Timeout | null = null;
  private PROCESS_INTERVAL = 10000; // 10 seconds base interval
  private MAX_RETRIES = 4;
  private BATCH_SIZE = 50;
  private idMappings = new Map<string, Map<string, string>>(); // mapId -> localId -> serverId

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

      // Process each map
      for (const [mapId, ops] of mapGroups) {
        await this.processMapOperations(mapId, ops);
      }
    } finally {
      this.isSaving = false;
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
    const edgeCreates = operations.filter((op) => op.type === 'edge-create');
    const edgeDeletes = operations.filter((op) => op.type === 'edge-delete');

    const processed: QueuedOperation[] = [];

    try {
      // Step 1: Update map metadata (consolidate all to last one)
      if (mapUpdates.length > 0) {
        const lastMapUpdate = mapUpdates[mapUpdates.length - 1];
        try {
          await this.executeWithRetry(lastMapUpdate);
          processed.push(lastMapUpdate);
        } catch (err) {
          console.warn(`[SaveQueue] Failed to update map metadata:`, err);
        }
      }

      // Step 2: Create new nodes in batch
      if (nodeCreates.length > 0) {
        for (let i = 0; i < nodeCreates.length; i += this.BATCH_SIZE) {
          const batch = nodeCreates.slice(i, i + this.BATCH_SIZE);
          for (const op of batch) {
            try {
              const result = await this.executeWithRetry(op);
              if (result.success && result.serverId) {
                // Store ID mapping for future edge creation
                if (!this.idMappings.has(mapId)) {
                  this.idMappings.set(mapId, new Map());
                }
                this.idMappings.get(mapId)!.set(op.localId || op.payload.id, result.serverId);
              }
              processed.push(op);
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
            await this.executeBatchNodeUpdate(batch);
            processed.push(...batch);
          } catch (err) {
            console.warn(`[SaveQueue] Batch node update failed, falling back to individual updates:`, err);
            // Fallback: Individual updates
            for (const op of batch) {
              try {
                await this.executeWithRetry(op);
                processed.push(op);
              } catch (innerErr) {
                console.warn(`[SaveQueue] Individual node update failed for ${op.payload.id}:`, innerErr);
              }
            }
          }
        }
      }

      // Step 4: Create edges (after node IDs are resolved)
      if (edgeCreates.length > 0) {
        for (const op of edgeCreates) {
          try {
            await this.executeWithRetry(op);
            processed.push(op);
          } catch (err: any) {
            // 409 conflict usually means edge already exists - safe to ignore
            if (err?.statusCode === 409) {
              console.log(`[SaveQueue] Edge already exists (409), skipping:`, op.payload);
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
            await this.executeWithRetry(op);
            processed.push(op);
          } catch (err) {
            console.warn(`[SaveQueue] Failed to delete edge:`, err);
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
        console.log(`[SaveQueue] Processed ${processed.length}/${operations.length} operations for map ${mapId}`);
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
  ): Promise<{ success: boolean; serverId?: string }> {
    // Check if should retry
    if (op.retries >= op.maxRetries) {
      console.warn(`[SaveQueue] Max retries exceeded for operation ${op.id}`);
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
          break;

        case 'node-create':
          console.log('[SaveQueue] Creating node:', op.payload.id);
          result = await nodesApi.create(op.payload as any);
          return {
            success: result?.success !== false,
            serverId: result?.data?.id,
          };

        case 'node-update':
          result = await nodesApi.update(op.payload.id, op.payload);
          break;

        case 'edge-create':
          console.log('[SaveQueue] Creating edge:', op.payload.source_id, '->', op.payload.target_id);
          result = await nodesApi.createEdge(op.payload as any);
          return {
            success: result?.success !== false,
            serverId: result?.data?.id,
          };

        case 'edge-delete':
          result = await nodesApi.deleteEdge(op.payload.id);
          break;

        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }

      // Clear error and remove from queue
      op.lastError = undefined;
      return { success: true };
    } catch (err: any) {
      // Handle specific errors
      const statusCode = err?.statusCode || err?.status;
      const errorMessage = err?.message || 'Unknown error';

      console.error(`[SaveQueue] Operation error (${op.type}):`, { statusCode, message: errorMessage });

      // 404 = resource not found on batch update - try individual updates instead
      if (statusCode === 404 && op.type === 'node-update') {
        console.warn(`[SaveQueue] Got 404 on node update, will fall back to individual updates`);
        // Don't immediately fail - let the caller know to retry
      }

      // 409 = conflict - could be duplicate (especially for edges)
      if (statusCode === 409) {
        console.log(`[SaveQueue] Conflict (409) for operation ${op.id} - likely duplicate, will retry`);
        // Still retry, as it might be transient
      }

      // 401/403 = auth errors - don't retry, fail immediately
      if (statusCode === 401 || statusCode === 403) {
        console.error('[SaveQueue] Authentication error - user may not be logged in');
        op.lastError = 'Authentication failed: ' + errorMessage;
        throw err;
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
  private async executeBatchNodeUpdate(ops: QueuedOperation[]): Promise<void> {
    const BATCH_TIMEOUT = 15000; // 15 seconds timeout

    try {
      const payload = ops.map((op) => ({
        id: op.payload.id,
        position_x: op.payload.position_x,
        position_y: op.payload.position_y,
        ...(op.payload.label && { label: op.payload.label }),
        ...(op.payload.content !== undefined && { content: op.payload.content }),
        ...(op.payload.type && { type: op.payload.type }),
      }));

      console.log('[SaveQueue] Attempting batch node update with', payload.length, 'nodes');

      // Set a timeout for the batch operation
      const batchPromise = nodesApi.batchUpdate(payload);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Batch update timeout')), BATCH_TIMEOUT);
      });

      await Promise.race([batchPromise, timeoutPromise]);
      console.log('[SaveQueue] Batch node update succeeded');

      // Remove from queue only if successful
      for (const op of ops) {
        this.queue.delete(op.id);
        this.deletePersistedOperation(op.id);
      }
    } catch (err: any) {
      console.warn('[SaveQueue] Batch update failed, will retry individual updates:', err?.message);
      // Don't throw - let individual updates handle the retry logic
      throw err;
    }
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
  getStatus(): SaveStatus {
    const pendingByType: Record<string, number> = {
      'map-update': 0,
      'node-create': 0,
      'node-update': 0,
      'edge-create': 0,
      'edge-delete': 0,
    };

    let activeRetries = 0;
    const failedOperations: QueuedOperation[] = [];

    for (const [, op] of this.queue) {
      pendingByType[op.type]++;

      if (op.retries > 0) {
        activeRetries++;
      }

      if (op.retries >= op.maxRetries) {
        failedOperations.push(op);
      }
    }

    return {
      queueLength: this.queue.size,
      isSaving: this.isSaving,
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

  /**
   * Force immediate processing (for Ctrl+S or unload)
   */
  async forceSync(): Promise<void> {
    await this.processQueue();
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

    return canceledCount;
  }

  /**
   * Clear queue (only for development/testing)
   */
  clear(): void {
    this.queue.clear();
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
    }
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
