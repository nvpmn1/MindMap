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
import { advancedSaveQueue } from '@/lib/advanced-save-queue';

// useEditorState

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

// useNodeOperations

export function useNodeOperations(
  nodes: PowerNode[],
  edges: PowerEdge[],
  setNodes: React.Dispatch<React.SetStateAction<PowerNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<PowerEdge[]>>,
  _selectedNodeId: string | null,
  saveToHistory: () => void,
  _mapId?: string
) {
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const generateId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

  const generateEdgeId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

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
        const edgeId = generateEdgeId();
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

      return newNode;
    },
    [
      nodes,
      edges,
      setNodes,
      setEdges,
      saveToHistory,
      generateId,
      generateEdgeId,
      screenToFlowPosition,
      getViewport,
    ]
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<NeuralNodeData>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    },
    [setNodes]
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

      toast.success('No removido', { duration: 2500 });
    },
    [edges, setNodes, setEdges, saveToHistory]
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
        { ...original.data, label: `${original.data.label} (copia)` }
      );

      toast.success('No duplicado', { duration: 2500 });
      return newNode;
    },
    [nodes, createNode, saveToHistory]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceId = connection.source!;
      const targetId = connection.target!;

      // Validation 1: Prevent self-loops (connecting node to itself)
      if (sourceId === targetId) {
        toast.error('Um nó não pode se conectar a si mesmo!', { duration: 3000 });
        return;
      }

      // Validation 2: Check if nodes exist
      const sourceExists = nodes.some((n) => n.id === sourceId);
      const targetExists = nodes.some((n) => n.id === targetId);
      if (!sourceExists || !targetExists) {
        toast.error('Um ou ambos os nós não existem!', { duration: 3000 });
        return;
      }

      // Validation 3: Prevent duplicate connections (source->target or inverse)
      const edgeExists = edges.some(
        (e) =>
          (e.source === sourceId && e.target === targetId) ||
          (e.source === targetId && e.target === sourceId)
      );
      if (edgeExists) {
        toast.error('Já existe uma conexão entre esses nós!', { duration: 3000 });
        return;
      }

      const edgeId = generateEdgeId();

      // All validations passed - create connection
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

      toast.success('Conexão criada com sucesso!', { duration: 2500 });
    },
    [nodes, edges, setEdges, saveToHistory, generateEdgeId]
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

