// ============================================================================
// NeuralMap - AI Agent Panel (Agent Mode Interface)
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, X, Bot, Zap, Search, BarChart3,
  Lightbulb, CheckSquare, HelpCircle, Maximize2, Minimize2,
  Trash2, Settings, ChevronDown, Copy, Play, Loader2,
  Target, Eye, BookOpen, GitBranch, RefreshCw, Wand2,
  type LucideIcon
} from 'lucide-react';
import { neuralAgent } from './NeuralAgent';
import type { AIAgentMode, AIAgentAction, AIAgentMessage, PowerNode, PowerEdge, NeuralNodeType } from '../editor/types';

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: PowerNode[];
  edges: PowerEdge[];
  selectedNodeId: string | null;
  onApplyActions: (actions: AIAgentAction[]) => void;
  pendingPrompt?: string;
  onPendingPromptConsumed?: () => void;
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
  mode: AIAgentMode;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'analyze', label: 'Analisar Mapa', icon: Eye, prompt: 'Analise completamente meu mapa mental', mode: 'analytical', color: 'text-cyan-400' },
  { id: 'ideas', label: 'Gerar Ideias', icon: Lightbulb, prompt: 'Gere ideias criativas e inovadoras para expandir', mode: 'creative', color: 'text-amber-400' },
  { id: 'tasks', label: 'Criar Tarefas', icon: CheckSquare, prompt: 'Crie um plano de ação com tarefas detalhadas', mode: 'agent', color: 'text-emerald-400' },
  { id: 'research', label: 'Pesquisar', icon: Search, prompt: 'Pesquise aprofundadamente sobre o tema selecionado', mode: 'research', color: 'text-violet-400' },
  { id: 'chart', label: 'Gerar Gráficos', icon: BarChart3, prompt: 'Gere gráficos e visualizações dos dados do mapa', mode: 'analytical', color: 'text-pink-400' },
  { id: 'hypothesis', label: 'Hipóteses', icon: HelpCircle, prompt: 'Formule hipóteses e cenários possíveis', mode: 'research', color: 'text-yellow-400' },
  { id: 'expand', label: 'Expandir', icon: GitBranch, prompt: 'Expanda e aprofunde o tópico selecionado', mode: 'agent', color: 'text-blue-400' },
  { id: 'organize', label: 'Organizar', icon: RefreshCw, prompt: 'Organize e reestruture o mapa', mode: 'agent', color: 'text-indigo-400' },
];

// ─── Mode Config ────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<AIAgentMode, { label: string; icon: LucideIcon; color: string; desc: string }> = {
  agent: { label: 'Agent Mode', icon: Zap, color: 'text-cyan-400', desc: 'Executa ações diretamente no mapa' },
  assistant: { label: 'Assistente', icon: Bot, color: 'text-blue-400', desc: 'Responde perguntas e sugere' },
  research: { label: 'Pesquisa', icon: BookOpen, color: 'text-violet-400', desc: 'Análise profunda e hipóteses' },
  creative: { label: 'Criativo', icon: Sparkles, color: 'text-amber-400', desc: 'Ideação e brainstorming' },
  analytical: { label: 'Analítico', icon: Target, color: 'text-emerald-400', desc: 'Dados, gráficos e métricas' },
};

// ─── Component ──────────────────────────────────────────────────────────────

