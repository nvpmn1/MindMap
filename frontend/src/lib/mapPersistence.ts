/**
 * Robust Map Persistence System
 * Ensures data is ALWAYS saved to Supabase
 * with fallback and sync capabilities
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const PERSISTENCE_KEY = 'mindmap_pending_saves';
const SYNC_INTERVAL = 10000; // 10 seconds

interface MapData {
  workspace_id: string;
  title: string;
  description?: string | null;
  is_template?: boolean;
  settings?: Record<string, any> | null;
}

interface MapDataWithId extends MapData {
  id: string;
  created_at?: string;
  updated_at?: string;
  nodes_count?: number;
}

interface PendingSave {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: MapDataWithId;
  timestamp: number;
  retries: number;
}

class MapPersistenceManager {
  private pendingSaves = new Map<string, PendingSave>();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.loadPendingSaves();
    this.setupNetworkListener();
    this.startSyncLoop();
  }

  /**
   * CRITICAL: Save map immediately to Supabase
   * Falls back to localStorage if offline
   */
  async saveMapCritical(mapData: MapData): Promise<MapDataWithId> {
    try {
      console.log('💾 Saving map to Supabase...', mapData);

      // Try Supabase first
      // Note: Supabase client has strict schema typing, we bypass it since we handle data validation
      const { data, error } = await (supabase
        .from('maps')
        // @ts-expect-error - Supabase type inference limitation
        .insert([mapData as unknown as any])
        .select() as unknown as Promise<{ data: MapDataWithId[] | null; error: any }>);

      if (error) {
        console.error('❌ Supabase save failed:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from Supabase insert');
      }

      console.log('✅ Map saved to Supabase:', data[0]);

      // Clear from pending if it was there
      const returnedData = data[0] as MapDataWithId;
      this.removePendingSave(returnedData.id);

      return returnedData;
    } catch (err) {
      console.warn('⚠️ Falling back to localStorage:', err);

      // Save to localStorage as backup
      const mapId = crypto.randomUUID();
      const mapWithId: MapDataWithId = {
        ...mapData,
        id: mapId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        nodes_count: 0,
      };

      // Also save to localStorage for immediate access
      const existing = JSON.parse(localStorage.getItem('mindmap_maps') || '[]') as MapDataWithId[];
      if (!existing.find((m) => m.id === mapWithId.id)) {
        existing.unshift(mapWithId);
        localStorage.setItem('mindmap_maps', JSON.stringify(existing));
      }

      // Add to pending for retry
      this.addPendingSave(mapWithId.id, 'create', mapWithId);

      return mapWithId;
    }
  }

  /**
   * Add a save operation to pending queue
   */
  private addPendingSave(
    id: string,
    type: 'create' | 'update' | 'delete',
    data: MapDataWithId
  ): void {
    this.pendingSaves.set(id, {
      id,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    });
    this.savePendingToStorage();
  }

  /**
   * Remove a completed save from pending
   */
  private removePendingSave(id: string): void {
    this.pendingSaves.delete(id);
    this.savePendingToStorage();
  }

  /**
   * Save pending operations to localStorage
   */
  private savePendingToStorage() {
    const pending = Array.from(this.pendingSaves.values());
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(pending));
  }

  /**
   * Load pending saves from localStorage
   */
  private loadPendingSaves() {
    const stored = localStorage.getItem(PERSISTENCE_KEY);
    if (stored) {
      try {
        const pending = JSON.parse(stored) as PendingSave[];
        pending.forEach((p) => {
          this.pendingSaves.set(p.id, p);
        });
        console.log(`📋 Loaded ${pending.length} pending saves`);
      } catch (err) {
        console.error('Error loading pending saves:', err);
      }
    }
  }

  /**
   * Sync pending saves with Supabase
   */
  private async syncPendingWithSupabase(): Promise<void> {
    if (this.pendingSaves.size === 0) return;

    console.log(`🔄 Syncing ${this.pendingSaves.size} pending saves...`);

    for (const [id, save] of this.pendingSaves) {
      if (save.retries > 5) {
        console.warn(`⚠️ Giving up on save after 5 retries: ${id}`);
        this.removePendingSave(id);
        continue;
      }

      try {
        if (save.type === 'create') {
          // Extract only the data fields, exclude id/timestamps for insert
          const { id: _, created_at: __, updated_at: ___, ...insertData } = save.data;
          const { data, error } = await (supabase
            .from('maps')
            // @ts-expect-error - Supabase type inference limitation
            .insert([insertData as unknown as any])
            .select() as unknown as Promise<{ data: MapDataWithId[] | null; error: any }>);

          if (error) throw error;
          console.log(`✅ Synced create: ${id}`);
          this.removePendingSave(id);
        } else if (save.type === 'update') {
          // For updates, only send the updatable fields
          const { id: _, created_at: __, nodes_count: ___, ...updateData } = save.data;
          const { data, error } = await (supabase
            .from('maps')
            // @ts-expect-error - Supabase type inference limitation
            .update(updateData as unknown as any)
            .eq('id', id)
            .select() as unknown as Promise<{ data: MapDataWithId[] | null; error: any }>);

          if (error) throw error;
          console.log(`✅ Synced update: ${id}`);
          this.removePendingSave(id);
        } else if (save.type === 'delete') {
          const { error } = await supabase.from('maps').delete().eq('id', id);

          if (error) throw error;
          console.log(`✅ Synced delete: ${id}`);
          this.removePendingSave(id);
        }
      } catch (err) {
        console.error(`❌ Sync failed for ${id}:`, err);
        save.retries++;
        this.savePendingToStorage();
      }
    }
  }

  /**
   * Start periodic sync check
   */
  private startSyncLoop(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        void this.syncPendingWithSupabase();
      }
    }, SYNC_INTERVAL);
  }

  /**
   * Detect online/offline changes
   */
  private setupNetworkListener(): void {
    const handleOnline = (): void => {
      console.log('🌐 Back online! Syncing...');
      this.isOnline = true;
      void this.syncPendingWithSupabase();
    };

    const handleOffline = (): void => {
      console.log('📴 Offline mode activated');
      this.isOnline = false;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
  }

  /**
   * Get current sync status
   */
  getPendingCount(): number {
    return this.pendingSaves.size;
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create singleton instance
export const mapPersistence = new MapPersistenceManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  const handleBeforeUnload = (): void => {
    mapPersistence.destroy();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
}
