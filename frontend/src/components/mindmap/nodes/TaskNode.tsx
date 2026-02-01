import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  MoreHorizontal, 
  Calendar,
  User,
  Flag,
  Trash2,
  Copy,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge, StatusBadge } from '@/components/ui';

// Task Node data interface
export interface TaskNodeData {
  type: 'task';
  label: string;
  content?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  color?: string;
  subtasks?: Array<{ id: string; label: string; completed: boolean }>;
}

const priorityColors = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f97316',
  urgent: '#ef4444',
};

const TaskNode = memo(({ id, data, selected }: NodeProps<TaskNodeData>) => {
  const { setNodes, getNode, addNodes } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(data.label);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const borderColor = priorityColors[data.priority] || '#3b82f6';
  const isCompleted = data.status === 'done';

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
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setEditValue(data.label);
      setIsEditing(false);
    }
  };

  const handleStatusChange = (status: TaskNodeData['status']) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, status } }
          : node
      )
    );
  };

  const handlePriorityChange = (priority: TaskNodeData['priority']) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, priority } }
          : node
      )
    );
  };

  const handleToggleComplete = () => {
    const newStatus = isCompleted ? 'todo' : 'done';
    handleStatusChange(newStatus);
  };

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  const handleDuplicate = () => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    const newNodeId = `node-${Date.now()}`;
    addNodes([{
      id: newNodeId,
      type: 'task',
      position: {
        x: parentNode.position.x + 50,
        y: parentNode.position.y + 50,
      },
      data: { ...data, label: `${data.label} (cópia)` },
    }]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now && !isCompleted;
    return {
      formatted: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      isOverdue,
    };
  };

  const dueDateInfo = formatDate(data.dueDate);
  const completedSubtasks = data.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = data.subtasks?.length || 0;

  return (
    <div
      className={cn(
        'group relative min-w-[200px] max-w-[280px] rounded-lg border-l-4 border bg-card p-3 shadow-sm transition-all',
        selected && 'ring-2 ring-ring ring-offset-2',
        isCompleted && 'opacity-70',
        'hover:shadow-md'
      )}
      style={{ borderLeftColor: borderColor }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background !left-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
      />

      {/* Header */}
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className="mt-0.5 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        {/* Title */}
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
            <p className={cn(
              'text-sm font-medium',
              isCompleted && 'line-through text-muted-foreground'
            )}>
              {data.label}
            </p>
          )}
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Flag className="mr-2 h-4 w-4" />
                Prioridade
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)}>
                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: priorityColors[p] }} />
                    {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : p === 'high' ? 'Alta' : 'Urgente'}
                    {data.priority === p && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="mr-2 h-4 w-4" />
                Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(['backlog', 'todo', 'in_progress', 'review', 'done'] as const).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                    {s === 'backlog' ? 'Backlog' : 
                     s === 'todo' ? 'A Fazer' : 
                     s === 'in_progress' ? 'Em Progresso' : 
                     s === 'review' ? 'Revisão' : 'Concluído'}
                    {data.status === s && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {data.content && !isEditing && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-2 ml-7">
          {data.content}
        </p>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="mt-2 ml-7">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 ml-7">
        <StatusBadge status={data.status} showDot={false} className="text-[10px] px-1.5 py-0" />
        
        {dueDateInfo && (
          <span className={cn(
            'flex items-center gap-1 text-[10px]',
            dueDateInfo.isOverdue ? 'text-red-500' : 'text-muted-foreground'
          )}>
            <Calendar className="h-3 w-3" />
            {dueDateInfo.formatted}
          </span>
        )}

        {data.assignee && (
          <div className="ml-auto flex items-center gap-1" title={data.assignee.name}>
            {data.assignee.avatar_url ? (
              <img 
                src={data.assignee.avatar_url} 
                alt={data.assignee.name}
                className="h-4 w-4 rounded-full"
              />
            ) : (
              <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-medium">
                {data.assignee.name[0]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

export { TaskNode };
export default TaskNode;
