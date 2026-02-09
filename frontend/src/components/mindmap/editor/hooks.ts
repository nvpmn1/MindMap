// ============================================================================
// NeuralMap Editor - Custom Hooks
// ============================================================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNodesState, useEdgesState, useReactFlow, type Connection } from '@xyflow/react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type {
  PowerNode,
  PowerEdge,
  NeuralNodeData,
  NeuralNodeType,
  MapInfo,
  EditorSettings,
  CollaboratorInfo,
  ViewMode,
  MapAnalytics,
} from './types';
import { DEFAULT_NODE_DATA, DEFAULT_EDITOR_SETTINGS, NODE_TYPE_CONFIG } from './constants';
import { useAuthStore } from '@/stores/authStore';
import { mapsApi, nodesApi } from '@/lib/api';

// ─── useEditorState ─────────────────────────────────────────────────────────

export function useEditorState() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<PowerNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PowerEdge>([]);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);

  // Undo/Redo stacks
  const undoStackRef = useRef<Array<{ nodes: PowerNode[]; edges: PowerEdge[] }>>([]);
  const redoStackRef = useRef<Array<{ nodes: PowerNode[]; edges: PowerEdge[] }>>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveToHistory = useCallback(() => {
    undoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  }, [nodes, edges, setNodes, setEdges]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return {
    mapId,
    navigate,
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    mapInfo,
    setMapInfo,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    viewMode,
    setViewMode,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    lastSaved,
    setLastSaved,
    settings,
    setSettings,
    collaborators,
    setCollaborators,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

// ─── useNodeOperations ──────────────────────────────────────────────────────

export function useNodeOperations(
  nodes: PowerNode[],
  edges: PowerEdge[],
  setNodes: React.Dispatch<React.SetStateAction<PowerNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<PowerEdge[]>>,
  selectedNodeId: string | null,
  saveToHistory: () => void,
  mapId?: string
) {
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const generateId = useCallback(
    () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const createNode = useCallback(
    (
      type: NeuralNodeType,
      position?: { x: number; y: number },
      parentId?: string | null,
      data?: Partial<NeuralNodeData>
    ): PowerNode => {
      saveToHistory();
      const config = NODE_TYPE_CONFIG[type];
      const id = generateId();

      // Calculate position
      let nodePosition = position;
      if (!nodePosition) {
        if (parentId) {
          const parent = nodes.find((n) => n.id === parentId);
          if (parent) {
            const childCount = edges.filter((e) => e.source === parentId).length;
            const angle = (childCount * Math.PI) / 4 - Math.PI / 2;
            const radius = 300;
            nodePosition = {
              x: (parent.position?.x || 0) + Math.cos(angle) * radius,
              y: (parent.position?.y || 0) + Math.sin(angle) * radius,
            };
          }
        }
        if (!nodePosition) {
          const viewport = getViewport();
          nodePosition = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          });
        }
      }

      const newNode: PowerNode = {
        id,
        type: 'power',
        position: nodePosition,
        data: {
          label: data?.label || config.label,
          type,
          description: data?.description || '',
          ...DEFAULT_NODE_DATA,
          ...data,
        },
      };

      setNodes((prev) => [...prev, newNode]);

      // Create edge if has parent
      if (parentId) {
        const edgeId = `edge_${parentId}_${id}`;
        setEdges((prev) => [
          ...prev,
          {
            id: edgeId,
            source: parentId,
            target: id,
            type: 'power',
            animated: true,
            data: { style: 'neural' as const, strength: 1 },
          },
        ]);
      }

      // Save to API if remote map
      if (mapId && mapId !== 'new' && mapId !== 'local' && !mapId.startsWith('local_')) {
        nodesApi
          .create({
            map_id: mapId,
            type: type as any,
            label: newNode.data.label,
            content: newNode.data.description || '',
            position_x: nodePosition!.x,
            position_y: nodePosition!.y,
          } as any)
          .then((response: any) => {
              const created = response?.data;
              if (!created?.id) return;

              const newId = created.id as string;

              setNodes((prev) =>
                prev.map((node) => (node.id === id ? { ...node, id: newId } : node))
              );

              setEdges((prev) =>
                prev.map((edge) => {
                  const source = edge.source === id ? newId : edge.source;
                  const target = edge.target === id ? newId : edge.target;
                  return source !== edge.source || target !== edge.target
                    ? { ...edge, source, target }
                    : edge;
                })
              );

              // Save edge to API if parent exists
              if (parentId) {
                const isUuid = (tid: string) =>
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tid);
                const resolvedParentId = parentId;
                if (isUuid(resolvedParentId)) {
                  nodesApi
                    .createEdge({
                      map_id: mapId,
                      source_id: resolvedParentId,
                      target_id: newId,
                    })
                    .then((edgeRes: any) => {
                      if (edgeRes?.data?.id) {
                        setEdges((prev) =>
                          prev.map((e) =>
                            e.id === `edge_${parentId}_${id}` ||
                            e.id === `edge_${resolvedParentId}_${newId}`
                              ? { ...e, id: edgeRes.data.id }
                              : e
                          )
                        );
                      }
                    })
                    .catch(() => {});
                }
              }
            })
            .catch(() => {});
      }

      return newNode;
    },
    [
      nodes,
      edges,
      setNodes,
      setEdges,
      saveToHistory,
      generateId,
      screenToFlowPosition,
      getViewport,
      mapId,
    ]
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<NeuralNodeData>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );

      // Persist to API for remote nodes
      const isUuidId = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUuidId(nodeId) && mapId && mapId !== 'new' && !mapId.startsWith('local')) {
        // Debounced update - will be handled by the auto-save timer
        // For immediate label/content changes, update directly
        if (data.label || data.description !== undefined || data.type) {
          const updatePayload: any = {};
            if (data.label) updatePayload.label = data.label;
            if (data.description !== undefined) updatePayload.content = data.description || '';
            if (data.type) updatePayload.type = data.type;
            
            if (Object.keys(updatePayload).length > 0) {
              nodesApi.update(nodeId, updatePayload).catch(() => {
                // Will be synced on next save
              });
            }
        }
      }
    },
    [setNodes, mapId]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      saveToHistory();

      // Find all descendants
      const getDescendants = (id: string): string[] => {
        const children = edges.filter((e) => e.source === id).map((e) => e.target);
        return children.flatMap((c) => [c, ...getDescendants(c)]);
      };

      const toDelete = new Set([nodeId, ...getDescendants(nodeId)]);

      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
      setEdges((prev) => prev.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)));

      // Delete from API if it's a real UUID (server-side node)
      const isUuidId = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUuidId(nodeId) && mapId && mapId !== 'new' && !mapId.startsWith('local')) {
        nodesApi.delete(nodeId, true).catch(() => {
          // Deletion will be reconciled on next full save
        });
      }

      toast.success('Nó removido', { duration: 2500 });
    },
    [edges, setNodes, setEdges, saveToHistory, mapId]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const original = nodes.find((n) => n.id === nodeId);
      if (!original) return;

      saveToHistory();
      const newNode = createNode(
        original.data.type,
        { x: original.position.x + 50, y: original.position.y + 50 },
        null,
        { ...original.data, label: `${original.data.label} (cópia)` }
      );

      toast.success('Nó duplicado', { duration: 2500 });
      return newNode;
    },
    [nodes, createNode, saveToHistory]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceId = connection.source!;
      const targetId = connection.target!;

      // 🚫 Validation 1: Prevent self-loops (connecting node to itself)
      if (sourceId === targetId) {
        toast.error('Um nó não pode se conectar a si mesmo!', { duration: 3000 });
        return;
      }

      // 🚫 Validation 2: Check if nodes exist
      const sourceExists = nodes.some((n) => n.id === sourceId);
      const targetExists = nodes.some((n) => n.id === targetId);
      if (!sourceExists || !targetExists) {
        toast.error('Um ou ambos os nós não existem!', { duration: 3000 });
        return;
      }

      // 🚫 Validation 3: Prevent duplicate connections
      const edgeId = `edge_${sourceId}_${targetId}`;
      const reversEdgeId = `edge_${targetId}_${sourceId}`;
      const edgeExists = edges.some((e) => e.id === edgeId || e.id === reversEdgeId);
      if (edgeExists) {
        toast.error('Já existe uma conexão entre esses nós!', { duration: 3000 });
        return;
      }

      // ✅ All validations passed - create connection
      saveToHistory();
      setEdges((prev) => [
        ...prev,
        {
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'power',
          animated: true,
          data: { style: 'neural' as const, strength: 1 },
        },
      ]);

      // ✨ Success feedback
      toast.success('✨ Conexão criada com sucesso!', { duration: 2500 });

      // Persist edge to API if remote map
      if (mapId && mapId !== 'new' && mapId !== 'local' && !mapId.startsWith('local_')) {
        // Only save if both node IDs are real UUIDs (not local temp IDs)
        const isUuid = (id: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid(sourceId) && isUuid(targetId)) {
          nodesApi
            .createEdge({
              map_id: mapId,
              source_id: sourceId,
              target_id: targetId,
            })
            .then((response: any) => {
              const created = response?.data;
              if (created?.id) {
                // Update local edge with server ID
                setEdges((prev) =>
                  prev.map((e) => (e.id === edgeId ? { ...e, id: created.id } : e))
                );
              }
            })
            .catch((err: any) => {});
        }
      }
    },
    [setEdges, saveToHistory, mapId]
  );

  return {
    createNode,
    updateNodeData,
    deleteNode,
    duplicateNode,
    onConnect,
    generateId,
  };
}

