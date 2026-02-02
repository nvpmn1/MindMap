import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Lightbulb, 
  Brain, 
  CheckSquare, 
  MessageSquare,
  Zap,
  X,
  ChevronDown,
  Loader2,
  Copy,
  ThumbsUp,
  RotateCcw,
  Wand2,
  GitBranch,
  FileText,
  Target,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiAgent, AI_AGENTS, AIMessage, AISuggestion } from '@/services/aiAgent';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface AIAgentPanelProps {
  mapId: string;
  nodes: Array<{ id: string; label: string; type: string; content?: string }>;
  selectedNode?: { id: string; label: string; type: string; content?: string } | null;
  onApplySuggestions: (suggestions: AISuggestion[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function AIAgentPanel({
  mapId,
  nodes,
  selectedNode,
  onApplySuggestions,
  onClose,
  isOpen,
}: AIAgentPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string>('chat');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [showAgents, setShowAgents] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      switch (activeAgent) {
        case 'generate': {
          const result = await aiAgent.generate(mapId, message, selectedNode?.id);
          setSuggestions(result.suggestions);
          
          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.message,
            timestamp: new Date(),
            metadata: { suggestions: result.suggestions, agentType: 'generate' },
          };
          setMessages(prev => [...prev, assistantMessage]);
          toast.success(`${result.suggestions.length} ideias geradas!`);
          break;
        }

        case 'expand': {
          if (!selectedNode) {
            toast.error('Selecione um nó para expandir');
            return;
          }
          const result = await aiAgent.expand(mapId, selectedNode);
          setSuggestions(result.suggestions);
          
          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.message,
            timestamp: new Date(),
            metadata: { suggestions: result.suggestions, agentType: 'expand' },
          };
          setMessages(prev => [...prev, assistantMessage]);
          toast.success(`${result.suggestions.length} sub-ideias geradas!`);
          break;
        }

        case 'summarize': {
          const result = await aiAgent.summarize(mapId, nodes);
          
          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `**Resumo do Mapa:**\n\n${result.summary}\n\n**Insights:**\n${result.insights.map(i => `• ${i}`).join('\n')}`,
            timestamp: new Date(),
            metadata: { agentType: 'summarize' },
          };
          setMessages(prev => [...prev, assistantMessage]);
          break;
        }

        case 'toTasks': {
          const nodesToConvert = selectedNode ? [selectedNode] : nodes;
          const result = await aiAgent.toTasks(mapId, nodesToConvert);
          setSuggestions(result.tasks);
          
          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.message,
            timestamp: new Date(),
            metadata: { suggestions: result.tasks, agentType: 'toTasks' },
          };
          setMessages(prev => [...prev, assistantMessage]);
          toast.success(`${result.tasks.length} tarefas criadas!`);
          break;
        }

        case 'analyze': {
          const result = await aiAgent.analyze(mapId, nodes);
          
          const content = `**Análise do Mapa:**\n\n` +
            `**Padrões Identificados:**\n${result.patterns.map(p => `• ${p}`).join('\n')}\n\n` +
            `**Conexões Sugeridas:**\n${result.connections.map(c => `• ${c.from} → ${c.to}: ${c.reason}`).join('\n') || '• Nenhuma conexão adicional sugerida'}\n\n` +
            `**Recomendações:**\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;

          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content,
            timestamp: new Date(),
            metadata: { agentType: 'analyze' },
          };
          setMessages(prev => [...prev, assistantMessage]);
          break;
        }

        case 'chat':
        default: {
          const assistantMessage = await aiAgent.chat(
            mapId,
            message,
            nodes.map(n => ({ id: n.id, label: n.label }))
          );
          setMessages(prev => [...prev, assistantMessage]);
          break;
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Erro ao processar com IA. Tente novamente.');
      
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, activeAgent, mapId, nodes, selectedNode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplySuggestions = () => {
    if (suggestions.length > 0) {
      onApplySuggestions(suggestions);
      setSuggestions([]);
      toast.success('Sugestões aplicadas ao mapa!');
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado!');
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'generate': return <Lightbulb className="w-4 h-4" />;
      case 'expand': return <Brain className="w-4 h-4" />;
      case 'summarize': return <FileText className="w-4 h-4" />;
      case 'toTasks': return <CheckSquare className="w-4 h-4" />;
      case 'analyze': return <Target className="w-4 h-4" />;
      case 'organize': return <Layers className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const currentAgent = AI_AGENTS.find(a => a.type === activeAgent);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-screen w-80 bg-[#0A0E18]/98 backdrop-blur-xl border-l border-cyan-500/20 flex flex-col z-50 shadow-2xl shadow-cyan-500/10"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <span className="font-semibold text-white">AI Agent</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 rounded">BETA</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Agent Selector */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowAgents(!showAgents)}
                className="w-full justify-between h-9 bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: currentAgent?.color }}>{getAgentIcon(activeAgent)}</span>
                  <span className="text-sm">{currentAgent?.name}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAgents && "rotate-180")} />
              </Button>

              <AnimatePresence>
                {showAgents && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#0D1520] border border-slate-700 rounded-lg overflow-hidden z-10 shadow-xl"
                  >
                    {AI_AGENTS.map((agent) => (
                      <button
                        key={agent.type}
                        onClick={() => {
                          setActiveAgent(agent.type);
                          setShowAgents(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-left",
                          activeAgent === agent.type && "bg-slate-800"
                        )}
                      >
                        <span style={{ color: agent.color }}>{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{agent.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{agent.description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-white font-medium mb-2">AI Agent Pronto</h3>
                <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                  {currentAgent?.description}
                </p>
                
                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Ações Rápidas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveAgent('generate');
                        setInputValue('Gere 5 ideias criativas sobre ');
                        inputRef.current?.focus();
                      }}
                      className="h-auto py-2 px-3 text-xs bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50"
                    >
                      <Lightbulb className="w-3 h-3 mr-1.5 text-yellow-400" />
                      Gerar Ideias
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveAgent('analyze');
                        handleSendMessage();
                      }}
                      className="h-auto py-2 px-3 text-xs bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50"
                    >
                      <Target className="w-3 h-3 mr-1.5 text-pink-400" />
                      Analisar Mapa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveAgent('summarize');
                        setInputValue('Resuma este mapa');
                        handleSendMessage();
                      }}
                      className="h-auto py-2 px-3 text-xs bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50"
                    >
                      <FileText className="w-3 h-3 mr-1.5 text-teal-400" />
                      Resumir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveAgent('toTasks');
                        setInputValue('Converta em tarefas');
                        handleSendMessage();
                      }}
                      className="h-auto py-2 px-3 text-xs bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50"
                    >
                      <CheckSquare className="w-3 h-3 mr-1.5 text-green-400" />
                      Para Tarefas
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "rounded-lg p-3",
                  message.role === 'user'
                    ? "bg-cyan-500/10 border border-cyan-500/20 ml-4"
                    : "bg-slate-800/50 border border-slate-700/50 mr-4"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                          Sugestões ({message.metadata.suggestions.length})
                        </p>
                        <div className="space-y-1">
                          {message.metadata.suggestions.slice(0, 5).map((s, i) => (
                            <div
                              key={s.id || i}
                              className="flex items-center gap-2 px-2 py-1.5 bg-slate-900/50 rounded text-xs"
                            >
                              <span className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px]">
                                {i + 1}
                              </span>
                              <span className="text-slate-300 truncate">{s.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyMessage(message.content)}
                      className="h-6 w-6 text-slate-500 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-500 hover:text-green-400"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-slate-500 text-sm"
              >
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>AI processando...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Apply Button */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-3 border-t border-slate-800/50 bg-cyan-500/5"
            >
              <Button
                onClick={handleApplySuggestions}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Aplicar {suggestions.length} Sugestões ao Mapa
              </Button>
            </motion.div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-800/50">
            {selectedNode && (
              <div className="mb-2 px-2 py-1.5 bg-slate-800/50 rounded-lg flex items-center gap-2">
                <GitBranch className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] text-slate-400 truncate">
                  Selecionado: <span className="text-white">{selectedNode.label}</span>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${currentAgent?.name}...`}
                className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-500/50"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
