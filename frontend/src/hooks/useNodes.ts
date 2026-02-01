// ============================================================================
// MindMap Hub - React Query Hooks for Nodes
// ============================================================================
// Hooks para operações CRUD de nós com optimistic updates
// ============================================================================

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MindMapNode, CreateNodeInput, UpdateNodeInput } from '@/types'

// ============================================================================
// Query Keys
// ============================================================================

export const nodeKeys = {
  all: ['nodes'] as const,
  lists: () => [...nodeKeys.all, 'list'] as const,
  list: (mapId: string) => [...nodeKeys.lists(), mapId] as const,
  details: () => [...nodeKeys.all, 'detail'] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
}

// ============================================================================
// API Functions
// ============================================================================

const nodesApi = {
  getByMapId: async (mapId: string) => {
    return api.get<MindMapNode[]>(`/maps/${mapId}/nodes`)
  },

  getById: async (nodeId: string) => {
    return api.get<MindMapNode>(`/nodes/${nodeId}`)
  },

  create: async ({ mapId, data }: { mapId: string; data: CreateNodeInput }) => {
    return api.post<MindMapNode>(`/maps/${mapId}/nodes`, data)
  },

  update: async ({ id, data }: { id: string; data: UpdateNodeInput }) => {
    return api.patch<MindMapNode>(`/nodes/${id}`, data)
  },

  delete: async (id: string) => {
    return api.delete(`/nodes/${id}`)
  },

  bulkCreate: async ({ mapId, nodes }: { mapId: string; nodes: CreateNodeInput[] }) => {
    return api.post<MindMapNode[]>(`/maps/${mapId}/nodes/bulk`, { nodes })
  },

  bulkUpdate: async (updates: { id: string; data: UpdateNodeInput }[]) => {
    return api.patch<MindMapNode[]>('/nodes/bulk', { updates })
  },

  bulkDelete: async (ids: string[]) => {
    return api.delete('/nodes/bulk', { data: { ids } })
  },

  moveNode: async ({ id, position, parentId }: { 
    id: string
    position: { x: number; y: number }
    parentId?: string | null
  }) => {
    return api.patch<MindMapNode>(`/nodes/${id}/move`, { position, parent_id: parentId })
  },

  reorderChildren: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
    return api.patch(`/nodes/${parentId}/reorder`, { child_ids: childIds })
  }
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all nodes for a map
 */
export function useNodes(
  mapId: string,
  options?: Omit<UseQueryOptions<MindMapNode[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: nodeKeys.list(mapId),
    queryFn: () => nodesApi.getByMapId(mapId),
    enabled: !!mapId,
    ...options
  })
}

/**
 * Fetch a single node by ID
 */
export function useNode(
  nodeId: string,
  options?: Omit<UseQueryOptions<MindMapNode>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: nodeKeys.detail(nodeId),
    queryFn: () => nodesApi.getById(nodeId),
    enabled: !!nodeId,
    ...options
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new node
 */
export function useCreateNode(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNodeInput) => nodesApi.create({ mapId, data }),
    onMutate: async (newNode): Promise<{ previousNodes: MindMapNode[] | undefined }> => {
      await queryClient.cancelQueries({ queryKey: nodeKeys.list(mapId) })

      const previousNodes = queryClient.getQueryData<MindMapNode[]>(nodeKeys.list(mapId))

      // Optimistically add new node
      if (previousNodes) {
        const tempNode: MindMapNode = {
          id: `temp-${Date.now()}`,
          map_id: mapId,
          node_type: newNode.node_type,
          content: newNode.content,
          parent_id: newNode.parent_id,
          position_x: newNode.position_x ?? 0,
          position_y: newNode.position_y ?? 0,
          color: newNode.color,
          emoji: newNode.emoji,
          metadata: newNode.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        queryClient.setQueryData(nodeKeys.list(mapId), [...previousNodes, tempNode])
      }

      return { previousNodes }
    },
    onError: (_err, _newNode, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(nodeKeys.list(mapId), context.previousNodes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}

/**
 * Update a node
 */
export function useUpdateNode(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.update,
    onMutate: async ({ id, data }): Promise<{ previousNodes: MindMapNode[] | undefined }> => {
      await queryClient.cancelQueries({ queryKey: nodeKeys.list(mapId) })

      const previousNodes = queryClient.getQueryData<MindMapNode[]>(nodeKeys.list(mapId))

      // Optimistically update
      if (previousNodes) {
        queryClient.setQueryData(
          nodeKeys.list(mapId),
          previousNodes.map((node) =>
            node.id === id
              ? { ...node, ...data, updated_at: new Date().toISOString() }
              : node
          )
        )
      }

      return { previousNodes }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(nodeKeys.list(mapId), context.previousNodes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}

/**
 * Delete a node
 */
export function useDeleteNode(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.delete,
    onMutate: async (nodeId): Promise<{ previousNodes: MindMapNode[] | undefined }> => {
      await queryClient.cancelQueries({ queryKey: nodeKeys.list(mapId) })

      const previousNodes = queryClient.getQueryData<MindMapNode[]>(nodeKeys.list(mapId))

      // Optimistically remove node and its children
      if (previousNodes) {
        const nodeIdsToRemove = new Set<string>()
        
        // Find all descendant nodes
        const findDescendants = (parentId: string) => {
          nodeIdsToRemove.add(parentId)
          previousNodes
            .filter((n) => n.parent_id === parentId)
            .forEach((n) => findDescendants(n.id))
        }
        findDescendants(nodeId)

        queryClient.setQueryData(
          nodeKeys.list(mapId),
          previousNodes.filter((n) => !nodeIdsToRemove.has(n.id))
        )
      }

      return { previousNodes }
    },
    onError: (_err, _nodeId, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(nodeKeys.list(mapId), context.previousNodes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}

/**
 * Move a node (position and/or parent)
 */
export function useMoveNode(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.moveNode,
    onMutate: async ({ id, position, parentId }): Promise<{ previousNodes: MindMapNode[] | undefined }> => {
      await queryClient.cancelQueries({ queryKey: nodeKeys.list(mapId) })

      const previousNodes = queryClient.getQueryData<MindMapNode[]>(nodeKeys.list(mapId))

      if (previousNodes) {
        queryClient.setQueryData(
          nodeKeys.list(mapId),
          previousNodes.map((node) =>
            node.id === id
              ? { 
                  ...node, 
                  position_x: position.x, 
                  position_y: position.y,
                  parent_id: parentId !== undefined ? parentId : node.parent_id,
                  updated_at: new Date().toISOString()
                }
              : node
          )
        )
      }

      return { previousNodes }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(nodeKeys.list(mapId), context.previousNodes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}

/**
 * Bulk create nodes
 */
export function useBulkCreateNodes(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nodes: CreateNodeInput[]) => nodesApi.bulkCreate({ mapId, nodes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}

/**
 * Bulk update nodes
 */
export function useBulkUpdateNodes(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.bulkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}

/**
 * Bulk delete nodes
 */
export function useBulkDeleteNodes(mapId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.list(mapId) })
    },
  })
}
