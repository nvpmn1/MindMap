import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

interface LoadingOverlayProps {
  show?: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  show = true,
  message,
  className,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
    </span>
  );
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular';
}

export function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'default' && 'rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-none',
        className
      )}
      {...props}
    />
  );
}
