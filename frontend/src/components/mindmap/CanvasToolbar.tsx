import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Button, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Separator } from '@/components/ui';
import { useNodeStore, createNode } from '@/stores';
import {
  Lightbulb,
  CheckSquare,
  StickyNote,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Share2,
  Sparkles,
  Trash2,
  Copy,
} from 'lucide-react';

export function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { 
    addNode, 
    selectedNodeIds, 
    removeNode, 
    duplicateNode,
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useNodeStore();

  const handleAddNode = useCallback(
    (type: 'idea' | 'task' | 'note') => {
      const node = createNode(type, { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 });
      addNode(node);
    },
    [addNode]
  );

  const handleDelete = useCallback(() => {
    selectedNodeIds.forEach((id) => removeNode(id));
  }, [selectedNodeIds, removeNode]);

  const handleDuplicate = useCallback(() => {
    selectedNodeIds.forEach((id) => duplicateNode(id));
  }, [selectedNodeIds, duplicateNode]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg p-1">
        {/* Add Nodes */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleAddNode('idea')}
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nova Ideia (I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleAddNode('task')}
                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nova Tarefa (T)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleAddNode('note')}
                className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
              >
                <StickyNote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nova Nota (N)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Edit Actions */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={undo}
                disabled={!canUndo()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer (⌘Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={redo}
                disabled={!canRedo()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer (⌘⇧Z)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Selection Actions */}
        {selectedNodeIds.length > 0 && (
          <>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDuplicate}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicar (⌘D)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir (Del)</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* View Controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => zoomIn()}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aumentar Zoom (⌘+)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => zoomOut()}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Diminuir Zoom (⌘-)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fitView({ padding: 0.2 })}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajustar à Tela (⌘1)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* AI & Share */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expandir com IA (⌘J)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Compartilhar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
