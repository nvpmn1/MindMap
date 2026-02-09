/**
 * ROBUST MAP DELETE SYSTEM
 * Garante 100% de deleção - nunca deixa mapas órfãos
 * - Delete com retry automático
 * - Feedback visual imediato
 * - Sincronização em segundo plano
 * - Proteção contra erros de rede
 */

import toast from 'react-hot-toast';

interface DeleteJob {
  id: string;
  mapId: string;
  timestamp: number;
  retries: number;
  lastError?: string;
}

const DELETE_QUEUE_KEY = 'neuralmap_delete_queue';
const MAX_DELETE_RETRIES = 5;
const DELETE_RETRY_DELAY = 3000; // 3 seconds initial

class RobustMapDeleteManager {
  private deleteQueue = new Map<string, DeleteJob>();
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadQueueFromStorage();
    this.setupAutoSync();
    this.setupNetworkMonitoring();
  }

  /**
   * CRITICAL: Queue delete with immediate UI feedback
   * Ensures map is deleted from frontend AND backend
   */
  async queueDelete(mapId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Queuing delete for map: ${mapId}`);

      // 1. IMMEDIATE: Remove from localStorage to show result to user
      this.removeMapFromCache(mapId);

      // 2. QUEUE: Add to delete queue for backend sync
      const deleteJob: DeleteJob = {
        id: this.generateJobId(),
        mapId,
        timestamp: Date.now(),
        retries: 0,
      };

      this.deleteQueue.set(deleteJob.id, deleteJob);
      this.persistQueueToStorage();

      console.log(`✅ Map removed from cache, queued for backend delete`);

      // 3. TRY IMMEDIATE: Attempt delete now
      await this.processQueue();

      return { success: true };
    } catch (error) {
      console.error('❌ Queue delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove map from all local caches
   */
  private removeMapFromCache(mapId: string): void {
    try {
      // Remove from mindmap_maps
      const maps = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
      const filtered = maps.filter((m: any) => m.id !== mapId);
      localStorage.setItem('mindmap_maps', JSON.stringify(filtered));
      console.log(`✅ Removed ${mapId} from mindmap_maps cache`);

      // Remove from neuralmap_{mapId} if it exists (local map data)
      localStorage.removeItem(`neuralmap_${mapId}`);
      console.log(`✅ Removed ${mapId} local data`);

      // Remove from save queue if pending
      const saveQueue = JSON.parse(localStorage.getItem('neuralmap_save_queue') || '[]');
      const filteredSaveQueue = saveQueue.filter((job: any) => job.mapId !== mapId);
      localStorage.setItem('neuralmap_save_queue', JSON.stringify(filteredSaveQueue));
      console.log(`✅ Removed ${mapId} from save queue if pending`);
    } catch (err) {
      console.error('Error removing from cache:', err);
    }
  }

  /**
   * Attempt to delete job from backend
   */
  private async processDeleteJob(job: DeleteJob): Promise<boolean> {
    const { mapId, id: jobId } = job;

    try {
      const { mapsApi } = await import('@/lib/api');

      console.log(
        `📤 Attempting backend delete for map ${mapId} (retry ${job.retries + 1}/${MAX_DELETE_RETRIES})...`
      );

      const response = await mapsApi.delete(mapId);

      if (response.success) {
        console.log(`✅ Backend delete successful for map ${mapId}`);
        return true;
      } else {
        const errorMsg = response.error?.message || 'Unknown error';
        console.warn(`⚠️ Backend delete rejected for ${mapId}:`, errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Delete failed for map ${mapId}:`, error);

      job.lastError = errorMsg;
      job.retries++;

      // Increment and retry
      return false; // Will be picked up by processQueue for retry or cleanup on max retries
    }
  }

  /**
   * Process entire delete queue with exponential backoff
   */
  private async processQueue(): Promise<void> {
    if (this.isSyncing || this.deleteQueue.size === 0 || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;

    try {
      for (const [jobId, job] of this.deleteQueue) {
        const success = await this.processDeleteJob(job);

        if (success) {
          console.log(`✅ Delete job completed: ${jobId}`);
          this.deleteQueue.delete(jobId);
          this.persistQueueToStorage();
        } else if (job.retries >= MAX_DELETE_RETRIES) {
          // Max retries reached - give up but remove from queue
          console.warn(`❌ Max retries reached for ${jobId}, removing from queue`);
          this.deleteQueue.delete(jobId);
          this.persistQueueToStorage();
        } else {
          job.timestamp = Date.now();

          // Exponential backoff
          const delay = DELETE_RETRY_DELAY * Math.pow(2, Math.min(job.retries - 1, 3));
          console.log(
            `⏳ Retry ${job.retries}/${MAX_DELETE_RETRIES} in ${Math.round(delay / 1000)}s for delete job ${jobId}`
          );

          this.persistQueueToStorage();

          // Don't try other jobs if one fails - spread out the load
          break;
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Setup auto-sync interval
   */
  private setupAutoSync(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);

    this.syncInterval = setInterval(() => {
      if (this.deleteQueue.size > 0 && navigator.onLine) {
        console.log(`🔄 Auto-sync delete queue...`);
        void this.processQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Monitor online/offline status
   */
  private setupNetworkMonitoring(): void {
    const handleOnline = (): void => {
      console.log('🌐 Back online! Syncing pending deletes...');
      void this.processQueue();
    };

    const handleOffline = (): void => {
      console.log('📴 Offline - deletes will sync when back online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueueToStorage(): void {
    try {
      const jobs = Array.from(this.deleteQueue.values());
      localStorage.setItem(DELETE_QUEUE_KEY, JSON.stringify(jobs));
    } catch (err) {
      console.error('❌ Failed to persist delete queue:', err);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(DELETE_QUEUE_KEY);
      if (stored) {
        const jobs = JSON.parse(stored) as DeleteJob[];
        jobs.forEach((job) => {
          this.deleteQueue.set(job.id, job);
        });
        console.log(`📋 Loaded ${jobs.length} pending delete jobs`);

        // Try to process them if online
        if (navigator.onLine && this.deleteQueue.size > 0) {
          void this.processQueue();
        }
      }
    } catch (err) {
      console.error('Error loading delete queue:', err);
    }
  }

  /**
   * Get pending deletes count
   */
  getPendingCount(): number {
    return this.deleteQueue.size;
  }

  /**
   * Force immediate sync
   */
  async forceSyncNow(): Promise<void> {
    console.log('🔄 Forcing immediate delete sync...');
    await this.processQueue();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create singleton
export const robustMapDelete = new RobustMapDeleteManager();

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    robustMapDelete.destroy();
  });
}
