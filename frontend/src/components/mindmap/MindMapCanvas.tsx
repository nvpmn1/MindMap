import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  ConnectionMode,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import { useMapStore, useUIStore } from '@/stores';
import { nodeTypes, createIdeaNode, createTaskNode, createNoteNode } from './nodes';
import { CanvasToolbar } from './CanvasToolbar';

interface MindmapCanvasProps {
  mapId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  readOnly?: boolean;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  className?: string;
}

function MindmapCanvasInner({
  mapId,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  className,
}: MindmapCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, getNodes, setNodes: setRFNodes } = useReactFlow();
  
  // Use local state for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // UI State
  const [showGrid, setShowGrid] = useState(true);
  const [isLocked, setIsLocked] = useState(readOnly);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
  // History for undo/redo
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory.slice(-50)); // Keep last 50 states
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const prevState = history[historyIndex - 1];
    setNodes(prevState.nodes);
    setEdges(prevState.edges);
    setHistoryIndex(historyIndex - 1);
  }, [canUndo, history, historyIndex, setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextState = history[historyIndex + 1];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setHistoryIndex(historyIndex + 1);
  }, [canRedo, history, historyIndex, setNodes, setEdges]);

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      if (isLocked) return;
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
      saveToHistory();
    },
    [setEdges, isLocked, saveToHistory]
  );

  // Handle drop from external source
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (isLocked) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `node-${Date.now()}`;
      let newNode;

      switch (type) {
        case 'idea':
          newNode = createIdeaNode(nodeId, position);
          break;
        case 'task':
          newNode = createTaskNode(nodeId, position);
          break;
        case 'note':
          newNode = createNoteNode(nodeId, position);
          break;
        default:
          return;
      }

      setNodes((nds) => [...nds, newNode]);
      saveToHistory();
    },
    [screenToFlowPosition, setNodes, isLocked, saveToHistory]
  );

  // Add node at center
  const handleAddNode = useCallback(
    (type: 'idea' | 'task' | 'note') => {
      if (isLocked) return;

      const nodeId = `node-${Date.now()}`;
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      let newNode;
      switch (type) {
        case 'idea':
          newNode = createIdeaNode(nodeId, position);
          break;
        case 'task':
          newNode = createTaskNode(nodeId, position);
          break;
        case 'note':
          newNode = createNoteNode(nodeId, position);
          break;
      }

      setNodes((nds) => [...nds, newNode]);
      saveToHistory();
    },
    [screenToFlowPosition, setNodes, isLocked, saveToHistory]
  );

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    if (isLocked) return;
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !nodes.find((n) => n.selected && (n.id === e.source || n.id === e.target))
      )
    );
    saveToHistory();
  }, [setNodes, setEdges, nodes, isLocked, saveToHistory]);

  // Duplicate selected nodes
  const handleDuplicateSelected = useCallback(() => {
    if (isLocked) return;
    const selectedNodes = nodes.filter((n) => n.selected);
    const newNodes = selectedNodes.map((node) => ({
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: false,
    }));
    setNodes((nds) => [...nds, ...newNodes]);
    saveToHistory();
  }, [nodes, setNodes, isLocked, saveToHistory]);

  // Auto layout
  const handleAutoLayout = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      if (isLocked) return;
      
      const spacing = direction === 'horizontal' ? { x: 250, y: 0 } : { x: 0, y: 150 };
      const layoutedNodes = nodes.map((node, index) => ({
        ...node,
        position: {
          x: (index % 5) * spacing.x + (direction === 'vertical' ? (index % 5) * 200 : 0),
          y: Math.floor(index / 5) * (spacing.y || 150) + (direction === 'horizontal' ? Math.floor(index / 5) * 100 : 0),
        },
      }));
      
      setNodes(layoutedNodes);
      saveToHistory();
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    },
    [nodes, setNodes, fitView, isLocked, saveToHistory]
  );

  // Export/Import
  const handleExport = useCallback(() => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${mapId || 'export'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, mapId]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          saveToHistory();
          fitView({ padding: 0.2 });
        }
      } catch (err) {
        console.error('Failed to import:', err);
      }
    };
    input.click();
  }, [setNodes, setEdges, fitView, saveToHistory]);

  // Selection change handler
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNodes(selectedNodes.map((n) => n.id));
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
      // Ctrl+D - Duplicate
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
      // I - Add Idea
      if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
        handleAddNode('idea');
      }
      // T - Add Task
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        handleAddNode('task');
      }
      // N - Add Note
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        handleAddNode('note');
      }
      // Ctrl+0 - Fit view
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        fitView({ padding: 0.2 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleUndo, handleRedo, handleDeleteSelected, handleDuplicateSelected, handleAddNode, fitView]);

  // Notify parent of changes
  React.useEffect(() => {
    onNodesChangeProp?.(nodes);
  }, [nodes, onNodesChangeProp]);

  React.useEffect(() => {
    onEdgesChangeProp?.(edges);
  }, [edges, onEdgesChangeProp]);

  return (
    <div ref={reactFlowWrapper} className={cn('w-full h-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag={!isLocked}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        panOnDrag={[1, 2]} // Middle and right click to pan
        selectionOnDrag
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Toolbar */}
        <CanvasToolbar
          onAddNode={handleAddNode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          onFitView={() => fitView({ padding: 0.2 })}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showGrid={showGrid}
          onToggleLock={() => setIsLocked(!isLocked)}
          isLocked={isLocked}
          onExport={handleExport}
          onImport={handleImport}
          onAutoLayout={handleAutoLayout}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          hasSelection={selectedNodes.length > 0}
        />

        {/* Background */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--muted-foreground)"
            className="opacity-20"
          />
        )}

        {/* Controls */}
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bg-background !border !shadow-lg"
        />

        {/* MiniMap */}
        <MiniMap
          position="bottom-right"
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="!bg-background !border !shadow-lg"
        />

        {/* Lock indicator */}
        {isLocked && (
          <Panel position="top-right" className="!m-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 text-sm">
              <span>🔒</span>
              <span>Modo visualização</span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// Wrap with provider
export function MindmapCanvas(props: MindmapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MindmapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

export default MindmapCanvas;
