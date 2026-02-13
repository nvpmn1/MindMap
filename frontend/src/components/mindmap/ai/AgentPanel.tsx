// ============================================================================
// NeuralMap - AI Agent Panel v3 (Complete Redesign)
// Real-time streaming UI with TODO list, thinking, and step-by-step progress
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Send,
  Sparkles,
  X,
  Bot,
  Zap,
  Search,
  BarChart3,
  Lightbulb,
  CheckSquare,
  HelpCircle,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronDown,
  Play,
  Loader2,
  Target,
  Eye,
  BookOpen,
  GitBranch,
  RefreshCw,
  Wand2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Cpu,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { neuralAgent } from './NeuralAgent';
import type { AgentTodoItem, StreamCallbacks } from './NeuralAgent';
import type {
  AIAgentMode,
  AIAgentAction,
  AIAgentMessage,
  PowerNode,
  PowerEdge,
  NeuralNodeData,
  NeuralNodeType,
} from '../editor/types';
import type { ExecutionContext } from './ActionExecutor';

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string | null;
  nodes: PowerNode[];
  edges: PowerEdge[];
  selectedNodeId: string | null;
  onApplyActions: (actions: AIAgentAction[]) => void;
  pendingPrompt?: string;
  onPendingPromptConsumed?: () => void;
  // Node operation functions for ExecutionContext (Agent Mode direct execution)
  createNode?: (
    type: NeuralNodeType,
    position?: { x: number; y: number },
    parentId?: string | null,
    data?: Partial<NeuralNodeData>
  ) => PowerNode;
  updateNodeData?: (nodeId: string, data: Partial<NeuralNodeData>) => void;
  deleteNode?: (nodeId: string) => void;
  setEdges?: React.Dispatch<React.SetStateAction<PowerEdge[]>>;
  // Save callback to persist changes after AI actions
  onSave?: () => void | Promise<void>;
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
  mode: AIAgentMode;
  color: string;
  requiresExecution?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  // Core Agents
  {
    id: 'generate',
    label: 'Gerar Ideias',
    icon: Lightbulb,
    prompt: 'Gere ideias criativas e inovadoras para expandir meu mapa mental',
    mode: 'agent',
    color: 'text-amber-400',
    requiresExecution: true,
  },
  {
    id: 'expand',
    label: 'Expandir',
    icon: GitBranch,
    prompt: 'Expanda e aprofunde o nó selecionado com sub-tópicos detalhados',
    mode: 'agent',
    color: 'text-blue-400',
    requiresExecution: true,
  },
  {
    id: 'summarize',
    label: 'Sintetizar',
    icon: BookOpen,
    prompt:
      'Sintetize o conteúdo do mapa em um resumo executivo claro e anexe essa síntese ao mapa como nós úteis',
    mode: 'agent',
    color: 'text-teal-400',
    requiresExecution: true,
  },
  {
    id: 'analyze',
    label: 'Analisar Mapa',
    icon: Eye,
    prompt:
      'Analise completamente meu mapa mental, identifique padrões, lacunas e sugira melhorias aplicando ao menos uma melhoria prática',
    mode: 'agent',
    color: 'text-cyan-400',
    requiresExecution: true,
  },
  {
    id: 'organize',
    label: 'Organizar',
    icon: RefreshCw,
    prompt: 'Reorganize e melhore a estrutura do mapa mental',
    mode: 'agent',
    color: 'text-indigo-400',
    requiresExecution: true,
  },
  {
    id: 'research',
    label: 'Pesquisar',
    icon: Search,
    prompt: 'Pesquise aprofundadamente sobre o tema do mapa e adicione nós de pesquisa com fontes',
    mode: 'agent',
    color: 'text-violet-400',
    requiresExecution: true,
  },

  // Advanced Agents
  {
    id: 'hypothesize',
    label: 'Hipóteses',
    icon: HelpCircle,
    prompt:
      'Formule hipóteses e cenários possíveis baseados no conteúdo do mapa e registre no mapa como nós',
    mode: 'agent',
    color: 'text-yellow-400',
    requiresExecution: true,
  },
  {
    id: 'task_convert',
    label: 'Criar Tarefas',
    icon: CheckSquare,
    prompt: 'Crie um plano de ação detalhado com tarefas, prioridades e prazos',
    mode: 'agent',
    color: 'text-emerald-400',
    requiresExecution: true,
  },
  {
    id: 'critique',
    label: 'Crítica Construtiva',
    icon: AlertCircle,
    prompt:
      'Ofereça crítica construtiva e sugestões de melhoria para o mapa, aplicando as melhorias mais importantes',
    mode: 'agent',
    color: 'text-red-400',
    requiresExecution: true,
  },
  {
    id: 'connect',
    label: 'Descobrir Conexões',
    icon: GitBranch,
    prompt:
      'Descubra conexões ocultas e relações não-óbvias entre conceitos e crie as conexões no mapa',
    mode: 'agent',
    color: 'text-pink-400',
    requiresExecution: true,
  },
  {
    id: 'visualize',
    label: 'Melhorar Visual',
    icon: Wand2,
    prompt: 'Melhore visual e organização do mapa com ações reais de estrutura e conexões',
    mode: 'agent',
    color: 'text-rose-400',
    requiresExecution: true,
  },
  {
    id: 'chart',
    label: 'Dashboard',
    icon: BarChart3,
    prompt: 'Crie um dashboard analítico com gráficos e métricas sobre o mapa usando nós de dados',
    mode: 'agent',
    color: 'text-pink-400',
    requiresExecution: true,
  },
];