export const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen, onClose, nodes, edges, selectedNodeId, onApplyActions,
  pendingPrompt, onPendingPromptConsumed
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AIAgentMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<AIAgentAction[]>([]);
  const [mode, setMode] = useState<AIAgentMode>('agent');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Auto-send pending prompt from AI quick actions
  useEffect(() => {
    if (pendingPrompt && isOpen && !isProcessing) {
      handleSend(pendingPrompt);
      onPendingPromptConsumed?.();
    }
  }, [pendingPrompt, isOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isProcessing) return;

    setInput('');
    setIsProcessing(true);
    setShowQuickActions(false);
    neuralAgent.setMode(mode);

    // Add user message
    const userMsg: AIAgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: msgText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await neuralAgent.processMessage(msgText, nodes, edges, selectedNodeId);

      // Add agent response
      const agentMsg: AIAgentMessage = {
        id: `agent_${Date.now()}`,
        role: 'agent',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: {
          mode,
          actions: result.actions,
          reasoning: result.thinking,
          confidence: result.confidence,
        },
      };
      setMessages(prev => [...prev, agentMsg]);

      if (result.actions.length > 0) {
        setPendingActions(result.actions);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'system',
        content: '❌ Erro ao processar. Tente novamente.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, mode, nodes, edges, selectedNodeId]);

  const handleApply = useCallback(() => {
    if (pendingActions.length === 0) return;
    onApplyActions(pendingActions);
    setPendingActions([]);
    
    setMessages(prev => [...prev, {
      id: `system_${Date.now()}`,
      role: 'system',
      content: `✅ ${pendingActions.length} ações aplicadas ao mapa com sucesso!`,
      timestamp: new Date().toISOString(),
    }]);
  }, [pendingActions, onApplyActions]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setMode(action.mode);
    neuralAgent.setMode(action.mode);
    handleSend(action.prompt);
  }, [handleSend]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
    neuralAgent.clearHistory();
    setShowQuickActions(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const panelWidth = isExpanded ? 'w-[560px]' : 'w-[400px]';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed right-0 top-14 h-[calc(100%-3.5rem)] ${panelWidth} z-50 flex flex-col
            bg-[#0a0f1a]/95 backdrop-blur-xl border-l border-cyan-500/20
            shadow-[-8px_0_32px_rgba(6,182,212,0.08)]`}
        >
          {/* ─── Header ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 
                  flex items-center justify-center border border-cyan-500/30">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full 
                  border-2 border-[#0a0f1a] animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">NeuralAgent</h3>
                <p className="text-[10px] text-slate-500">Claude Haiku 4.5 • Agent Mode</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Mode Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                    bg-white/5 border border-white/10 hover:bg-white/10 transition-all
                    ${MODE_CONFIG[mode].color}`}
                >
                  {React.createElement(MODE_CONFIG[mode].icon, { className: 'w-3.5 h-3.5' })}
                  <span className="hidden sm:inline">{MODE_CONFIG[mode].label}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {showModeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-[#111827] border border-white/10 
                      rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {(Object.entries(MODE_CONFIG) as [AIAgentMode, typeof MODE_CONFIG[AIAgentMode]][]).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => { setMode(key); neuralAgent.setMode(key); setShowModeSelector(false); }}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-white/5 
                          transition-all ${mode === key ? 'bg-white/10' : ''}`}
                      >
                        {React.createElement(config.icon, { className: `w-4 h-4 ${config.color}` })}
                        <div>
                          <div className={`text-xs font-medium ${config.color}`}>{config.label}</div>
                          <div className="text-[10px] text-slate-500">{config.desc}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <button onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Context Bar ─────────────────────────────────────────── */}
          {selectedNodeId && (
            <div className="px-4 py-2 bg-cyan-500/5 border-b border-cyan-500/10">
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Target className="w-3.5 h-3.5" />
                <span className="font-medium">Contexto:</span>
                <span className="text-cyan-300 truncate">
                  {nodes.find(n => n.id === selectedNodeId)?.data.label || 'Nó selecionado'}
                </span>
              </div>
            </div>
          )}

          {/* ─── Messages ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin 
            scrollbar-thumb-white/10 scrollbar-track-transparent">
            
            {/* Quick Actions (show when no messages) */}
            {showQuickActions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10
                    border border-cyan-500/20 flex items-center justify-center mb-3">
                    <Wand2 className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">Agent Mode Ativo</h4>
                  <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                    Eu executo ações diretamente no seu mapa. Peça qualquer coisa ou use as ações rápidas abaixo.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                        bg-white/[0.03] border border-white/[0.06] 
                        hover:bg-white/[0.06] hover:border-white/[0.12]
                        transition-all group text-left"
                    >
                      {React.createElement(action.icon, { className: `w-4 h-4 ${action.color} group-hover:scale-110 transition-transform` })}
                      <span className="text-xs text-slate-300 group-hover:text-white">{action.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-600">
                    💡 Dica: Selecione um nó para dar contexto ao agente
                  </p>
                </div>
              </motion.div>
            )}

            {/* Message List */}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cyan-500/5 rounded-xl border border-cyan-500/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    {pendingActions.length} ações prontas para execução
                  </div>
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30
                      transition-all hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  >
                    <Play className="w-3 h-3" />
                    Aplicar Tudo
                  </button>
                </div>
                
                <div className="space-y-1">
                  {pendingActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                      bg-white/[0.02] text-[11px] text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="truncate">{action.description}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02]"
              >
                <div className="relative">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <div className="absolute inset-0 w-5 h-5 rounded-full bg-cyan-400/20 animate-ping" />
                </div>
                <div>
                  <div className="text-xs text-cyan-400 font-medium">Processando...</div>
                  <div className="text-[10px] text-slate-500">
                    {mode === 'agent' ? 'Planejando e executando ações' :
                     mode === 'research' ? 'Pesquisando e analisando' :
                     mode === 'creative' ? 'Gerando ideias criativas' :
                     mode === 'analytical' ? 'Analisando dados' : 'Pensando...'}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Input ───────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-t border-white/5">
            <div className="flex items-end gap-2 bg-white/[0.03] rounded-xl border border-white/[0.08] 
              focus-within:border-cyan-500/30 transition-all p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'agent' 
                  ? "Diga o que deseja fazer no mapa..." 
                  : mode === 'research' 
                  ? "O que deseja pesquisar?" 
                  : "Digite sua mensagem..."}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 
                  resize-none outline-none min-h-[36px] max-h-[120px] py-1.5 px-2"
                style={{ height: 'auto', overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isProcessing}
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                  bg-gradient-to-br from-cyan-500 to-blue-600 text-white
                  hover:from-cyan-400 hover:to-blue-500
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all shadow-lg shadow-cyan-500/20
                  hover:shadow-cyan-500/40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-slate-600">
                Enter para enviar • Shift+Enter para quebra de linha
              </span>
              <span className="text-[10px] text-slate-600">
                Claude Haiku 4.5
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Message Bubble ─────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: AIAgentMessage }> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-xs text-slate-500 py-1">
        {message.content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[90%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Agent header */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20 
              flex items-center justify-center">
              <Brain className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">NeuralAgent</span>
            {message.metadata?.confidence && (
              <span className="text-[10px] text-slate-600">
                {Math.round(message.metadata.confidence * 100)}% confiança
              </span>
            )}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser 
            ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20 rounded-br-md' 
            : 'bg-white/[0.03] text-slate-200 border border-white/[0.06] rounded-bl-md'}`}
        >
          {/* Render markdown-like content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <div key={i} className="font-semibold text-white">{line.replace(/\*\*/g, '')}</div>;
              }
              if (line.startsWith('###')) {
                return <div key={i} className="font-bold text-white mt-2">{line.replace(/###\s?/g, '')}</div>;
              }
              if (line.startsWith('- ') || line.startsWith('• ')) {
                return <div key={i} className="ml-2 text-slate-300">{line}</div>;
              }
              if (line.match(/^\d+\./)) {
                return <div key={i} className="ml-2 text-slate-300">{line}</div>;
              }
              return <div key={i}>{line || <br />}</div>;
            })}
          </div>
        </div>

        {/* Reasoning toggle */}
        {!isUser && message.metadata?.reasoning && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 px-2 py-1 text-[10px] text-slate-500 
              hover:text-slate-300 transition-colors"
          >
            <Eye className="w-3 h-3" />
            {expanded ? 'Ocultar raciocínio' : 'Ver raciocínio'}
          </button>
        )}
        
        {expanded && message.metadata?.reasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-1 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]
              text-[11px] text-slate-500 italic"
          >
            💭 {message.metadata.reasoning}
          </motion.div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] text-slate-600 mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

export default AgentPanel;
