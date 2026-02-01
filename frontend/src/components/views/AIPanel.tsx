import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input, ScrollArea, Avatar, AvatarFallback, LoadingDots } from '@/components/ui';
import { useAI } from '@/hooks';
import { useNodeStore, useAuthStore } from '@/stores';
import {
  Send,
  Sparkles,
  Lightbulb,
  ListTodo,
  FileText,
  Link2,
  Copy,
  Check,
  Bot,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

// Local interface for node data in React Flow
interface NodeData {
  id: string;
  title?: string;
  content?: string;
  type?: string;
  emoji?: string;
  color?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAction {
  id: string;
  icon: typeof Sparkles;
  label: string;
  description: string;
  action: () => void;
}

interface AIPanelProps {
  className?: string;
  mapId: string;
}

export function AIPanel({ className, mapId }: AIPanelProps) {
  const { user } = useAuthStore();
  const { focusedNodeId, getNodeById } = useNodeStore();
  const { sendMessage, expandNode, generateTasks, summarizeMap, suggestConnections, isLoading } = useAI(mapId);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente de IA. Posso ajudar a expandir ideias, gerar tarefas, resumir conteúdos e muito mais. Como posso ajudar?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const focusedNode = focusedNodeId ? getNodeById(focusedNodeId) : null;
  const focusedNodeData = focusedNode?.data as NodeData | undefined;

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendMessage(input, focusedNodeId || undefined);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response?.response || 'Desculpe, não consegui processar sua solicitação.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickActions: AIAction[] = [
    {
      id: 'expand',
      icon: Lightbulb,
      label: 'Expandir Ideia',
      description: focusedNodeData
        ? `Expandir "${focusedNodeData.title}"`
        : 'Selecione um nó primeiro',
      action: async () => {
        if (!focusedNodeId || !focusedNodeData) return;
        
        const result = await expandNode(focusedNodeId, { style: 'brainstorm' });
        if (result) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `**Ideias para expandir "${focusedNodeData.title}":**\n\n${result.reasoning || ''}\n${result.suggestions?.map(s => `- ${s.title}: ${s.description}`).join('\n') || ''}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      },
    },
    {
      id: 'tasks',
      icon: ListTodo,
      label: 'Gerar Tarefas',
      description: 'Criar tarefas a partir do mapa',
      action: async () => {
        if (!focusedNodeId) return;
        const result = await generateTasks(focusedNodeId);
        if (result) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `**Tarefas sugeridas:**\n\n${result.tasks?.map(t => `- ${t.title}: ${t.description}`).join('\n') || ''}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      },
    },
    {
      id: 'summarize',
      icon: FileText,
      label: 'Resumir Mapa',
      description: 'Gerar resumo do conteúdo',
      action: async () => {
        const result = await summarizeMap();
        if (result) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `**Resumo do mapa:**\n\n${result.summary || ''}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      },
    },
    {
      id: 'connections',
      icon: Link2,
      label: 'Sugerir Conexões',
      description: 'Encontrar relações entre nós',
      action: async () => {
        const result = await suggestConnections();
        if (result) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `**Conexões sugeridas:**\n\n${result.connections?.map(c => `- ${c.title}: ${c.description}`).join('\n') || ''}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      },
    },
  ];

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente IA</h3>
            <p className="text-xs text-muted-foreground">Powered by Claude</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isDisabled = action.id === 'expand' && !focusedNodeData;
            
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                disabled={isDisabled || isLoading}
                onClick={action.action}
                className="flex-shrink-0 gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <Avatar size="sm" className="flex-shrink-0">
                {message.role === 'user' ? (
                  <>
                    <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Message Bubble */}
              <div
                className={cn(
                  'group relative max-w-[80%] rounded-2xl px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                
                {/* Copy button for assistant messages */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  >
                    {copiedId === message.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <LoadingDots />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo ou peça uma sugestão..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <LoadingDots />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Context indicator */}
        {focusedNodeData && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Contexto:</span>
            <span className="px-2 py-0.5 bg-muted rounded">
              {focusedNodeData.emoji} {focusedNodeData.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
