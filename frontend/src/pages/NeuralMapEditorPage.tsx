// ============================================================================
// NeuralMap - Main Editor Page (Complete Overhaul v2)
// The heart of the application - fully functional editor
// ============================================================================

import React, { useState, useCallback, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Brain, Calendar, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Editor core
import type { NeuralNodeType, PowerNode, PowerEdge, NeuralNodeData, AIAgentAction, ViewMode } from '../components/mindmap/editor/types';
import {
  useEditorState,
  useNodeOperations,
  useMapPersistence,
  useEditorKeyboard,
  useMapAnalytics
} from '../components/mindmap/editor/hooks';
import { NODE_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '../components/mindmap/editor/constants';

// Components
import { PowerNode as PowerNodeComponent } from '../components/mindmap/nodes/PowerNode';
import { PowerEdge as PowerEdgeComponent } from '../components/mindmap/edges/PowerEdge';
import { EditorHeader } from '../components/mindmap/layout/EditorHeader';
import { CommandToolbar } from '../components/mindmap/toolbars/CommandToolbar';
import { AgentPanel } from '../components/mindmap/ai/AgentPanel';
import { NodeDetailPanel as PowerNodeDetail } from '../components/mindmap/panels/PowerNodeDetail';
import { AnalyticsPanel } from '../components/mindmap/panels/AnalyticsPanel';
import { ResearchPanel } from '../components/mindmap/panels/ResearchPanel';
import { NeuralContextMenu, type ContextMenuState, type ContextMenuAction } from '../components/mindmap/menus/NeuralContextMenu';

// ─── Node & Edge type registrations ────────────────────────────────────────

const nodeTypes: NodeTypes = { power: PowerNodeComponent as any };
const edgeTypes: EdgeTypes = { power: PowerEdgeComponent as any };

// ─── List View ─────────────────────────────────────────────────────────────

const ListView: React.FC<{
  nodes: PowerNode[];
  edges: PowerEdge[];
  onSelectNode: (id: string) => void;
  selectedNodeId: string | null;
  onUpdateNodeData: (id: string, data: Partial<NeuralNodeData>) => void;
}> = ({ nodes, edges, onSelectNode, selectedNodeId, onUpdateNodeData }) => {
  const [sortBy, setSortBy] = useState<'label' | 'type' | 'status' | 'priority'>('label');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const sortedNodes = useMemo(() => {
    let filtered = [...nodes];
    if (filterType !== 'all') filtered = filtered.filter(n => n.data.type === filterType);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.data.label.toLowerCase().includes(lower) ||
        (n.data.description || '').toLowerCase().includes(lower)
      );
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'label': return a.data.label.localeCompare(b.data.label);
        case 'type': return a.data.type.localeCompare(b.data.type);
        case 'status': return a.data.status.localeCompare(b.data.status);
        case 'priority': {
          const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
          return (o[a.data.priority] ?? 4) - (o[b.data.priority] ?? 4);
        }
        default: return 0;
      }
    });
    return filtered;
  }, [nodes, sortBy, filterType, searchTerm]);

  return (
    <div className="h-full overflow-y-auto p-4 custom-scrollbar">
      <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#060910] z-10 pb-3 border-b border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar nós..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/30"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-300 outline-none">
          <option value="all" className="bg-[#111827]">Todos os tipos</option>
          {Object.entries(NODE_TYPE_CONFIG).map(([k, c]) => (
            <option key={k} value={k} className="bg-[#111827]">{c.label}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-300 outline-none">
          <option value="label" className="bg-[#111827]">Nome</option>
          <option value="type" className="bg-[#111827]">Tipo</option>
          <option value="status" className="bg-[#111827]">Status</option>
          <option value="priority" className="bg-[#111827]">Prioridade</option>
        </select>
      </div>
      <div className="text-xs text-slate-500 mb-2">{sortedNodes.length} nós</div>
      <div className="space-y-1">
        {sortedNodes.map(node => {
          const cfg = NODE_TYPE_CONFIG[node.data.type] || NODE_TYPE_CONFIG.idea;
          const stCfg = STATUS_CONFIG[node.data.status] || STATUS_CONFIG.active;
          const prCfg = PRIORITY_CONFIG[node.data.priority] || PRIORITY_CONFIG.medium;
          const Icon = cfg.icon;
          return (
            <div key={node.id} onClick={() => onSelectNode(node.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all
                ${selectedNodeId === node.id
                  ? 'bg-white/[0.08] border border-white/[0.12]'
                  : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05]'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cfg.gradient} border ${cfg.borderColor}`}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{node.data.label}</div>
                {node.data.description && <div className="text-[11px] text-slate-500 truncate mt-0.5">{node.data.description}</div>}
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${stCfg.bg} ${stCfg.color}`}>{stCfg.label}</span>
              <span className={`text-[10px] font-bold ${prCfg.color}`}>{prCfg.icon}</span>
              {node.data.progress > 0 && (
                <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${node.data.progress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Kanban View ───────────────────────────────────────────────────────────

const KanbanView: React.FC<{
  nodes: PowerNode[]; onSelectNode: (id: string) => void;
  selectedNodeId: string | null; onUpdateNodeData: (id: string, data: Partial<NeuralNodeData>) => void;
}> = ({ nodes, onSelectNode, selectedNodeId, onUpdateNodeData }) => {
  const columns = useMemo(() => {
    const cols: Record<string, PowerNode[]> = {};
    Object.keys(STATUS_CONFIG).forEach(s => { cols[s] = []; });
    nodes.forEach(n => { const s = n.data.status || 'active'; if (!cols[s]) cols[s] = []; cols[s].push(n); });
    return cols;
  }, [nodes]);

  return (
    <div className="h-full overflow-x-auto p-4 custom-scrollbar">
      <div className="flex gap-4 h-full min-w-max">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const colNodes = columns[status] || [];
          return (
            <div key={status} className="w-72 flex-shrink-0 flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className={`w-2.5 h-2.5 rounded-full ${config.bg}`} />
                <span className="text-xs font-semibold text-slate-300">{config.label}</span>
                <span className="ml-auto text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{colNodes.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {colNodes.map(node => {
                  const cfg = NODE_TYPE_CONFIG[node.data.type] || NODE_TYPE_CONFIG.idea;
                  const prCfg = PRIORITY_CONFIG[node.data.priority] || PRIORITY_CONFIG.medium;
                  const Icon = cfg.icon;
                  return (
                    <div key={node.id} onClick={() => onSelectNode(node.id)} draggable
                      onDragStart={e => { e.dataTransfer.setData('nodeId', node.id); e.dataTransfer.effectAllowed = 'move'; }}
                      className={`p-3 rounded-xl cursor-pointer transition-all border
                        ${selectedNodeId === node.id ? 'bg-white/[0.08] border-white/[0.15]' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                        <span className="text-xs font-semibold text-white truncate">{node.data.label}</span>
                        <span className={`ml-auto text-[10px] font-bold ${prCfg.color}`}>{prCfg.icon}</span>
                      </div>
                      {node.data.description && <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{node.data.description}</p>}
                      {node.data.progress > 0 && (
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${node.data.progress}%`, backgroundColor: cfg.color }} />
                        </div>
                      )}
                      {node.data.tags && node.data.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {node.data.tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-slate-400">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 py-2 border-2 border-dashed border-white/[0.06] rounded-xl text-center text-[10px] text-slate-600 hover:border-cyan-500/30 transition-colors"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-cyan-500/40'); }}
                onDragLeave={e => e.currentTarget.classList.remove('border-cyan-500/40')}
                onDrop={e => {
                  e.preventDefault(); e.currentTarget.classList.remove('border-cyan-500/40');
                  const nid = e.dataTransfer.getData('nodeId');
                  if (nid) { onUpdateNodeData(nid, { status: status as any }); toast.success(`Movido para ${config.label}`); }
                }}>
                Solte aqui
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Timeline View ─────────────────────────────────────────────────────────

const TimelineView: React.FC<{
  nodes: PowerNode[]; onSelectNode: (id: string) => void; selectedNodeId: string | null;
}> = ({ nodes, onSelectNode, selectedNodeId }) => {
  const sortedNodes = useMemo(() =>
    [...nodes].sort((a, b) => (a.data.dueDate || a.data.createdAt || '9999').localeCompare(b.data.dueDate || b.data.createdAt || '9999')),
    [nodes]
  );

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.08]" />
        {sortedNodes.map(node => {
          const cfg = NODE_TYPE_CONFIG[node.data.type] || NODE_TYPE_CONFIG.idea;
          const stCfg = STATUS_CONFIG[node.data.status] || STATUS_CONFIG.active;
          const Icon = cfg.icon;
          return (
            <div key={node.id} className="relative flex items-start gap-4 mb-6 ml-2">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${selectedNodeId === node.id ? 'bg-cyan-500/20' : 'bg-[#0c1220]'}`}
                style={{ borderColor: selectedNodeId === node.id ? cfg.color : 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div onClick={() => onSelectNode(node.id)}
                className={`flex-1 p-4 rounded-xl cursor-pointer transition-all border
                  ${selectedNodeId === node.id ? 'bg-white/[0.06] border-white/[0.12]' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{node.data.label}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${stCfg.bg} ${stCfg.color}`}>{stCfg.label}</span>
                </div>
                {node.data.description && <p className="text-[11px] text-slate-500 line-clamp-2">{node.data.description}</p>}
                {node.data.dueDate && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(node.data.dueDate).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Inner Editor ──────────────────────────────────────────────────────────

function NeuralMapEditorInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const editor = useEditorState();
  const {
    mapId, navigate,
    nodes, setNodes, onNodesChange,
    edges, setEdges, onEdgesChange,
    mapInfo, setMapInfo,
    selectedNodeId, setSelectedNodeId, selectedNode,
    viewMode, setViewMode,
    isLoading, setIsLoading,
    isSaving, lastSaved,
    settings, setSettings,
    collaborators,
    saveToHistory, undo, redo, canUndo, canRedo,
  } = editor;

  const { createNode, updateNodeData, deleteNode, duplicateNode, onConnect } =
    useNodeOperations(nodes, edges, setNodes, setEdges, selectedNodeId, saveToHistory, mapId);

  const { saveMap, isRemoteMap } = useMapPersistence(
    mapId, nodes, edges, mapInfo,
    setNodes, setEdges, setMapInfo,
    setIsLoading, editor.setIsSaving, editor.setLastSaved, navigate
  );

  const analytics = useMapAnalytics(nodes, edges);

  // Panel states
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [showResearchPanel, setShowResearchPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<PowerNode | null>(null);
  const [aiPendingPrompt, setAiPendingPrompt] = useState<string | null>(null);

  // Keyboard shortcuts
  useEditorKeyboard(
    createNode, deleteNode, selectedNodeId, setSelectedNodeId,
    undo, redo, saveMap,
    () => setShowAIPanel(p => !p),
    settings, setSettings
  );

  // Save on unmount & before unload (data persistence fix)
  const saveRef = useRef({ nodes, edges, mapInfo, mapId });
  saveRef.current = { nodes, edges, mapInfo, mapId };

  useEffect(() => {
    const handleBeforeUnload = () => {
      const { nodes: n, edges: e, mapInfo: m, mapId: id } = saveRef.current;
      if (n.length > 0 && id) {
        // Strip callback functions from node data before saving
        const cleanNodes = n.map(nd => ({
          ...nd,
          data: Object.fromEntries(Object.entries(nd.data).filter(([k]) =>
            !['onAddChild', 'onAIExpand', 'onDuplicate', 'onDeleteNode', 'onUpdateData'].includes(k)
          )),
        }));
        localStorage.setItem(`neuralmap_${id}`, JSON.stringify({
          mapInfo: m, nodes: cleanNodes, edges: e, savedAt: new Date().toISOString(),
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Also save on React unmount (navigation)
    };
  }, []);

  // Inject callbacks into nodes for PowerNode hover toolbar
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onAddChild: (nodeId: string) => createNode('idea', undefined, nodeId),
        onAIExpand: (nodeId: string) => {
          setSelectedNodeId(nodeId);
          setShowAIPanel(true);
          const nd = nodes.find(n => n.id === nodeId);
          if (nd) {
            setAiPendingPrompt(`Expanda o tópico "${nd.data.label}" com sub-tópicos e ideias derivadas`);
          }
        },
        onDuplicate: (nodeId: string) => duplicateNode(nodeId),
        onDeleteNode: (nodeId: string) => {
          deleteNode(nodeId);
          if (selectedNodeId === nodeId) { setSelectedNodeId(null); setShowDetailPanel(false); }
        },
        onUpdateData: (nodeId: string, d: Partial<NeuralNodeData>) => updateNodeData(nodeId, d),
      },
    }));
  }, [nodes, createNode, duplicateNode, deleteNode, updateNodeData, selectedNodeId, setSelectedNodeId]);

  // Selection
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: sel }) => {
    if (sel.length === 1) { setSelectedNodeId(sel[0].id); setShowDetailPanel(true); }
    else if (sel.length === 0) { setSelectedNodeId(null); setShowDetailPanel(false); }
  }, [setSelectedNodeId]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: PowerNode) => {
    setSelectedNodeId(node.id); setShowDetailPanel(true);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null); setShowDetailPanel(false); setContextMenu(null);
  }, [setSelectedNodeId]);

  // Context menu
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const nodeEl = (event.target as HTMLElement).closest('[data-id]');
    const nodeId = nodeEl?.getAttribute('data-id') || undefined;
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId, isCanvas: !nodeId });
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: PowerNode) => {
    event.preventDefault();
    setSelectedNodeId(node.id);
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, isCanvas: false });
  }, [setSelectedNodeId]);

  // AI Quick Action -> send prompt to panel
  const handleAIQuickAction = useCallback((actionType: string, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const prompts: Record<string, string> = {
      analyze: `Analise o nó "${node.data.label}" em profundidade. Identifique pontos fortes, fracos, oportunidades e ameaças.`,
      expand: `Expanda o tópico "${node.data.label}" com sub-tópicos e ideias derivadas. Crie nós filhos com labels claros.`,
      tasks: `Gere tarefas práticas e acionáveis para "${node.data.label}". Retorne como nós do tipo task.`,
      chart: `Gere dados para um gráfico de barras sobre "${node.data.label}". Inclua dados quantitativos.`,
      ideas: `Gere ideias criativas relacionadas a "${node.data.label}"`,
      research: `Pesquise em profundidade sobre "${node.data.label}"`,
      hypotheses: `Gere hipóteses sobre "${node.data.label}"`,
      organize: `Organize e reestruture o mapa a partir de "${node.data.label}"`,
    };
    setAiPendingPrompt(prompts[actionType] || `Ajude com "${node.data.label}"`);
  }, [nodes]);

  // Context menu actions
  const handleContextMenuAction = useCallback((action: ContextMenuAction) => {
    switch (action.type) {
      case 'add-node': {
        const p = screenToFlowPosition({ x: action.position.x, y: action.position.y });
        createNode(action.nodeType, p, selectedNodeId); break;
      }
      case 'delete-node': deleteNode(action.nodeId); break;
      case 'duplicate-node': duplicateNode(action.nodeId); break;
      case 'copy-node': {
        const n = nodes.find(nd => nd.id === action.nodeId);
        if (n) { setClipboard(JSON.parse(JSON.stringify(n))); toast.success('Nó copiado!'); }
        break;
      }
      case 'cut-node': {
        const n = nodes.find(nd => nd.id === action.nodeId);
        if (n) { setClipboard(JSON.parse(JSON.stringify(n))); deleteNode(action.nodeId); toast.success('Nó cortado!'); }
        break;
      }
      case 'paste-node': {
        if (clipboard) {
          const p = action.position ? screenToFlowPosition({ x: action.position.x, y: action.position.y })
            : { x: clipboard.position.x + 50, y: clipboard.position.y + 50 };
          createNode(clipboard.data.type, p, null, { ...clipboard.data, label: `${clipboard.data.label} (cópia)` });
          toast.success('Nó colado!');
        }
        break;
      }
      case 'pin-node':
        updateNodeData(action.nodeId, { pinned: !nodes.find(n => n.id === action.nodeId)?.data.pinned });
        toast.success('Nó fixado!'); break;
      case 'lock-node': {
        const locked = nodes.find(n => n.id === action.nodeId)?.data.locked;
        updateNodeData(action.nodeId, { locked: !locked });
        setNodes(prev => prev.map(n => n.id === action.nodeId ? { ...n, draggable: !!locked } : n));
        toast.success(locked ? 'Nó desbloqueado' : 'Nó bloqueado'); break;
      }
      case 'collapse-node': {
        const childIds = new Set(edges.filter(e => e.source === action.nodeId).map(e => e.target));
        setNodes(prev => prev.map(n => childIds.has(n.id) ? { ...n, hidden: !n.hidden } : n));
        setEdges(prev => prev.map(e => e.source === action.nodeId ? { ...e, hidden: !e.hidden } : e));
        toast.success('Filhos alternados'); break;
      }
      case 'expand-all':
        setNodes(prev => prev.map(n => ({ ...n, hidden: false })));
        setEdges(prev => prev.map(e => ({ ...e, hidden: false })));
        toast.success('Todos expandidos'); break;
      case 'select-all':
        setNodes(prev => prev.map(n => ({ ...n, selected: true }))); break;
      case 'group-selected': {
        const sel = nodes.filter(n => n.selected);
        if (sel.length < 2) { toast.error('Selecione pelo menos 2 nós'); break; }
        const gn = createNode('group', {
          x: Math.min(...sel.map(n => n.position.x)) - 20,
          y: Math.min(...sel.map(n => n.position.y)) - 40,
        }, null, { label: 'Grupo', description: `${sel.length} nós agrupados` });
        sel.forEach(n => setEdges(prev => [...prev, {
          id: `edge_${gn.id}_${n.id}`, source: gn.id, target: n.id,
          type: 'power', animated: true, data: { style: 'neural' as const },
        }]));
        toast.success(`${sel.length} nós agrupados`); break;
      }
      case 'connect-to':
        toast('Arraste uma conexão do nó fonte para o destino', { icon: 'ℹ️' }); break;
      case 'ai-expand':
        setSelectedNodeId(action.nodeId); setShowAIPanel(true);
        handleAIQuickAction('expand', action.nodeId); break;
      case 'ai-analyze':
        setSelectedNodeId(action.nodeId); setShowAIPanel(true);
        handleAIQuickAction('analyze', action.nodeId); break;
      case 'ai-generate-tasks':
        setSelectedNodeId(action.nodeId); setShowAIPanel(true);
        handleAIQuickAction('tasks', action.nodeId); break;
      case 'ai-research':
        setSelectedNodeId(action.nodeId); setShowResearchPanel(true); break;
      case 'ai-chart':
        setSelectedNodeId(action.nodeId); setShowAIPanel(true);
        handleAIQuickAction('chart', action.nodeId); break;
      case 'change-type':
        updateNodeData(action.nodeId, { type: action.nodeType }); break;
      case 'disconnect-all':
        saveToHistory();
        setEdges(prev => prev.filter(e => e.source !== action.nodeId && e.target !== action.nodeId)); break;
      case 'fit-view': fitView({ padding: 0.2 }); break;
      case 'delete-edge':
        saveToHistory();
        setEdges(prev => prev.filter(e => e.id !== action.edgeId)); break;
      default: break;
    }
    setContextMenu(null);
  }, [createNode, deleteNode, duplicateNode, updateNodeData, selectedNodeId, clipboard,
    screenToFlowPosition, setNodes, setEdges, fitView, saveToHistory, setSelectedNodeId,
    nodes, edges, handleAIQuickAction]);

  // AI apply actions
  const handleApplyAIActions = useCallback((actions: AIAgentAction[]) => {
    saveToHistory();
    let created = 0, updated = 0, deleted = 0;
    actions.forEach(action => {
      const d = action.data as any;
      switch (action.type) {
        case 'create_node':
        case 'batch_create_nodes':
          createNode((d?.type as NeuralNodeType) || 'idea', d?.position, d?.parentId || selectedNodeId, {
            label: d?.label || action.description,
            description: d?.description || '',
            tags: d?.tags || [],
            status: d?.status,
            priority: d?.priority,
            progress: d?.progress,
            checklist: d?.checklist,
            chart: d?.chart,
            table: d?.table,
            dueDate: d?.dueDate,
            ai: d?.ai || { generated: true, model: 'claude-haiku-4-5-20251001', confidence: 0.8 },
          });
          created++; break;
        case 'update_node':
        case 'batch_update_nodes': {
          const nodeId = d?.nodeId;
          if (!nodeId) break;
          // Build updates from flat properties
          const updates: Partial<NeuralNodeData> = {};
          if (d.label !== undefined) updates.label = d.label;
          if (d.description !== undefined) updates.description = d.description;
          if (d.type !== undefined) updates.type = d.type;
          if (d.status !== undefined) updates.status = d.status;
          if (d.priority !== undefined) updates.priority = d.priority;
          if (d.progress !== undefined) updates.progress = d.progress;
          if (d.tags !== undefined) updates.tags = d.tags;
          if (d.checklist !== undefined) updates.checklist = d.checklist;
          if (d.chart !== undefined) updates.chart = d.chart;
          if (d.table !== undefined) updates.table = d.table;
          if (d.dueDate !== undefined) updates.dueDate = d.dueDate;
          // Also support d.updates for backwards compatibility
          const finalUpdates = d.updates ? { ...updates, ...d.updates } : updates;
          if (Object.keys(finalUpdates).length > 0) {
            updateNodeData(nodeId, finalUpdates);
            updated++;
          }
          break;
        }
        case 'delete_node':
          if (d?.nodeId) { deleteNode(d.nodeId); deleted++; } break;
        case 'create_edge':
          if (d?.source && d?.target) setEdges(prev => [...prev, {
            id: `edge_${d.source}_${d.target}`, source: d.source, target: d.target,
            type: 'power', animated: true, data: { style: 'neural' as const },
          }]); break;
        case 'delete_edge':
          if (d?.edgeId) setEdges(prev => prev.filter(e => e.id !== d.edgeId));
          else if (d?.source && d?.target) setEdges(prev => prev.filter(e => !(e.source === d.source && e.target === d.target)));
          break;
        case 'generate_chart':
          if (selectedNodeId && d?.chartData) updateNodeData(selectedNodeId, { chart: d.chartData }); break;
        case 'analyze_map':
        case 'find_nodes':
        case 'reorganize_map':
          // These are informational — no direct mutation needed
          break;
      }
    });
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} nó(s) criado(s)`);
    if (updated > 0) parts.push(`${updated} nó(s) atualizado(s)`);
    if (deleted > 0) parts.push(`${deleted} nó(s) removido(s)`);
    if (parts.length > 0) {
      toast.success(`IA: ${parts.join(', ')}`, { icon: '🤖' });
      setTimeout(() => fitView({ padding: 0.2 }), 300);
    }
  }, [createNode, updateNodeData, deleteNode, setEdges, selectedNodeId, saveToHistory, fitView]);

  // Toolbar
  const handleAddNode = useCallback((type: NeuralNodeType) => createNode(type, undefined, selectedNodeId), [createNode, selectedNodeId]);

  // Export / Import
  const handleExportJSON = useCallback(() => {
    const cleanNodes = nodes.map(n => ({
      id: n.id, type: n.type, position: n.position,
      data: Object.fromEntries(Object.entries(n.data).filter(([k]) =>
        !['onAddChild', 'onAIExpand', 'onDuplicate', 'onDeleteNode', 'onUpdateData'].includes(k))),
    }));
    const blob = new Blob([JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), mapInfo, nodes: cleanNodes, edges }, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = `${mapInfo?.title || 'neuralmap'}.json`; a.click();
    URL.revokeObjectURL(u);
    toast.success('Mapa exportado como JSON!');
  }, [nodes, edges, mapInfo]);

  const handleExportPNG = useCallback(async () => {
    try {
      const el = document.querySelector('.react-flow') as HTMLElement;
      if (!el) return;
      // Use canvas to capture the viewport
      const canvas = document.createElement('canvas');
      const rect = el.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas');
      // Draw background
      ctx.fillStyle = '#060910';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Use SVG foreignObject approach
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${el.innerHTML}</div>
        </foreignObject>
      </svg>`;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a'); a.href = url;
      a.download = `${mapInfo?.title || 'neuralmap'}.svg`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportado como SVG!');
    } catch {
      toast.error('Erro ao exportar imagem. Exportando JSON...');
      handleExportJSON();
    }
  }, [mapInfo, handleExportJSON]);

  const handleImport = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target?.result as string);
        if (d.nodes && d.edges) {
          saveToHistory(); if (d.mapInfo) setMapInfo(d.mapInfo);
          setNodes(d.nodes); setEdges(d.edges);
          toast.success(`Importado: ${d.nodes.length} nós, ${d.edges.length} conexões`);
          setTimeout(() => fitView({ padding: 0.2 }), 300);
        } else toast.error('Formato inválido');
      } catch { toast.error('Erro ao ler arquivo'); }
    };
    r.readAsText(f); e.target.value = '';
  }, [saveToHistory, setMapInfo, setNodes, setEdges, fitView]);

  const handleDeleteMap = useCallback(() => {
    if (!confirm('Excluir este mapa permanentemente?')) return;
    localStorage.removeItem(`neuralmap_${mapId}`);
    toast.success('Mapa excluído'); navigate('/maps');
  }, [mapId, navigate]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) await navigator.share({ title: mapInfo?.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.success('Link copiado!', { icon: '🔗' }); }
    } catch { await navigator.clipboard.writeText(window.location.href); toast.success('Link copiado!', { icon: '🔗' }); }
  }, [mapInfo]);

  const handleInsertResearchAsNode = useCallback((result: any) => {
    createNode('research', undefined, selectedNodeId, {
      label: result.title, description: result.summary,
      tags: result.relatedTopics?.slice(0, 5) || [],
      ai: { generated: true, model: 'research', confidence: result.confidence || 0.7 },
    });
    toast.success('Pesquisa inserida como nó!', { icon: '🔬' });
  }, [createNode, selectedNodeId]);

  const handleViewSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId); setShowDetailPanel(true);
  }, [setSelectedNodeId]);

  // Loading
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#060910] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/20 animate-pulse">
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
            <Loader2 className="w-6 h-6 text-cyan-400 absolute -bottom-1 -right-1 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Carregando Mapa Neural</p>
            <p className="text-xs text-slate-500 mt-1">Preparando canvas inteligente...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#060910] flex flex-col overflow-hidden" onContextMenu={onContextMenu}>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />

      <EditorHeader
        mapInfo={mapInfo}
        onUpdateMapInfo={(info) => setMapInfo(prev => prev ? { ...prev, ...info } : null)}
        viewMode={viewMode} onViewModeChange={setViewMode}
        collaborators={collaborators} isSaving={isSaving} lastSaved={lastSaved}
        onSave={saveMap} onShare={handleShare}
        onToggleAI={() => setShowAIPanel(p => !p)}
        onToggleAnalytics={() => setShowAnalyticsPanel(p => !p)}
        settings={settings} onSettingsChange={s => setSettings(prev => ({ ...prev, ...s }))}
        canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
        nodeCount={nodes.length} edgeCount={edges.length}
        onExportPNG={handleExportPNG} onExportJSON={handleExportJSON}
        onImport={handleImport} onDeleteMap={handleDeleteMap}
      />

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Map View */}
        {viewMode === 'map' && (
          <ReactFlow
            nodes={nodesWithCallbacks} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick}
            onPaneClick={onPaneClick} onNodeContextMenu={onNodeContextMenu}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'power', animated: true }}
            fitView fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1} maxZoom={2}
            snapToGrid={settings.snapToGrid} snapGrid={[settings.gridSize, settings.gridSize]}
            nodesDraggable={!settings.isLocked} nodesConnectable={!settings.isLocked}
            proOptions={{ hideAttribution: true }} className="neural-canvas"
          >
            {settings.showGrid && <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(148,163,184,0.06)" />}
            <svg className="absolute inset-0 pointer-events-none z-[1]" width="100%" height="100%">
              <defs>
                <radialGradient id="cg1" cx="30%" cy="40%" r="50%"><stop offset="0%" stopColor="rgba(6,182,212,0.03)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                <radialGradient id="cg2" cx="70%" cy="60%" r="45%"><stop offset="0%" stopColor="rgba(139,92,246,0.02)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#cg1)" /><rect width="100%" height="100%" fill="url(#cg2)" />
            </svg>
            <Controls className="!bg-[#111827]/90 !border-white/10 !rounded-xl !shadow-2xl [&>button]:!bg-transparent [&>button]:!border-white/5 [&>button]:!text-slate-400 [&>button:hover]:!text-white [&>button:hover]:!bg-white/5"
              showZoom showFitView showInteractive={false} position="bottom-left" />
            {settings.showMinimap && (
              <MiniMap className="!bg-[#111827]/80 !border-white/10 !rounded-xl"
                nodeColor={n => NODE_TYPE_CONFIG[(n.data as NeuralNodeData)?.type || 'idea']?.color || '#64748b'}
                maskColor="rgba(6,9,16,0.85)" position="bottom-left" style={{ left: 60 }} />
            )}
            <Panel position="bottom-right" className="!m-4 !mr-6">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#111827]/80 backdrop-blur-sm border border-white/[0.06] text-[10px] text-slate-500">
                <span>{nodes.length} nós</span><span className="w-px h-3 bg-white/10" />
                <span>{edges.length} conexões</span><span className="w-px h-3 bg-white/10" />
                <span>{Math.round(analytics.completionRate)}% conclusão</span>
                {analytics.aiGeneratedNodes > 0 && (<><span className="w-px h-3 bg-white/10" /><span className="text-purple-400">🤖 {analytics.aiGeneratedNodes} IA</span></>)}
              </div>
            </Panel>
          </ReactFlow>
        )}

        {viewMode === 'list' && <ListView nodes={nodes} edges={edges} onSelectNode={handleViewSelectNode} selectedNodeId={selectedNodeId} onUpdateNodeData={updateNodeData} />}
        {viewMode === 'kanban' && <KanbanView nodes={nodes} onSelectNode={handleViewSelectNode} selectedNodeId={selectedNodeId} onUpdateNodeData={updateNodeData} />}
        {viewMode === 'timeline' && <TimelineView nodes={nodes} onSelectNode={handleViewSelectNode} selectedNodeId={selectedNodeId} />}
        {viewMode === 'analytics' && (
          <div className="h-full overflow-y-auto p-6 custom-scrollbar">
            <AnalyticsPanel isOpen={true} onClose={() => setViewMode('map')} analytics={analytics} nodes={nodes} edges={edges} isEmbedded />
          </div>
        )}

        {viewMode === 'map' && (
          <CommandToolbar onCreateNode={handleAddNode} onToggleAI={() => setShowAIPanel(p => !p)} isLocked={settings.isLocked} />
        )}

        <AgentPanel isOpen={showAIPanel} onClose={() => setShowAIPanel(false)}
          nodes={nodes} edges={edges} selectedNodeId={selectedNodeId}
          onApplyActions={handleApplyAIActions} pendingPrompt={aiPendingPrompt || undefined}
          onPendingPromptConsumed={() => setAiPendingPrompt(null)} />

        <AnimatePresence>
          {showDetailPanel && selectedNode && (
            <PowerNodeDetail node={selectedNode} isOpen={showDetailPanel}
              onClose={() => setShowDetailPanel(false)}
              onUpdate={(id, d) => updateNodeData(id, d)}
              onDelete={id => { deleteNode(id); setSelectedNodeId(null); setShowDetailPanel(false); }} />
          )}
        </AnimatePresence>

        {viewMode !== 'analytics' && (
          <AnalyticsPanel isOpen={showAnalyticsPanel} onClose={() => setShowAnalyticsPanel(false)} analytics={analytics} nodes={nodes} edges={edges} />
        )}

        <ResearchPanel isOpen={showResearchPanel} onClose={() => setShowResearchPanel(false)}
          selectedNodeTitle={selectedNode?.data?.label} onInsertAsNode={handleInsertResearchAsNode} />
      </div>

      <NeuralContextMenu state={contextMenu} onClose={() => setContextMenu(null)} onAction={handleContextMenuAction} />

      <Toaster position="bottom-center" toastOptions={{
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' },
        duration: 2000,
      }} />

      <style>{`
        .neural-canvas .react-flow__pane { cursor: crosshair; }
        .neural-canvas .react-flow__node { transition: none; }
        .neural-canvas .react-flow__edge path { stroke-width: 2; }
        .neural-canvas .react-flow__handle { width: 8px; height: 8px; background: rgba(6,182,212,0.4); border: 2px solid rgba(6,182,212,0.2); border-radius: 50%; }
        .neural-canvas .react-flow__handle:hover { background: rgba(6,182,212,0.8); border-color: rgba(6,182,212,0.6); transform: scale(1.4); }
        .neural-canvas .react-flow__selection { background: rgba(6,182,212,0.05); border: 1px solid rgba(6,182,212,0.2); border-radius: 8px; }
        .neural-canvas .react-flow__controls { bottom: 80px !important; }
        .neural-canvas .react-flow__minimap { bottom: 80px !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}

export default function NeuralMapEditorPage() {
  return <ReactFlowProvider><NeuralMapEditorInner /></ReactFlowProvider>;
}
