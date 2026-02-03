import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/AnimatedCards';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckSquare,
  Calendar,
  Tag,
  SortAsc,
  SortDesc,
  ChevronRight,
  Trash2,
  Edit3,
  Network,
  Circle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Sparkles,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: { name: string; color: string };
  dueDate?: string;
  mapId?: string;
  mapTitle?: string;
  nodeId?: string;
  tags?: string[];
  createdAt: string;
  completedAt?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
}

// Mock data
const MOCK_TASKS: TaskItem[] = [
  {
    id: 'task-001',
    title: 'Implementar autenticação OAuth com Google',
    description: 'Adicionar login social com Google para facilitar onboarding de novos usuários',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Guilherme', color: '#00D9FF' },
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    mapId: 'map-003',
    mapTitle: 'Arquitetura do Sistema',
    tags: ['Auth', 'Backend'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    subtasks: [
      { id: 'st-1', title: 'Configurar credenciais no Google Cloud', completed: true },
      { id: 'st-2', title: 'Implementar callback de autenticação', completed: true },
      { id: 'st-3', title: 'Testar fluxo completo', completed: false },
    ],
  },
  {
    id: 'task-002',
    title: 'Criar documentação da API de mapas',
    description: 'Documentar todos os endpoints REST da API',
    status: 'todo',
    priority: 'medium',
    assignee: { name: 'Helen', color: '#00FFC8' },
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    mapId: 'map-003',
    mapTitle: 'Arquitetura do Sistema',
    tags: ['Docs', 'API'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'task-003',
    title: 'Otimizar performance do editor de mapas',
    description: 'Melhorar o tempo de carregamento para mapas com mais de 100 nós',
    status: 'review',
    priority: 'high',
    assignee: { name: 'Pablo', color: '#A78BFA' },
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    mapId: 'map-003',
    mapTitle: 'Arquitetura do Sistema',
    tags: ['Performance', 'Frontend'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'task-004',
    title: 'Pesquisar modelos de IA para sumarização',
    description: 'Avaliar diferentes modelos para funcionalidade de resumo automático',
    status: 'done',
    priority: 'low',
    assignee: { name: 'Guilherme', color: '#00D9FF' },
    mapId: 'map-001',
    mapTitle: 'Pesquisa de IA Generativa',
    tags: ['IA', 'Pesquisa'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'task-005',
    title: 'Definir métricas de sucesso para Q1',
    description: 'Estabelecer KPIs e metas mensuráveis para o trimestre',
    status: 'todo',
    priority: 'urgent',
    assignee: { name: 'Pablo', color: '#A78BFA' },
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    mapId: 'map-002',
    mapTitle: 'Roadmap Q1 2026',
    tags: ['Planejamento', 'KPI'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-006',
    title: 'Design do novo componente de chat da IA',
    description: 'Criar mockups e protótipo interativo',
    status: 'in_progress',
    priority: 'medium',
    assignee: { name: 'Helen', color: '#00FFC8' },
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    mapId: 'map-004',
    mapTitle: 'Brainstorm - Novos Features',
    tags: ['Design', 'IA'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    subtasks: [
      { id: 'st-4', title: 'Wireframes low-fi', completed: true },
      { id: 'st-5', title: 'Design high-fi', completed: false },
      { id: 'st-6', title: 'Protótipo Figma', completed: false },
    ],
  },
];

const STATUS_CONFIG = {
  todo: { label: 'A Fazer', color: '#64748b', bg: 'bg-slate-500/20', icon: Circle },
  in_progress: { label: 'Em Progresso', color: '#00D9FF', bg: 'bg-cyan-500/20', icon: Timer },
  review: { label: 'Em Revisão', color: '#A78BFA', bg: 'bg-purple-500/20', icon: AlertCircle },
  done: { label: 'Concluído', color: '#10B981', bg: 'bg-emerald-500/20', icon: CheckCircle2 },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: '#64748b', bg: 'bg-slate-500/20' },
  medium: { label: 'Média', color: '#F59E0B', bg: 'bg-amber-500/20' },
  high: { label: 'Alta', color: '#EF4444', bg: 'bg-red-500/20' },
  urgent: { label: 'Urgente', color: '#DC2626', bg: 'bg-red-600/20' },
};

export function TasksPage() {
  const navigate = useNavigate();
  useAuthStore();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTasks(MOCK_TASKS);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }
    
    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority === filterPriority);
    }
    
    if (filterAssignee !== 'all') {
      result = result.filter(t => t.assignee?.name.toLowerCase() === filterAssignee.toLowerCase());
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sorting
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [tasks, filterStatus, filterPriority, filterAssignee, searchQuery, sortBy, sortOrder]);

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      review: tasks.filter(t => t.status === 'review'),
      done: tasks.filter(t => t.status === 'done'),
    };
  }, [tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  }), [tasks]);

  const assignees = useMemo(() => {
    const unique = new Map<string, { name: string; color: string }>();
    tasks.forEach(t => {
      if (t.assignee) unique.set(t.assignee.name, t.assignee);
    });
    return Array.from(unique.values());
  }, [tasks]);

  const handleToggleStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const statusOrder = ['todo', 'in_progress', 'review', 'done'] as const;
        const currentIndex = statusOrder.indexOf(t.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { 
          ...t, 
          status: nextStatus,
          completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
        };
      }
      return t;
    }));
    toast.success('Status atualizado!');
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Tarefa excluída!');
  };

  const handleDragTask = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
    toast.success('Tarefa movida!');
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: `${Math.abs(days)}d atrasado`, color: 'text-red-400' };
    if (days === 0) return { text: 'Hoje', color: 'text-amber-400' };
    if (days === 1) return { text: 'Amanhã', color: 'text-amber-400' };
    if (days < 7) return { text: `${days} dias`, color: 'text-slate-400' };
    return { text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), color: 'text-slate-500' };
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#080C14] overflow-y-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tarefas</h1>
            <p className="text-slate-500 text-sm">
              Gerencie todas as suas tarefas em um só lugar
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => toast.success('Em breve!')}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar com IA
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Target, color: 'cyan' },
            { label: 'A Fazer', value: stats.todo, icon: Circle, color: 'slate' },
            { label: 'Em Progresso', value: stats.inProgress, icon: Timer, color: 'cyan' },
            { label: 'Em Revisão', value: stats.review, icon: AlertCircle, color: 'purple' },
            { label: 'Concluídas', value: stats.done, icon: CheckCircle2, color: 'emerald' },
            { label: 'Atrasadas', value: stats.overdue, icon: XCircle, color: 'red' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-4 rounded-xl border backdrop-blur-sm',
                `bg-${stat.color}-500/5 border-${stat.color}-500/20`
              )}
              style={{ 
                backgroundColor: stat.color === 'cyan' ? 'rgba(0, 217, 255, 0.05)' :
                                stat.color === 'purple' ? 'rgba(167, 139, 250, 0.05)' :
                                stat.color === 'emerald' ? 'rgba(16, 185, 129, 0.05)' :
                                stat.color === 'red' ? 'rgba(239, 68, 68, 0.05)' :
                                'rgba(100, 116, 139, 0.05)',
                borderColor: stat.color === 'cyan' ? 'rgba(0, 217, 255, 0.2)' :
                             stat.color === 'purple' ? 'rgba(167, 139, 250, 0.2)' :
                             stat.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' :
                             stat.color === 'red' ? 'rgba(239, 68, 68, 0.2)' :
                             'rgba(100, 116, 139, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn(
                  'w-5 h-5',
                  stat.color === 'cyan' ? 'text-cyan-400' :
                  stat.color === 'purple' ? 'text-purple-400' :
                  stat.color === 'emerald' ? 'text-emerald-400' :
                  stat.color === 'red' ? 'text-red-400' :
                  'text-slate-400'
                )} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">Todos os Status</option>
            <option value="todo">A Fazer</option>
            <option value="in_progress">Em Progresso</option>
            <option value="review">Em Revisão</option>
            <option value="done">Concluído</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">Todos os Responsáveis</option>
            {assignees.map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg border border-slate-800 p-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm text-slate-400 px-2 py-1 focus:outline-none"
            >
              <option value="dueDate">Prazo</option>
              <option value="priority">Prioridade</option>
              <option value="createdAt">Criação</option>
              <option value="title">Título</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'kanban' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-900/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => {
                const StatusIcon = STATUS_CONFIG[task.status].icon;
                const dueInfo = formatDueDate(task.dueDate);
                const isExpanded = expandedTasks.has(task.id);
                const subtaskProgress = task.subtasks 
                  ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
                  : null;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <div className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer',
                      'bg-slate-900/30 border-slate-800/50',
                      'hover:border-cyan-500/30 hover:bg-slate-800/30',
                      task.status === 'done' && 'opacity-60'
                    )}>
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(task.id)}
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                          STATUS_CONFIG[task.status].bg
                        )}
                        style={{ color: STATUS_CONFIG[task.status].color }}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </button>

                      {/* Expand Button */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <button
                          onClick={() => toggleExpanded(task.id)}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                        </button>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn(
                            'font-medium text-white truncate',
                            task.status === 'done' && 'line-through text-slate-400'
                          )}>
                            {task.title}
                          </h3>
                          {/* Priority Badge */}
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded',
                            PRIORITY_CONFIG[task.priority].bg
                          )}
                          style={{ color: PRIORITY_CONFIG[task.priority].color }}>
                            {PRIORITY_CONFIG[task.priority].label}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-slate-500 truncate mb-1">{task.description}</p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {task.mapTitle && (
                            <button
                              onClick={() => task.mapId && navigate(`/map/${task.mapId}`)}
                              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                            >
                              <Network className="w-3 h-3" />
                              {task.mapTitle}
                            </button>
                          )}
                          {task.tags && task.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Subtask Progress */}
                      {subtaskProgress !== null && (
                        <div className="hidden md:flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500 rounded-full transition-all"
                              style={{ width: `${subtaskProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{subtaskProgress}%</span>
                        </div>
                      )}

                      {/* Assignee */}
                      {task.assignee && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: task.assignee.color + '20',
                            color: task.assignee.color 
                          }}
                          title={task.assignee.name}
                        >
                          {task.assignee.name[0]}
                        </div>
                      )}

                      {/* Due Date */}
                      {dueInfo && (
                        <div className={cn('flex items-center gap-1 text-xs min-w-[80px]', dueInfo.color)}>
                          <Calendar className="w-3 h-3" />
                          {dueInfo.text}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-white rounded transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subtasks */}
                    <AnimatePresence>
                      {isExpanded && task.subtasks && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-14 mt-2 space-y-1 pb-2">
                            {task.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                onClick={() => handleToggleSubtask(task.id, subtask.id)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30 cursor-pointer transition-colors"
                              >
                                <div className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                  subtask.completed 
                                    ? 'bg-cyan-500 border-cyan-500' 
                                    : 'border-slate-600 hover:border-cyan-500'
                                )}>
                                  {subtask.completed && <CheckSquare className="w-3 h-3 text-white" />}
                                </div>
                                <span className={cn(
                                  'text-sm',
                                  subtask.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                                )}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredTasks.length === 0 && (
              <GlassCard gradient="none" className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                  <CheckSquare className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Nenhuma tarefa encontrada</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {searchQuery ? 'Tente outro termo de busca' : 'Crie sua primeira tarefa'}
                </p>
                <Button className="bg-cyan-600 hover:bg-cyan-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </GlassCard>
            )}
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
              const config = STATUS_CONFIG[status];
              const StatusIcon = config.icon;
              const statusTasks = tasksByStatus[status];

              return (
                <div key={status} className="flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <StatusIcon className="w-4 h-4" style={{ color: config.color }} />
                    <h3 className="font-medium text-white">{config.label}</h3>
                    <span className="ml-auto px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full">
                      {statusTasks.length}
                    </span>
                  </div>

                  {/* Column Content */}
                  <div 
                    className="flex-1 p-2 rounded-xl bg-slate-900/20 border border-slate-800/30 min-h-[400px] space-y-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const taskId = e.dataTransfer.getData('taskId');
                      if (taskId) handleDragTask(taskId, status);
                    }}
                  >
                    {statusTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        draggable
                        onDragStart={(e: any) => e.dataTransfer.setData('taskId', task.id)}
                        className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 cursor-grab active:cursor-grabbing transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-white line-clamp-2">{task.title}</h4>
                          <span 
                            className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', PRIORITY_CONFIG[task.priority].bg)}
                            style={{ color: PRIORITY_CONFIG[task.priority].color }}
                          >
                            {task.priority[0].toUpperCase()}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          {task.assignee && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ 
                                backgroundColor: task.assignee.color + '20',
                                color: task.assignee.color 
                              }}
                            >
                              {task.assignee.name[0]}
                            </div>
                          )}
                          {formatDueDate(task.dueDate) && (
                            <span className={cn('text-[10px]', formatDueDate(task.dueDate)?.color)}>
                              {formatDueDate(task.dueDate)?.text}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksPage;
