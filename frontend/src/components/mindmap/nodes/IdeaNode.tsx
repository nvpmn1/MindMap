import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  MoreHorizontal, 
  GripVertical,
  Sparkles,
  MessageSquare,
  Trash2,
  Copy,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleTooltip } from '@/components/ui';

// Base node data interface
export interface BaseNodeData {
  label: string;
  content?: string;
  color?: string;
  emoji?: string;
  isSelected?: boolean;
  isEditing?: boolean;
  hasComments?: boolean;
  commentCount?: number;
}

// Idea Node - main node type for brainstorming
export interface IdeaNodeData extends BaseNodeData {
  type: 'idea';
}

const IdeaNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const data = props.data as unknown as IdeaNodeData;
  const { setNodes, getNode, addNodes, addEdges } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(data.label);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const nodeColor = data.color || '#3b82f6';

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() } }
            : node
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(data.label);
      setIsEditing(false);
    }
  };

  const handleAddChild = () => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'idea',
      position: {
        x: parentNode.position.x + 250,
        y: parentNode.position.y,
      },
      data: { label: 'Nova ideia', type: 'idea' },
    };

    const newEdge = {
      id: `edge-${id}-${newNodeId}`,
      source: id,
      target: newNodeId,
      type: 'smoothstep',
    };

    addNodes([newNode]);
    addEdges([newEdge]);
  };

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  const handleDuplicate = () => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'idea',
      position: {
        x: parentNode.position.x + 50,
        y: parentNode.position.y + 50,
      },
      data: { ...data, label: `${data.label} (cópia)` },
    };

    addNodes([newNode]);
  };

  return (
    <div
      className={cn(
        'group relative min-w-[150px] max-w-[300px] rounded-lg border-2 bg-card p-3 shadow-sm transition-all',
        selected && 'ring-2 ring-ring ring-offset-2',
        'hover:shadow-md'
      )}
      style={{ borderColor: nodeColor }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
      />

      {/* Drag Handle */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Color indicator */}
      <div
        className="absolute -top-1 left-4 h-2 w-8 rounded-full"
        style={{ backgroundColor: nodeColor }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        {data.emoji && (
          <span className="text-lg flex-shrink-0">{data.emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none text-sm font-medium"
            />
          ) : (
            <p className="text-sm font-medium truncate">{data.label}</p>
          )}
          {data.content && !isEditing && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {data.content}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <SimpleTooltip content="Adicionar filho" side="right">
          <button
            onClick={handleAddChild}
            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </SimpleTooltip>
      </div>

      {/* Menu */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleAddChild}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar filho
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Sparkles className="mr-2 h-4 w-4" />
              Expandir com IA
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              Comentários
              {data.commentCount && data.commentCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {data.commentCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comments indicator */}
      {data.hasComments && (
        <div className="absolute -bottom-2 right-2 flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {data.commentCount || 0}
          </span>
        </div>
      )}
    </div>
  );
});

IdeaNode.displayName = 'IdeaNode';

export { IdeaNode };
export default IdeaNode;
