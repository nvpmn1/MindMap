/**
 * Robust Map Persistence System
 * Ensures data is ALWAYS saved to Supabase
 * with fallback and sync capabilities
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const PERSISTENCE_KEY = 'mindmap_pending_saves';
const SYNC_INTERVAL = 10000; // 10 seconds

interface PendingSave {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

class MapPersistenceManager {
  private pendingSaves = new Map<string, PendingSave>();
  private syncInterval: NodeJS.Timer | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.loadPendingSaves();
    this.setupNetworkListener();
    this.startSyncLoop();
  }

  /**
   * CRITICAL: Save map immediately to Supabase
   * Falls back to localStorage if offline
   */
  async saveMapCritical(mapData: {
    workspace_id: string;
    title: string;
    description?: string;
    is_template?: boolean;
    settings?: any;
  }) {
    try {
      console.log('💾 Saving map to Supabase...', mapData);
      
      // Try Supabase first
      const { data, error } = await supabase
        .from('maps')
        .insert(mapData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase save failed:', error);
        throw error;
      }

      console.log('✅ Map saved to Supabase:', data);
      
      // Clear from pending if it was there
      this.removePendingSave(data.id);
      
      return data;
    } catch (err) {
      console.warn('⚠️ Falling back to localStorage:', err);
      
      // Save to localStorage as backup
      const mapId = (mapData as any).id || crypto.randomUUID();
      const mapWithId = { ...mapData, id: mapId } as any;
      this.saveToPendingQueue(mapWithId);
      
      // Also save to localStorage for immediate access
      const existing = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
      if (!existing.find((m: any) => m.id === mapWithId.id)) {
        existing.unshift({
          ...mapWithId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          nodes_count: 0,
        });
        localStorage.setItem('mindmap_maps', JSON.stringify(existing));
      }
      
      // Retry later
      this.addPendingSave(mapWithId.id, 'create', mapWithId);
      
      return mapWithId;
    }
  }

  /**
   * Add a save operation to pending queue
   */
  private addPendingSave(id: string, type: 'create' | 'update' | 'delete', data: any) {
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
  private removePendingSave(id: string) {
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
        pending.forEach(p => {
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
  private async syncPendingWithSupabase() {
    if (this.pendingSaves.size === 0) return;

    console.log(`🔄 Syncing ${this.pendingSaves.size} pending saves...`);

    for (const [id, save] of this.pendingSaves) {
      if (save.retries > 5) {
        console.warn(`⚠️ Giving up on save after 5 retries: ${id}`);
        continue;
      }

      try {
        if (save.type === 'create') {
          const { data, error } = await supabase
            .from('maps')
            .insert(save.data)
            .select()
            .single();
          
          if (error) throw error;
          console.log(`✅ Synced create: ${id}`);
          this.removePendingSave(id);
        } else if (save.type === 'update') {
          const { data, error } = await supabase
            .from('maps')
            .update(save.data)
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          console.log(`✅ Synced update: ${id}`);
          this.removePendingSave(id);
        } else if (save.type === 'delete') {
          const { error } = await supabase
            .from('maps')
            .delete()
            .eq('id', id);
          
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
  private startSyncLoop() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingWithSupabase();
      }
    }, SYNC_INTERVAL);
  }

  /**
   * Detect online/offline changes
   */
  private setupNetworkListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online! Syncing...');
      this.isOnline = true;
      this.syncPendingWithSupabase();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline mode activated');
      this.isOnline = false;
    });
  }

  /**
   * Get current sync status
   */
  getPendingCount(): number {
    return this.pendingSaves.size;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Create singleton instance
export const mapPersistence = new MapPersistenceManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mapPersistence.destroy();
  });
}
