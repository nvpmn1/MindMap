import { useState, useCallback, useEffect, useRef } from 'react';
import { useNodeStore } from '@/stores';
import {
  Copy,
  Trash2,
  Edit3,
  Palette,
  Sparkles,
  Lightbulb,
  CheckSquare,
  StickyNote,
  ChevronRight,
  Link2,
} from 'lucide-react';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

const COLORS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6366f1', // Indigo
];

export function NodeContextMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  const { removeNode, duplicateNode, updateNode } = useNodeStore();

  // Handle context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeElement = target.closest('.react-flow__node');

      if (nodeElement) {
        e.preventDefault();
        const nodeId = nodeElement.getAttribute('data-id');

        setState({
          isOpen: true,
          x: e.clientX,
          y: e.clientY,
          nodeId,
        });
      }
    };

    const handleClick = () => {
      setState((prev) => ({ ...prev, isOpen: false }));
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleDelete = useCallback(() => {
    if (state.nodeId) {
      removeNode(state.nodeId);
    }
  }, [state.nodeId, removeNode]);

  const handleDuplicate = useCallback(() => {
    if (state.nodeId) {
      duplicateNode(state.nodeId);
    }
  }, [state.nodeId, duplicateNode]);

  const handleChangeColor = useCallback(
    (color: string) => {
      if (state.nodeId) {
        updateNode(state.nodeId, { color });
      }
    },
    [state.nodeId, updateNode]
  );

  const handleConvertTo = useCallback(
    (nodeType: 'idea' | 'task' | 'note') => {
      if (state.nodeId) {
        // Update the node type for React Flow
        const { nodes, setNodes } = useNodeStore.getState();
        setNodes(
          nodes.map((n) =>
            n.id === state.nodeId
              ? { ...n, type: `${nodeType}Node`, data: { ...n.data, type: nodeType } }
              : n
          )
        );
      }
    },
    [state.nodeId]
  );

  if (!state.isOpen || !state.nodeId) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{ left: state.x, top: state.y }}
    >
      <div className="bg-popover border rounded-lg shadow-lg p-1 min-w-[180px] animate-in fade-in-0 zoom-in-95">
        {/* Edit */}
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left"
          onClick={() => {
            // TODO: Open edit modal
          }}
        >
          <Edit3 className="h-4 w-4" />
          Editar
        </button>

        {/* Duplicate */}
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left"
          onClick={handleDuplicate}
        >
          <Copy className="h-4 w-4" />
          Duplicar
          <span className="ml-auto text-xs text-muted-foreground">⌘D</span>
        </button>

        <div className="my-1 border-t" />

        {/* Color Submenu */}
        <div className="relative group">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left">
            <Palette className="h-4 w-4" />
            Cor
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>
          <div className="absolute left-full top-0 ml-1 bg-popover border rounded-lg shadow-lg p-2 hidden group-hover:block">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-primary"
                  style={{ backgroundColor: color }}
                  onClick={() => handleChangeColor(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Convert Submenu */}
        <div className="relative group">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left">
            <ChevronRight className="h-4 w-4 rotate-0" />
            Converter para
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>
          <div className="absolute left-full top-0 ml-1 bg-popover border rounded-lg shadow-lg p-1 min-w-[140px] hidden group-hover:block">
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left text-blue-500"
              onClick={() => handleConvertTo('idea')}
            >
              <Lightbulb className="h-4 w-4" />
              Ideia
            </button>
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left text-green-500"
              onClick={() => handleConvertTo('task')}
            >
              <CheckSquare className="h-4 w-4" />
              Tarefa
            </button>
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left text-amber-500"
              onClick={() => handleConvertTo('note')}
            >
              <StickyNote className="h-4 w-4" />
              Nota
            </button>
          </div>
        </div>

        <div className="my-1 border-t" />

        {/* AI Expand */}
        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left text-purple-500">
          <Sparkles className="h-4 w-4" />
          Expandir com IA
        </button>

        {/* Link */}
        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left">
          <Link2 className="h-4 w-4" />
          Conectar
        </button>

        <div className="my-1 border-t" />

        {/* Delete */}
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-destructive/10 text-destructive text-left"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
          <span className="ml-auto text-xs">Del</span>
        </button>
      </div>
    </div>
  );
}
