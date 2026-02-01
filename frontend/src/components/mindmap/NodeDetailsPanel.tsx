import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Label,
  ScrollArea,
  Badge,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { EmojiPicker, ColorPicker } from '@/components/ui';
import { useNodeStore } from '@/stores';
import { X, Trash2, Clock } from 'lucide-react';
import type { TaskStatus, Priority, NodeMetadata } from '@/types';

interface NodeDetailsPanelProps {
  nodeId: string | null;
  onClose?: () => void;
}

// Local interface for node data in React Flow state
interface NodeData {
  id: string;
  title: string;
  content?: string;
  type: 'idea' | 'task' | 'note';
  color?: string;
  emoji?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: NodeMetadata;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'A fazer' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'review', label: 'Revisão' },
  { value: 'done', label: 'Concluído' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export function NodeDetailsPanel({ nodeId, onClose }: NodeDetailsPanelProps) {
  const { getNodeById, updateNode, removeNode } = useNodeStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const node = nodeId ? getNodeById(nodeId) : null;
  const nodeData = node?.data as NodeData | undefined;

  if (!node || !nodeData) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p>Selecione um nó para ver os detalhes</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<NodeData>) => {
    updateNode(nodeId!, updates);
  };

  const handleDelete = () => {
    if (nodeId) {
      removeNode(nodeId);
      onClose?.();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-2xl hover:scale-110 transition-transform"
          >
            {nodeData.emoji || '📝'}
          </button>
          <div>
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: nodeData.color, color: nodeData.color }}
            >
              {nodeData.type === 'idea'
                ? 'Ideia'
                : nodeData.type === 'task'
                ? 'Tarefa'
                : 'Nota'}
            </Badge>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute top-16 left-4 z-10 bg-popover border rounded-lg shadow-lg p-2">
          <EmojiPicker
            value={nodeData.emoji}
            onChange={(emoji) => {
              handleUpdate({ emoji });
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={nodeData.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              placeholder="Digite o título..."
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={nodeData.content || ''}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              placeholder="Adicione uma descrição..."
              autoResize
              className="min-h-[100px]"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-10 rounded-lg border flex items-center gap-2 px-3 hover:border-primary transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: nodeData.color }}
                />
                <span className="text-sm">{nodeData.color}</span>
              </button>
              {showColorPicker && (
                <div className="absolute top-12 left-0 z-10 bg-popover border rounded-lg shadow-lg p-2">
                  <ColorPicker
                    value={nodeData.color}
                    onChange={(color) => {
                      handleUpdate({ color });
                      setShowColorPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Task-specific fields */}
          {nodeData.type === 'task' && (
            <>
              <Separator />

              <div className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={nodeData.metadata?.status || 'todo'}
                    onValueChange={(value) =>
                      handleUpdate({
                        metadata: {
                          ...nodeData.metadata,
                          status: value as TaskStatus,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={nodeData.metadata?.priority || 'medium'}
                    onValueChange={(value) =>
                      handleUpdate({
                        metadata: {
                          ...nodeData.metadata,
                          priority: value as Priority,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Data de Entrega</Label>
                  <Input
                    type="date"
                    value={nodeData.metadata?.due_date || ''}
                    onChange={(e) =>
                      handleUpdate({
                        metadata: {
                          ...nodeData.metadata,
                          due_date: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground">
            {nodeData.created_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  Criado em{' '}
                  {new Date(nodeData.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            {nodeData.updated_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  Atualizado em{' '}
                  {new Date(nodeData.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Nó
        </Button>
      </div>
    </div>
  );
}
