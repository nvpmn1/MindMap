import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side: 'left' | 'right';
  onWidthChange?: (width: number) => void;
  className?: string;
  isOpen?: boolean;
}

export function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 500,
  side,
  onWidthChange,
  className,
  isOpen = true,
}: ResizablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = panelRef.current?.offsetWidth || defaultWidth;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [defaultWidth]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      const diff = side === 'left' 
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      
      const newWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidth.current + diff)
      );

      if (panelRef.current) {
        panelRef.current.style.width = `${newWidth}px`;
      }

      onWidthChange?.(newWidth);
    },
    [side, minWidth, maxWidth, onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn('relative flex-shrink-0 bg-background border-l', className)}
      style={{ width: defaultWidth }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10',
          side === 'left' ? 'right-0' : 'left-0'
        )}
        onMouseDown={handleMouseDown}
      />
      
      {/* Content */}
      <div className="h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onSizeChange?: (size: number) => void;
  className?: string;
}

export function SplitPane({
  children,
  direction = 'horizontal',
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  onSizeChange,
  className,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSize.current = defaultSize;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction, defaultSize]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' 
        ? containerRect.width 
        : containerRect.height;
      
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const containerStart = direction === 'horizontal' 
        ? containerRect.left 
        : containerRect.top;
      
      const newSize = ((currentPos - containerStart) / containerSize) * 100;
      const clampedSize = Math.min(maxSize, Math.max(minSize, newSize));

      onSizeChange?.(clampedSize);
    },
    [direction, minSize, maxSize, onSizeChange]
  );

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full',
        direction === 'vertical' && 'flex-col',
        className
      )}
    >
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${defaultSize}%`,
        }}
        className="overflow-hidden"
      >
        {children[0]}
      </div>

      <div
        className={cn(
          'flex-shrink-0 bg-border hover:bg-primary/50 transition-colors',
          direction === 'horizontal' 
            ? 'w-1 cursor-col-resize' 
            : 'h-1 cursor-row-resize'
        )}
        onMouseDown={handleMouseDown}
      />

      <div className="flex-1 overflow-hidden">
        {children[1]}
      </div>
    </div>
  );
}
