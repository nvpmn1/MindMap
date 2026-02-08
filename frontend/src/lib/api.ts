import { getAccessToken } from './supabase';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MAX_RETRIES = 2;
const RETRY_DELAY = 500; // ms

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
  retries?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Enhanced API client with retry logic, better error handling, and caching
 */
class ApiClient {
  private baseUrl: string;
  private requestCache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get auth headers with proper validation
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        return headers;
      }

      // Fallback: Use profile-based headers only if user is logged in
      const { profile, user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && (profile || user)) {
        const profileId = profile?.id || user?.id;
        const email = profile?.email || user?.email || '';
        const name = profile?.display_name || user?.display_name || 'Guest';
        const color = profile?.color || user?.color || '#00D9FF';

        // Only set headers if we have a valid profile ID
        if (profileId && profileId !== '') {
          headers['x-profile-id'] = profileId;
          headers['x-profile-email'] = email;
          headers['x-profile-name'] = name;
          headers['x-profile-color'] = color;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to get auth headers:', error);
      // Continue without auth
    }

    return headers;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Build cache key for GET requests
   */
  private getCacheKey(endpoint: string, method: string): string | null {
    if (method === 'GET') {
      return `${this.baseUrl}${endpoint}`;
    }
    return null;
  }

  /**
   * Main fetch method with retry logic and error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { authenticated = true, retries = MAX_RETRIES, ...fetchOptions } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();

    // Check cache for GET requests
    const cacheKey = this.getCacheKey(endpoint, method);
    if (cacheKey && method === 'GET') {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`✅ Cache hit for ${endpoint}`);
        return cached.data;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth headers
    if (authenticated) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    // Merge any custom headers
    if (fetchOptions.headers) {
      Object.assign(headers, fetchOptions.headers);
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object'
            ? data.error?.message || data.message || 'Request failed'
            : 'Request failed';

        const errorCode =
          typeof data === 'object' ? data.error?.code || 'UNKNOWN_ERROR' : 'UNKNOWN_ERROR';

        throw new ApiError(errorMessage, errorCode, response.status);
      }

      // Ensure response has expected structure
      const apiResponse: ApiResponse<T> = typeof data === 'object' ? data : { success: true, data };

      // Cache successful GET responses
      if (cacheKey && method === 'GET' && apiResponse.success) {
        this.requestCache.set(cacheKey, {
          data: apiResponse,
          timestamp: Date.now(),
        });
      }

      return apiResponse;
    } catch (error) {
      // Only retry on network errors, not application errors (400/500)
      const isNetworkError = error instanceof TypeError || 
                            (error instanceof DOMException && error.name === 'AbortError');
      const isServerError = error instanceof ApiError && (error.statusCode === 0 || error.statusCode >= 500);
      
      if (retries > 0 && (isNetworkError || isServerError)) {
        console.warn(`⚠️ Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await this.sleep(RETRY_DELAY);
        return this.fetch<T>(endpoint, { ...options, retries: retries - 1 });
      }

      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout - server took too long to respond', 'TIMEOUT', 0);
      }

      // Network or other errors
      console.error('❌ API request failed:', error);
      throw new ApiError(
        'Failed to connect to server. Please check your connection.',
        'NETWORK_ERROR',
        0
      );
    }
  }

  // GET request
  async get<T>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Custom API Error
export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Typed API methods
export const authApi = {
  sendMagicLink: (email: string) =>
    api.post('/api/auth/magic-link', { email }, { authenticated: false }),

  verifyOtp: (email: string, token: string) =>
    api.post('/api/auth/verify', { email, token }, { authenticated: false }),

  refreshToken: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refresh_token: refreshToken }, { authenticated: false }),

  logout: () =>
    api.post('/api/auth/logout'),

  getMe: () =>
    api.get('/api/auth/me'),

  updateProfile: (data: {
    display_name?: string;
    avatar_url?: string | null;
    color?: string;
    preferences?: Record<string, unknown>;
  }) =>
    api.patch('/api/auth/me', data),
};

export const mapsApi = {
  list: (params?: { workspace_id?: string; search?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.workspace_id) searchParams.set('workspace_id', params.workspace_id);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    return api.get(`/api/maps?${searchParams}`);
  },

  get: (mapId: string) =>
    api.get(`/api/maps/${mapId}`),

  create: (data: { workspace_id: string; title: string; description?: string }) =>
    api.post('/api/maps', data),

  update: (mapId: string, data: { title?: string; description?: string; settings?: Record<string, unknown> }) =>
    api.patch(`/api/maps/${mapId}`, data),

  delete: (mapId: string) =>
    api.delete(`/api/maps/${mapId}`),

  duplicate: (mapId: string, title?: string) =>
    api.post(`/api/maps/${mapId}/duplicate`, { title }),
};

export const nodesApi = {
  listByMap: (mapId: string) =>
    api.get(`/api/nodes/map/${mapId}`),

  get: (nodeId: string) =>
    api.get(`/api/nodes/${nodeId}`),

  create: (data: {
    map_id: string;
    parent_id?: string | null;
    type?: string;
    label: string;
    content?: string;
    position_x?: number;
    position_y?: number;
  }) =>
    api.post('/api/nodes', data),

  update: (nodeId: string, data: {
    label?: string;
    content?: string;
    type?: string;
    position_x?: number;
    position_y?: number;
    collapsed?: boolean;
    style?: Record<string, unknown>;
    data?: Record<string, unknown>;
  }) =>
    api.patch(`/api/nodes/${nodeId}`, data),

  batchUpdate: (nodes: Array<{
    id: string;
    position_x?: number;
    position_y?: number;
    collapsed?: boolean;
  }>) =>
    api.patch('/api/nodes/batch', { nodes }),

  delete: (nodeId: string, cascade = true) =>
    api.delete(`/api/nodes/${nodeId}?cascade=${cascade}`),

  // Edges
  getEdges: (mapId: string) =>
    api.get(`/api/nodes/edges/map/${mapId}`),

  createEdge: (data: { map_id: string; source_id: string; target_id: string; type?: string }) =>
    api.post('/api/nodes/edges', data),

  deleteEdge: (edgeId: string) =>
    api.delete(`/api/nodes/edges/${edgeId}`),

  // Comments
  getComments: (nodeId: string) =>
    api.get(`/api/nodes/${nodeId}/comments`),

  addComment: (nodeId: string, content: string, mentions?: string[]) =>
    api.post(`/api/nodes/${nodeId}/comments`, { content, mentions }),

  deleteComment: (commentId: string) =>
    api.delete(`/api/nodes/comments/${commentId}`),
};

export const tasksApi = {
  list: (params?: {
    map_id?: string;
    workspace_id?: string;
    status?: string;
    assigned_to_me?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.map_id) searchParams.set('map_id', params.map_id);
    if (params?.workspace_id) searchParams.set('workspace_id', params.workspace_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assigned_to_me) searchParams.set('assigned_to_me', 'true');
    return api.get(`/api/tasks?${searchParams}`);
  },

  getKanban: (mapId: string) =>
    api.get(`/api/tasks/kanban/${mapId}`),

  get: (taskId: string) =>
    api.get(`/api/tasks/${taskId}`),

  create: (data: {
    node_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    due_date?: string;
    tags?: string[];
  }) =>
    api.post('/api/tasks', data),

  update: (taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string | null;
    due_date?: string | null;
    tags?: string[];
    checklist?: Array<{ id: string; text: string; done: boolean }>;
  }) =>
    api.patch(`/api/tasks/${taskId}`, data),

  reorder: (tasks: Array<{ id: string; order_index: number; status?: string }>) =>
    api.patch('/api/tasks/reorder', { tasks }),

  delete: (taskId: string) =>
    api.delete(`/api/tasks/${taskId}`),

  getStats: (workspaceId: string) =>
    api.get(`/api/tasks/stats/${workspaceId}`),
};

export const aiApi = {
  generate: (data: {
    map_id: string;
    prompt: string;
    parent_node_id?: string;
    context?: { existing_nodes?: Array<{ id: string; label: string }>; map_title?: string };
    options?: { count?: number; style?: string };
  }) =>
    api.post('/api/ai/generate', data),

  expand: (data: {
    map_id: string;
    node_id: string;
    context: { node: { id: string; label: string; type: string; content?: string } };
    options?: { count?: number; direction?: string };
  }) =>
    api.post('/api/ai/expand', data),

  summarize: (data: {
    map_id: string;
    context: { nodes: Array<{ id: string; label: string; type: string; content?: string }> };
    options?: { format?: string; length?: string };
  }) =>
    api.post('/api/ai/summarize', data),

  toTasks: (data: {
    map_id: string;
    node_ids: string[];
    context: { nodes: Array<{ id: string; label: string; type: string; content?: string }> };
    options?: { include_subtasks?: boolean };
  }) =>
    api.post('/api/ai/to-tasks', data),

  chat: (data: {
    map_id: string;
    message: string;
    context?: {
      nodes?: Array<{ id: string; label: string }>;
      conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
  }) =>
    api.post('/api/ai/chat', data),

  getHistory: (mapId: string) =>
    api.get(`/api/ai/history/${mapId}`),

  applyRun: (runId: string, selectedItems?: number[]) =>
    api.post(`/api/ai/apply/${runId}`, { selected_items: selectedItems }),

  getUsage: (period = '30d') =>
    api.get(`/api/ai/usage?period=${period}`),
};
