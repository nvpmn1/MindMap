// ============================================================================
// MindMap Hub - React Query Hooks for Maps
// ============================================================================
// Hooks para operações CRUD de mapas com cache e otimistic updates
// ============================================================================

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MindMap, CreateMapInput, UpdateMapInput } from '@/types'

// ============================================================================
// Query Keys
// ============================================================================

export const mapKeys = {
  all: ['maps'] as const,
  lists: () => [...mapKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...mapKeys.lists(), filters] as const,
  details: () => [...mapKeys.all, 'detail'] as const,
  detail: (id: string) => [...mapKeys.details(), id] as const,
}

// ============================================================================
// API Functions
// ============================================================================

const mapsApi = {
  getAll: async (params?: { workspace_id?: string; is_archived?: boolean }) => {
    return api.get<MindMap[]>('/maps', { params })
  },

  getById: async (id: string) => {
    return api.get<MindMap>(`/maps/${id}`)
  },

  create: async (data: CreateMapInput) => {
    return api.post<MindMap>('/maps', data)
  },

  update: async ({ id, data }: { id: string; data: UpdateMapInput }) => {
    return api.patch<MindMap>(`/maps/${id}`, data)
  },

  delete: async (id: string) => {
    return api.delete(`/maps/${id}`)
  },

  duplicate: async (id: string) => {
    return api.post<MindMap>(`/maps/${id}/duplicate`)
  },

  toggleFavorite: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
    return api.patch<MindMap>(`/maps/${id}`, { is_favorite })
  },

  archive: async ({ id, is_archived }: { id: string; is_archived: boolean }) => {
    return api.patch<MindMap>(`/maps/${id}`, { is_archived })
  }
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all maps
 */
export function useMaps(
  params?: { workspace_id?: string; is_archived?: boolean },
  options?: Omit<UseQueryOptions<MindMap[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: mapKeys.list(params),
    queryFn: () => mapsApi.getAll(params),
    ...options
  })
}

/**
 * Fetch single map by ID
 */
export function useMap(
  id: string,
  options?: Omit<UseQueryOptions<MindMap>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: mapKeys.detail(id),
    queryFn: () => mapsApi.getById(id),
    enabled: !!id,
    ...options
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new map
 */
export function useCreateMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mapsApi.create,
    onSuccess: (newMap) => {
      // Invalidate maps list
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() })
      
      // Add to cache
      queryClient.setQueryData(mapKeys.detail(newMap.id), newMap)
    },
  })
}

/**
 * Update a map
 */
export function useUpdateMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mapsApi.update,
    onMutate: async ({ id, data }): Promise<{ previousMap: MindMap | undefined }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: mapKeys.detail(id) })

      // Snapshot previous value
      const previousMap = queryClient.getQueryData<MindMap>(mapKeys.detail(id))

      // Optimistically update
      if (previousMap) {
        queryClient.setQueryData(mapKeys.detail(id), {
          ...previousMap,
          ...data,
          updated_at: new Date().toISOString()
        })
      }

      return { previousMap }
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousMap) {
        queryClient.setQueryData(mapKeys.detail(id), context.previousMap)
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: mapKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() })
    },
  })
}

/**
 * Delete a map
 */
export function useDeleteMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await mapsApi.delete(id)
    },
    onMutate: async (id): Promise<{ previousMaps: MindMap[] | undefined }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: mapKeys.lists() })

      // Snapshot previous value
      const previousMaps = queryClient.getQueryData<MindMap[]>(mapKeys.list())

      // Optimistically remove from list
      if (previousMaps) {
        queryClient.setQueryData(
          mapKeys.list(),
          previousMaps.filter((m) => m.id !== id)
        )
      }

      return { previousMaps }
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousMaps) {
        queryClient.setQueryData(mapKeys.list(), context.previousMaps)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() })
    },
  })
}

/**
 * Duplicate a map
 */
export function useDuplicateMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mapsApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() })
    },
  })
}

/**
 * Toggle map favorite
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mapsApi.toggleFavorite,
    onMutate: async ({ id, is_favorite }): Promise<{ previousMaps: MindMap[] | undefined }> => {
      await queryClient.cancelQueries({ queryKey: mapKeys.lists() })
      
      const previousMaps = queryClient.getQueryData<MindMap[]>(mapKeys.list())
      
      if (previousMaps) {
        queryClient.setQueryData(
          mapKeys.list(),
          previousMaps.map((m) =>
            m.id === id ? { ...m, is_favorite } : m
          )
        )
      }

      return { previousMaps }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMaps) {
        queryClient.setQueryData(mapKeys.list(), context.previousMaps)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() })
    },
  })
}

/**
 * Archive/unarchive a map
 */
export function useArchiveMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mapsApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() })
    },
  })
}
