/**
 * Robust Map Delete - Clean deletion via backend API
 * No localStorage queues - direct API calls with retry
 */

import { mapsApi } from '@/lib/api';
import { mapPersistence } from '@/lib/mapPersistence';

const MAX_RETRIES = 3;

class RobustMapDeleteManager {
  private pendingCount = 0;
  private lastStatus: 'idle' | 'deleted' | 'error' = 'idle';
  private lastUpdated = 0;

  /**
   * Delete a map via the backend API with retry
   */
  async queueDelete(mapId: string): Promise<{ success: boolean; error?: string }> {
    this.pendingCount += 1;
    this.lastStatus = 'idle';
    this.lastUpdated = Date.now();

    // Cancel any pending save operations before delete to avoid stale writes after removal.
    try {
      const { advancedSaveQueue } = await import('@/lib/advanced-save-queue');
      advancedSaveQueue.cancelMapQueue(mapId);
    } catch (error) {
      console.warn('[Delete] Failed to cancel pending save queue:', error);
    }

    let lastError = '';
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await mapsApi.delete(mapId);
        if (response.success || (response as any).message) {
          // Invalidate cache only when backend confirms deletion.
          mapPersistence.removeFromCache(mapId);
          console.log('[Delete] Map deleted:', mapId);
          this.pendingCount = Math.max(0, this.pendingCount - 1);
          this.lastStatus = 'deleted';
          this.lastUpdated = Date.now();
          return { success: true };
        }
        lastError = (response as any)?.error?.message || 'Delete failed';
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        // If 404, map is already gone - that's fine
        if (err?.statusCode === 404) {
          // Resource is already gone server-side: cache can be safely invalidated.
          mapPersistence.removeFromCache(mapId);
          console.log('[Delete] Map already gone:', mapId);
          this.pendingCount = Math.max(0, this.pendingCount - 1);
          this.lastStatus = 'deleted';
          this.lastUpdated = Date.now();
          return { success: true };
        }
        // Authorization errors are not recoverable by retry.
        if (err?.statusCode === 401 || err?.statusCode === 403) {
          console.warn('[Delete] Delete denied by authorization policy:', mapId);
          this.pendingCount = Math.max(0, this.pendingCount - 1);
          this.lastStatus = 'error';
          this.lastUpdated = Date.now();
          return { success: false, error: lastError };
        }
        // Wait before retry
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    console.error('[Delete] Failed after retries:', mapId, lastError);
    this.pendingCount = Math.max(0, this.pendingCount - 1);
    this.lastStatus = 'error';
    this.lastUpdated = Date.now();
    return { success: false, error: lastError };
  }

  getPendingCount(): number {
    return this.pendingCount;
  }

  getStatus(): {
    pendingCount: number;
    lastStatus: 'idle' | 'deleted' | 'error';
    lastUpdated: number;
  } {
    return {
      pendingCount: this.pendingCount,
      lastStatus: this.lastStatus,
      lastUpdated: this.lastUpdated,
    };
  }

  async forceSyncNow(): Promise<void> {
    // No-op
  }

  destroy(): void {
    // Nothing to clean up
  }
}

export const robustMapDelete = new RobustMapDeleteManager();
