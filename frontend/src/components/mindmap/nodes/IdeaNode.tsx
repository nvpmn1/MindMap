import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface IdeaNodeData {
  id: string;
  title: string;
  content?: string;
  color?: string;
  emoji?: string;
  [key: string]: unknown;
}

interface IdeaNodeProps {
  data: IdeaNodeData;
  selected?: boolean;
}

export const IdeaNode = memo(({ data, selected }: IdeaNodeProps) => {
  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-xl shadow-md border-2 transition-all duration-200 min-w-[150px] max-w-[300px]',
        'bg-background hover:shadow-lg',
        selected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-transparent hover:border-primary/50'
      )}
      style={{
        backgroundColor: data.color ? `${data.color}10` : undefined,
        borderColor: selected ? data.color : 'transparent',
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Emoji */}
        {data.emoji && (
          <span className="text-2xl flex-shrink-0">{data.emoji}</span>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className="font-semibold text-sm leading-tight break-words"
            style={{ color: data.color }}
          >
            {data.title}
          </h3>

          {/* Content Preview */}
          {data.content && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.content}
            </p>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Selection Indicator */}
      {selected && (
        <div
          className="absolute -inset-1 rounded-xl border-2 pointer-events-none animate-pulse"
          style={{ borderColor: data.color || 'var(--primary)' }}
        />
      )}
    </div>
  );
});

IdeaNode.displayName = 'IdeaNode';
