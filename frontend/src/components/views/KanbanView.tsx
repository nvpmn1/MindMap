import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Badge, ScrollArea, Avatar, AvatarFallback } from '@/components/ui';
import { useNodeStore } from '@/stores';
import {
  Plus,
  MoreHorizontal,
  GripVertical,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { TaskStatus, Priority } from '@/types';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Node } from '@xyflow/react';

// Local interface for task data
interface TaskNodeData {
  id?: string;
  title?: string;
  content?: string;
  type?: string;
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
}

// Column statuses - using TaskStatus from types
type KanbanStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

interface Column {
  id: KanbanStatus;
  title: string;
  color: string;
  icon: typeof Circle;
}

const columns: Column[] = [
  { id: 'backlog', title: 'Backlog', color: '#9ca3af', icon: Circle },
  { id: 'todo', title: 'A Fazer', color: '#6b7280', icon: Circle },
  { id: 'in_progress', title: 'Em Progresso', color: '#3b82f6', icon: Clock },
  { id: 'review', title: 'Revisão', color: '#8b5cf6', icon: Clock },
  { id: 'done', title: 'Concluído', color: '#22c55e', icon: CheckCircle2 },
];

const priorityColors: Record<Priority, string> = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626',
};

interface KanbanViewProps {
  className?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export function KanbanView({ className, onNodeSelect }: KanbanViewProps) {
  const { nodes, updateNode } = useNodeStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter task nodes and group by status
  const tasksByStatus = useMemo(() => {
    const tasks = nodes.filter(
      (n) => n.type === 'taskNode' || (n.data as TaskNodeData).type === 'task'
    );

    const grouped: Record<KanbanStatus, Node[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    tasks.forEach((task) => {
      const data = task.data as TaskNodeData;
      const status = (data.metadata?.status as KanbanStatus) || 'todo';
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped.todo.push(task);
      }
    });

    return grouped;
  }, [nodes]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const overId = over.id as string;

      // Check if dropped on a column
      const targetColumn = columns.find((col) => col.id === overId);
      if (targetColumn) {
        updateNode(active.id as string, {
          metadata: {
            status: targetColumn.id,
          },
        });
      }
    },
    [updateNode]
  );

  const activeTask = activeId
    ? nodes.find((n) => n.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('h-full flex gap-4 p-4 overflow-x-auto', className)}>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onNodeSelect={onNodeSelect}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  column: Column;
  tasks: any[];
  onNodeSelect?: (nodeId: string) => void;
}

function KanbanColumn({ column, tasks, onNodeSelect }: KanbanColumnProps) {
  const Icon = column.icon;

  return (
    <div
      className="flex-shrink-0 w-72 bg-muted/30 rounded-xl flex flex-col"
      data-column={column.id}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: column.color }} />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1 px-3 pb-3">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2" id={column.id}>
            {tasks.map((task) => (
              <SortableKanbanCard
                key={task.id}
                task={task}
                onSelect={() => onNodeSelect?.(task.id)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Task Button */}
        <Button
          variant="ghost"
          className="w-full mt-2 justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar tarefa
        </Button>
      </ScrollArea>
    </div>
  );
}

interface SortableKanbanCardProps {
  task: any;
  onSelect?: () => void;
}

function SortableKanbanCard({ task, onSelect }: SortableKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanCard
        task={task}
        isDragging={isDragging}
        onSelect={onSelect}
        dragListeners={listeners}
      />
    </div>
  );
}

interface KanbanCardProps {
  task: Node;
  isDragging?: boolean;
  onSelect?: () => void;
  dragListeners?: any;
}

function KanbanCard({
  task,
  isDragging,
  onSelect,
  dragListeners,
}: KanbanCardProps) {
  const data = task.data as TaskNodeData;
  const priority = (data.metadata?.priority as Priority) || 'medium';

  return (
    <div
      className={cn(
        'bg-card rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md',
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-lg'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <button {...dragListeners} className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {data.emoji && <span>{data.emoji}</span>}
            <h4 className="font-medium text-sm truncate">{data.title || 'Sem título'}</h4>
          </div>
          {data.content && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.content}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        {/* Priority */}
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: priorityColors[priority] }}
          title={`Prioridade: ${priority}`}
        />

        {/* Due Date & Assignee */}
        <div className="flex items-center gap-2">
          {data.metadata?.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(data.metadata.due_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          )}
          {data.metadata?.assignee && (
            <Avatar size="xs">
              <AvatarFallback className="text-[8px]">
                {data.metadata.assignee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