// ─── Mode Config ────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<
  AIAgentMode,
  { label: string; icon: LucideIcon; color: string; desc: string }
> = {
  agent: {
    label: 'Agent Mode',
    icon: Zap,
    color: 'text-cyan-400',
    desc: 'Executa ações diretamente no mapa',
  },
  assistant: {
    label: 'Assistente',
    icon: Bot,
    color: 'text-blue-400',
    desc: 'Responde perguntas e sugere',
  },
  research: {
    label: 'Pesquisa',
    icon: BookOpen,
    color: 'text-violet-400',
    desc: 'Análise profunda e hipóteses',
  },
  creative: {
    label: 'Criativo',
    icon: Sparkles,
    color: 'text-amber-400',
    desc: 'Ideação e brainstorming',
  },
  analytical: {
    label: 'Analítico',
    icon: Target,
    color: 'text-emerald-400',
    desc: 'Dados, gráficos e métricas',
  },
};

// ─── TODO Item Component ────────────────────────────────────────────────────

const TodoItem: React.FC<{ item: AgentTodoItem; index: number }> = ({ item, index }) => {
  const statusConfig: Record<
    AgentTodoItem['status'],
    { icon: LucideIcon; color: string; bg: string; label: string; animate?: boolean }
  > = {
    planning: { icon: Circle, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Planejado' },
    'in-progress': {
      icon: Loader2,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      label: 'Em progresso',
      animate: true,
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      label: 'Concluído',
    },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Falhou' },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${config.bg} transition-all`}
    >
      <div className="flex-shrink-0">
        <Icon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      </div>
      <span
        className={`text-xs flex-1 ${item.status === 'completed' ? 'line-through text-slate-500' : item.status === 'in-progress' ? 'text-cyan-300 font-medium' : 'text-slate-400'}`}
      >
        {item.title}
      </span>
      {item.status === 'in-progress' && (
        <div className="flex gap-0.5">
          <div
            className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      )}
    </motion.div>
  );
};

// ─── Streaming Text Component ───────────────────────────────────────────────

const StreamingText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {text.split('\n').map((line, i) => {
        // Bold text
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <div key={i} className="font-semibold text-white">
              {line.replace(/\*\*/g, '')}
            </div>
          );
        }
        // Headers
        if (line.startsWith('###')) {
          return (
            <div key={i} className="font-bold text-white mt-2">
              {line.replace(/###\s?/g, '')}
            </div>
          );
        }
        // Lines with **bold** inline
        if (line.includes('**')) {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i}>
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <span key={j} className="font-semibold text-white">
                      {part.replace(/\*\*/g, '')}
                    </span>
                  );
                }
                return <span key={j}>{part}</span>;
              })}
            </div>
          );
        }
        // List items
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="ml-2 text-slate-300">
              {line}
            </div>
          );
        }
        // Numbered items
        if (line.match(/^\d+\./)) {
          return (
            <div key={i} className="ml-2 text-slate-300">
              {line}
            </div>
          );
        }
        // Success/emoji lines
        if (line.startsWith('✅') || line.startsWith('⚡') || line.startsWith('❌')) {
          return (
            <div key={i} className="font-medium">
              {line}
            </div>
          );
        }
        return <div key={i}>{line || <br />}</div>;
      })}
    </div>
  );
};

