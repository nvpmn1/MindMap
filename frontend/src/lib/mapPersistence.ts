/**
 * Map Persistence Manager
 * All data operations go through the backend API.
 * localStorage is used ONLY as a temporary cache for display, never as source of truth.
 */

import { mapsApi } from '@/lib/api';
import { logger } from '@/lib/logger';

const CACHE_KEY = 'mindmap_maps_cache';
const LEGACY_CACHE_KEY = 'mindmap_maps';

interface MapData {
  workspace_id: string;
  title: string;
  description?: string | null;
}

interface MapRecord {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  is_template?: boolean;
  settings?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

class MapPersistenceManager {
  /**
   * Create a map via the backend API.
   * Returns the map record from the server.
   */
  async createMap(mapData: MapData): Promise<MapRecord> {
    const safeData = {
      ...mapData,
      description: mapData.description ?? '', // Convert null to empty string
    };
    const response = await mapsApi.create(safeData);

    if (!response.success || !response.data) {
      throw new Error('Failed to create map on server');
    }

    const created = response.data as MapRecord;
    logger.info('Map created via API:', created.id);
    return created;
  }

  /**
   * Update local cache (for faster list loading).
   * This is NOT a save mechanism - just display optimization.
   */
  updateCache(maps: MapRecord[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(maps));
    } catch {
      // localStorage full or unavailable - not critical
    }
  }

  /**
   * Get cached maps for instant display while API loads.
   */
  getCachedMaps(): MapRecord[] {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);

      // Migrate legacy cache if present
      const legacy = localStorage.getItem(LEGACY_CACHE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as MapRecord[];
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        localStorage.removeItem(LEGACY_CACHE_KEY);
        return Array.isArray(parsed) ? parsed : [];
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Remove a map from the cache.
   */
  removeFromCache(mapId: string): void {
    try {
      const maps = this.getCachedMaps();
      const filtered = maps.filter((m) => m.id !== mapId);
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    } catch {
      // Not critical
    }
  }

  /**
   * Clear all caches.
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(LEGACY_CACHE_KEY);
    } catch {
      // Not critical
    }
  }

  // Backward compat - no pending saves anymore
  getPendingCount(): number {
    return 0;
  }

  // Backward compat
  async saveMapCritical(mapData: MapData): Promise<MapRecord> {
    return this.createMap(mapData);
  }

  destroy(): void {
    // Nothing to clean up
  }
}

export const mapPersistence = new MapPersistenceManager();
