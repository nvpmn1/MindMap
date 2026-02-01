import React from 'react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard, StatusBadge, Button, SkeletonTaskCard } from '@/components/ui';
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types
export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: Date;
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  tags?: string[];
  position: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: KanbanTask['status'];
  color: string;
}

const defaultColumns: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', status: 'backlog', color: '#64748b' },
  { id: 'todo', title: 'A Fazer', status: 'todo', color: '#64748b' },
  { id: 'in_progress', title: 'Em Progresso', status: 'in_progress', color: '#3b82f6' },
  { id: 'review', title: 'Revisão', status: 'review', color: '#a855f7' },
  { id: 'done', title: 'Concluído', status: 'done', color: '#22c55e' },
];

// Sortable Task Card
interface SortableTaskProps {
  task: KanbanTask;
  onClick: () => void;
  isDragging?: boolean;
}

function SortableTask({ task, onClick, isDragging }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isSortableDragging && 'opacity-50'
      )}
    >
      <TaskCard
        title={task.title}
        description={task.description}
        priority={task.priority}
        dueDate={task.dueDate}
        assignee={task.assignee}
        tags={task.tags}
        isDragging={isDragging}
      />
    </div>
  );
}

// Kanban Column
interface KanbanColumnProps {
  column: KanbanColumn;
  tasks: KanbanTask[];
  onAddTask: () => void;
  onTaskClick: (task: KanbanTask) => void;
  onEditColumn?: () => void;
  onDeleteColumn?: () => void;
  isOver?: boolean;
}

function KanbanColumnComponent({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onEditColumn,
  onDeleteColumn,
  isOver,
}: KanbanColumnProps) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-lg bg-muted/30',
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditColumn}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar coluna
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDeleteColumn}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <p>Nenhuma tarefa</p>
            <button
              onClick={onAddTask}
              className="mt-2 text-primary hover:underline text-xs"
            >
              Adicionar tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Kanban Board
interface KanbanBoardProps {
  tasks: KanbanTask[];
  columns?: KanbanColumn[];
  onTaskMove: (taskId: string, newStatus: KanbanTask['status'], newPosition: number) => void;
  onTaskClick: (task: KanbanTask) => void;
  onAddTask: (status: KanbanTask['status']) => void;
  isLoading?: boolean;
  className?: string;
}

export function KanbanBoard({
  tasks,
  columns = defaultColumns,
  onTaskMove,
  onTaskClick,
  onAddTask,
  isLoading = false,
  className,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<KanbanTask | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

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

  const getTasksByStatus = (status: KanbanTask['status']) => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id?.toString() || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Find the target column
    let targetStatus: KanbanTask['status'] | null = null;
    let targetPosition = 0;

    // Check if dropped on a column
    const column = columns.find((c) => c.id === over.id);
    if (column) {
      targetStatus = column.status;
      const columnTasks = getTasksByStatus(column.status);
      targetPosition = columnTasks.length;
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
        const columnTasks = getTasksByStatus(overTask.status);
        targetPosition = columnTasks.findIndex((t) => t.id === overTask.id);
      }
    }

    if (targetStatus && (targetStatus !== activeTask.status || targetPosition !== activeTask.position)) {
      onTaskMove(activeTask.id, targetStatus, targetPosition);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex gap-4 overflow-x-auto p-4', className)}>
        {columns.map((column) => (
          <div key={column.id} className="w-72 shrink-0 space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-t-lg">
              <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <SkeletonTaskCard key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('flex gap-4 overflow-x-auto p-4', className)}>
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.status)}
            onAddTask={() => onAddTask(column.status)}
            onTaskClick={onTaskClick}
            isOver={overId === column.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            title={activeTask.title}
            description={activeTask.description}
            priority={activeTask.priority}
            dueDate={activeTask.dueDate}
            assignee={activeTask.assignee}
            tags={activeTask.tags}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
