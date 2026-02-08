// ============================================================================
// NeuralMap Editor - Constants & Configuration
// ============================================================================

import { 
  Brain, Lightbulb, CheckSquare, FileText, Link2, Search, 
  BarChart3, Grid3X3, Milestone, HelpCircle, GitBranch, Users,
  type LucideIcon
} from 'lucide-react';
import type { NeuralNodeType, NodeStatus, NodePriority, ConnectionStyle, ViewMode } from './types';

// ─── Node Type Config ───────────────────────────────────────────────────────

export interface NodeTypeConfig {
  type: NeuralNodeType;
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  glow: string;
  bgColor: string;
  borderColor: string;
  shortcut: string;
  description: string;
}

export const NODE_TYPE_CONFIG: Record<NeuralNodeType, NodeTypeConfig> = {
  central: {
    type: 'central',
    label: 'Central',
    icon: Brain,
    color: '#a855f7',
    gradient: 'from-purple-500/20 to-violet-600/20',
    glow: 'shadow-purple-500/30',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    shortcut: 'C',
    description: 'Tema central do mapa'
  },
  idea: {
    type: 'idea',
    label: 'Ideia',
    icon: Lightbulb,
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-yellow-600/20',
    glow: 'shadow-amber-500/30',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/40',
    shortcut: 'I',
    description: 'Ideias criativas e insights'
  },
  task: {
    type: 'task',
    label: 'Tarefa',
    icon: CheckSquare,
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-green-600/20',
    glow: 'shadow-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    shortcut: 'T',
    description: 'Tarefas e ações'
  },
  note: {
    type: 'note',
    label: 'Nota',
    icon: FileText,
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-sky-600/20',
    glow: 'shadow-blue-500/30',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    shortcut: 'N',
    description: 'Notas e anotações'
  },
  reference: {
    type: 'reference',
    label: 'Referência',
    icon: Link2,
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-teal-600/20',
    glow: 'shadow-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/40',
    shortcut: 'R',
    description: 'Links e referências externas'
  },
  research: {
    type: 'research',
    label: 'Pesquisa',
    icon: Search,
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-purple-600/20',
    glow: 'shadow-violet-500/30',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/40',
    shortcut: 'P',
    description: 'Pesquisa e análise'
  },
  data: {
    type: 'data',
    label: 'Dados',
    icon: BarChart3,
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-rose-600/20',
    glow: 'shadow-pink-500/30',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/40',
    shortcut: 'D',
    description: 'Gráficos e visualização de dados'
  },
  group: {
    type: 'group',
    label: 'Grupo',
    icon: Grid3X3,
    color: '#6366f1',
    gradient: 'from-indigo-500/20 to-blue-600/20',
    glow: 'shadow-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/40',
    shortcut: 'G',
    description: 'Agrupamento de nós'
  },
  milestone: {
    type: 'milestone',
    label: 'Marco',
    icon: Milestone,
    color: '#f97316',
    gradient: 'from-orange-500/20 to-amber-600/20',
    glow: 'shadow-orange-500/30',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    shortcut: 'M',
    description: 'Marcos e objetivos'
  },
  question: {
    type: 'question',
    label: 'Questão',
    icon: HelpCircle,
    color: '#eab308',
    gradient: 'from-yellow-500/20 to-amber-600/20',
    glow: 'shadow-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/40',
    shortcut: 'Q',
    description: 'Perguntas e hipóteses'
  },
  decision: {
    type: 'decision',
    label: 'Decisão',
    icon: GitBranch,
    color: '#ef4444',
    gradient: 'from-red-500/20 to-rose-600/20',
    glow: 'shadow-red-500/30',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
    shortcut: 'X',
    description: 'Pontos de decisão'
  },
  resource: {
    type: 'resource',
    label: 'Recurso',
    icon: Users,
    color: '#14b8a6',
    gradient: 'from-teal-500/20 to-emerald-600/20',
    glow: 'shadow-teal-500/30',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/40',
    shortcut: 'U',
    description: 'Recursos e equipe'
  }
};

// ─── Status Config ──────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<NodeStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  active: { label: 'Ativo', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  in_progress: { label: 'Em Progresso', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  review: { label: 'Em Revisão', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  completed: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  archived: { label: 'Arquivado', color: 'text-gray-400', bg: 'bg-gray-500/20' }
};

// ─── Priority Config ────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<NodePriority, { label: string; color: string; bg: string; icon: string }> = {
  low: { label: 'Baixa', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '▽' },
  medium: { label: 'Média', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '◇' },
  high: { label: 'Alta', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '△' },
  urgent: { label: 'Urgente', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '▲' },
  critical: { label: 'Crítica', color: 'text-red-400', bg: 'bg-red-500/20', icon: '⬆' }
};

