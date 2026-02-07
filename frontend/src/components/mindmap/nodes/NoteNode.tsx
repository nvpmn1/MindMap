import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  MoreHorizontal, 
  Trash2,
  Copy,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Note Node data interface
export interface NoteNodeData {
  type: 'note';
  label: string;
  content: string;
  color?: string;
  isExpanded?: boolean;
}

const noteColors = [
  { name: 'Amarelo', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700' },
  { name: 'Verde', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700' },
  { name: 'Azul', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700' },
  { name: 'Rosa', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700' },
  { name: 'Roxo', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700' },
];

const NoteNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const data = props.data as unknown as NoteNodeData;
  const { setNodes, getNode, addNodes } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editLabel, setEditLabel] = React.useState(data.label);
  const [editContent, setEditContent] = React.useState(data.content);
  const [isExpanded, setIsExpanded] = React.useState(data.isExpanded ?? false);
  const labelRef = React.useRef<HTMLInputElement>(null);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const colorIndex = data.color ? parseInt(data.color) % noteColors.length : 0;
  const noteColor = noteColors[colorIndex];

  React.useEffect(() => {
    if (isEditing && labelRef.current) {
      labelRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editLabel.trim() !== data.label || editContent !== data.content) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  label: editLabel.trim() || 'Nota',
                  content: editContent,
                } 
              }
            : node
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditLabel(data.label);
      setEditContent(data.content);
      setIsEditing(false);
    }
    // Allow Enter in textarea, but Ctrl+Enter to save
    if (e.key === 'Enter' && e.ctrlKey) {
      handleBlur();
    }
  };

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  const handleDuplicate = () => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    addNodes([{
      id: `node-${Date.now()}`,
      type: 'note',
      position: {
        x: parentNode.position.x + 50,
        y: parentNode.position.y + 50,
      },
      data: { ...data, label: `${data.label} (cópia)` },
    }]);
  };

  const handleColorChange = (index: number) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, color: index.toString() } }
          : node
      )
    );
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, isExpanded: !isExpanded } }
          : node
      )
    );
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border shadow-sm transition-all',
        noteColor.bg,
        noteColor.border,
        selected && 'ring-2 ring-ring ring-offset-2',
        isExpanded ? 'w-80' : 'w-48',
        'hover:shadow-md'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-inherit">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          {isEditing ? (
            <input
              ref={labelRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-xs font-medium w-full"
              placeholder="Título da nota"
            />
          ) : (
            <span className="text-xs font-medium truncate">{data.label}</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleExpand}
            className="p-1 rounded hover:bg-black/10 transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-black/10 transition-colors">
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium mb-1.5">Cor</p>
                <div className="flex gap-1">
                  {noteColors.map((color, index) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(index)}
                      className={cn(
                        'w-5 h-5 rounded',
                        color.bg,
                        color.border,
                        'border',
                        colorIndex === index && 'ring-2 ring-ring'
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {isEditing ? (
          <textarea
            ref={contentRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={isExpanded ? 6 : 3}
            className={cn(
              'w-full bg-transparent border-none outline-none text-xs resize-none',
              'placeholder:text-muted-foreground'
            )}
            placeholder="Escreva sua nota aqui... (Ctrl+Enter para salvar)"
          />
        ) : (
          <p className={cn(
            'text-xs whitespace-pre-wrap',
            isExpanded ? '' : 'line-clamp-3'
          )}>
            {data.content || 'Clique duas vezes para editar...'}
          </p>
        )}
      </div>

      {/* Fold indicator */}
      <div className="absolute bottom-0 right-0 w-4 h-4 overflow-hidden">
        <div 
          className={cn(
            'absolute -bottom-2 -right-2 w-5 h-5 rotate-45',
            'bg-background/50'
          )}
        />
      </div>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';

export { NoteNode };
export default NoteNode;
