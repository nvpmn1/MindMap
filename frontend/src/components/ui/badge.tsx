import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500/10 text-green-600 dark:text-green-400',
        warning:
          'border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        info:
          'border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({ className, variant, removable, onRemove, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
      {removable && (
        <button
          type="button"
          className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </button>
      )}
    </div>
  );
}

// Priority badge for tasks
type Priority = 'low' | 'medium' | 'high' | 'urgent';

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: {
    label: 'Baixa',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  medium: {
    label: 'Média',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  high: {
    label: 'Alta',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  urgent: {
    label: 'Urgente',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: Priority;
}

function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
      {...props}
    >
      {config.label}
    </div>
  );
}

// Status badge for tasks
type Status = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'archived';

const statusConfig: Record<Status, { label: string; className: string; dotColor: string }> = {
  backlog: {
    label: 'Backlog',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-500',
  },
  todo: {
    label: 'A Fazer',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-500',
  },
  in_progress: {
    label: 'Em Progresso',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  review: {
    label: 'Revisão',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dotColor: 'bg-purple-500',
  },
  done: {
    label: 'Concluído',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  archived: {
    label: 'Arquivado',
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    dotColor: 'bg-gray-500',
  },
};

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: Status;
  showDot?: boolean;
}

function StatusBadge({ status, showDot = true, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', config.dotColor)} />
      )}
      {config.label}
    </div>
  );
}

// Node type badge for mindmap nodes
type NodeType = 'idea' | 'task' | 'note' | 'link' | 'image' | 'file';

const nodeTypeConfig: Record<NodeType, { label: string; className: string; icon: string }> = {
  idea: {
    label: 'Ideia',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    icon: '💡',
  },
  task: {
    label: 'Tarefa',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: '✓',
  },
  note: {
    label: 'Nota',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    icon: '📝',
  },
  link: {
    label: 'Link',
    className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    icon: '🔗',
  },
  image: {
    label: 'Imagem',
    className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    icon: '🖼️',
  },
  file: {
    label: 'Arquivo',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    icon: '📎',
  },
};

interface NodeTypeBadgeProps extends Omit<BadgeProps, 'variant'> {
  nodeType: NodeType;
  showIcon?: boolean;
}

function NodeTypeBadge({ nodeType, showIcon = true, className, ...props }: NodeTypeBadgeProps) {
  const config = nodeTypeConfig[nodeType];
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </div>
  );
}

export { Badge, badgeVariants, PriorityBadge, StatusBadge, NodeTypeBadge };
export type { Priority, Status, NodeType };
