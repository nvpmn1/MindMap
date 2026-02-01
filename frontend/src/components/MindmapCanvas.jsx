import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Lock,
  Unlock
} from 'lucide-react';

import MindMapNode from './MindMapNode';
import { useMindmapStore, useUserStore, useViewStore } from '../store';
import { nodesAPI, aiAPI } from '../lib/api';

// Custom node types
const nodeTypes = {
  mindmapNode: MindMapNode,
};

// Convert app nodes to ReactFlow nodes
const convertToFlowNodes = (nodes, parentPositions = {}) => {
  const flowNodes = [];
  const positions = {};
  
  // Calculate positions for nodes
  const calculatePosition = (node, index, siblings, parentPos = { x: 0, y: 0 }, level = 0) => {
    const spacing = 250;
    const verticalSpacing = 120;
    
    if (node.position_x !== null && node.position_y !== null) {
      return { x: node.position_x, y: node.position_y };
    }
    
    if (level === 0) {
      // Root node at center
      return { x: 0, y: 0 };
    }
    
    // Calculate radial position for children
    const angleStep = Math.PI / Math.max(siblings.length, 1);
    const startAngle = -Math.PI / 2;
    const angle = startAngle + angleStep * (index + 0.5);
    
    const radius = spacing * level;
    
    return {
      x: parentPos.x + Math.cos(angle) * radius,
      y: parentPos.y + Math.sin(angle) * radius + verticalSpacing * level
    };
  };

  // Build tree structure
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const rootNodes = nodes.filter(n => !n.parent_id);
  
  const processNode = (node, index, siblings, parentPos, level) => {
    const position = calculatePosition(node, index, siblings, parentPos, level);
    positions[node.id] = position;
    
    flowNodes.push({
      id: node.id,
      type: 'mindmapNode',
      position,
      data: {
        ...node,
        level,
      },
    });

    // Process children
    const children = nodes.filter(n => n.parent_id === node.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    children.forEach((child, i) => {
      processNode(child, i, children, position, level + 1);
    });
  };

  rootNodes.forEach((node, i) => {
    processNode(node, i, rootNodes, { x: 0, y: 0 }, 0);
  });

  return { flowNodes, positions };
};

// Convert parent-child relationships to edges
const convertToFlowEdges = (nodes, links = []) => {
  const edges = [];
  
  // Parent-child edges
  nodes.forEach(node => {
    if (node.parent_id) {
      edges.push({
        id: `edge-${node.parent_id}-${node.id}`,
        source: node.parent_id,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: '#94a3b8', 
          strokeWidth: 2 
        },
      });
    }
  });

  // Cross-link edges
  links.forEach(link => {
    edges.push({
      id: `link-${link.id}`,
      source: link.source_node_id,
      target: link.target_node_id,
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#8b5cf6', 
        strokeWidth: 2,
        strokeDasharray: '5 5'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8b5cf6',
      },
    });
  });

  return edges;
};

export default function MindmapCanvas() {
  const { 
    nodes: appNodes, 
    links,
    currentMindmap,
    addNode,
    updateNode,
    selectedNodeId,
    setSelectedNodeId
  } = useMindmapStore();
  
  const { currentUser } = useUserStore();
  const { zoom, setZoom, panPosition, setPanPosition } = useViewStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactionMode, setInteractionMode] = useState('free'); // 'free' | 'locked'

  // Convert app nodes to flow nodes when they change
  useEffect(() => {
    if (appNodes.length > 0) {
      const { flowNodes } = convertToFlowNodes(appNodes);
      setNodes(flowNodes);
      setEdges(convertToFlowEdges(appNodes, links));
    }
  }, [appNodes, links, setNodes, setEdges]);

  // Handle node drag stop - save position
  const onNodeDragStop = useCallback(async (event, node) => {
    try {
      await nodesAPI.update(node.id, {
        position: { x: node.position.x, y: node.position.y },
        userId: currentUser?.id
      });
      updateNode(node.id, {
        position_x: node.position.x,
        position_y: node.position.y
      });
    } catch (error) {
      console.error('Failed to save node position:', error);
    }
  }, [currentUser, updateNode]);

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // Handle connecting nodes
  const onConnect = useCallback(async (params) => {
    try {
      await nodesAPI.link(params.source, params.target, currentUser?.id);
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
      }, eds));
    } catch (error) {
      console.error('Failed to create link:', error);
    }
  }, [currentUser, setEdges]);

  // Add new root node
  const handleAddRootNode = async () => {
    if (!currentMindmap) return;
    
    try {
      const result = await nodesAPI.create({
        mindmapId: currentMindmap.id,
        content: 'Nova Ideia',
        type: 'idea',
        userId: currentUser?.id,
        position: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }
      });
      
      addNode(result.data);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  // Generate map with AI
  const handleAIGenerate = async () => {
    const prompt = window.prompt('Descreva o tema do mapa mental:');
    if (!prompt || !currentMindmap) return;

    setIsGenerating(true);
    try {
      const result = await aiAPI.generateMap(prompt, {
        mindmapId: currentMindmap.id,
        userId: currentUser?.id
      });

      // Create nodes from AI structure
      if (result.data.nodes && result.data.nodes.length > 0) {
        await nodesAPI.bulkCreate(result.data.nodes, currentMindmap.id, currentUser?.id);
        // Reload will happen via realtime subscription
      }
    } catch (error) {
      console.error('Failed to generate map:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Custom minimap node color
  const minimapNodeColor = useCallback((node) => {
    const data = node.data;
    if (data?.status === 'done') return '#22c55e';
    if (data?.status === 'doing') return '#3b82f6';
    if (data?.assigned_to) return '#f59e0b';
    return '#64748b';
  }, []);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={interactionMode === 'free'}
        className="bg-slate-50 dark:bg-slate-900"
      >
        <Background 
          color="#94a3b8" 
          gap={20} 
          size={1}
          className="opacity-30"
        />
        
        <Controls 
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="!shadow-lg"
        />
        
        <MiniMap 
          nodeColor={minimapNodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white dark:!bg-slate-800 !rounded-lg !shadow-lg"
        />

        {/* Custom Controls Panel */}
        <Panel position="top-left" className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddRootNode}
            className="btn-primary !px-3"
            title="Adicionar nó"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Nó</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="btn bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 !px-3"
            title="Gerar com IA"
          >
            {isGenerating ? (
              <div className="spinner !border-white !border-t-transparent" />
            ) : (
              <Sparkles size={18} />
            )}
            <span className="hidden sm:inline">
              {isGenerating ? 'Gerando...' : 'IA Gera'}
            </span>
          </motion.button>
        </Panel>

        {/* Zoom Controls */}
        <Panel position="bottom-left" className="flex flex-col gap-1">
          <button
            onClick={() => setInteractionMode(m => m === 'free' ? 'locked' : 'free')}
            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-700"
            title={interactionMode === 'free' ? 'Bloquear movimentação' : 'Liberar movimentação'}
          >
            {interactionMode === 'free' ? <Unlock size={18} /> : <Lock size={18} />}
          </button>
        </Panel>
      </ReactFlow>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Sparkles className="w-12 h-12 text-purple-500 animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="w-12 h-12 text-purple-500 opacity-30" />
                </div>
              </div>
              <p className="text-lg font-medium">IA está criando seu mapa...</p>
              <p className="text-sm text-slate-500">Isso pode levar alguns segundos</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
