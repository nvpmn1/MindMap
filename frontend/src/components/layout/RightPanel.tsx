import React from 'react';
import { cn } from '@/lib/utils';
import { Button, SimpleTooltip } from '@/components/ui';
import { X, Sparkles, Send, Loader2, Brain, Lightbulb, ListTodo, FileText, Link2 } from 'lucide-react';
import { aiAgentService } from '@/services/aiAgent';

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function RightPanel({ open, onClose, title = 'Painel', children }: RightPanelProps) {
  if (!open) return null;

  return (
    <aside
      className={cn(
        'fixed right-0 top-16 bottom-0 z-30 w-80 border-l bg-background shadow-lg',
        'animate-in slide-in-from-right duration-300'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </aside>
  );
}

// AI Chat Panel - specific panel for AI chat
interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatPanel({ open, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente de IA. Posso ajudar você a organizar ideias, expandir conceitos, criar tarefas e muito mais. Como posso ajudar?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Use the AI agent service for intelligent responses
      const response = await aiAgentService.chat(userInput, messages);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: '💡 Expandir ideia', prompt: 'Expanda essa ideia com mais detalhes e sub-tópicos:', icon: <Lightbulb className="w-3 h-3" /> },
    { label: '📋 Criar tarefas', prompt: 'Crie tarefas acionáveis a partir de:', icon: <ListTodo className="w-3 h-3" /> },
    { label: '📝 Resumir', prompt: 'Faça um resumo conciso de:', icon: <FileText className="w-3 h-3" /> },
    { label: '🔗 Conectar', prompt: 'Encontre conexões entre esses conceitos:', icon: <Link2 className="w-3 h-3" /> },
    { label: '🧠 Analisar', prompt: 'Faça uma análise profunda de:', icon: <Brain className="w-3 h-3" /> },
  ];

  if (!open) return null;

  return (
    <aside
      className={cn(
        'fixed right-0 top-16 bottom-0 z-30 w-96 border-l bg-background shadow-lg',
        'animate-in slide-in-from-right duration-300'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">Assistente IA</h3>
              <p className="text-xs text-muted-foreground">Powered by Claude</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="border-t px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.prompt + ' ')}
                className="rounded-full bg-muted px-2 py-1 text-xs hover:bg-muted/80 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </aside>
  );
}

// Node Details Panel
interface NodeDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  node?: {
    id: string;
    label: string;
    type: string;
    content?: string;
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
  onSave?: (data: { label: string; content: string; color: string }) => void;
}

export function NodeDetailsPanel({ open, onClose, node, onSave }: NodeDetailsPanelProps) {
  const [label, setLabel] = React.useState(node?.label || '');
  const [content, setContent] = React.useState(node?.content || '');
  const [color, setColor] = React.useState(node?.color || '#3b82f6');

  React.useEffect(() => {
    if (node) {
      setLabel(node.label);
      setContent(node.content || '');
      setColor(node.color || '#3b82f6');
    }
  }, [node]);

  const handleSave = () => {
    onSave?.({ label, content, color });
  };

  if (!open || !node) return null;

  return (
    <RightPanel open={open} onClose={onClose} title="Detalhes do Nó">
      <div className="p-4 space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cor</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 rounded border-0 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 rounded-md border px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
          <p>Tipo: {node.type}</p>
          {node.createdAt && (
            <p>Criado em: {node.createdAt.toLocaleDateString('pt-BR')}</p>
          )}
          {node.updatedAt && (
            <p>Atualizado em: {node.updatedAt.toLocaleDateString('pt-BR')}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </RightPanel>
  );
}

export default RightPanel;
