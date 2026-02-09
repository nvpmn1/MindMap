/**
 * Robust Map Delete - Clean deletion via backend API
 * No localStorage queues - direct API calls with retry
 */

import { mapsApi } from '@/lib/api';
import { mapPersistence } from '@/lib/mapPersistence';

const MAX_RETRIES = 3;

class RobustMapDeleteManager {
  /**
   * Delete a map via the backend API with retry
   */
  async queueDelete(mapId: string): Promise<{ success: boolean; error?: string }> {
    // Remove from local cache immediately for instant UI feedback
    mapPersistence.removeFromCache(mapId);

    let lastError = '';
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await mapsApi.delete(mapId);
        if (response.success || (response as any).message) {
          console.log('[Delete] Map deleted:', mapId);
          return { success: true };
        }
        lastError = (response as any)?.error?.message || 'Delete failed';
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        // If 404, map is already gone - that's fine
        if (err?.statusCode === 404) {
          console.log('[Delete] Map already gone:', mapId);
          return { success: true };
        }
        // Wait before retry
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    console.error('[Delete] Failed after retries:', mapId, lastError);
    return { success: false, error: lastError };
  }

  getPendingCount(): number {
    return 0;
  }

  async forceSyncNow(): Promise<void> {
    // No-op
  }

  destroy(): void {
    // Nothing to clean up
  }
}

export const robustMapDelete = new RobustMapDeleteManager();
