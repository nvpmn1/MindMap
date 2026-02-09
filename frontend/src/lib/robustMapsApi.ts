/**
 * Robust Maps API - Clean wrapper around backend API
 * No localStorage fallbacks - all data goes through the API
 */

import { mapsApi } from '@/lib/api';
import { mapPersistence } from '@/lib/mapPersistence';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface MapRecord {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  is_template?: boolean;
  settings?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  nodes_count?: number;
}

class RobustMapsApi {
  /**
   * Create a map via the backend API
   */
  async create(data: {
    workspace_id: string;
    title: string;
    description?: string;
  }): Promise<ApiResponse<MapRecord>> {
    const response = (await mapsApi.create(data)) as ApiResponse<MapRecord>;
    return response;
  }

  /**
   * List maps from the backend API, with cache update
   */
  async list(query: {
    workspace_id: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<MapRecord[]>> {
    const response = (await mapsApi.list(query)) as ApiResponse<MapRecord[]>;

    // Update cache for faster subsequent loads
    if (response.success && response.data && Array.isArray(response.data)) {
      mapPersistence.updateCache(response.data);
    }

    return response;
  }

  /**
   * Delete a map via the backend API
   */
  async delete(mapId: string): Promise<ApiResponse<null>> {
    const response = (await mapsApi.delete(mapId)) as ApiResponse<null>;

    // Remove from local cache
    mapPersistence.removeFromCache(mapId);

    return response;
  }

  /**
   * Duplicate a map via the backend API
   */
  async duplicate(mapId: string): Promise<ApiResponse<MapRecord>> {
    const response = (await mapsApi.duplicate(mapId)) as ApiResponse<MapRecord>;
    return response;
  }

  /**
   * Force sync - no-op since everything is API-based now
   */
  async forceSyncPending(): Promise<{ success: boolean; pending: number }> {
    return { success: true, pending: 0 };
  }
}

export const robustMapsApi = new RobustMapsApi();
