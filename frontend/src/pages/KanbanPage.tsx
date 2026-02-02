import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/AnimatedCards';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flame,
  MessageSquare,
  Paperclip,
  GripVertical,
  Sparkles,
  Network,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: { name: string; color: string };
  dueDate?: Date;
  tags?: string[];
  comments?: number;
  attachments?: number;
}

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#64748B', icon: Circle },
  { id: 'todo', title: 'A Fazer', color: '#3B82F6', icon: Circle },
  { id: 'in_progress', title: 'Em Progresso', color: '#F59E0B', icon: Clock },
  { id: 'review', title: 'Revisão', color: '#8B5CF6', icon: AlertCircle },
  { id: 'done', title: 'Concluído', color: '#10B981', icon: CheckCircle2 },
];

const PRIORITY_CONFIG = {
  low: { color: '#64748B', label: 'Baixa', icon: null },
  medium: { color: '#3B82F6', label: 'Média', icon: null },
  high: { color: '#F59E0B', label: 'Alta', icon: AlertCircle },
  urgent: { color: '#EF4444', label: 'Urgente', icon: Flame },
};

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Implementar AI Agent',
    description: 'Integrar Claude API para geração de mapas',
    status: 'in_progress',
    priority: 'urgent',
    assignee: { name: 'Guilherme', color: '#00D9FF' },
    dueDate: new Date(Date.now() + 86400000 * 2),
    tags: ['IA', 'Backend'],
    comments: 5,
    attachments: 2,
  },
  {
    id: 'task-2',
    title: 'Design System Update',
    description: 'Atualizar componentes com novo tema neural',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Helen', color: '#00FFC8' },
    dueDate: new Date(Date.now() + 86400000 * 4),
    tags: ['Design', 'Frontend'],
    comments: 3,
  },
  {
    id: 'task-3',
    title: 'Configurar Supabase RLS',
    description: 'Implementar políticas de segurança',
    status: 'review',
    priority: 'high',
    assignee: { name: 'Pablo', color: '#A78BFA' },
    tags: ['Segurança', 'Database'],
    comments: 2,
  },
  {
    id: 'task-4',
    title: 'Testes E2E',
    description: 'Criar suite de testes automatizados',
    status: 'backlog',
    priority: 'medium',
    tags: ['QA', 'Testing'],
  },
  {
    id: 'task-5',
    title: 'Documentação API',
    description: 'Documentar endpoints do backend',
    status: 'done',
    priority: 'low',
    assignee: { name: 'Guilherme', color: '#00D9FF' },
    tags: ['Docs'],
    comments: 1,
  },
  {
    id: 'task-6',
    title: 'Performance Optimization',
    description: 'Otimizar renderização do canvas',
    status: 'todo',
    priority: 'medium',
    assignee: { name: 'Pablo', color: '#A78BFA' },
    dueDate: new Date(Date.now() + 86400000 * 7),
    tags: ['Performance'],
  },
];

function TaskCard({ task, onDragStart }: { task: Task; onDragStart?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priority.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <div className={cn(
        "p-3 rounded-xl bg-[#0D1520]/90 border border-slate-800/50 cursor-pointer transition-all",
        isHovered && "border-slate-700 shadow-lg shadow-cyan-500/5"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {PriorityIcon && (
              <PriorityIcon className="w-3.5 h-3.5" style={{ color: priority.color }} />
            )}
            <span 
              className="px-1.5 py-0.5 text-[9px] font-medium rounded"
              style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
            >
              {priority.label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 text-slate-500 transition-opacity",
              !isHovered && "opacity-0"
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">{task.title}</h4>
        
        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] bg-slate-800/50 text-slate-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={cn(
                "flex items-center gap-1 text-[10px]",
                task.dueDate < new Date() ? "text-red-400" : "text-slate-500"
              )}>
                <Calendar className="w-3 h-3" />
                {task.dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            )}
            {task.comments && task.comments > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <MessageSquare className="w-3 h-3" />
                {task.comments}
              </span>
            )}
            {task.attachments && task.attachments > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <Paperclip className="w-3 h-3" />
                {task.attachments}
              </span>
            )}
          </div>

          {task.assignee && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: `${task.assignee.color}20`,
                color: task.assignee.color,
              }}
              title={task.assignee.name}
            >
              {task.assignee.name[0]}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ 
  column, 
  tasks, 
  onAddTask,
}: { 
  column: typeof COLUMNS[0]; 
  tasks: Task[];
  onAddTask: () => void;
}) {
  const Icon = column.icon;

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: column.color }} />
          <h3 className="font-medium text-white">{column.title}</h3>
          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddTask}
          className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-2 border-dashed border-slate-800 rounded-xl text-center"
          >
            <p className="text-xs text-slate-600">Sem tarefas</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function KanbanPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const handleAddTask = useCallback((status: Task['status']) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Nova Tarefa',
      status,
      priority: 'medium',
      assignee: user ? { name: user.display_name || 'User', color: user.color || '#00D9FF' } : undefined,
    };
    setTasks(prev => [...prev, newTask]);
    toast.success('Tarefa criada!');
  }, [user]);

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterPriority && task.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  const getTasksByStatus = (status: string) => 
    filteredTasks.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-[#080C14]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#080C14]/80 backdrop-blur-xl">
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-semibold text-white">Kanban Board</h1>
                <p className="text-[11px] text-slate-500">{tasks.length} tarefas total</p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600"
              />
            </div>

            <Button
              variant="ghost"
              className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>

            <Button
              onClick={() => handleAddTask('backlog')}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="p-6 overflow-x-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-6 min-w-max pb-4"
        >
          {COLUMNS.map((column, index) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <KanbanColumn
                column={column}
                tasks={getTasksByStatus(column.id)}
                onAddTask={() => handleAddTask(column.id as Task['status'])}
              />
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* AI Suggestion Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2"
      >
        <GlassCard gradient="purple" glow>
          <div className="px-4 py-3 flex items-center gap-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-white">
              <span className="text-purple-400">AI Sugestão:</span> 3 tarefas podem ser movidas para "Em Progresso"
            </p>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
            >
              Aplicar
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
