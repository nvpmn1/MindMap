import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  MarkerType,
  Panel,
  NodeTypes,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NeuralNode, NeuralNodeData } from '@/components/mindmap/NeuralNode';
import { AIAgentPanel } from '@/components/ai/AIAgentPanel';
import { AISuggestion } from '@/services/aiAgent';
import { 
  ArrowLeft, 
  Save, 
  Trash2,
  MessageSquare,
  CheckSquare,
  FileText,
  Link2,
  Cpu,
  Database,
  Zap,
  Lightbulb,
  X,
  Network,
  Wand2,
  Expand,
  GitBranch,
  Users,
  Share2,
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  MoreHorizontal,
  Sparkles,
  Target,
  Layers,
  Play,
  Pause,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  neural: NeuralNode,
};

const NODE_TYPE_COLORS = {
  root: '#8B5CF6',
  idea: '#F59E0B',
  task: '#10B981',
  note: '#3B82F6',
  reference: '#06B6D4',
  data: '#A78BFA',
  process: '#EC4899',
};

interface MapData {
  id: string;
  title: string;
  description: string | null;
  nodes: Node<NeuralNodeData>[];
  edges: Edge[];
}

const createInitialData = (mapId: string, userName: string, userColor: string): MapData => {
  const storedData = localStorage.getItem(`mindmap_nodes_${mapId}`);
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch {
      // Continue to create default
    }
  }

  return {
    id: mapId,
    title: 'Novo Mapa Neural',
    description: null,
    nodes: [
      {
        id: 'root',
        type: 'neural',
        position: { x: 400, y: 100 },
        data: {
          label: 'Tema Central',
          type: 'root',
          description: 'Clique em + para adicionar ideias conectadas',
          tasks: 0,
          comments: 0,
          creator: { name: userName, color: userColor },
          connections: 3,
        },
      },
      {
        id: 'node-1',
        type: 'neural',
        position: { x: 150, y: 300 },
        data: {
          label: 'Subtópico 1',
          type: 'idea',
          description: 'Expanda suas ideias aqui',
          tasks: 2,
          comments: 1,
          creator: { name: 'Helen', color: '#00FFC8' },
        },
      },
      {
        id: 'node-2',
        type: 'neural',
        position: { x: 400, y: 300 },
        data: {
          label: 'Tarefa Importante',
          type: 'task',
          description: 'Uma tarefa delegada para o time',
          tasks: 0,
          comments: 3,
          priority: 'high',
          progress: 45,
          creator: { name: 'Pablo', color: '#A78BFA' },
        },
      },
      {
        id: 'node-3',
        type: 'neural',
        position: { x: 650, y: 300 },
        data: {
          label: 'Referência',
          type: 'reference',
          description: 'Link para artigo ou recurso externo',
          creator: { name: userName, color: userColor },
          tags: ['docs', 'research'],
        },
      },
    ],
    edges: [
      {
        id: 'e-root-1',
        source: 'root',
        target: 'node-1',
        style: { stroke: NODE_TYPE_COLORS.root, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: NODE_TYPE_COLORS.root, width: 15, height: 15 },
        animated: true,
      },
      {
        id: 'e-root-2',
        source: 'root',
        target: 'node-2',
        style: { stroke: NODE_TYPE_COLORS.root, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: NODE_TYPE_COLORS.root, width: 15, height: 15 },
        animated: true,
      },
      {
        id: 'e-root-3',
        source: 'root',
        target: 'node-3',
        style: { stroke: NODE_TYPE_COLORS.root, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: NODE_TYPE_COLORS.root, width: 15, height: 15 },
        animated: true,
      },
    ],
  };
};