// ─── View Modes ─────────────────────────────────────────────────────────────

export const VIEW_MODE_CONFIG: Record<ViewMode, { label: string; icon: string }> = {
  map: { label: 'Mapa Neural', icon: 'brain' },
  list: { label: 'Lista', icon: 'list' },
  kanban: { label: 'Kanban', icon: 'columns' },
  timeline: { label: 'Timeline', icon: 'calendar' },
  analytics: { label: 'Analytics', icon: 'chart' }
};

// ─── Connection Styles ──────────────────────────────────────────────────────

export const CONNECTION_STYLES: Record<ConnectionStyle, { label: string; description: string }> = {
  neural: { label: 'Neural', description: 'Conexões com partículas animadas' },
  bezier: { label: 'Bezier', description: 'Curvas suaves' },
  straight: { label: 'Reta', description: 'Linhas retas diretas' },
  step: { label: 'Step', description: 'Ângulos retos' },
  animated: { label: 'Animada', description: 'Fluxo animado contínuo' }
};

// ─── Default Values ─────────────────────────────────────────────────────────

export const DEFAULT_NODE_DATA = {
  status: 'active' as NodeStatus,
  priority: 'medium' as NodePriority,
  progress: 0,
  impact: 50,
  effort: 50,
  confidence: 50,
  tags: [],
};

export const DEFAULT_EDITOR_SETTINGS = {
  showGrid: true,
  showMinimap: true,
  snapToGrid: false,
  gridSize: 20,
  isLocked: false,
  connectionStyle: 'neural' as ConnectionStyle,
  autoSave: true,
  autoSaveInterval: 30000,
  animateEdges: true,
  showNodeStats: true,
  compactMode: false,
};

// ─── Collaboration Colors ───────────────────────────────────────────────────

export const COLLABORATOR_COLORS = [
  '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#10b981',
  '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#6366f1'
];

// ─── AI Models ──────────────────────────────────────────────────────────────

export const AI_MODELS = {
  auto: {
    id: 'auto',
    name: '🤖 Auto Select',
    description: 'Seleciona automaticamente o melhor modelo para cada tarefa',
    maxTokens: 200000,
  },
  haiku: {
    id: 'claude-3-haiku-4-5-20250514',
    name: 'Claude 3 Haiku 4.5',
    description: 'Rápido e econômico - ideal para tarefas simples',
    maxTokens: 200000,
  },
  sonnet45: {
    id: 'claude-3-5-sonnet-20250514',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanceado - padrão para maioria das tarefas',
    maxTokens: 200000,
  },
  opus46: {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Mais poderoso - para tarefas complexas',
    maxTokens: 200000,
  },
};

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

export const KEYBOARD_SHORTCUTS = {
  // Node creation
  'i': { action: 'createNode', type: 'idea', label: 'Nova Ideia' },
  't': { action: 'createNode', type: 'task', label: 'Nova Tarefa' },
  'n': { action: 'createNode', type: 'note', label: 'Nova Nota' },
  'r': { action: 'createNode', type: 'reference', label: 'Nova Referência' },
  'p': { action: 'createNode', type: 'research', label: 'Nova Pesquisa' },
  'd': { action: 'createNode', type: 'data', label: 'Novos Dados' },
  'q': { action: 'createNode', type: 'question', label: 'Nova Questão' },
  
  // Editor actions
  'Delete': { action: 'deleteSelected', label: 'Excluir Selecionado' },
  'Backspace': { action: 'deleteSelected', label: 'Excluir Selecionado' },
  'Escape': { action: 'clearSelection', label: 'Limpar Seleção' },
  'ctrl+z': { action: 'undo', label: 'Desfazer' },
  'ctrl+shift+z': { action: 'redo', label: 'Refazer' },
  'ctrl+y': { action: 'redo', label: 'Refazer' },
  'ctrl+a': { action: 'selectAll', label: 'Selecionar Tudo' },
  'ctrl+s': { action: 'save', label: 'Salvar' },
  'ctrl+k': { action: 'commandPalette', label: 'Paleta de Comandos' },
  'ctrl+shift+a': { action: 'toggleAI', label: 'Abrir IA' },
  'ctrl+e': { action: 'toggleExport', label: 'Exportar' },
  'ctrl+f': { action: 'search', label: 'Buscar no Mapa' },
  'f': { action: 'fitView', label: 'Ajustar Visualização' },
  'l': { action: 'toggleLock', label: 'Alternar Bloqueio' },
  'g': { action: 'toggleGrid', label: 'Alternar Grade' },
  'space': { action: 'quickAdd', label: 'Adição Rápida' },
} as const;
