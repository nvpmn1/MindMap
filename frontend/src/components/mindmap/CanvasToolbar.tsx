import React from 'react';
import { cn } from '@/lib/utils';
import { Button, SimpleTooltip, KeyboardTooltip } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Lightbulb,
  CheckSquare,
  StickyNote,
  Link as LinkIcon,
  Image,
  Plus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Lock,
  Unlock,
  Download,
  Upload,
  Trash2,
  Copy,
  Sparkles,
  Layout,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
} from 'lucide-react';

interface CanvasToolbarProps {
  onAddNode: (type: 'idea' | 'task' | 'note') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
  onToggleLock: () => void;
  isLocked: boolean;
  onExport: () => void;
  onImport: () => void;
  onAutoLayout: (direction: 'horizontal' | 'vertical') => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  hasSelection: boolean;
  onAIExpand?: () => void;
  className?: string;
}

export function CanvasToolbar({
  onAddNode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleGrid,
  showGrid,
  onToggleLock,
  isLocked,
  onExport,
  onImport,
  onAutoLayout,
  onDeleteSelected,
  onDuplicateSelected,
  hasSelection,
  onAIExpand,
  className,
}: CanvasToolbarProps) {
  return (
    <div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-10',
        'flex items-center gap-1 p-1.5 rounded-lg',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'border shadow-lg',
        className
      )}
    >
      {/* Add Node Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onAddNode('idea')}>
            <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
            Ideia
            <span className="ml-auto text-xs text-muted-foreground">I</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('task')}>
            <CheckSquare className="mr-2 h-4 w-4 text-blue-500" />
            Tarefa
            <span className="ml-auto text-xs text-muted-foreground">T</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('note')}>
            <StickyNote className="mr-2 h-4 w-4 text-green-500" />
            Nota
            <span className="ml-auto text-xs text-muted-foreground">N</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <LinkIcon className="mr-2 h-4 w-4" />
            Link (em breve)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Image className="mr-2 h-4 w-4" />
            Imagem (em breve)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Undo/Redo */}
      <KeyboardTooltip label="Desfazer" shortcut="Ctrl+Z">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      </KeyboardTooltip>

      <KeyboardTooltip label="Refazer" shortcut="Ctrl+Y">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </KeyboardTooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Selection Actions */}
      {hasSelection && (
        <>
          <KeyboardTooltip label="Duplicar" shortcut="Ctrl+D">
            <Button
              variant="ghost"
              size="icon"
              onClick={onDuplicateSelected}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </KeyboardTooltip>

          <KeyboardTooltip label="Excluir" shortcut="Del">
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteSelected}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </KeyboardTooltip>

          {onAIExpand && (
            <SimpleTooltip content="Expandir com IA">
              <Button
                variant="ghost"
                size="icon"
                onClick={onAIExpand}
                className="text-primary"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </SimpleTooltip>
          )}

          <div className="w-px h-6 bg-border mx-1" />
        </>
      )}

      {/* Zoom Controls */}
      <KeyboardTooltip label="Diminuir zoom" shortcut="Ctrl+-">
        <Button variant="ghost" size="icon" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
      </KeyboardTooltip>

      <KeyboardTooltip label="Aumentar zoom" shortcut="Ctrl++">
        <Button variant="ghost" size="icon" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </KeyboardTooltip>

      <KeyboardTooltip label="Ajustar à tela" shortcut="Ctrl+0">
        <Button variant="ghost" size="icon" onClick={onFitView}>
          <Maximize className="h-4 w-4" />
        </Button>
      </KeyboardTooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {/* View Options */}
      <SimpleTooltip content={showGrid ? 'Ocultar grade' : 'Mostrar grade'}>
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onToggleGrid}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content={isLocked ? 'Desbloquear edição' : 'Bloquear edição'}>
        <Button
          variant={isLocked ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onToggleLock}
        >
          {isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </Button>
      </SimpleTooltip>

      {/* Auto Layout */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Layout className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAutoLayout('horizontal')}>
            <AlignHorizontalJustifyCenter className="mr-2 h-4 w-4" />
            Layout Horizontal
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAutoLayout('vertical')}>
            <AlignVerticalJustifyCenter className="mr-2 h-4 w-4" />
            Layout Vertical
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Export/Import */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            Importar JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Mini toolbar for quick actions (appears near selected node)
interface MiniToolbarProps {
  position: { x: number; y: number };
  onAddChild: () => void;
  onExpand: () => void;
  onDelete: () => void;
}

export function MiniToolbar({ position, onAddChild, onExpand, onDelete }: MiniToolbarProps) {
  return (
    <div
      className="absolute z-20 flex items-center gap-1 p-1 rounded-lg bg-background border shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <SimpleTooltip content="Adicionar filho">
        <button
          onClick={onAddChild}
          className="p-1.5 rounded hover:bg-accent transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </SimpleTooltip>
      <SimpleTooltip content="Expandir com IA">
        <button
          onClick={onExpand}
          className="p-1.5 rounded hover:bg-accent transition-colors"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </button>
      </SimpleTooltip>
      <SimpleTooltip content="Excluir">
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-accent transition-colors text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </SimpleTooltip>
    </div>
  );
}

export default CanvasToolbar;