function MapEditorContent() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const reactFlowInstance = useReactFlow();
  
  const [mapInfo, setMapInfo] = useState<{ title: string; description: string | null }>({
    title: 'Novo Mapa',
    description: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<NeuralNodeData> | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collaborators] = useState([
    { name: 'Guilherme', color: '#00D9FF', online: true },
    { name: 'Helen', color: '#00FFC8', online: true },
    { name: 'Pablo', color: '#A78BFA', online: false },
  ]);

  const initialData = useMemo(() => 
    createInitialData(mapId || 'new', user?.display_name || 'User', user?.color || '#00D9FF'),
    [mapId, user]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Load map data
  useEffect(() => {
    if (!mapId) return;
    
    const timer = setTimeout(() => {
      setMapInfo({ title: initialData.title, description: initialData.description });
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [mapId, initialData]);

  // Auto-save
  useEffect(() => {
    if (!mapId || isLoading) return;

    const saveData = () => {
      setIsAutoSaving(true);
      const data: MapData = {
        id: mapId,
        title: mapInfo.title,
        description: mapInfo.description,
        nodes,
        edges,
      };
      localStorage.setItem(`mindmap_nodes_${mapId}`, JSON.stringify(data));
      setLastSaved(new Date());
      setTimeout(() => setIsAutoSaving(false), 500);
    };

    const debounce = setTimeout(saveData, 1000);
    return () => clearTimeout(debounce);
  }, [nodes, edges, mapId, isLoading, mapInfo]);

  // Event listeners for node actions
  useEffect(() => {
    const handleAddChild = (e: CustomEvent) => {
      const { parentId, parentLabel } = e.detail;
      addNewNode('idea', parentId);
    };

    const handleExpandNode = (e: CustomEvent) => {
      const { nodeId, nodeData } = e.detail;
      setSelectedNode({ id: nodeId, data: nodeData } as Node<NeuralNodeData>);
      setShowAIPanel(true);
    };

    window.addEventListener('addChildNode', handleAddChild as EventListener);
    window.addEventListener('expandNode', handleExpandNode as EventListener);

    return () => {
      window.removeEventListener('addChildNode', handleAddChild as EventListener);
      window.removeEventListener('expandNode', handleExpandNode as EventListener);
    };
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const color = sourceNode?.data?.type ? NODE_TYPE_COLORS[sourceNode.data.type as keyof typeof NODE_TYPE_COLORS] : '#00D9FF';
      
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
            animated: true,
          },
          eds
        )
      );
    },
    [setEdges, nodes]
  );

  const addNewNode = useCallback((
    type: NeuralNodeData['type'] = 'idea',
    parentId?: string
  ) => {
    const newId = `node-${Date.now()}`;
    const parent = parentId ? nodes.find(n => n.id === parentId) : selectedNode || nodes[0];
    
    const labels: Record<string, string> = {
      idea: 'Nova Ideia',
      task: 'Nova Tarefa',
      note: 'Nova Nota',
      reference: 'Nova Referência',
      data: 'Novo Dado',
      process: 'Novo Processo',
      root: 'Novo Central',
    };

    const offset = Math.random() * 100 - 50;
    
    const newNode: Node<NeuralNodeData> = {
      id: newId,
      type: 'neural',
      position: {
        x: parent ? parent.position.x + offset : 400,
        y: parent ? parent.position.y + 180 : 300,
      },
      data: {
        label: labels[type],
        type,
        description: '',
        tasks: 0,
        comments: 0,
        creator: { name: user?.display_name || 'User', color: user?.color || '#00D9FF' },
      },
    };

    setNodes((nds) => [...nds, newNode]);

    // Connect to parent
    if (parent) {
      const color = NODE_TYPE_COLORS[parent.data?.type as keyof typeof NODE_TYPE_COLORS] || '#00D9FF';
      setEdges((eds) => [
        ...eds,
        {
          id: `e-${parent.id}-${newId}`,
          source: parent.id,
          target: newId,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
          animated: true,
        },
      ]);
    }

    toast.success(`${labels[type]} adicionada!`);
  }, [nodes, selectedNode, user, setNodes, setEdges]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.id === 'root') {
      toast.error('Não é possível deletar o nó central');
      return;
    }

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.success('Nó removido');
  }, [selectedNode, setNodes, setEdges]);

  const handleApplySuggestions = useCallback((suggestions: AISuggestion[]) => {
    const baseNode = selectedNode || nodes.find(n => n.id === 'root');
    if (!baseNode) return;

    const newNodes: Node<NeuralNodeData>[] = [];
    const newEdges: Edge[] = [];
    const startX = baseNode.position.x - (suggestions.length * 100) / 2;
    const startY = baseNode.position.y + 200;

    suggestions.forEach((suggestion, index) => {
      const newId = `ai-${Date.now()}-${index}`;
      newNodes.push({
        id: newId,
        type: 'neural',
        position: {
          x: startX + index * 220,
          y: startY + (index % 2) * 50,
        },
        data: {
          label: suggestion.label,
          type: suggestion.type,
          description: suggestion.description || '',
          priority: suggestion.priority,
          tags: suggestion.tags,
          aiGenerated: true,
          creator: { name: 'AI Agent', color: '#FFB800' },
        },
      });

      newEdges.push({
        id: `e-${baseNode.id}-${newId}`,
        source: baseNode.id,
        target: newId,
        style: { stroke: '#FFB800', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#FFB800', width: 15, height: 15 },
        animated: true,
      });
    });

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    
    // Fit view to show new nodes
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, [selectedNode, nodes, setNodes, setEdges, reactFlowInstance]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<NeuralNodeData>);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSave = useCallback(() => {
    setIsAutoSaving(true);
    setTimeout(() => {
      setIsAutoSaving(false);
      setLastSaved(new Date());
      toast.success('Mapa salvo!');
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080C14]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#080C14]">
      {/* Header */}
      <header className="h-14 border-b border-slate-800/50 bg-[#0A0E18]/95 backdrop-blur-xl flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
            >
              <Network className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <Input
                value={mapInfo.title}
                onChange={(e) => setMapInfo(prev => ({ ...prev, title: e.target.value }))}
                className="h-7 bg-transparent border-0 p-0 text-white font-semibold text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <p className="text-[11px] text-slate-500">
                {nodes.length} nós • {edges.length} conexões
                {lastSaved && ` • Salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Collaborators */}
          <div className="flex items-center -space-x-2 mr-2">
            {collaborators.map((collab, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -2, zIndex: 10 }}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0A0E18]"
                style={{
                  backgroundColor: `${collab.color}20`,
                  color: collab.color,
                }}
                title={`${collab.name}${collab.online ? ' (online)' : ''}`}
              >
                {collab.name[0]}
                {collab.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0A0E18]" />
                )}
              </motion.div>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-slate-800/50 text-slate-400 hover:text-white border-2 border-[#0A0E18]"
            >
              <Users className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* AI Button */}
          <Button
            variant={showAIPanel ? 'default' : 'ghost'}
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={cn(
              "gap-2",
              showAIPanel 
                ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Sparkles className="w-4 h-4" />
            AI Agent
          </Button>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isAutoSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
          >
            {isAutoSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Save className="w-4 h-4" />
              </motion.div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-[#080C14]"
            defaultEdgeOptions={{
              style: { stroke: '#1E3A5F', strokeWidth: 2 },
            }}
          >
            <Background
              color="#1E3A5F"
              gap={30}
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              className="!bg-[#0D1520] !border-slate-800/50 !rounded-xl [&>button]:!bg-[#0D1520] [&>button]:!border-slate-800/50 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-800 [&>button:hover]:!text-white"
            />
            <MiniMap
              className="!bg-[#0D1520] !rounded-xl !border-slate-800/50"
              nodeColor={(node) => {
                const type = (node.data as NeuralNodeData)?.type || 'idea';
                return NODE_TYPE_COLORS[type as keyof typeof NODE_TYPE_COLORS] || '#00D9FF';
              }}
              maskColor="rgba(8, 12, 20, 0.85)"
            />

            {/* Toolbar */}
            <Panel position="bottom-center" className="!mb-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-1 px-3 py-2 bg-[#0D1520]/95 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('idea')}
                  className="h-9 gap-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-xs">Ideia</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('task')}
                  className="h-9 gap-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-xs">Tarefa</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('note')}
                  className="h-9 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Nota</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('reference')}
                  className="h-9 gap-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
                >
                  <Link2 className="w-4 h-4" />
                  <span className="text-xs">Referência</span>
                </Button>

                <div className="h-6 w-px bg-slate-700 mx-1" />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAIPanel(true)}
                  className="h-9 gap-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="text-xs">Gerar IA</span>
                </Button>

                {selectedNode && selectedNode.id !== 'root' && (
                  <>
                    <div className="h-6 w-px bg-slate-700 mx-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={deleteSelectedNode}
                      className="h-9 gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs">Deletar</span>
                    </Button>
                  </>
                )}
              </motion.div>
            </Panel>

            {/* Selected Node Info */}
            {selectedNode && (
              <Panel position="top-left" className="!mt-4 !ml-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-3 bg-[#0D1520]/95 backdrop-blur-xl rounded-xl border border-slate-800/50 max-w-[200px]"
                >
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Selecionado</p>
                  <p className="text-sm font-medium text-white truncate">{selectedNode.data?.label}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{selectedNode.data?.type}</p>
                </motion.div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* AI Panel */}
        <AIAgentPanel
          mapId={mapId || 'new'}
          nodes={nodes.map(n => ({
            id: n.id,
            label: n.data?.label || '',
            type: n.data?.type || 'idea',
            content: n.data?.description,
          }))}
          selectedNode={selectedNode ? {
            id: selectedNode.id,
            label: selectedNode.data?.label || '',
            type: selectedNode.data?.type || 'idea',
            content: selectedNode.data?.description,
          } : null}
          onApplySuggestions={handleApplySuggestions}
          onClose={() => setShowAIPanel(false)}
          isOpen={showAIPanel}
        />
      </div>
    </div>
  );
}

export function MapEditorPage() {
  return (
    <ReactFlowProvider>
      <MapEditorContent />
    </ReactFlowProvider>
  );
}
