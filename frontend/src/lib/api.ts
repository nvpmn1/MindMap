import { getAccessToken } from './supabase';

const DEFAULT_DEV_API_URL = 'http://localhost:3001';
const DEFAULT_PROD_API_URL = 'https://mindmap-hub-api.onrender.com';

// Avoid shipping a production build that calls localhost if VITE_API_URL is missing.
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);
const MAX_RETRIES = 2;
const RETRY_DELAY = 500; // ms
const DEFAULT_TIMEOUT_MS = import.meta.env.PROD ? 20000 : 12000;
const AUTH_TIMEOUT_MS = import.meta.env.PROD ? 35000 : 18000;

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
  retries?: number;
  useCache?: boolean;
  timeoutMs?: number;
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

function base64UrlDecodeToString(input: string): string {
  // base64url -> base64
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${'='.repeat(padLen)}`;

  // Browser (Vite) path
  if (typeof atob === 'function') {
    return atob(padded);
  }

  // Node fallback (e.g., test runners)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  throw new Error('No base64 decoder available');
}

function fnv1a32(input: string): string {
  // Non-cryptographic, stable hash for cache key scoping.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // hash *= 16777619 (with overflow)
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function extractJwtSubject(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payloadJson = base64UrlDecodeToString(parts[1]);
    const payload = JSON.parse(payloadJson) as { sub?: unknown; user_id?: unknown; id?: unknown };

    const sub = payload?.sub ?? payload?.user_id ?? payload?.id;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

function extractAuthCacheScope(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const value = String(authHeader);
  if (!value.toLowerCase().startsWith('bearer ')) return null;

  const token = value.slice('bearer '.length).trim();
  if (!token) return null;

  const sub = extractJwtSubject(token);
  if (sub) return `uid:${sub}`;
  return `tok:${fnv1a32(token)}`;
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
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // If token is missing, request will be unauthenticated.
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
  private getCacheKey(
    endpoint: string,
    method: string,
    useCache: boolean,
    vary: string | null = null
  ): string | null {
    if (useCache && method === 'GET') {
      return `${this.baseUrl}${endpoint}${vary ? `::${vary}` : ''}`;
    }
    return null;
  }

  /**
   * Invalidate stale cache after mutating requests
   */
  private invalidateCache(): void {
    this.requestCache.clear();
  }

  /**
   * Clear cached GET responses (useful when changing auth/session).
   */
  clearCache(): void {
    this.invalidateCache();
  }

  /**
   * Main fetch method with retry logic and error handling
   */
  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    const {
      authenticated = true,
      retries = MAX_RETRIES,
      useCache = true,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      ...fetchOptions
    } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();

    const authHeaders = authenticated ? await this.getAuthHeaders() : {};

    // Check cache for GET requests
    const cacheVary = authenticated ? extractAuthCacheScope(authHeaders['Authorization']) : null;
    const cacheKey = this.getCacheKey(endpoint, method, useCache, cacheVary);
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
      Object.assign(headers, authHeaders);
    }

    // Merge any custom headers
    if (fetchOptions.headers) {
      Object.assign(headers, fetchOptions.headers);
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;

      try {
        response = await fetch(url, {
          ...fetchOptions,
          method,
          headers,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 409 Conflict (duplicate edges, etc.) - not a real error
        if (response.status === 409) {
          const apiResponse: ApiResponse<T> =
            typeof data === 'object'
              ? data
              : { success: false, error: { code: 'CONFLICT', message: 'Conflict' } };
          return apiResponse;
        }

        // Handle 404 Not Found
        if (response.status === 404) {
          throw new ApiError(
            typeof data === 'object' ? data.error?.message || 'Not found' : 'Not found',
            'NOT_FOUND',
            404
          );
        }

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

      // Any successful mutation invalidates cached reads to avoid stale editor state
      if (method !== 'GET' && apiResponse.success) {
        this.invalidateCache();
      }

      return apiResponse;
    } catch (error) {
      // Only retry on network errors, not application errors (400/500)
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === 'AbortError');
      const isServerError =
        error instanceof ApiError && (error.statusCode === 0 || error.statusCode >= 500);

      if (retries > 0 && (isNetworkError || isServerError)) {
        console.warn(
          `⚠️ Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`
        );
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
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
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
  warmup: () =>
    api.get('/health', {
      authenticated: false,
      useCache: false,
      retries: 0,
      timeoutMs: AUTH_TIMEOUT_MS,
    }),

  listFixedAccounts: () => api.get('/api/auth/accounts', { authenticated: false }),

  getMe: () => api.get('/api/auth/me', { timeoutMs: AUTH_TIMEOUT_MS }),

  getMeWithToken: (accessToken: string) =>
    api.get('/api/auth/me', {
      authenticated: false,
      useCache: false,
      retries: 0,
      timeoutMs: AUTH_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  updateProfile: (data: {
    display_name?: string;
    avatar_url?: string | null;
    color?: string;
    preferences?: Record<string, unknown>;
  }) => api.patch('/api/auth/me', data),
};

export const mapsApi = {
  list: (params?: { workspace_id?: string; search?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.workspace_id) searchParams.set('workspace_id', params.workspace_id);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    return api.get(`/api/maps?${searchParams}`, { useCache: false });
  },

  get: (mapId: string, options?: { includeGraph?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.includeGraph) params.set('include_graph', 'true');
    const query = params.toString();
    return api.get(`/api/maps/${mapId}${query ? `?${query}` : ''}`, { useCache: false });
  },

  create: (data: { workspace_id: string; title: string; description?: string }) =>
    api.post('/api/maps', data),

  update: (
    mapId: string,
    data: { title?: string; description?: string; settings?: Record<string, unknown> }
  ) => api.patch(`/api/maps/${mapId}`, data),

  delete: (mapId: string) => api.delete(`/api/maps/${mapId}`),

  duplicate: (mapId: string, title?: string) => api.post(`/api/maps/${mapId}/duplicate`, { title }),
};

export const nodesApi = {
  listByMap: (mapId: string) => api.get(`/api/nodes/map/${mapId}`, { useCache: false }),

  get: (nodeId: string) => api.get(`/api/nodes/${nodeId}`, { useCache: false }),

  create: (data: {
    id?: string;
    map_id: string;
    parent_id?: string | null;
    type?: string;
    label: string;
    content?: string;
    position_x?: number;
    position_y?: number;
    width?: number | null;
    height?: number | null;
    style?: Record<string, unknown>;
    data?: Record<string, unknown>;
    collapsed?: boolean;
  }) => api.post('/api/nodes', data),

  update: (
    nodeId: string,
    data: {
      label?: string;
      content?: string;
      type?: string;
      position_x?: number;
      position_y?: number;
      collapsed?: boolean;
      style?: Record<string, unknown>;
      data?: Record<string, unknown>;
      expected_version?: number;
    }
  ) => api.patch(`/api/nodes/${nodeId}`, data),

  batchUpdate: (
    nodes: Array<{
      id: string;
      parent_id?: string | null;
      type?: string;
      label?: string;
      content?: string | null;
      position_x?: number;
      position_y?: number;
      width?: number | null;
      height?: number | null;
      collapsed?: boolean;
      style?: Record<string, unknown>;
      data?: Record<string, unknown>;
      expected_version?: number;
    }>
  ) => api.patch('/api/nodes/batch', { nodes }),

  delete: (nodeId: string, cascade = true) => api.delete(`/api/nodes/${nodeId}?cascade=${cascade}`),

  // Edges
  getEdges: (mapId: string) => api.get(`/api/nodes/edges/map/${mapId}`, { useCache: false }),

  createEdge: (data: {
    id?: string;
    map_id: string;
    source_id: string;
    target_id: string;
    type?: string;
    label?: string | null;
    style?: Record<string, unknown>;
    animated?: boolean;
  }) => api.post('/api/nodes/edges', data),

  deleteEdge: (edgeId: string) => api.delete(`/api/nodes/edges/${edgeId}`),

  deleteEdgeByConnection: (data: { map_id: string; source_id: string; target_id: string }) => {
    const params = new URLSearchParams({
      map_id: data.map_id,
      source_id: data.source_id,
      target_id: data.target_id,
    });
    return api.delete(`/api/nodes/edges?${params.toString()}`);
  },

  // Comments
  getComments: (nodeId: string) => api.get(`/api/nodes/${nodeId}/comments`),

  addComment: (nodeId: string, content: string, mentions?: string[]) =>
    api.post(`/api/nodes/${nodeId}/comments`, { content, mentions }),

  deleteComment: (commentId: string) => api.delete(`/api/nodes/comments/${commentId}`),
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

  getKanban: (mapId: string) => api.get(`/api/tasks/kanban/${mapId}`),

  get: (taskId: string) => api.get(`/api/tasks/${taskId}`),

  create: (data: {
    node_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    due_date?: string;
    tags?: string[];
  }) => api.post('/api/tasks', data),

  update: (
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assigned_to?: string | null;
      due_date?: string | null;
      tags?: string[];
      checklist?: Array<{ id: string; text: string; done: boolean }>;
    }
  ) => api.patch(`/api/tasks/${taskId}`, data),

  reorder: (tasks: Array<{ id: string; order_index: number; status?: string }>) =>
    api.patch('/api/tasks/reorder', { tasks }),

  delete: (taskId: string) => api.delete(`/api/tasks/${taskId}`),

  getStats: (workspaceId: string) => api.get(`/api/tasks/stats/${workspaceId}`),
};

export const aiApi = {
  generate: (data: {
    map_id: string;
    prompt: string;
    parent_node_id?: string;
    context?: { existing_nodes?: Array<{ id: string; label: string }>; map_title?: string };
    options?: { count?: number; style?: string };
  }) => api.post('/api/ai/generate', data),

  expand: (data: {
    map_id: string;
    node_id: string;
    context: { node: { id: string; label: string; type: string; content?: string } };
    options?: { count?: number; direction?: string };
  }) => api.post('/api/ai/expand', data),

  summarize: (data: {
    map_id: string;
    context: { nodes: Array<{ id: string; label: string; type: string; content?: string }> };
    options?: { format?: string; length?: string };
  }) => api.post('/api/ai/summarize', data),

  toTasks: (data: {
    map_id: string;
    node_ids: string[];
    context: { nodes: Array<{ id: string; label: string; type: string; content?: string }> };
    options?: { include_subtasks?: boolean };
  }) => api.post('/api/ai/to-tasks', data),

  chat: (data: {
    map_id: string;
    message: string;
    context?: {
      nodes?: Array<{ id: string; label: string }>;
      conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
  }) => api.post('/api/ai/chat', data),

  getHistory: (mapId: string) => api.get(`/api/ai/history/${mapId}`),

  applyRun: (runId: string, selectedItems?: number[]) =>
    api.post(`/api/ai/apply/${runId}`, { selected_items: selectedItems }),

  getUsage: (period = '30d') => api.get(`/api/ai/usage?period=${period}`),
};

export const resetApi = {
  factoryReset: () => api.post('/api/reset/factory-reset', {}),
};
