import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Spinner component
const spinnerVariants = cva('animate-spin text-muted-foreground', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

function Spinner({ size, className }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size }), className)} />;
}

// Full page loading
interface LoadingPageProps {
  message?: string;
}

function LoadingPage({ message = 'Carregando...' }: LoadingPageProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Spinner size="xl" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Loading overlay for sections
interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <Spinner size="lg" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

// Inline loading indicator
interface LoadingInlineProps {
  message?: string;
  className?: string;
}

function LoadingInline({ message = 'Carregando...', className }: LoadingInlineProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size="sm" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Skeleton components for loading states
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('animate-pulse rounded-md bg-muted', className)}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

// Skeleton for text lines
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && 'w-3/4')}
        />
      ))}
    </div>
  );
}

// Skeleton for cards
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border p-4 space-y-4', className)}>
      <Skeleton className="h-32 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Skeleton for map cards
function SkeletonMapCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      <Skeleton className="h-32 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex -space-x-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for task cards
function SkeletonTaskCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-l-4 border-l-muted p-3 space-y-2', className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for sidebar
function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn('w-64 border-r p-4 space-y-4', className)}>
      <Skeleton className="h-8 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

// Skeleton for list view
function SkeletonListView({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for kanban board
function SkeletonKanban({ columns = 4, cardsPerColumn = 3 }: { columns?: number; cardsPerColumn?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div key={colIdx} className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          {Array.from({ length: cardsPerColumn }).map((_, cardIdx) => (
            <SkeletonTaskCard key={cardIdx} />
          ))}
        </div>
      ))}
    </div>
  );
}

export {
  Spinner,
  LoadingPage,
  LoadingOverlay,
  LoadingInline,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonMapCard,
  SkeletonTaskCard,
  SkeletonSidebar,
  SkeletonListView,
  SkeletonKanban,
};
