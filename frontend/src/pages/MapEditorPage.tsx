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
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MapData {
  id: string;
  title: string;
  description: string | null;
  nodes: Node[];
  edges: Edge[];
}

// Neural Node Component
const NeuralNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const typeStyles: Record<string, { icon: any; color: string; glow: string }> = {
    idea: { icon: Lightbulb, color: '#00D9FF', glow: 'rgba(0, 217, 255, 0.3)' },
    task: { icon: CheckSquare, color: '#00FFC8', glow: 'rgba(0, 255, 200, 0.3)' },
    note: { icon: FileText, color: '#FFB800', glow: 'rgba(255, 184, 0, 0.3)' },
    reference: { icon: Link2, color: '#00B4D8', glow: 'rgba(0, 180, 216, 0.3)' },
    data: { icon: Database, color: '#A78BFA', glow: 'rgba(167, 139, 250, 0.3)' },
    process: { icon: Cpu, color: '#34D399', glow: 'rgba(52, 211, 153, 0.3)' },
  };

  const style = typeStyles[data.type] || typeStyles.idea;
  const Icon = style.icon;

  return (
    <div 
      className={`
        relative px-4 py-3 rounded-lg min-w-[160px] max-w-[240px]
        bg-[#0D1520] border transition-all duration-150
        ${selected ? 'border-cyan-400' : 'border-slate-700/50 hover:border-slate-600'}
      `}
      style={{
        boxShadow: selected ? `0 0 20px ${style.glow}` : 'none',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-2 !h-2 !bg-slate-600 !border-0"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="p-1.5 rounded"
          style={{ backgroundColor: `${style.color}15` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          {data.type}
        </span>
      </div>
      
      <p className="text-white text-sm font-medium leading-snug">{data.label}</p>
      {data.description && (
        <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">{data.description}</p>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {data.tasks > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <CheckSquare className="w-3 h-3" /> {data.tasks}
            </span>
          )}
          {data.comments > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <MessageSquare className="w-3 h-3" /> {data.comments}
            </span>
          )}
        </div>
        {data.creator && (
          <div 
            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-semibold"
            style={{ 
              backgroundColor: `${data.creator.color}20`,
              color: data.creator.color 
            }}
            title={data.creator.name}
          >
            {data.creator.name[0]}
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2 !h-2 !bg-slate-600 !border-0"
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  neural: NeuralNode,
};

const getInitialMapData = (mapId: string, userName: string, userColor: string): MapData => {
  const storedMaps = localStorage.getItem('mindmap_nodes_' + mapId);
  if (storedMaps) {
    return JSON.parse(storedMaps);
  }

  const defaultData: MapData = {
    id: mapId,
    title: 'Neural Map',
    description: null,
    nodes: [
      {
        id: 'root',
        type: 'neural',
        position: { x: 400, y: 50 },
        data: { 
          label: 'Central Node', 
          type: 'idea',
          description: 'Primary research focus',
          tasks: 0,
          comments: 0,
          creator: { name: userName, color: userColor },
        },
      },
      {
        id: 'node-1',
        type: 'neural',
        position: { x: 150, y: 200 },
        data: { 
          label: 'Data Analysis', 
          type: 'process',
          description: 'Processing pipeline',
          tasks: 2,
          comments: 1,
          creator: { name: 'Helen', color: '#00FFC8' },
        },
      },
      {
        id: 'node-2',
        type: 'neural',
        position: { x: 400, y: 200 },
        data: { 
          label: 'Model Training', 
          type: 'task',
          description: 'Neural network optimization',
          tasks: 0,
          comments: 3,
          creator: { name: 'Pablo', color: '#00B4D8' },
        },
      },
      {
        id: 'node-3',
        type: 'neural',
        position: { x: 650, y: 200 },
        data: { 
          label: 'Documentation', 
          type: 'reference',
          description: 'Research papers',
          tasks: 0,
          comments: 0,
          creator: { name: userName, color: userColor },
        },
      },
      {
        id: 'node-4',
        type: 'neural',
        position: { x: 275, y: 350 },
        data: { 
          label: 'Dataset Prep', 
          type: 'data',
          description: 'Data normalization',
          tasks: 1,
          comments: 0,
          creator: { name: 'Helen', color: '#00FFC8' },
        },
      },
      {
        id: 'node-5',
        type: 'neural',
        position: { x: 525, y: 350 },
        data: { 
          label: 'Evaluation', 
          type: 'note',
          description: 'Performance metrics',
          tasks: 0,
          comments: 2,
          creator: { name: 'Pablo', color: '#00B4D8' },
        },
      },
    ],
    edges: [
      { id: 'e-root-1', source: 'root', target: 'node-1', style: { stroke: '#1E3A5F', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00D9FF', width: 15, height: 15 } },
      { id: 'e-root-2', source: 'root', target: 'node-2', style: { stroke: '#1E3A5F', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00D9FF', width: 15, height: 15 } },
      { id: 'e-root-3', source: 'root', target: 'node-3', style: { stroke: '#1E3A5F', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00D9FF', width: 15, height: 15 } },
      { id: 'e-1-4', source: 'node-1', target: 'node-4', style: { stroke: '#1E3A5F', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00FFC8', width: 15, height: 15 } },
      { id: 'e-2-5', source: 'node-2', target: 'node-5', style: { stroke: '#1E3A5F', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00FFC8', width: 15, height: 15 } },
    ],
  };

  return defaultData;
};

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

  const initialData = useMemo(() => 
    getInitialMapData(mapId || '', user?.display_name || 'User', user?.color || '#00D9FF'),
    [mapId, user]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  useEffect(() => {
    if (!mapId) return;
    setTimeout(() => {
      const info = getMapInfo(mapId);
      setMapInfo(info || { id: mapId, title: 'New Map', description: '' });
      setIsLoading(false);
    }, 200);
  }, [mapId]);

  useEffect(() => {
    if (mapId && !isLoading) {
      const data = { id: mapId, title: mapInfo?.title, nodes, edges };
      localStorage.setItem('mindmap_nodes_' + mapId, JSON.stringify(data));
    }
  }, [nodes, edges, mapId, isLoading, mapInfo]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: '#1E3A5F', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#00D9FF', width: 15, height: 15 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addNewNode = (type: 'idea' | 'task' | 'note' | 'reference' | 'data' | 'process' = 'idea') => {
    const newId = `node-${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const labels: Record<string, string> = {
      idea: 'New Concept',
      task: 'New Task',
      note: 'New Note',
      reference: 'New Reference',
      data: 'Data Node',
      process: 'Process Node',
    };
    
    const newNode: Node = {
      id: newId,
      type: 'neural',
      position: { 
        x: lastNode ? lastNode.position.x + 80 : 400, 
        y: lastNode ? lastNode.position.y + 120 : 300 
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
    
    if (selectedNode || nodes.length > 0) {
      const sourceId = selectedNode?.id || nodes[0]?.id;
      if (sourceId) {
        setEdges((eds) => [
          ...eds,
          {
            id: `e-${sourceId}-${newId}`,
            source: sourceId,
            target: newId,
            style: { stroke: '#1E3A5F', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#00D9FF', width: 15, height: 15 },
          },
        ]);
      }
    }
    
    toast.success('Node added');
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    if (selectedNode.id === 'root') {
      toast.error('Cannot delete root node');
      return;
    }
    
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.success('Node removed');
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Enter a prompt');
      return;
    }

    setAiLoading(true);
    
    setTimeout(() => {
      const generatedIdeas = [
        'Feature Extraction',
        'Model Architecture',
        'Hyperparameter Tuning',
        'Cross Validation',
        'Performance Analysis',
      ];

      const baseX = selectedNode?.position.x || 400;
      const baseY = (selectedNode?.position.y || 100) + 150;
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      generatedIdeas.forEach((idea, index) => {
        const newId = `ai-${Date.now()}-${index}`;
        newNodes.push({
          id: newId,
          type: 'neural',
          position: { x: baseX - 200 + (index * 100), y: baseY + (index % 2) * 80 },
          data: {
            label: idea,
            type: index % 2 === 0 ? 'process' : 'data',
            description: 'AI Generated',
            tasks: 0,
            comments: 0,
            creator: { name: 'AI System', color: '#FFB800' },
          },
        });

        if (selectedNode) {
          newEdges.push({
            id: `e-${selectedNode.id}-${newId}`,
            source: selectedNode.id,
            target: newId,
            style: { stroke: '#FFB800', strokeWidth: 2, strokeDasharray: '5,5' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#FFB800', width: 15, height: 15 },
          });
        }
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setAiLoading(false);
      setAiPrompt('');
      toast.success(`${generatedIdeas.length} nodes generated`);
    }, 1500);
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080C14]">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#080C14]">
      {/* Header */}
      <header className="h-12 border-b border-slate-800/50 bg-[#0A0E18]/95 backdrop-blur-sm flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-white hover:bg-slate-800 h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">{mapInfo?.title || 'Neural Map'}</span>
          </div>
          <span className="text-xs text-slate-600">
            {nodes.length} nodes • {edges.length} connections
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            {['Guilherme', 'Helen', 'Pablo'].map((name, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium border border-slate-700/50"
                style={{ 
                  backgroundColor: i === 0 ? '#00D9FF10' : i === 1 ? '#00FFC810' : '#00B4D810',
                  color: i === 0 ? '#00D9FF' : i === 1 ? '#00FFC8' : '#00B4D8',
                }}
                title={`${name} online`}
              >
                {name[0]}
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`h-8 gap-1.5 text-xs ${showAIPanel ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI Assistant
          </Button>
          
          <Button
            size="sm"
            onClick={() => toast.success('Changes saved')}
            className="h-8 gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
        </div>
      </header>

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
            className="bg-[#080C14]"
            defaultEdgeOptions={{
              style: { stroke: '#1E3A5F', strokeWidth: 2 },
            }}
          >
            <Background 
              color="#1E3A5F" 
              gap={40} 
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              className="!bg-[#0D1520] !border-slate-800/50 !rounded-lg [&>button]:!bg-[#0D1520] [&>button]:!border-slate-800/50 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-800 [&>button:hover]:!text-white" 
            />
            <MiniMap 
              className="!bg-[#0D1520] !rounded-lg !border-slate-800/50"
              nodeColor={() => '#1E3A5F'}
              maskColor="rgba(8, 12, 20, 0.8)"
            />

            {/* Quick Actions */}
            <Panel position="bottom-center" className="!mb-3">
              <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0D1520]/95 backdrop-blur-sm rounded-lg border border-slate-800/50">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('idea')}
                  className="h-7 gap-1.5 text-xs text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Concept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('task')}
                  className="h-7 gap-1.5 text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Task
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('data')}
                  className="h-7 gap-1.5 text-xs text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                >
                  <Database className="w-3.5 h-3.5" />
                  Data
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addNewNode('process')}
                  className="h-7 gap-1.5 text-xs text-slate-400 hover:text-teal-400 hover:bg-teal-500/10"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Process
                </Button>
                
                {selectedNode && selectedNode.id !== 'root' && (
                  <>
                    <div className="w-px h-4 bg-slate-700" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={deleteSelectedNode}
                      className="h-7 gap-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-72 border-l border-slate-800/50 bg-[#0A0E18]/95 backdrop-blur-sm flex flex-col">
            <div className="p-3 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIPanel(false)}
                className="text-slate-500 hover:text-white h-6 w-6"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 p-3 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Quick Actions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-auto py-2 px-2"
                    onClick={() => {
                      setAiPrompt('Generate related concepts');
                      handleAIGenerate();
                    }}
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                    <span className="text-[11px]">Generate</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-auto py-2 px-2"
                    onClick={() => toast.success('Expanding selected node...')}
                  >
                    <Expand className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                    <span className="text-[11px]">Expand</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-auto py-2 px-2"
                    onClick={() => toast.success('Analyzing map...')}
                  >
                    <GitBranch className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    <span className="text-[11px]">Analyze</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-auto py-2 px-2"
                    onClick={() => toast.success('Converting to tasks...')}
                  >
                    <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    <span className="text-[11px]">To Tasks</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Custom Prompt</p>
                <Input
                  placeholder="Describe what to generate..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="h-8 text-xs bg-[#0D1520] border-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                />
                <Button
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full h-8 text-xs bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30"
                >
                  {aiLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      Execute
                    </>
                  )}
                </Button>
              </div>

              {selectedNode && (
                <div className="space-y-2 p-2.5 bg-slate-800/30 rounded-lg border border-slate-800/50">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider">Selected Node</p>
                  <p className="text-white text-sm font-medium">{selectedNode.data?.label as string}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{selectedNode.data?.type as string}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
