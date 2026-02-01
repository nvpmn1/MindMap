import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { useNodeStore, useUIStore, useCollaborationStore } from '@/stores';
import { IdeaNode, TaskNode, NoteNode } from './nodes';
import { CanvasToolbar } from './CanvasToolbar';
import { CollaboratorCursors } from './CollaboratorCursors';
import { NodeContextMenu } from './NodeContextMenu';

// Type assertion to make NodeTypes work with our custom nodes
const nodeTypes = {
  ideaNode: IdeaNode,
  taskNode: TaskNode,
  noteNode: NoteNode,
} as NodeTypes;

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: 'var(--border)', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: 'var(--border)',
  },
};

interface MindMapCanvasProps {
  className?: string;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function MindMapCanvas({ className, onNodeSelect }: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setFocusedNode,
    addNode,
    saveToHistory,
  } = useNodeStore();

  const { canvasSettings } = useUIStore();
  const { updateCursor, collaborators } = useCollaborationStore();

  // Handle node selection
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: any[] }) => {
      const selectedId = selectedNodes.length > 0 ? selectedNodes[0].id : null;
      setFocusedNode(selectedId);
      onNodeSelect?.(selectedId);
    },
    [setFocusedNode, onNodeSelect]
  );

  // Handle double click to create node
  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node-${Date.now()}`,
        type: 'ideaNode',
        position,
        data: {
          id: `node-${Date.now()}`,
          map_id: '',
          parent_id: null,
          type: 'idea' as const,
          title: 'Nova Ideia',
          content: '',
          color: '#3b82f6',
          emoji: '💡',
          position_x: position.x,
          position_y: position.y,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  // Track cursor for collaboration
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateCursor(position.x, position.y);
    },
    [screenToFlowPosition, updateCursor]
  );

  // Fit view on initial load
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, []);

  // Save history on node/edge changes
  const handleNodesChangeWithHistory: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Only save to history for significant changes (not position during drag)
      const hasSignificantChange = changes.some(
        (c) => c.type === 'add' || c.type === 'remove'
      );
      if (hasSignificantChange) {
        saveToHistory();
      }
    },
    [onNodesChange, saveToHistory]
  );

  const handleEdgesChangeWithHistory: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      const hasSignificantChange = changes.some(
        (c) => c.type === 'add' || c.type === 'remove'
      );
      if (hasSignificantChange) {
        saveToHistory();
      }
    },
    [onEdgesChange, saveToHistory]
  );

  return (
    <div
      ref={containerRef}
      className={cn('w-full h-full', className)}
      onMouseMove={handleMouseMove}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChangeWithHistory}
        onEdgesChange={handleEdgesChangeWithHistory}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() => onNodeSelect?.(null)}
        onDoubleClick={handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        snapToGrid={canvasSettings.snapToGrid}
        snapGrid={[canvasSettings.gridSize, canvasSettings.gridSize]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        {/* Background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={canvasSettings.gridSize}
          size={1}
          className="!bg-background"
        />

        {/* Controls */}
        {canvasSettings.showControls && (
          <Controls
            className="!bg-card !border-border !rounded-lg !shadow-md"
            showInteractive={false}
          />
        )}

        {/* Minimap */}
        {canvasSettings.showMinimap && (
          <MiniMap
            className="!bg-card !border-border !rounded-lg !shadow-md"
            nodeColor={(node) => {
              switch (node.type) {
                case 'ideaNode':
                  return '#3b82f6';
                case 'taskNode':
                  return '#22c55e';
                case 'noteNode':
                  return '#f59e0b';
                default:
                  return '#6b7280';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            pannable
            zoomable
          />
        )}

        {/* Toolbar */}
        <Panel position="top-center" className="mt-2">
          <CanvasToolbar />
        </Panel>

        {/* Collaborator Cursors */}
        <CollaboratorCursors collaborators={collaborators} />
      </ReactFlow>

      {/* Context Menu */}
      <NodeContextMenu />
    </div>
  );
}
