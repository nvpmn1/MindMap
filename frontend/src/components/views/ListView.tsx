import React from 'react';
import { cn } from '@/lib/utils';
import {
  TaskCheckbox,
  PriorityBadge,
  StatusBadge,
  Button,
  SimpleTooltip,
  SkeletonListView,
} from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  User,
  MoreHorizontal,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  SortAsc,
} from 'lucide-react';

// Types
export interface ListItem {
  id: string;
  title: string;
  description?: string;
  type: 'idea' | 'task' | 'note';
  status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  tags?: string[];
  children?: ListItem[];
  parentId?: string;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// List Item Row
interface ListItemRowProps {
  item: ListItem;
  depth?: number;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onToggleExpand?: (id: string) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  expanded?: boolean;
  selected?: boolean;
}

function ListItemRow({
  item,
  depth = 0,
  onToggleComplete,
  onToggleExpand,
  onClick,
  onEdit,
  onDelete,
  expanded = false,
  selected = false,
}: ListItemRowProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isTask = item.type === 'task';
  const isOverdue = item.dueDate && new Date() > item.dueDate && !item.completed;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    if (days === -1) return 'Ontem';
    if (days < -1) return `${Math.abs(days)}d atrás`;
    if (days < 7) return `Em ${days}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const typeIcons = {
    idea: '💡',
    task: '✓',
    note: '📝',
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b',
        selected && 'bg-primary/5 border-primary/20',
        item.completed && 'opacity-60'
      )}
      style={{ paddingLeft: `${depth * 24 + 16}px` }}
    >
      {/* Expand button */}
      <div className="w-5 flex-shrink-0">
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand?.(item.id)}
            className="p-0.5 rounded hover:bg-muted transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="text-sm">{typeIcons[item.type]}</span>
        )}
      </div>

      {/* Checkbox (for tasks) */}
      {isTask && (
        <TaskCheckbox
          checked={item.completed || false}
          onCheckedChange={(checked) => onToggleComplete?.(item.id, checked)}
          label=""
          className="!space-x-0"
        />
      )}

      {/* Title and Description */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onClick}
      >
        <p className={cn(
          'text-sm font-medium truncate',
          item.completed && 'line-through text-muted-foreground'
        )}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{item.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Priority */}
      {item.priority && (
        <PriorityBadge priority={item.priority} className="hidden sm:flex" />
      )}

      {/* Status */}
      {item.status && (
        <StatusBadge status={item.status} className="hidden md:flex" />
      )}

      {/* Due Date */}
      {item.dueDate && (
        <span className={cn(
          'hidden sm:flex items-center gap-1 text-xs',
          isOverdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          <Calendar className="h-3 w-3" />
          {formatDate(item.dueDate)}
        </span>
      )}

      {/* Assignee */}
      {item.assignee && (
        <SimpleTooltip content={item.assignee.name}>
          <div className="hidden lg:flex">
            {item.assignee.avatar_url ? (
              <img
                src={item.assignee.avatar_url}
                alt={item.assignee.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                {item.assignee.name[0]}
              </div>
            )}
          </div>
        </SimpleTooltip>
      )}

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// List Header
interface ListHeaderProps {
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onFilter?: () => void;
  onAddItem?: () => void;
  showColumns?: {
    status?: boolean;
    priority?: boolean;
    dueDate?: boolean;
    assignee?: boolean;
  };
}

function ListHeader({
  onSort,
  sortField,
  sortDirection,
  onFilter,
  onAddItem,
  showColumns = { status: true, priority: true, dueDate: true, assignee: true },
}: ListHeaderProps) {
  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => onSort?.(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
        sortField === field && 'text-foreground'
      )}
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      )}
    </button>
  );

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
      <div className="w-5" /> {/* Expand button placeholder */}
      <div className="flex-1">
        <SortButton field="title" label="Título" />
      </div>
      
      {showColumns.priority && (
        <div className="hidden sm:block w-16">
          <SortButton field="priority" label="Prioridade" />
        </div>
      )}
      
      {showColumns.status && (
        <div className="hidden md:block w-24">
          <SortButton field="status" label="Status" />
        </div>
      )}
      
      {showColumns.dueDate && (
        <div className="hidden sm:block w-20">
          <SortButton field="dueDate" label="Data" />
        </div>
      )}
      
      {showColumns.assignee && (
        <div className="hidden lg:block w-8" />
      )}
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onFilter}>
          <Filter className="h-4 w-4 mr-1" />
          Filtrar
        </Button>
        <Button variant="ghost" size="sm" onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

// Main List View
interface ListViewProps {
  items: ListItem[];
  onItemClick?: (item: ListItem) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onEdit?: (item: ListItem) => void;
  onDelete?: (id: string) => void;
  onAddItem?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showHeader?: boolean;
  className?: string;
}

export function ListView({
  items,
  onItemClick,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddItem,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado',
  showHeader = true,
  className,
}: ListViewProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<string>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort items
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      let aVal: any = a[sortField as keyof ListItem];
      let bVal: any = b[sortField as keyof ListItem];

      // Handle special cases
      if (sortField === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        aVal = priorityOrder[aVal as keyof typeof priorityOrder] ?? 4;
        bVal = priorityOrder[bVal as keyof typeof priorityOrder] ?? 4;
      }

      if (sortField === 'status') {
        const statusOrder = { done: 4, review: 3, in_progress: 2, todo: 1, backlog: 0 };
        aVal = statusOrder[aVal as keyof typeof statusOrder] ?? 5;
        bVal = statusOrder[bVal as keyof typeof statusOrder] ?? 5;
      }

      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection]);

  // Render items recursively
  const renderItems = (items: ListItem[], depth = 0): React.ReactNode => {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <ListItemRow
          item={item}
          depth={depth}
          expanded={expandedIds.has(item.id)}
          selected={selectedId === item.id}
          onToggleComplete={onToggleComplete}
          onToggleExpand={handleToggleExpand}
          onClick={() => {
            setSelectedId(item.id);
            onItemClick?.(item);
          }}
          onEdit={() => onEdit?.(item)}
          onDelete={() => onDelete?.(item.id)}
        />
        {item.children && expandedIds.has(item.id) && (
          renderItems(item.children, depth + 1)
        )}
      </React.Fragment>
    ));
  };

  if (isLoading) {
    return <SkeletonListView rows={8} className={className} />;
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {showHeader && (
        <ListHeader
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onAddItem={onAddItem}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p>{emptyMessage}</p>
            {onAddItem && (
              <Button
                variant="link"
                onClick={onAddItem}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar item
              </Button>
            )}
          </div>
        ) : (
          renderItems(sortedItems)
        )}
      </div>
    </div>
  );
}

export default ListView;
