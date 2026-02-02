import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Sparkles, 
  Save, 
  Trash2,
  MessageSquare,
  CheckSquare,
  FileText,
  Link2,
  Users,
  Bot,
  Wand2,
  Expand,
  ListTree,
  Lightbulb,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Dados mock de mapas e nodes - sincronizados com localStorage
interface MapData {
  id: string;
  title: string;
  description: string | null;
  nodes: Node[];
  edges: Edge[];
}

// Cores para diferentes tipos de nodes
const NODE_COLORS = {
  idea: { bg: 'from-purple-500 to-pink-500', border: 'border-purple-400' },
  task: { bg: 'from-green-500 to-emerald-500', border: 'border-green-400' },
  note: { bg: 'from-yellow-500 to-orange-500', border: 'border-yellow-400' },
  reference: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-400' },
  question: { bg: 'from-red-500 to-rose-500', border: 'border-red-400' },
};

// Node customizado para o MindMap
const MindMapNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const colors = NODE_COLORS[data.type as keyof typeof NODE_COLORS] || NODE_COLORS.idea;
  
  return (
    <div className={`
      px-4 py-3 rounded-xl min-w-[180px] max-w-[300px]
      bg-gradient-to-br ${colors.bg}
      shadow-lg ${selected ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900' : ''}
      transition-all duration-200 hover:scale-105
      border-2 ${colors.border}
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-white !w-3 !h-3 !border-2 !border-slate-800"
      />
      
      <div className="flex items-start gap-2">
        <div className="text-white/80 mt-0.5">
          {data.type === 'idea' && <Lightbulb className="w-4 h-4" />}
          {data.type === 'task' && <CheckSquare className="w-4 h-4" />}
          {data.type === 'note' && <FileText className="w-4 h-4" />}
          {data.type === 'reference' && <Link2 className="w-4 h-4" />}
          {data.type === 'question' && <MessageSquare className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm leading-tight">{data.label}</p>
          {data.description && (
            <p className="text-white/70 text-xs mt-1 line-clamp-2">{data.description}</p>
          )}
        </div>
      </div>
      
      {/* Indicadores */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
        {data.tasks > 0 && (
          <span className="flex items-center gap-1 text-xs text-white/70">
            <CheckSquare className="w-3 h-3" /> {data.tasks}
          </span>
        )}
        {data.comments > 0 && (
          <span className="flex items-center gap-1 text-xs text-white/70">
            <MessageSquare className="w-3 h-3" /> {data.comments}
          </span>
        )}
        {data.creator && (
          <span 
            className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
            style={{ backgroundColor: data.creator.color }}
            title={data.creator.name}
          >
            {data.creator.name[0]}
          </span>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-white !w-3 !h-3 !border-2 !border-slate-800"
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  mindmap: MindMapNode,
};

// Dados iniciais de exemplo para mapas
const getInitialMapData = (mapId: string, userName: string, userColor: string): MapData => {
  const storedMaps = localStorage.getItem('mindmap_nodes_' + mapId);
  if (storedMaps) {
    return JSON.parse(storedMaps);
  }

  // Dados padrão para um novo mapa
  const defaultData: MapData = {
    id: mapId,
    title: 'Mapa Mental',
    description: null,
    nodes: [
      {
        id: 'root',
        type: 'mindmap',
        position: { x: 400, y: 100 },
        data: { 
          label: 'Tema Central', 
          type: 'idea',
          description: 'Clique em + para adicionar ideias conectadas',
          tasks: 0,
          comments: 0,
          creator: { name: userName, color: userColor },
        },
      },
      {
        id: 'node-1',
        type: 'mindmap',
        position: { x: 150, y: 250 },
        data: { 
          label: 'Subtópico 1', 
          type: 'idea',
          description: 'Expanda suas ideias aqui',
          tasks: 2,
          comments: 1,
          creator: { name: 'Helen', color: '#FF6B6B' },
        },
      },
      {
        id: 'node-2',
        type: 'mindmap',
        position: { x: 400, y: 250 },
        data: { 
          label: 'Tarefa Importante', 
          type: 'task',
          description: 'Uma tarefa delegada para o time',
          tasks: 0,
          comments: 3,
          creator: { name: 'Pablo', color: '#45B7D1' },
        },
      },
      {
        id: 'node-3',
        type: 'mindmap',
        position: { x: 650, y: 250 },
        data: { 
          label: 'Referência', 
          type: 'reference',
          description: 'Link para artigo ou recurso externo',
          tasks: 0,
          comments: 0,
          creator: { name: userName, color: userColor },
        },
      },
    ],
    edges: [
      { id: 'e-root-1', source: 'root', target: 'node-1', animated: true, style: { stroke: '#8b5cf6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
      { id: 'e-root-2', source: 'root', target: 'node-2', animated: true, style: { stroke: '#8b5cf6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
      { id: 'e-root-3', source: 'root', target: 'node-3', animated: true, style: { stroke: '#8b5cf6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
    ],
  };

  return defaultData;
};

// Busca mapa no localStorage
const getMapInfo = (mapId: string) => {
  const stored = localStorage.getItem('mindmap_maps');
  if (stored) {
    const maps = JSON.parse(stored);
    return maps.find((m: any) => m.id === mapId);
  }
  return null;
};

export function MapEditorPage() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [mapInfo, setMapInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Estados do React Flow
  const initialData = useMemo(() => 
    getInitialMapData(mapId || '', user?.display_name || 'User', user?.color || '#8b5cf6'),
    [mapId, user]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Carrega informações do mapa
  useEffect(() => {
    if (!mapId) return;
    
    setTimeout(() => {
      const info = getMapInfo(mapId);
      setMapInfo(info || { id: mapId, title: 'Novo Mapa', description: '' });
      setIsLoading(false);
    }, 200);
  }, [mapId]);

  // Salva no localStorage quando nodes/edges mudam
  useEffect(() => {
    if (mapId && !isLoading) {
      const data = { id: mapId, title: mapInfo?.title, nodes, edges };
      localStorage.setItem('mindmap_nodes_' + mapId, JSON.stringify(data));
    }
  }, [nodes, edges, mapId, isLoading, mapInfo]);

  // Conexão entre nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#8b5cf6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Adicionar novo node
  const addNewNode = (type: 'idea' | 'task' | 'note' | 'reference' | 'question' = 'idea') => {
    const newId = `node-${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const newNode: Node = {
      id: newId,
      type: 'mindmap',
      position: { 
        x: lastNode ? lastNode.position.x + 50 : 400, 
        y: lastNode ? lastNode.position.y + 150 : 300 
      },
      data: { 
        label: type === 'task' ? 'Nova Tarefa' : type === 'note' ? 'Nova Nota' : 'Nova Ideia',
        type,
        description: '',
        tasks: 0,
        comments: 0,
        creator: { name: user?.display_name || 'User', color: user?.color || '#8b5cf6' },
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    
    // Conecta ao node selecionado ou ao root
    if (selectedNode || nodes.length > 0) {
      const sourceId = selectedNode?.id || nodes[0]?.id;
      if (sourceId) {
        setEdges((eds) => [
          ...eds,
          {
            id: `e-${sourceId}-${newId}`,
            source: sourceId,
            target: newId,
            animated: true,
            style: { stroke: '#8b5cf6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          },
        ]);
      }
    }
    
    toast.success(`${type === 'task' ? 'Tarefa' : type === 'note' ? 'Nota' : 'Ideia'} adicionada!`);
  };

  // Deletar node selecionado
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    if (selectedNode.id === 'root') {
      toast.error('Não é possível deletar o node raiz');
      return;
    }
    
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.success('Node removido');
  };

  // AI: Gerar ideias
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite um prompt para a IA');
      return;
    }

    setAiLoading(true);
    
    // Simula chamada à API (será substituído pela integração real)
    setTimeout(() => {
      const generatedIdeas = [
        'Análise de Mercado',
        'Pesquisa de Usuários',
        'Prototipação Rápida',
        'Validação de Hipóteses',
        'Métricas de Sucesso',
      ];

      let yOffset = 0;
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const baseX = selectedNode?.position.x || 400;
      const baseY = (selectedNode?.position.y || 100) + 150;

      generatedIdeas.forEach((idea, index) => {
        const newId = `ai-${Date.now()}-${index}`;
        newNodes.push({
          id: newId,
          type: 'mindmap',
          position: { x: baseX - 200 + (index * 100), y: baseY + yOffset },
          data: {
            label: idea,
            type: 'idea',
            description: `Gerado por IA: ${aiPrompt}`,
            tasks: 0,
            comments: 0,
            creator: { name: 'AI Agent', color: '#f59e0b' },
          },
        });

        if (selectedNode) {
          newEdges.push({
            id: `e-${selectedNode.id}-${newId}`,
            source: selectedNode.id,
            target: newId,
            animated: true,
            style: { stroke: '#f59e0b' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          });
        }

        yOffset += 80;
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setAiLoading(false);
      setAiPrompt('');
      toast.success(`${generatedIdeas.length} ideias geradas pela IA!`);
    }, 1500);
  };

  // Seleção de node
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">{mapInfo?.title || 'Mapa Mental'}</h1>
            <p className="text-xs text-white/50">
              {nodes.length} nodes • Editando como {user?.display_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Colaboradores online */}
          <div className="flex items-center gap-1 mr-4">
            <Users className="w-4 h-4 text-white/50" />
            <div className="flex -space-x-2">
              {['Guilherme', 'Helen', 'Pablo'].map((name, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs text-white font-medium"
                  style={{ 
                    backgroundColor: i === 0 ? '#4ECDC4' : i === 1 ? '#FF6B6B' : '#45B7D1',
                  }}
                  title={`${name} online`}
                >
                  {name[0]}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`gap-2 ${showAIPanel ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Bot className="w-4 h-4" />
            AI Agent
          </Button>
          
          <Button
            size="sm"
            onClick={() => toast.success('Mapa salvo!')}
            className="gap-2 bg-purple-500 hover:bg-purple-600"
          >
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Canvas */}
        <div className="flex-1">
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
            className="bg-slate-900"
          >
            <Background color="#334155" gap={20} />
            <Controls className="!bg-slate-800 !border-slate-700 !rounded-lg [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white [&>button:hover]:!bg-slate-600" />
            <MiniMap 
              className="!bg-slate-800 !rounded-lg"
              nodeColor={(n) => {
                const type = n.data?.type as string;
                if (type === 'task') return '#10b981';
                if (type === 'note') return '#f59e0b';
                if (type === 'reference') return '#3b82f6';
                return '#8b5cf6';
              }}
            />

            {/* Quick Actions Panel */}
            <Panel position="bottom-center" className="!mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/90 backdrop-blur-sm rounded-full border border-white/10 shadow-xl">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('idea')}
                  className="gap-2 text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                >
                  <Lightbulb className="w-4 h-4" />
                  Ideia
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('task')}
                  className="gap-2 text-green-300 hover:text-green-200 hover:bg-green-500/20"
                >
                  <CheckSquare className="w-4 h-4" />
                  Tarefa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('note')}
                  className="gap-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20"
                >
                  <FileText className="w-4 h-4" />
                  Nota
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('reference')}
                  className="gap-2 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                >
                  <Link2 className="w-4 h-4" />
                  Referência
                </Button>
                
                {selectedNode && selectedNode.id !== 'root' && (
                  <>
                    <div className="w-px h-6 bg-white/20" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={deleteSelectedNode}
                      className="gap-2 text-red-300 hover:text-red-200 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </Button>
                  </>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* AI Agent Panel */}
        {showAIPanel && (
          <div className="w-80 border-l border-white/10 bg-slate-800/50 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">AI Agent Console</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIPanel(false)}
                className="text-white/50 hover:text-white h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* AI Actions */}
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase tracking-wider">Ações Rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-white/70 hover:text-white hover:bg-white/10 h-auto py-3"
                    onClick={() => {
                      setAiPrompt('Gere ideias relacionadas a este tópico');
                      handleAIGenerate();
                    }}
                  >
                    <Wand2 className="w-4 h-4 mr-2 text-purple-400" />
                    <span className="text-xs">Gerar Ideias</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-white/70 hover:text-white hover:bg-white/10 h-auto py-3"
                    onClick={() => toast.success('Expandindo node selecionado...')}
                  >
                    <Expand className="w-4 h-4 mr-2 text-green-400" />
                    <span className="text-xs">Expandir</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-white/70 hover:text-white hover:bg-white/10 h-auto py-3"
                    onClick={() => toast.success('Resumindo mapa...')}
                  >
                    <ListTree className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="text-xs">Resumir</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-white/70 hover:text-white hover:bg-white/10 h-auto py-3"
                    onClick={() => toast.success('Convertendo para tarefas...')}
                  >
                    <CheckSquare className="w-4 h-4 mr-2 text-yellow-400" />
                    <span className="text-xs">→ Tarefas</span>
                  </Button>
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase tracking-wider">Prompt Personalizado</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Ex: Analise gaps neste mapa..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                  />
                  <Button
                    onClick={handleAIGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Executar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Selected Node Info */}
              {selectedNode && (
                <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-white/50 uppercase tracking-wider">Node Selecionado</p>
                  <p className="text-white font-medium">{selectedNode.data?.label as string}</p>
                  <p className="text-xs text-white/50">{selectedNode.data?.type as string}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