// ─── useMapPersistence ──────────────────────────────────────────────────────

export function useMapPersistence(
  mapId: string | undefined,
  nodes: PowerNode[],
  edges: PowerEdge[],
  mapInfo: MapInfo | null,
  setNodes: React.Dispatch<React.SetStateAction<PowerNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<PowerEdge[]>>,
  setMapInfo: (info: MapInfo | null) => void,
  setIsLoading: (loading: boolean) => void,
  setIsSaving: (saving: boolean) => void,
  setLastSaved: (date: Date | null) => void,
  navigate: (path: string) => void
) {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isSavingRef = useRef(false);
  const loadedRef = useRef(false);
  const isRemoteMap = mapId && mapId !== 'new' && mapId !== 'local' && !mapId.startsWith('local_');
  const { workspaces } = useAuthStore();
  const workspaceId = workspaces[0]?.id || '11111111-1111-1111-1111-111111111111';

  const isUuid = useCallback(
    (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    []
  );

  // Create default map when loading fails
  const createDefaultMap = useCallback(() => {
    const centralNode: PowerNode = {
      id: 'central_1',
      type: 'power',
      position: { x: 0, y: 0 },
      data: {
        label: 'Tema Central',
        type: 'idea',
        description: 'Clique em + para adicionar ideias conectadas',
        ...DEFAULT_NODE_DATA,
        status: 'active',
        priority: 'high',
      },
    };
    setMapInfo({ id: mapId || 'local', title: 'Novo Mapa Neural' });
    setNodes([centralNode]);
    setEdges([]);
  }, [mapId, setNodes, setEdges, setMapInfo]);

  // Load map from API
  const loadMap = useCallback(async () => {
    if (!mapId || loadedRef.current) return;
    loadedRef.current = true;
    setIsLoading(true);

    try {
      if (mapId === 'new') {
        // Create new map via API and redirect to it
        // mapsApi imported at top
        try {
          const response = await mapsApi.create({
            title: 'Novo Mapa Neural',
            description: 'Meu novo mapa neural colaborativo',
            workspace_id: workspaceId,
          });
          const created = response.data as any;
          if (created?.id) {
            navigate(`/map/${created.id}`);
            return;
          }
        } catch (err) {
          console.error('[LoadMap] Failed to create new map:', err);
          toast.error('Erro ao criar mapa. Verifique a conexão.', { duration: 4000 });
        }
        setIsLoading(false);
        return;
      }

      if (isRemoteMap) {
        try {
          // Load map data, nodes, and edges in parallel
          const [mapResponse, nodesResponse, edgesResponse] = await Promise.all([
            mapsApi.get(mapId),
            nodesApi.listByMap(mapId),
            nodesApi.getEdges(mapId).catch(() => ({ data: [] })),
          ]);

          if (mapResponse.data) {
            const mapData = mapResponse.data as any;
            setMapInfo({
              id: mapData.id,
              title: mapData.title,
              description: mapData.description || '',
              createdAt: mapData.created_at,
              updatedAt: mapData.updated_at,
            });
          }

          if (nodesResponse.data && Array.isArray(nodesResponse.data)) {
            const loadedNodes: PowerNode[] = (nodesResponse.data as any[]).map((n: any) => ({
              id: n.id,
              type: 'power',
              position: { x: n.position_x || 0, y: n.position_y || 0 },
              data: {
                label: n.label || 'Sem título',
                type: n.type || 'idea',
                description: n.content || '',
                ...DEFAULT_NODE_DATA,
                ...(typeof n.data === 'object' && n.data !== null ? n.data : {}),
              },
            }));

            setNodes(loadedNodes);

            // If no nodes exist yet, create a root node
            if (loadedNodes.length === 0 && mapResponse.data) {
              const mapData = mapResponse.data as any;
              const centralNode: PowerNode = {
                id: 'central_1',
                type: 'power',
                position: { x: 0, y: 0 },
                data: {
                  label: mapData.title || 'Tema Central',
                  type: 'idea',
                  description: '',
                  ...DEFAULT_NODE_DATA,
                  status: 'active',
                  priority: 'high',
                },
              };
              setNodes([centralNode]);
            }
          }

          // Load edges
          if (edgesResponse.data && Array.isArray(edgesResponse.data)) {
            const loadedEdges: PowerEdge[] = (edgesResponse.data as any[]).map((e: any) => ({
              id: e.id,
              source: e.source_id,
              target: e.target_id,
              type: 'power',
              animated: e.animated ?? true,
              data: { style: 'neural' as const, ...(e.style || {}) },
            }));
            setEdges(loadedEdges);
          } else {
            // Try to build edges from parent_id as fallback
            if (nodesResponse.data && Array.isArray(nodesResponse.data)) {
              const parentEdges: PowerEdge[] = [];
              (nodesResponse.data as any[]).forEach((n: any) => {
                if (n.parent_id) {
                  parentEdges.push({
                    id: `edge_${n.parent_id}_${n.id}`,
                    source: n.parent_id,
                    target: n.id,
                    type: 'power',
                    animated: true,
                    data: { style: 'neural' as const },
                  });
                }
              });
              if (parentEdges.length > 0) setEdges(parentEdges);
            }
          }
        } catch (err) {
          console.error('[LoadMap] API error:', err);
          toast.error('Erro ao carregar mapa. Verifique sua conexão.', { duration: 4000 });
          createDefaultMap();
        }
      } else {
        // Local map
        const saved = localStorage.getItem(`neuralmap_${mapId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setMapInfo(parsed.mapInfo || { id: mapId, title: 'Mapa Local' });
            setNodes(parsed.nodes || []);
            setEdges(parsed.edges || []);
          } catch {
            createDefaultMap();
          }
        } else {
          createDefaultMap();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    mapId,
    isRemoteMap,
    navigate,
    setNodes,
    setEdges,
    setMapInfo,
    setIsLoading,
    createDefaultMap,
    workspaceId,
    isUuid,
  ]);

  // Manual save
  const saveMap = useCallback(async () => {
    if (!mapId || isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    try {
      if (isRemoteMap) {
        // 1. Update map metadata
        if (mapInfo) {
          try {
            await mapsApi.update(mapId, {
              title: mapInfo.title,
              description: mapInfo.description || '',
            });
          } catch (err: any) {
            if (err?.statusCode === 404) {
              toast.error('Mapa não encontrado no servidor', { duration: 3000 });
              return;
            }
          }
        }

        // 2. Separate nodes into create vs update
        const nodesToCreate: PowerNode[] = [];
        const nodesToUpdate: PowerNode[] = [];

        for (const node of nodes) {
          if (isUuid(node.id)) {
            nodesToUpdate.push(node);
          } else {
            nodesToCreate.push(node);
          }
        }

        // 3. Create new nodes
        const idMapping = new Map<string, string>();

        for (const node of nodesToCreate) {
          try {
            const response = await nodesApi.create({
              map_id: mapId,
              type: node.data.type as any,
              label: node.data.label,
              content: node.data.description || '',
              position_x: node.position.x,
              position_y: node.position.y,
            });
            const created = response?.data as any;
            if (created?.id) {
              idMapping.set(node.id, created.id);
            }
          } catch {
            // Continue with other nodes
          }
        }

        // 4. Update local IDs with server IDs
        if (idMapping.size > 0) {
          setNodes((prev) =>
            prev.map((node) => {
              const newId = idMapping.get(node.id);
              return newId ? { ...node, id: newId } : node;
            })
          );
          setEdges((prev) =>
            prev.map((edge) => ({
              ...edge,
              source: idMapping.get(edge.source) || edge.source,
              target: idMapping.get(edge.target) || edge.target,
            }))
          );
        }

        // 5. Update existing nodes in batch
        if (nodesToUpdate.length > 0) {
          try {
            await nodesApi.batchUpdate(
              nodesToUpdate.map((node) => ({
                id: node.id,
                position_x: node.position.x,
                position_y: node.position.y,
              }))
            );
          } catch {
            // Fallback to individual updates
            for (const node of nodesToUpdate) {
              try {
                await nodesApi.update(node.id, {
                  label: node.data.label,
                  content: node.data.description || '',
                  position_x: node.position.x,
                  position_y: node.position.y,
                  type: node.data.type as any,
                });
              } catch {
                // Continue
              }
            }
          }
        }

        // 6. Sync edges
        try {
          const serverEdgesRes = await nodesApi.getEdges(mapId);
          const serverEdges = (serverEdgesRes.data || []) as any[];
          const serverEdgeKeys = new Set<string>();
          serverEdges.forEach((e: any) => {
            serverEdgeKeys.add(`${e.source_id}__${e.target_id}`);
          });

          // Resolve local edges with ID mapping
          const resolvedEdges = edges.map((e) => ({
            source: idMapping.get(e.source) || e.source,
            target: idMapping.get(e.target) || e.target,
            localId: e.id,
          }));

          // Create missing edges
          for (const edge of resolvedEdges) {
            if (!isUuid(edge.source) || !isUuid(edge.target)) continue;
            if (edge.source === edge.target) continue;
            const key = `${edge.source}__${edge.target}`;
            if (!serverEdgeKeys.has(key)) {
              try {
                await nodesApi.createEdge({
                  map_id: mapId,
                  source_id: edge.source,
                  target_id: edge.target,
                });
              } catch {
                // 409 conflict or other - continue
              }
            }
          }

          // Delete orphaned server edges
          const localEdgeKeys = new Set<string>();
          resolvedEdges.forEach((e) => {
            if (isUuid(e.source) && isUuid(e.target)) {
              localEdgeKeys.add(`${e.source}__${e.target}`);
            }
          });

          for (const se of serverEdges) {
            const key = `${se.source_id}__${se.target_id}`;
            if (!localEdgeKeys.has(key)) {
              try {
                await nodesApi.deleteEdge(se.id);
              } catch {
                // Continue
              }
            }
          }
        } catch {
          // Edge sync non-critical
        }
      } else {
        // Local map: save to localStorage
        localStorage.setItem(
          `neuralmap_${mapId}`,
          JSON.stringify({
            mapInfo,
            nodes,
            edges,
            savedAt: new Date().toISOString(),
          })
        );
      }

      setLastSaved(new Date());
      toast.success('Mapa salvo!', { duration: 2000 });
    } catch (err) {
      console.error('[Save] Error:', err);
      toast.error('Erro ao salvar mapa', { duration: 3000 });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [isRemoteMap, mapId, mapInfo, nodes, edges, setNodes, setEdges, setIsSaving, setLastSaved, isUuid]);

  // Auto-save with debounce (only for position changes etc.)
  useEffect(() => {
    if (nodes.length === 0 || !mapId || !isRemoteMap) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;

      // Only auto-save node positions using the batch endpoint
      const uuidNodes = nodes.filter((n) => isUuid(n.id));

      if (uuidNodes.length > 0) {
        try {
          await nodesApi.batchUpdate(
            uuidNodes.map((n) => ({
              id: n.id,
              position_x: n.position.x,
              position_y: n.position.y,
            }))
          );
          setLastSaved(new Date());
        } catch {
          // Silent - positions will sync on next manual save
        }
      }
    }, 5000); // 5 second debounce for auto-save

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [nodes, edges, mapId, isRemoteMap, setLastSaved, isUuid]);

  // Initial load
  useEffect(() => {
    loadedRef.current = false;
    loadMap();
  }, [loadMap]);

  return { saveMap, loadMap, isRemoteMap };
}

// ─── useKeyboardShortcuts ───────────────────────────────────────────────────

export function useEditorKeyboard(
  createNode: (
    type: NeuralNodeType,
    pos?: { x: number; y: number },
    parentId?: string | null
  ) => void,
  deleteNode: (id: string) => void,
  selectedNodeId: string | null,
  setSelectedNodeId: (id: string | null) => void,
  undo: () => void,
  redo: () => void,
  saveMap: () => void,
  toggleAI: () => void,
  settings: EditorSettings,
  setSettings: React.Dispatch<React.SetStateAction<EditorSettings>>,
  nodes: PowerNode[] = []
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      if (settings.isLocked) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl combinations
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            return;
          case 'y':
            e.preventDefault();
            redo();
            return;
          case 's':
            e.preventDefault();
            saveMap();
            return;
          case 'a':
            if (e.shiftKey) {
              e.preventDefault();
              toggleAI();
            }
            return;
        }
        return;
      }

      // Single keys
      switch (e.key.toLowerCase()) {
        case 'i':
          createNode('idea', undefined, selectedNodeId);
          break;
        case 't':
          createNode('task', undefined, selectedNodeId);
          break;
        case 'n':
          createNode('note', undefined, selectedNodeId);
          break;
        case 'r':
          createNode('reference', undefined, selectedNodeId);
          break;
        case 'p':
          createNode('research', undefined, selectedNodeId);
          break;
        case 'd':
          createNode('data', undefined, selectedNodeId);
          break;
        case 'q':
          createNode('question', undefined, selectedNodeId);
          break;
        case 'delete':
        case 'backspace':
          // Delete all selected nodes
          e.preventDefault();
          const selectedNodes = nodes.filter((n) => n.selected);
          if (selectedNodes.length > 0) {
            // Delete all selected nodes
            selectedNodes.forEach((n) => deleteNode(n.id));
          } else if (selectedNodeId) {
            // Fallback: if no selected property, delete the currently focused node
            deleteNode(selectedNodeId);
          }
          break;
        case 'escape':
          setSelectedNodeId(null);
          break;
        case 'g':
          setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
          break;
        case 'l':
          setSettings((prev) => ({ ...prev, isLocked: !prev.isLocked }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    createNode,
    deleteNode,
    selectedNodeId,
    undo,
    redo,
    saveMap,
    toggleAI,
    settings,
    setSettings,
    setSelectedNodeId,
    nodes,
  ]);
}

// ─── useMapAnalytics ────────────────────────────────────────────────────────

export function useMapAnalytics(nodes: PowerNode[], edges: PowerEdge[]): MapAnalytics {
  return useMemo(() => {
    const nodesByType = {} as Record<string, number>;
    const nodesByStatus = {} as Record<string, number>;
    const nodesByPriority = {} as Record<string, number>;
    let totalProgress = 0;
    let taskCount = 0;
    let completedTasks = 0;
    let aiNodes = 0;

    nodes.forEach((node) => {
      const d = node.data;
      nodesByType[d.type] = (nodesByType[d.type] || 0) + 1;
      nodesByStatus[d.status] = (nodesByStatus[d.status] || 0) + 1;
      nodesByPriority[d.priority] = (nodesByPriority[d.priority] || 0) + 1;
      totalProgress += d.progress || 0;
      if (d.type === 'task') {
        taskCount++;
        if (d.status === 'completed') completedTasks++;
      }
      if (d.ai?.generated) aiNodes++;
    });

    // Connection density
    const maxEdges = (nodes.length * (nodes.length - 1)) / 2;
    const connectionDensity = maxEdges > 0 ? edges.length / maxEdges : 0;

    // Most connected
    const connectionCounts = new Map<string, number>();
    edges.forEach((e) => {
      connectionCounts.set(e.source, (connectionCounts.get(e.source) || 0) + 1);
      connectionCounts.set(e.target, (connectionCounts.get(e.target) || 0) + 1);
    });

    const mostConnected = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, connections]) => {
        const node = nodes.find((n) => n.id === id);
        return { id, label: node?.data.label || '', connections };
      });

    return {
      nodesByType,
      nodesByStatus,
      nodesByPriority,
      completionRate: taskCount > 0 ? (completedTasks / taskCount) * 100 : 0,
      averageProgress: nodes.length > 0 ? totalProgress / nodes.length : 0,
      totalTasks: taskCount,
      completedTasks,
      overdueTasks: 0,
      activeCollaborators: 0,
      aiGeneratedNodes: aiNodes,
      depthDistribution: {},
      connectionDensity,
      mostConnectedNodes: mostConnected,
      recentActivity: [],
    };
  }, [nodes, edges]);
}
