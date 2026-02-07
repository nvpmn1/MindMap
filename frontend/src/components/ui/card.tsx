import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'interactive' | 'selected';
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      variant === 'interactive' && 'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
      variant === 'selected' && 'ring-2 ring-primary border-primary',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Map Card - específico para exibir mapas na listagem
interface MapCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  thumbnail?: string;
  nodeCount?: number;
  lastModified?: Date;
  collaborators?: Array<{ id: string; name: string; avatar_url?: string }>;
  isSelected?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const MapCard = React.forwardRef<HTMLDivElement, MapCardProps>(
  ({ 
    className, 
    title, 
    description, 
    thumbnail, 
    nodeCount = 0,
    lastModified,
    collaborators = [],
    isSelected = false,
    onClick,
    ...props 
  }, ref) => {
    const formatDate = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Agora mesmo';
      if (minutes < 60) return `${minutes}min atrás`;
      if (hours < 24) return `${hours}h atrás`;
      if (days < 7) return `${days}d atrás`;
      return date.toLocaleDateString('pt-BR');
    };

    return (
      <Card
        ref={ref}
        variant={isSelected ? 'selected' : 'interactive'}
        className={cn('group overflow-hidden', className)}
        onClick={onClick}
        {...props}
      >
        {/* Thumbnail */}
        <div className="relative h-32 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg
                className="w-12 h-12 text-muted-foreground/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 bg-white/90 rounded-md text-sm font-medium text-gray-900">
              Abrir
            </span>
          </div>
        </div>
        
        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-base truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          )}
          
          {/* Meta info */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {nodeCount} nós
              </span>
              {lastModified && (
                <span>{formatDate(lastModified)}</span>
              )}
            </div>
            
            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex -space-x-1">
                {collaborators.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="w-5 h-5 rounded-full bg-primary/20 ring-2 ring-card flex items-center justify-center text-[10px] font-medium"
                    title={user.name}
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full" />
                    ) : (
                      user.name[0].toUpperCase()
                    )}
                  </div>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-muted ring-2 ring-card flex items-center justify-center text-[10px]">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
MapCard.displayName = 'MapCard';

// Task Card - para Kanban
interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignee?: { id: string; name: string; avatar_url?: string };
  tags?: string[];
  isDragging?: boolean;
}

const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ 
    className, 
    title, 
    description, 
    priority = 'medium',
    dueDate,
    assignee,
    tags = [],
    isDragging = false,
    ...props 
  }, ref) => {
    const priorityColors = {
      low: 'border-l-slate-400',
      medium: 'border-l-blue-500',
      high: 'border-l-orange-500',
      urgent: 'border-l-red-500',
    };

    const isOverdue = dueDate && new Date() > dueDate;

    return (
      <Card
        ref={ref}
        variant="interactive"
        className={cn(
          'border-l-4 transition-all',
          priorityColors[priority],
          isDragging && 'rotate-2 shadow-lg scale-105',
          className
        )}
        {...props}
      >
        <CardContent className="p-3">
          <h4 className="font-medium text-sm">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          )}
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            {dueDate && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                isOverdue ? 'text-red-500' : 'text-muted-foreground'
              )}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            )}
            
            {assignee && (
              <div
                className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium"
                title={assignee.name}
              >
                {assignee.avatar_url ? (
                  <img src={assignee.avatar_url} alt={assignee.name} className="w-full h-full rounded-full" />
                ) : (
                  assignee.name[0].toUpperCase()
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
TaskCard.displayName = 'TaskCard';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  TaskCard,
};