// useMapPersistence

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
  type EdgeSnapshot = {
    fingerprint: string;
    source: string;
    target: string;
  };

  const deltaSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isSavingRef = useRef(false);
  const loadedRef = useRef(false);
  const snapshotInitializedRef = useRef(false);
  const lastSuccessfulSaveRef = useRef<number | null>(null);
  const lastFailureRecoveryRef = useRef(0);
  const lastSnapshotRef = useRef<{
    mapTitle: string;
    mapDescription: string;
    nodes: Map<string, string>;
    edges: Map<string, EdgeSnapshot>;
  }>({
    mapTitle: '',
    mapDescription: '',
    nodes: new Map(),
    edges: new Map(),
  });

  const isRemoteMap = mapId && mapId !== 'new' && mapId !== 'local' && !mapId.startsWith('local_');
  const { workspaces } = useAuthStore();
  const workspaceId = workspaces[0]?.id || '11111111-1111-1111-1111-111111111111';

  const isUuid = useCallback(
    (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    []
  );

  const generateUuid = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

  const getBackupKey = useCallback((id: string) => `neuralmap_backup_${id}`, []);

  const stableStringify = useCallback((value: unknown): string => {
    const normalize = (input: unknown): unknown => {
      if (Array.isArray(input)) {
        return input.map((item) => normalize(item));
      }

      if (input && typeof input === 'object') {
        const entries = Object.entries(input as Record<string, unknown>)
          .filter(([, v]) => typeof v !== 'function')
          .sort(([a], [b]) => a.localeCompare(b));

        const out: Record<string, unknown> = {};
        for (const [key, val] of entries) {
          out[key] = normalize(val);
        }
        return out;
      }

      return input;
    };

    return JSON.stringify(normalize(value));
  }, []);

  const sanitizeNodeData = useCallback(
    (data: NeuralNodeData): Record<string, unknown> =>
      JSON.parse(stableStringify(data)) as Record<string, unknown>,
    [stableStringify]
  );

  const nodeFingerprint = useCallback(
    (node: PowerNode): string =>
      stableStringify({
        id: node.id,
        position: {
          x: node.position?.x || 0,
          y: node.position?.y || 0,
        },
        data: sanitizeNodeData(node.data),
      }),
    [sanitizeNodeData, stableStringify]
  );

  const edgeFingerprint = useCallback(
    (edge: PowerEdge): string =>
      stableStringify({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }),
    [stableStringify]
  );

  const buildEdgeSnapshot = useCallback(
    (edge: PowerEdge): EdgeSnapshot => ({
      fingerprint: edgeFingerprint(edge),
      source: edge.source,
      target: edge.target,
    }),
    [edgeFingerprint]
  );

  const normalizeGraphIds = useCallback(
    (
      inputNodes: PowerNode[],
      inputEdges: PowerEdge[]
    ): { nodes: PowerNode[]; edges: PowerEdge[] } => {
      const nodeIdMap = new Map<string, string>();

      for (const node of inputNodes) {
        if (!isUuid(node.id)) {
          nodeIdMap.set(node.id, generateUuid());
        }
      }

      const normalizedNodes = inputNodes.map((node) => ({
        ...node,
        id: nodeIdMap.get(node.id) || node.id,
      }));

      const normalizedEdges = inputEdges
        .map((edge) => {
          const source = nodeIdMap.get(edge.source) || edge.source;
          const target = nodeIdMap.get(edge.target) || edge.target;
          if (!isUuid(source) || !isUuid(target) || source === target) {
            return null;
          }
          return {
            ...edge,
            id: isUuid(edge.id) ? edge.id : generateUuid(),
            source,
            target,
          } as PowerEdge;
        })
        .filter((edge): edge is PowerEdge => edge !== null);

      return { nodes: normalizedNodes, edges: normalizedEdges };
    },
    [generateUuid, isUuid]
  );

  const seedSnapshot = useCallback(
    (info: MapInfo | null, nextNodes: PowerNode[], nextEdges: PowerEdge[]) => {
      const nodeMap = new Map<string, string>();
      const edgeMap = new Map<string, EdgeSnapshot>();

      for (const node of nextNodes) {
        nodeMap.set(node.id, nodeFingerprint(node));
      }

      for (const edge of nextEdges) {
        edgeMap.set(edge.id, buildEdgeSnapshot(edge));
      }

      lastSnapshotRef.current = {
        mapTitle: info?.title || '',
        mapDescription: info?.description || '',
        nodes: nodeMap,
        edges: edgeMap,
      };
      snapshotInitializedRef.current = true;
    },
    [buildEdgeSnapshot, nodeFingerprint]
  );

  const persistEmergencyBackup = useCallback(() => {
    if (!mapId) return;

    try {
      localStorage.setItem(
        getBackupKey(mapId),
        JSON.stringify({
          mapInfo,
          nodes,
          edges,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Best effort only.
    }
  }, [mapId, mapInfo, nodes, edges, getBackupKey]);

  const resolveServerIdMappings = useCallback(() => {
    if (!mapId || !isRemoteMap) return;

    const mapping = advancedSaveQueue.getIdMapping(mapId);
    if (mapping.size === 0) return;

    setNodes((prev) => {
      let changed = false;
      const next = prev.map((node) => {
        const serverId = mapping.get(node.id);
        if (serverId && serverId !== node.id) {
          changed = true;
          return { ...node, id: serverId };
        }
        return node;
      });
      return changed ? next : prev;
    });

    setEdges((prev) => {
      let changed = false;
      const next = prev.map((edge) => {
        const source = mapping.get(edge.source) || edge.source;
        const target = mapping.get(edge.target) || edge.target;
        if (source !== edge.source || target !== edge.target) {
          changed = true;
          return { ...edge, source, target };
        }
        return edge;
      });
      return changed ? next : prev;
    });

    const mappedNodeSnapshot = new Map<string, string>();
    for (const [nodeId, fingerprint] of lastSnapshotRef.current.nodes) {
      mappedNodeSnapshot.set(mapping.get(nodeId) || nodeId, fingerprint);
    }

    const mappedEdgeSnapshot = new Map<string, EdgeSnapshot>();
    for (const [edgeId, edgeSnap] of lastSnapshotRef.current.edges) {
      mappedEdgeSnapshot.set(edgeId, {
        ...edgeSnap,
        source: mapping.get(edgeSnap.source) || edgeSnap.source,
        target: mapping.get(edgeSnap.target) || edgeSnap.target,
      });
    }

    lastSnapshotRef.current.nodes = mappedNodeSnapshot;
    lastSnapshotRef.current.edges = mappedEdgeSnapshot;
  }, [mapId, isRemoteMap, setNodes, setEdges]);

  const restoreEmergencyBackup = useCallback((): boolean => {
    if (!mapId) return false;

    const backupRaw = localStorage.getItem(getBackupKey(mapId));
    if (!backupRaw) return false;

    try {
      const backup = JSON.parse(backupRaw);
      const backupMapInfo: MapInfo = backup.mapInfo || {
        id: mapId,
        title: 'Mapa (backup local)',
      };
      const backupNodes: PowerNode[] = Array.isArray(backup.nodes) ? backup.nodes : [];
      const backupEdges: PowerEdge[] = Array.isArray(backup.edges) ? backup.edges : [];
      const normalized = normalizeGraphIds(backupNodes, backupEdges);

      setMapInfo(backupMapInfo);
      setNodes(normalized.nodes);
      setEdges(normalized.edges);
      seedSnapshot(backupMapInfo, normalized.nodes, normalized.edges);
      return true;
    } catch {
      return false;
    }
  }, [mapId, getBackupKey, normalizeGraphIds, seedSnapshot, setEdges, setMapInfo, setNodes]);

  const createDefaultMap = useCallback(() => {
    const centralNode: PowerNode = {
      id: generateUuid(),
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

    const info: MapInfo = { id: mapId || 'local', title: 'Novo Mapa Neural' };
    setMapInfo(info);
    setNodes([centralNode]);
    setEdges([]);
    seedSnapshot(info, [centralNode], []);
  }, [generateUuid, mapId, seedSnapshot, setEdges, setMapInfo, setNodes]);

  const withRetry = useCallback(
    async <T>(operation: () => Promise<T>, attempts = 3, initialDelayMs = 400): Promise<T> => {
      let currentDelay = initialDelayMs;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          if (attempt >= attempts) break;

          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay = Math.min(currentDelay * 2, 2500);
        }
      }

      throw lastError;
    },
    []
  );

  const loadMap = useCallback(async () => {
    if (!mapId || loadedRef.current) return;

    loadedRef.current = true;
    setIsLoading(true);

    try {
      if (mapId === 'new') {
        try {
          const response = await withRetry(
            () =>
              mapsApi.create({
                title: 'Novo Mapa Neural',
                description: 'Meu novo mapa neural colaborativo',
                workspace_id: workspaceId,
              }),
            3,
            600
          );

          const created = response.data as { id?: string } | undefined;
          if (created?.id) {
            navigate(`/map/${created.id}`);
            return;
          }
        } catch (err) {
          console.error('[LoadMap] Failed to create new map:', err);
          toast.error('Erro ao criar mapa. Verifique sua conexao.', { duration: 4000 });
        }

        setIsLoading(false);
        return;
      }

      if (!isRemoteMap) {
        const saved = localStorage.getItem(`neuralmap_${mapId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const info = parsed.mapInfo || { id: mapId, title: 'Mapa Local' };
            const localNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
            const localEdges = Array.isArray(parsed.edges) ? parsed.edges : [];

            setMapInfo(info);
            setNodes(localNodes);
            setEdges(localEdges);
            seedSnapshot(info, localNodes, localEdges);
          } catch {
            createDefaultMap();
          }
        } else {
          createDefaultMap();
        }
        return;
      }

      try {
        const mapResponse = await withRetry(
          () => mapsApi.get(mapId, { includeGraph: true }),
          3,
          500
        );
        const mapData = mapResponse.data as any;
        if (!mapData?.id) {
          throw new Error('Map payload is missing id');
        }

        let nodesPayload: any[] | null = Array.isArray(mapData.nodes) ? mapData.nodes : null;
        let edgesPayload: any[] | null = Array.isArray(mapData.edges) ? mapData.edges : null;

        if (!nodesPayload || !edgesPayload) {
          const [nodesFallback, edgesFallback] = await Promise.all([
            !nodesPayload
              ? withRetry(() => nodesApi.listByMap(mapId), 3, 500)
              : Promise.resolve(null),
            !edgesPayload
              ? withRetry(
                  async () => {
                    try {
                      return await nodesApi.getEdges(mapId);
                    } catch {
                      return { success: true, data: [] } as any;
                    }
                  },
                  2,
                  400
                )
              : Promise.resolve(null),
          ]);

          if (!nodesPayload) {
            nodesPayload = Array.isArray((nodesFallback as any)?.data)
              ? ((nodesFallback as any).data as any[])
              : [];
          }
          if (!edgesPayload) {
            edgesPayload = Array.isArray((edgesFallback as any)?.data)
              ? ((edgesFallback as any).data as any[])
              : [];
          }
        }

        const info: MapInfo = {
          id: mapData.id,
          title: mapData.title,
          description: mapData.description || '',
          createdAt: mapData.created_at,
          updatedAt: mapData.updated_at,
        };

        const loadedNodes: PowerNode[] = Array.isArray(nodesPayload)
          ? (nodesPayload as any[]).map((n) => ({
              id: n.id,
              type: 'power',
              position: { x: n.position_x || 0, y: n.position_y || 0 },
              data: {
                label: n.label || 'Sem titulo',
                type: n.type || 'idea',
                description: n.content || '',
                ...DEFAULT_NODE_DATA,
                ...(typeof n.data === 'object' && n.data !== null ? n.data : {}),
              },
            }))
          : [];

        let normalizedNodes = loadedNodes;
        if (loadedNodes.length === 0) {
          const rootPayload: Record<string, unknown> = {
            id: generateUuid(),
            map_id: mapId,
            type: 'idea',
            label: mapData.title || 'Tema Central',
            content: '',
            position_x: 0,
            position_y: 0,
          };

          const createdRoot = await withRetry(() => nodesApi.create(rootPayload as any), 2, 400);
          const rootNode = createdRoot?.data as any;

          normalizedNodes = [
            {
              id: rootNode?.id || String(rootPayload.id),
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
            },
          ];
        }

        const loadedEdges: PowerEdge[] = Array.isArray(edgesPayload)
          ? (edgesPayload as any[]).map((e) => ({
              id: e.id,
              source: e.source_id,
              target: e.target_id,
              type: 'power',
              animated: e.animated ?? true,
              data: { style: 'neural' as const, ...(e.style || {}) },
            }))
          : [];

        const normalizedEdges =
          loadedEdges.length > 0
            ? loadedEdges
            : normalizedNodes
                .map((n) => {
                  const source = (nodesPayload as any[])?.find((raw) => raw.id === n.id)?.parent_id;
                  if (!source) return null;
                  return {
                    id: generateUuid(),
                    source,
                    target: n.id,
                    type: 'power',
                    animated: true,
                    data: { style: 'neural' as const },
                  } as PowerEdge;
                })
                .filter((edge): edge is PowerEdge => edge !== null);

        setMapInfo(info);
        setNodes(normalizedNodes);
        setEdges(normalizedEdges);
        seedSnapshot(info, normalizedNodes, normalizedEdges);
      } catch (err: any) {
        console.error('[LoadMap] API error:', err);

        if (err?.statusCode === 404) {
          toast.error('Mapa nao encontrado ou sem acesso.', { duration: 4000 });
          navigate('/maps');
          return;
        }

        if (restoreEmergencyBackup()) {
          toast.error('Servidor indisponivel. Mapa carregado do backup local.', {
            duration: 5000,
          });
          return;
        }

        toast.error('Erro ao carregar mapa. Verifique sua conexao.', { duration: 4000 });
        createDefaultMap();
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    createDefaultMap,
    generateUuid,
    isRemoteMap,
    mapId,
    navigate,
    restoreEmergencyBackup,
    seedSnapshot,
    setEdges,
    setIsLoading,
    setMapInfo,
    setNodes,
    withRetry,
    workspaceId,
  ]);

  const enqueueDeltaChanges = useCallback(() => {
    if (!mapId || !isRemoteMap) return;

    resolveServerIdMappings();

    const nextNodeSnapshot = new Map<string, string>();
    const nextEdgeSnapshot = new Map<string, EdgeSnapshot>();

    for (const node of nodes) {
      nextNodeSnapshot.set(node.id, nodeFingerprint(node));
    }

    for (const edge of edges) {
      nextEdgeSnapshot.set(edge.id, buildEdgeSnapshot(edge));
    }

    if (!snapshotInitializedRef.current) {
      lastSnapshotRef.current = {
        mapTitle: mapInfo?.title || '',
        mapDescription: mapInfo?.description || '',
        nodes: nextNodeSnapshot,
        edges: nextEdgeSnapshot,
      };
      snapshotInitializedRef.current = true;
      return;
    }

    if (mapInfo?.title) {
      const nextTitle = mapInfo.title;
      const nextDescription = mapInfo.description || '';
      if (
        nextTitle !== lastSnapshotRef.current.mapTitle ||
        nextDescription !== lastSnapshotRef.current.mapDescription
      ) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'map-update',
          payload: {
            title: nextTitle,
            description: nextDescription,
          },
        });

        lastSnapshotRef.current.mapTitle = nextTitle;
        lastSnapshotRef.current.mapDescription = nextDescription;
      }
    }

    const previousNodes = lastSnapshotRef.current.nodes;
    for (const node of nodes) {
      const currentFingerprint = nextNodeSnapshot.get(node.id)!;
      const previousFingerprint = previousNodes.get(node.id);

      const parentEdge = edges.find((edge) => edge.target === node.id);
      const parentId = parentEdge?.source || null;

      const basePayload: Record<string, unknown> = {
        map_id: mapId,
        parent_id: parentId,
        type: node.data.type || 'idea',
        label: node.data.label || 'Untitled',
        content: node.data.description || '',
        position_x: node.position?.x || 0,
        position_y: node.position?.y || 0,
        data: sanitizeNodeData(node.data),
        collapsed: Boolean(node.data.collapsed),
      };
      if (isUuid(node.id)) {
        basePayload.id = node.id;
      }

      if (!previousFingerprint) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'node-create',
          localId: node.id,
          payload: basePayload,
        });
        continue;
      }

      if (previousFingerprint !== currentFingerprint) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'node-update',
          payload: {
            id: node.id,
            parent_id: parentId,
            type: node.data.type || 'idea',
            label: node.data.label || 'Untitled',
            content: node.data.description || '',
            position_x: node.position?.x || 0,
            position_y: node.position?.y || 0,
            data: sanitizeNodeData(node.data),
            collapsed: Boolean(node.data.collapsed),
          },
        });
      }
    }

    for (const previousNodeId of previousNodes.keys()) {
      if (!nextNodeSnapshot.has(previousNodeId)) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'node-delete',
          payload: {
            id: previousNodeId,
            cascade: true,
          },
        });
      }
    }

    const previousEdges = lastSnapshotRef.current.edges;
    for (const edge of edges) {
      const nextEdge = nextEdgeSnapshot.get(edge.id)!;
      const previousEdge = previousEdges.get(edge.id);

      const createPayload: Record<string, unknown> = {
        map_id: mapId,
        source_id: edge.source,
        target_id: edge.target,
      };
      if (isUuid(edge.id)) {
        createPayload.id = edge.id;
      }

      if (!previousEdge) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'edge-create',
          payload: createPayload,
        });
        continue;
      }

      if (previousEdge.fingerprint !== nextEdge.fingerprint) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'edge-delete',
          payload: {
            map_id: mapId,
            id: edge.id,
            source_id: previousEdge.source,
            target_id: previousEdge.target,
          },
        });

        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'edge-create',
          payload: createPayload,
        });
      }
    }

    for (const [previousEdgeId, previousEdge] of previousEdges) {
      if (!nextEdgeSnapshot.has(previousEdgeId)) {
        advancedSaveQueue.enqueueOperation({
          mapId,
          type: 'edge-delete',
          payload: {
            map_id: mapId,
            id: previousEdgeId,
            source_id: previousEdge.source,
            target_id: previousEdge.target,
          },
        });
      }
    }

    lastSnapshotRef.current.nodes = nextNodeSnapshot;
    lastSnapshotRef.current.edges = nextEdgeSnapshot;
  }, [
    buildEdgeSnapshot,
    edges,
    isRemoteMap,
    isUuid,
    mapId,
    mapInfo,
    nodeFingerprint,
    nodes,
    resolveServerIdMappings,
    sanitizeNodeData,
  ]);

  const saveMap = useCallback(async () => {
    if (!mapId || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (isRemoteMap) {
        enqueueDeltaChanges();
        persistEmergencyBackup();
        resolveServerIdMappings();

        const syncResult = await advancedSaveQueue.forceSync({
          timeoutMs: 12000,
          mapId,
          includeDeadLetter: true,
        });
        resolveServerIdMappings();

        const status = advancedSaveQueue.getStatus(mapId);
        if (status.failedOperations.length > 0) {
          toast.error('Salvamento com falhas. Algumas operacoes precisam de retry.', {
            duration: 4000,
          });
          return;
        }

        if (syncResult.drained) {
          advancedSaveQueue.clearFailedOperations(mapId);
          setLastSaved(new Date());
          toast.success('Mapa salvo com sucesso!', { duration: 2000 });
        } else {
          toast.error(`Sincronizacao parcial: ${syncResult.remaining} operacao(oes) pendentes.`, {
            duration: 3500,
          });
        }

        return;
      }

      localStorage.setItem(
        `neuralmap_${mapId}`,
        JSON.stringify({
          mapInfo,
          nodes,
          edges,
          savedAt: new Date().toISOString(),
        })
      );
      setLastSaved(new Date());
      toast.success('Mapa salvo localmente!', { duration: 2000 });
    } catch (err) {
      console.error('[Save] Error:', err);
      toast.error('Erro ao salvar mapa', { duration: 3000 });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [
    edges,
    enqueueDeltaChanges,
    isRemoteMap,
    mapId,
    mapInfo,
    nodes,
    persistEmergencyBackup,
    resolveServerIdMappings,
    setIsSaving,
    setLastSaved,
  ]);

  useEffect(() => {
    if (!mapId || !isRemoteMap) return;
    if (deltaSaveTimerRef.current) clearTimeout(deltaSaveTimerRef.current);

    deltaSaveTimerRef.current = setTimeout(() => {
      try {
        enqueueDeltaChanges();
        persistEmergencyBackup();
      } catch (err) {
        console.error('[AutoSaveDelta] Error:', err);
      }
    }, 350);

    return () => {
      if (deltaSaveTimerRef.current) clearTimeout(deltaSaveTimerRef.current);
    };
  }, [edges, enqueueDeltaChanges, isRemoteMap, mapId, mapInfo, nodes, persistEmergencyBackup]);

  useEffect(() => {
    if (!isRemoteMap || !mapId) return;

    const interval = setInterval(() => {
      resolveServerIdMappings();
      const status = advancedSaveQueue.getStatus(mapId);
      setIsSaving(status.isSaving || status.queueLength > 0);

      if (
        status.lastSuccessfulSave &&
        status.lastSuccessfulSave !== lastSuccessfulSaveRef.current
      ) {
        lastSuccessfulSaveRef.current = status.lastSuccessfulSave;
        setLastSaved(new Date(status.lastSuccessfulSave));
      }

      if (
        status.failedOperations.length > 0 &&
        Date.now() - lastFailureRecoveryRef.current > 10000
      ) {
        lastFailureRecoveryRef.current = Date.now();
        const restored = advancedSaveQueue.requeueFailedOperations(mapId);
        if (restored > 0) {
          enqueueDeltaChanges();
          persistEmergencyBackup();
          void advancedSaveQueue.forceSync({ timeoutMs: 5000, mapId });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [
    enqueueDeltaChanges,
    isRemoteMap,
    mapId,
    persistEmergencyBackup,
    resolveServerIdMappings,
    setIsSaving,
    setLastSaved,
  ]);

  useEffect(() => {
    if (!isRemoteMap || !mapId) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      try {
        enqueueDeltaChanges();
        persistEmergencyBackup();
        void advancedSaveQueue.forceSync({ timeoutMs: 1200, mapId });

        const status = advancedSaveQueue.getStatus(mapId);
        if (status.queueLength > 0) {
          event.preventDefault();
          event.returnValue = '';
        }
      } catch {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handlePageHide = () => {
      enqueueDeltaChanges();
      persistEmergencyBackup();
      void advancedSaveQueue.forceSync({ timeoutMs: 1200, mapId });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [enqueueDeltaChanges, isRemoteMap, mapId, persistEmergencyBackup]);

  useEffect(() => {
    if (!isRemoteMap || !mapId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        persistEmergencyBackup();
        return;
      }

      enqueueDeltaChanges();
      resolveServerIdMappings();
      void advancedSaveQueue.forceSync({ timeoutMs: 4000, mapId });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enqueueDeltaChanges, isRemoteMap, mapId, persistEmergencyBackup, resolveServerIdMappings]);

  useEffect(() => {
    loadedRef.current = false;
    isSavingRef.current = false;
    snapshotInitializedRef.current = false;
    lastSuccessfulSaveRef.current = null;
    lastFailureRecoveryRef.current = 0;
    lastSnapshotRef.current = {
      mapTitle: '',
      mapDescription: '',
      nodes: new Map(),
      edges: new Map(),
    };

    if (deltaSaveTimerRef.current) {
      clearTimeout(deltaSaveTimerRef.current);
    }
  }, [mapId]);

  useEffect(() => {
    loadedRef.current = false;
    loadMap();
  }, [mapId, loadMap]);

  return { saveMap, loadMap, isRemoteMap };
}

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
        case 'backspace': {
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
        }
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

// useMapAnalytics

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