// ─── Tool Call Display ──────────────────────────────────────────────────────

const ToolCallDisplay: React.FC<{ toolName: string; isComplete: boolean }> = ({
  toolName,
  isComplete,
}) => {
  const toolLabels: Record<string, string> = {
    create_node: '📌 Criando nó',
    update_node: '✏️ Atualizando nó',
    delete_node: '🗑️ Removendo nó',
    batch_create_nodes: '📦 Criando múltiplos nós',
    batch_update_nodes: '📦 Atualizando nós em lote',
    create_edge: '🔗 Criando conexão',
    delete_edge: '✂️ Removendo conexão',
    analyze_map: '📊 Analisando mapa',
    reorganize_map: '🗂️ Reorganizando',
    find_nodes: '🔍 Buscando nós',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20"
    >
      {isComplete ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
      )}
      <span className="text-xs text-purple-300">{toolLabels[toolName] || `🔧 ${toolName}`}</span>
      {isComplete && <span className="text-[10px] text-emerald-400">✓</span>}
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen,
  onClose,
  mapId,
  nodes,
  edges,
  selectedNodeId,
  onApplyActions,
  pendingPrompt,
  onPendingPromptConsumed,
  createNode: createNodeFn,
  updateNodeData: updateNodeDataFn,
  deleteNode: deleteNodeFn,
  setEdges: setEdgesFn,
  onSave,
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AIAgentMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<AIAgentAction[]>([]);
  const [mode, setMode] = useState<AIAgentMode>('agent');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Streaming state
  const [streamingText, setStreamingText] = useState('');
  const [currentTodos, setCurrentTodos] = useState<AgentTodoItem[]>([]);
  const [activeToolCalls, setActiveToolCalls] = useState<
    Array<{ name: string; complete: boolean }>
  >([]);
  const [actionSteps, setActionSteps] = useState<
    Array<{ message: string; icon: string; timestamp: number }>
  >([]);
  const [thinkingText, setThinkingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, currentTodos, activeToolCalls, actionSteps]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Auto-send pending prompt
  useEffect(() => {
    if (pendingPrompt && isOpen && !isProcessing) {
      handleSend(pendingPrompt);
      onPendingPromptConsumed?.();
    }
  }, [pendingPrompt, isOpen]);

  const handleSend = useCallback(
    async (text?: string, agentType?: string) => {
      const msgText = text || input.trim();
      if (!msgText || isProcessing) return;
      if (!mapId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            role: 'system',
            content: '❌ Nao foi possivel identificar o mapa atual para executar o modo agente.',
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      setInput('');
      setIsProcessing(true);
      setIsStreaming(true);
      setShowQuickActions(false);
      setStreamingText('');
      setCurrentTodos([]);
      setActiveToolCalls([]);
      setActionSteps([]);
      setThinkingText('');
      neuralAgent.setMode(mode);
      neuralAgent.setMapId(mapId);

      // Add user message
      const userMsg: AIAgentMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: msgText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Setup streaming callbacks
      const callbacks: StreamCallbacks = {
        onThinkingStart: () => {
          setThinkingText('Analisando contexto e planejando ações...');
        },
        onThinkingUpdate: (text) => {
          setThinkingText(text);
        },
        onTodoUpdate: (todos) => {
          setCurrentTodos([...todos]);
        },
        onTextDelta: (_delta, accumulated) => {
          setStreamingText(accumulated);
        },
        onToolStart: (toolName, detail) => {
          setActiveToolCalls((prev) => [...prev, { name: toolName, complete: false }]);
        },
        onToolComplete: (toolName, _input, result) => {
          setActiveToolCalls((prev) =>
            prev.map((tc) =>
              tc.name === toolName && !tc.complete ? { ...tc, complete: true } : tc
            )
          );
        },
        onActionStep: (step, icon) => {
          setActionSteps((prev) => [
            ...prev,
            { message: step, icon: icon || '⚡', timestamp: Date.now() },
          ]);
        },
        onComplete: (response) => {
          setIsStreaming(false);
          setStreamingText('');
          setThinkingText('');

          // Build final agent message
          const agentMsg: AIAgentMessage = {
            id: `agent_${Date.now()}`,
            role: 'agent',
            content: response.response,
            timestamp: new Date().toISOString(),
            metadata: {
              mode,
              actions: response.actions,
              reasoning: response.thinking,
              confidence: response.confidence,
              usage: response.usage,
              todoList: response.todoList,
            },
          };
          setMessages((prev) => [...prev, agentMsg]);

          const executedOnMap = response.executedOnMap === true;
          if (response.actions.length > 0 && !executedOnMap) {
            setPendingActions(response.actions);
          } else {
            setPendingActions([]);
          }

          if (executedOnMap && (response.mutationsApplied || 0) > 0 && onSave) {
            setTimeout(() => {
              onSave();
              console.log('[AgentPanel] Auto-save triggered after agent execution');
            }, 500);
          }
        },
        onError: (error) => {
          setIsStreaming(false);
          setStreamingText('');
          setThinkingText('');
          setMessages((prev) => [
            ...prev,
            {
              id: `error_${Date.now()}`,
              role: 'system',
              content: `Erro na IA: ${error}`,
              timestamp: new Date().toISOString(),
            },
          ]);
        },
      };

      try {
        // ── Set up ExecutionContext so tool calls execute DIRECTLY on the map ──
        if (createNodeFn && updateNodeDataFn && deleteNodeFn && setEdgesFn) {
          const executionContext: ExecutionContext = {
            nodes: [...nodes],
            edges: [...edges],
            createNode: (type: NeuralNodeType, label: string, parentId?: string) => {
              const createdNode = createNodeFn(type, undefined, parentId || selectedNodeId, { label });
              executionContext.nodes.push(createdNode);
              return createdNode;
            },
            updateNode: (nodeId: string, data: Partial<NeuralNodeData>) => {
              updateNodeDataFn(nodeId, data);
              const target = executionContext.nodes.find((node) => node.id === nodeId);
              if (target) {
                target.data = { ...target.data, ...data };
              }
            },
            deleteNode: (nodeId: string) => {
              deleteNodeFn(nodeId);
              executionContext.nodes = executionContext.nodes.filter((node) => node.id !== nodeId);
              executionContext.edges = executionContext.edges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
              );
            },
            createEdge: (sourceId: string, targetId: string, label?: string) => {
              const edgeId = `edge_${sourceId}_${targetId}_${Date.now()}`;
              const newEdge: PowerEdge = {
                id: edgeId,
                source: sourceId,
                target: targetId,
                type: 'power',
                animated: true,
                data: { style: 'neural' as const, label },
              };
              executionContext.edges.push(newEdge);
              setEdgesFn((prev) => [...prev, newEdge]);
              return newEdge;
            },
            deleteEdge: (sourceId: string, targetId: string) => {
              executionContext.edges = executionContext.edges.filter(
                (edge) => !(edge.source === sourceId && edge.target === targetId)
              );
              setEdgesFn((prev) =>
                prev.filter((e) => !(e.source === sourceId && e.target === targetId))
              );
            },
          };
          neuralAgent.setExecutionContext(executionContext);
        }

        await neuralAgent.processMessage(
          msgText,
          nodes,
          edges,
          selectedNodeId,
          callbacks,
          agentType,
          mapId
        );
      } catch (error) {
        setIsStreaming(false);
        setStreamingText('');

        const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        setMessages((prev) => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            role: 'system',
            content: `❌ ${errMsg}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsProcessing(false);
        setActiveToolCalls([]);
      }
    },
    [input, isProcessing, mapId, mode, nodes, edges, selectedNodeId]
  );

  const handleApply = useCallback(() => {
    if (pendingActions.length === 0) return;
    onApplyActions(pendingActions);
    setPendingActions([]);

    setMessages((prev) => [
      ...prev,
      {
        id: `system_${Date.now()}`,
        role: 'system',
        content: `✅ ${pendingActions.length} ações aplicadas ao mapa com sucesso!`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [pendingActions, onApplyActions]);

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      setMode(action.mode);
      neuralAgent.setMode(action.mode);

      const strictExecutionSuffix = action.requiresExecution
        ? '\n\nIMPORTANTE: execute ações REAIS no mapa usando ferramentas (tool-use). Não apenas explique. Só finalize após executar pelo menos 1 ação concreta.'
        : '';

      handleSend(`${action.prompt}${strictExecutionSuffix}`, action.id);
    },
    [handleSend]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
    setCurrentTodos([]);
    setActiveToolCalls([]);
    setStreamingText('');
    setThinkingText('');
    neuralAgent.clearHistory();
    setShowQuickActions(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const panelWidth = isExpanded ? 'w-[560px]' : 'w-[420px]';

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
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border
                  ${
                    isProcessing
                      ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/30'
                  } transition-all duration-500`}
                >
                  <Brain
                    className={`w-5 h-5 text-cyan-400 ${isProcessing ? 'animate-pulse' : ''}`}
                  />
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0f1a]
                  ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">NeuralAgent</h3>
                <p className="text-[10px] text-slate-500">
                  Claude AI • {isProcessing ? '⚡ Processando...' : 'Agent Mode'}
                </p>
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
                    {(
                      Object.entries(MODE_CONFIG) as [
                        AIAgentMode,
                        (typeof MODE_CONFIG)[AIAgentMode],
                      ][]
                    ).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setMode(key);
                          neuralAgent.setMode(key);
                          setShowModeSelector(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-white/5
                          transition-all ${mode === key ? 'bg-white/10' : ''}`}
                      >
                        {React.createElement(config.icon, { className: `w-4 h-4 ${config.color}` })}
                        <div>
                          <div className={`text-xs font-medium ${config.color}`}>
                            {config.label}
                          </div>
                          <div className="text-[10px] text-slate-500">{config.desc}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
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
                  {nodes.find((n) => n.id === selectedNodeId)?.data.label || 'Nó selecionado'}
                </span>
              </div>
            </div>
          )}

          {/* ─── Messages ────────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin
            scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            {/* Quick Actions (initial state) */}
            {showQuickActions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="text-center py-4">
                  <div
                    className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10
                    border border-cyan-500/20 flex items-center justify-center mb-3"
                  >
                    <Wand2 className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Agent Mode com Claude AI
                  </h4>
                  <p className="text-xs text-slate-400 max-w-[300px] mx-auto">
                    IA real powered by Claude. Executo ações diretamente no mapa com raciocínio em
                    tempo real.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                        bg-white/[0.03] border border-white/[0.06]
                        hover:bg-white/[0.06] hover:border-white/[0.12]
                        transition-all group text-left"
                    >
                      {React.createElement(action.icon, {
                        className: `w-4 h-4 ${action.color} group-hover:scale-110 transition-transform`,
                      })}
                      <span className="text-xs text-slate-300 group-hover:text-white">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-600">
                    🧠 Powered by Claude (Anthropic) • Resultados reais via API
                  </p>
                </div>
              </motion.div>
            )}

            {/* Message List */}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* ─── STREAMING LIVE ZONE ──────────────────────────────── */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Thinking indicator */}
                {thinkingText && (
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs text-amber-300">{thinkingText}</span>
                  </div>
                )}

                {/* TODO List */}
                {currentTodos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#0d1321] rounded-xl border border-white/[0.06] overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04]">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-medium text-cyan-300">Progresso do Agente</span>
                      <span className="ml-auto text-[10px] text-slate-500">
                        {currentTodos.filter((t) => t.status === 'completed').length}/
                        {currentTodos.length}
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      {currentTodos.map((todo, i) => (
                        <TodoItem key={todo.id} item={todo} index={i} />
                      ))}
                    </div>
                    {/* Progress bar */}
                    <div className="px-3 pb-2">
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{
                            width: `${Math.round((currentTodos.filter((t) => t.status === 'completed').length / Math.max(currentTodos.length, 1)) * 100)}%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tool Calls */}
                {activeToolCalls.length > 0 && (
                  <div className="space-y-1.5">
                    {activeToolCalls.map((tc, i) => (
                      <ToolCallDisplay
                        key={`${tc.name}_${i}`}
                        toolName={tc.name}
                        isComplete={tc.complete}
                      />
                    ))}
                  </div>
                )}

                {/* Action Steps (Real-time VS Code style) */}
                {actionSteps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar"
                  >
                    {actionSteps.slice(-12).map((step, i) => (
                      <motion.div
                        key={`${step.timestamp}_${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.02] text-[10px] font-mono"
                      >
                        <span className="text-base">{step.icon}</span>
                        <span className="text-slate-400 truncate">{step.message}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Streaming text */}
                {streamingText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl px-4 py-3 bg-white/[0.03] text-slate-200 border border-white/[0.06] rounded-bl-md"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                        flex items-center justify-center"
                      >
                        <Brain className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">NeuralAgent</span>
                      <div className="flex gap-0.5 ml-1">
                        <div
                          className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                    <StreamingText text={streamingText} />
                    <span className="inline-block w-2 h-4 bg-cyan-400/70 animate-pulse ml-0.5" />
                  </motion.div>
                )}

                {/* Processing indicator (when no streaming text yet) */}
                {!streamingText && !thinkingText && currentTodos.length === 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02]">
                    <div className="relative">
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    </div>
                    <div>
                      <div className="text-xs text-cyan-400 font-medium">
                        Conectando com Claude AI...
                      </div>
                      <div className="text-[10px] text-slate-500">Enviando contexto do mapa</div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pending Actions */}
            {pendingActions.length > 0 && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cyan-500/5 rounded-xl border border-cyan-500/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    {pendingActions.length} ações para aplicar
                  </div>
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30
                      transition-all hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  >
                    <Play className="w-3 h-3" />
                    Aplicar
                  </button>
                </div>

                <div className="space-y-1">
                  {pendingActions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                      bg-white/[0.02] text-[11px] text-slate-400"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="truncate">{action.description}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Input ───────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-t border-white/5">
            <div
              className="flex items-end gap-2 bg-white/[0.03] rounded-xl border border-white/[0.08]
              focus-within:border-cyan-500/30 transition-all p-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isProcessing
                    ? 'Aguarde o processamento...'
                    : mode === 'agent'
                      ? 'Diga o que deseja fazer no mapa...'
                      : mode === 'research'
                        ? 'O que deseja pesquisar?'
                        : 'Digite sua mensagem...'
                }
                disabled={isProcessing}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500
                  resize-none outline-none min-h-[36px] max-h-[120px] py-1.5 px-2
                  disabled:opacity-50"
                style={{
                  height: 'auto',
                  overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden',
                }}
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
              <span className="text-[10px] text-slate-600">Claude Haiku 4.5</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Message Bubble ─────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: AIAgentMessage }> = ({ message }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs text-slate-500 py-1"
      >
        {message.content}
      </motion.div>
    );
  }

  const metadata = message.metadata as any;
  const todoList = metadata?.todoList as AgentTodoItem[] | undefined;
  const usage = metadata?.usage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[92%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Agent header */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20
              flex items-center justify-center"
            >
              <Brain className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">NeuralAgent</span>
            {metadata?.confidence && (
              <span className="text-[10px] text-slate-600">
                {Math.round(metadata.confidence * 100)}%
              </span>
            )}
            {usage && (
              <span className="text-[10px] text-emerald-600 ml-auto">
                ⚡ {usage.input_tokens + usage.output_tokens} tokens
              </span>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${
            isUser
              ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20 rounded-br-md'
              : 'bg-white/[0.03] text-slate-200 border border-white/[0.06] rounded-bl-md'
          }`}
        >
          <StreamingText text={message.content} />
        </div>

        {/* Action buttons for agent messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {metadata?.reasoning && (
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500
                  hover:text-slate-300 transition-colors rounded-md hover:bg-white/5"
              >
                <Eye className="w-3 h-3" />
                {showReasoning ? 'Ocultar raciocínio' : 'Ver raciocínio'}
              </button>
            )}

            {todoList && todoList.length > 0 && (
              <button
                onClick={() => setShowTodos(!showTodos)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500
                  hover:text-slate-300 transition-colors rounded-md hover:bg-white/5"
              >
                <CheckSquare className="w-3 h-3" />
                {showTodos ? 'Ocultar passos' : `Ver ${todoList.length} passos`}
              </button>
            )}

            <span className={`text-[10px] text-slate-600 ml-auto`}>
              {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {isUser && (
          <div className="text-[10px] text-slate-600 mt-1 text-right">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        {/* Expandable reasoning */}
        <AnimatePresence>
          {showReasoning && metadata?.reasoning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10
                text-[11px] text-amber-300/80 overflow-hidden"
            >
              💭 {metadata.reasoning}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expandable TODO history */}
        <AnimatePresence>
          {showTodos && todoList && todoList.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 rounded-lg bg-[#0d1321] border border-white/[0.04] p-2 space-y-1 overflow-hidden"
            >
              {todoList.map((todo, i) => (
                <TodoItem key={todo.id} item={todo} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AgentPanel;
