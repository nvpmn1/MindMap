import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { StickyNote } from 'lucide-react';

export interface NoteNodeData {
  id: string;
  title?: string;
  content?: string;
  color?: string;
  emoji?: string;
  [key: string]: unknown;
}

interface NoteNodeProps {
  data: NoteNodeData;
  selected?: boolean;
}

export const NoteNode = memo(({ data, selected }: NoteNodeProps) => {
  const noteColor = data.color || '#f59e0b';

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-lg shadow-md transition-all duration-200 min-w-[150px] max-w-[280px]',
        'hover:shadow-lg transform hover:-rotate-1',
        selected && 'ring-2 ring-primary/50'
      )}
      style={{
        backgroundColor: `${noteColor}20`,
        borderLeft: `4px solid ${noteColor}`,
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-background"
        style={{ backgroundColor: noteColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <StickyNote className="h-4 w-4" style={{ color: noteColor }} />
        <span className="text-xs font-medium" style={{ color: noteColor }}>
          Nota
        </span>
      </div>

      {/* Content */}
      <div className="flex items-start gap-2">
        {/* Emoji */}
        {data.emoji && (
          <span className="text-lg flex-shrink-0">{data.emoji}</span>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          {data.title && (
            <h3
              className="font-medium text-sm leading-tight break-words mb-1"
              style={{ color: noteColor }}
            >
              {data.title}
            </h3>
          )}

          {/* Content */}
          {data.content && (
            <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
              {data.content}
            </p>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-background"
        style={{ backgroundColor: noteColor }}
      />

      {/* Decorative fold corner */}
      <div
        className="absolute top-0 right-0 w-4 h-4"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${noteColor}40 50%)`,
        }}
      />

      {/* Selection Indicator */}
      {selected && (
        <div
          className="absolute -inset-1 rounded-lg border-2 pointer-events-none animate-pulse"
          style={{ borderColor: noteColor }}
        />
      )}
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
