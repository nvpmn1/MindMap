import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { TaskStatus, Priority } from '@/types';

export interface TaskNodeData {
  id: string;
  title: string;
  content?: string;
  color?: string;
  emoji?: string;
  metadata?: {
    status?: TaskStatus;
    priority?: Priority;
    due_date?: string;
    assignee?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  };
  [key: string]: unknown;
}

interface TaskNodeProps {
  data: TaskNodeData;
  selected?: boolean;
}

const statusConfig: Record<TaskStatus, { icon: typeof Circle; label: string; color: string }> = {
  backlog: { icon: Circle, label: 'Backlog', color: '#9ca3af' },
  todo: { icon: Circle, label: 'A fazer', color: '#6b7280' },
  in_progress: { icon: Clock, label: 'Em progresso', color: '#3b82f6' },
  review: { icon: Clock, label: 'Revisão', color: '#8b5cf6' },
  done: { icon: CheckCircle2, label: 'Concluído', color: '#22c55e' },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: '#6b7280' },
  medium: { label: 'Média', color: '#f59e0b' },
  high: { label: 'Alta', color: '#ef4444' },
  urgent: { label: 'Urgente', color: '#dc2626' },
};

export const TaskNode = memo(({ data, selected }: TaskNodeProps) => {
  const status = data.metadata?.status || 'todo';
  const priority = data.metadata?.priority || 'medium';
  const StatusIcon = statusConfig[status]?.icon || Circle;
  const isDone = status === 'done';

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-xl shadow-md border-2 transition-all duration-200 min-w-[180px] max-w-[320px]',
        'bg-background hover:shadow-lg',
        selected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-transparent hover:border-primary/50',
        isDone && 'opacity-75'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon
          className="h-5 w-5 flex-shrink-0"
          style={{ color: statusConfig[status].color }}
        />
        <Badge
          variant="outline"
          className="text-[10px] px-1.5"
          style={{
            borderColor: priorityConfig[priority].color,
            color: priorityConfig[priority].color,
          }}
        >
          {priorityConfig[priority].label}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Emoji */}
        {data.emoji && (
          <span className="text-xl flex-shrink-0">{data.emoji}</span>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              'font-semibold text-sm leading-tight break-words',
              isDone && 'line-through text-muted-foreground'
            )}
          >
            {data.title}
          </h3>

          {/* Content Preview */}
          {data.content && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.content}
            </p>
          )}

          {/* Due Date */}
          {data.metadata?.due_date && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(data.metadata.due_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
      />

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute -inset-1 rounded-xl border-2 border-green-500 pointer-events-none animate-pulse" />
      )}

      {/* Priority Bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: priorityConfig[priority].color }}
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
