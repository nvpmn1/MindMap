// ============================================================================
// NeuralMap Editor - Custom Hooks
// ============================================================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNodesState, useEdgesState, useReactFlow, type Connection } from '@xyflow/react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { 
  PowerNode, PowerEdge, NeuralNodeData, NeuralNodeType, 
  MapInfo, EditorSettings, CollaboratorInfo, ViewMode,
  MapAnalytics
} from './types';
import { DEFAULT_NODE_DATA, DEFAULT_EDITOR_SETTINGS, NODE_TYPE_CONFIG } from './constants';

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
      edges: JSON.parse(JSON.stringify(edges)) 
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
      edges: JSON.parse(JSON.stringify(edges)) 
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
      edges: JSON.parse(JSON.stringify(edges)) 
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  }, [nodes, edges, setNodes, setEdges]);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return {
    mapId, navigate,
    nodes, setNodes, onNodesChange,
    edges, setEdges, onEdgesChange,
    mapInfo, setMapInfo,
    selectedNodeId, setSelectedNodeId, selectedNode,
    viewMode, setViewMode,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    lastSaved, setLastSaved,
    settings, setSettings,
    collaborators, setCollaborators,
    saveToHistory, undo, redo, canUndo, canRedo,
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

  const generateId = useCallback(() => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

  const createNode = useCallback((
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
        const parent = nodes.find(n => n.id === parentId);
        if (parent) {
          const childCount = edges.filter(e => e.source === parentId).length;
          const angle = (childCount * Math.PI / 4) - Math.PI / 2;
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

    setNodes(prev => [...prev, newNode]);

    // Create edge if has parent
    if (parentId) {
      const edgeId = `edge_${parentId}_${id}`;
      setEdges(prev => [...prev, {
        id: edgeId,
        source: parentId,
        target: id,
        type: 'power',
        animated: true,
        data: { style: 'neural' as const, strength: 1 },
      }]);
    }

    // Save to API if remote map
    if (mapId && mapId !== 'new' && mapId !== 'local') {
      import('../../../lib/api').then(({ nodesApi }) => {
        nodesApi.create({
          map_id: mapId,
          type: type as any,
          label: newNode.data.label,
          content: newNode.data.description || '',
          position_x: nodePosition!.x,
          position_y: nodePosition!.y,
        } as any).catch(() => {});
      });
    }

    return newNode;
  }, [nodes, edges, setNodes, setEdges, saveToHistory, generateId, screenToFlowPosition, getViewport, mapId]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<NeuralNodeData>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ));
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    saveToHistory();
    
    // Find all descendants
    const getDescendants = (id: string): string[] => {
      const children = edges.filter(e => e.source === id).map(e => e.target);
      return children.flatMap(c => [c, ...getDescendants(c)]);
    };
    
    const toDelete = new Set([nodeId, ...getDescendants(nodeId)]);
    
    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    setEdges(prev => prev.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)));
    
    toast.success('Nó removido');
  }, [edges, setNodes, setEdges, saveToHistory]);

  const duplicateNode = useCallback((nodeId: string) => {
    const original = nodes.find(n => n.id === nodeId);
    if (!original) return;
    
    saveToHistory();
    const newNode = createNode(
      original.data.type,
      { x: original.position.x + 50, y: original.position.y + 50 },
      null,
      { ...original.data, label: `${original.data.label} (cópia)` }
    );
    
    toast.success('Nó duplicado');
    return newNode;
  }, [nodes, createNode, saveToHistory]);

  const onConnect = useCallback((connection: Connection) => {
    saveToHistory();
    const edgeId = `edge_${connection.source}_${connection.target}`;
    setEdges(prev => [...prev, {
      id: edgeId,
      source: connection.source!,
      target: connection.target!,
      type: 'power',
      animated: true,
      data: { style: 'neural' as const, strength: 1 },
    }]);
  }, [setEdges, saveToHistory]);

  return {
    createNode, updateNodeData, deleteNode, duplicateNode, onConnect, generateId
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
  const isRemoteMap = mapId && mapId !== 'new' && mapId !== 'local' && !mapId.startsWith('local_');

  // Create default map when loading fails or no data exists
  const createDefaultMap = useCallback(() => {
    const centralNode: PowerNode = {
      id: 'central_1',
      type: 'power',
      position: { x: 0, y: 0 },
      data: {
        label: 'Tema Central',
        type: 'central',
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

  // Load map
  const loadMap = useCallback(async () => {
    if (!mapId) return;
    setIsLoading(true);

    try {
      if (mapId === 'new') {
        // Create new remote map
        const { mapsApi } = await import('../../../lib/api');
        try {
          const response = await mapsApi.create({
            title: 'Novo Mapa Neural',
            description: 'Meu novo mapa neural colaborativo',
            workspace_id: '00000000-0000-0000-0000-000000000000',
          } as any);
          if ((response.data as any)) {
            navigate(`/map/${(response.data as any).id}`);
            return;
          }
        } catch {
          // Fallback to local
          const localId = `local_${Date.now()}`;
          navigate(`/map/${localId}`);
          return;
        }
      }

      if (isRemoteMap) {
        const { mapsApi, nodesApi } = await import('../../../lib/api');
        try {
          const [mapResponse, nodesResponse] = await Promise.all([
            mapsApi.get(mapId),
            nodesApi.listByMap(mapId),
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
            const loadedNodes: PowerNode[] = nodesResponse.data.map((n: any) => ({
              id: n.id,
              type: 'power',
              position: { x: n.position_x || 0, y: n.position_y || 0 },
              data: {
                label: n.label || 'Sem título',
                type: n.type || 'idea',
                description: n.content || '',
                ...DEFAULT_NODE_DATA,
                ...(typeof n.data === 'object' ? n.data : {}),
              },
            }));

            setNodes(loadedNodes);

            // Load edges
            try {
              const edgesResponse = await nodesApi.getEdges(mapId);
              if (edgesResponse.data && Array.isArray(edgesResponse.data)) {
                const loadedEdges: PowerEdge[] = edgesResponse.data.map((e: any) => ({
                  id: e.id,
                  source: e.source_node_id || e.source,
                  target: e.target_node_id || e.target,
                  type: 'power',
                  animated: true,
                  data: { style: 'neural' as const },
                }));
                setEdges(loadedEdges);
              }
            } catch {
              // Build edges from parent_id
              const parentEdges: PowerEdge[] = [];
              nodesResponse.data.forEach((n: any) => {
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
          console.warn('[Map Loading] API error, falling back to default map:', err);
          toast.error('Usando modo offline - alterações serão salvas localmente', { duration: 3000 });
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
  }, [mapId, isRemoteMap, navigate, setNodes, setEdges, setMapInfo, setIsLoading, createDefaultMap]);

  // Save map
  const saveMap = useCallback(async () => {
    setIsSaving(true);
    try {
      if (isRemoteMap) {
        const { mapsApi, nodesApi } = await import('../../../lib/api');
        if (mapInfo) {
          await mapsApi.update(mapId!, {
            title: mapInfo.title,
            description: mapInfo.description || '',
          });
        }
        // Batch update nodes
        for (const node of nodes) {
          await nodesApi.update(node.id, {
            label: node.data.label,
            content: node.data.description || '',
            position_x: node.position.x,
            position_y: node.position.y,
            data: node.data as any,
            type: node.data.type as any,
          }).catch(() => {});
        }
      } else {
        localStorage.setItem(`neuralmap_${mapId}`, JSON.stringify({
          mapInfo, nodes, edges,
          savedAt: new Date().toISOString(),
        }));
      }
      setLastSaved(new Date());
      toast.success('Mapa salvo!', { duration: 1500 });
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }, [isRemoteMap, mapId, mapInfo, nodes, edges, setIsSaving, setLastSaved]);

  // Auto-save
  useEffect(() => {
    if (nodes.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (!isRemoteMap) {
        localStorage.setItem(`neuralmap_${mapId}`, JSON.stringify({
          mapInfo, nodes, edges,
          savedAt: new Date().toISOString(),
        }));
        setLastSaved(new Date());
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [nodes, edges, mapInfo, mapId, isRemoteMap, setLastSaved]);

  // Initial load
  useEffect(() => {
    loadMap();
  }, [loadMap]);

  return { saveMap, loadMap, isRemoteMap };
}

// ─── useKeyboardShortcuts ───────────────────────────────────────────────────

export function useEditorKeyboard(
  createNode: (type: NeuralNodeType, pos?: { x: number; y: number }, parentId?: string | null) => void,
  deleteNode: (id: string) => void,
  selectedNodeId: string | null,
  setSelectedNodeId: (id: string | null) => void,
  undo: () => void,
  redo: () => void,
  saveMap: () => void,
  toggleAI: () => void,
  settings: EditorSettings,
  setSettings: React.Dispatch<React.SetStateAction<EditorSettings>>
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
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
          if (selectedNodeId) deleteNode(selectedNodeId);
          break;
        case 'escape':
          setSelectedNodeId(null);
          break;
        case 'g':
          setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }));
          break;
        case 'l':
          setSettings(prev => ({ ...prev, isLocked: !prev.isLocked }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNode, deleteNode, selectedNodeId, undo, redo, saveMap, toggleAI, settings, setSettings, setSelectedNodeId]);
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

    nodes.forEach(node => {
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
    const maxEdges = nodes.length * (nodes.length - 1) / 2;
    const connectionDensity = maxEdges > 0 ? edges.length / maxEdges : 0;

    // Most connected
    const connectionCounts = new Map<string, number>();
    edges.forEach(e => {
      connectionCounts.set(e.source, (connectionCounts.get(e.source) || 0) + 1);
      connectionCounts.set(e.target, (connectionCounts.get(e.target) || 0) + 1);
    });

    const mostConnected = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, connections]) => {
        const node = nodes.find(n => n.id === id);
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
