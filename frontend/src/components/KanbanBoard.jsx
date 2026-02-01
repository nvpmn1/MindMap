import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  GripVertical, 
  Check, 
  Clock, 
  User, 
  Flag,
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Plus
} from 'lucide-react';
import { useMindmapStore, useUserStore, useViewStore } from '../store';
import { tasksAPI, nodesAPI } from '../lib/api';

const statusConfig = {
  todo: { 
    label: 'A Fazer', 
    color: 'bg-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800'
  },
  doing: { 
    label: 'Fazendo', 
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  done: { 
    label: 'Feito', 
    color: 'bg-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  }
};

const priorityConfig = {
  high: { label: 'Alta', color: 'text-red-500', bg: 'bg-red-100' },
  medium: { label: 'Média', color: 'text-amber-500', bg: 'bg-amber-100' },
  low: { label: 'Baixa', color: 'text-green-500', bg: 'bg-green-100' }
};

function KanbanCard({ node, onDragEnd }) {
  const { currentUser, users, getUserColor } = useUserStore();
  const { openDetailsPanel } = useViewStore();
  const { updateNode } = useMindmapStore();
  const [showMenu, setShowMenu] = useState(false);

  const assignee = node.assigned_to ? users.find(u => u.id === node.assigned_to) : null;
  const assigneeColor = assignee ? getUserColor(assignee.id) : null;

  const handleStatusChange = async (newStatus) => {
    try {
      await tasksAPI.updateStatus(node.id, newStatus, currentUser?.id);
      updateNode(node.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    setShowMenu(false);
  };

  const handleAssign = async (userId) => {
    try {
      if (userId) {
        await tasksAPI.assign(node.id, userId, currentUser?.id);
      } else {
        await tasksAPI.unassign(node.id, currentUser?.id);
      }
      updateNode(node.id, { assigned_to: userId });
    } catch (error) {
      console.error('Failed to assign:', error);
    }
    setShowMenu(false);
  };

  const isOverdue = node.due_date && new Date(node.due_date) < new Date() && node.status !== 'done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`
        kanban-card relative
        ${node.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}
        ${node.priority === 'medium' ? 'border-l-4 border-l-amber-500' : ''}
        ${isOverdue ? 'ring-2 ring-red-500/50' : ''}
      `}
      onClick={() => openDetailsPanel(node.id)}
    >
      {/* Priority Badge */}
      {node.priority && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[node.priority].bg} ${priorityConfig[node.priority].color}`}>
          <Flag size={10} className="inline mr-1" />
          {priorityConfig[node.priority].label}
        </div>
      )}

      {/* Content */}
      <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 pr-6">
        {node.content}
      </h4>

      {node.description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
          {node.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {assignee && (
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: `${assigneeColor}20`,
                color: assigneeColor 
              }}
            >
              <User size={12} />
              <span className="font-medium">{assignee.name.split(' ')[0]}</span>
            </div>
          )}
        </div>

        {node.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
            <Calendar size={12} />
            <span>{new Date(node.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
        )}
      </div>

      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
      >
        <MoreHorizontal size={14} />
      </button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-8 right-0 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Status</div>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${node.status === status ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.label}
              </button>
            ))}
            
            <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
            
            <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Atribuir</div>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleAssign(user.id)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${node.assigned_to === user.id ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
              >
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getUserColor(user.id) }}
                >
                  {user.name[0]}
                </div>
                {user.name}
              </button>
            ))}
            {node.assigned_to && (
              <button
                onClick={() => handleAssign(null)}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                Remover atribuição
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function KanbanColumn({ status, tasks, onDrop }) {
  const { currentUser } = useUserStore();
  const { currentMindmap, addNode } = useMindmapStore();
  const config = statusConfig[status];

  const handleAddTask = async () => {
    try {
      const result = await nodesAPI.create({
        mindmapId: currentMindmap?.id,
        content: 'Nova tarefa',
        type: 'task',
        status: status,
        userId: currentUser?.id
      });
      addNode(result.data);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-primary/50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('ring-2', 'ring-primary/50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary/50');
    const nodeId = e.dataTransfer.getData('nodeId');
    if (nodeId) {
      onDrop(nodeId, status);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-w-[300px] max-w-[400px]"
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${config.bgColor}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{config.label}</h3>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={handleAddTask}
          className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors"
          title="Adicionar tarefa"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Column Content */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="bg-slate-100/50 dark:bg-slate-800/50 rounded-b-xl p-3 min-h-[400px] flex flex-col gap-2 transition-all"
      >
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <motion.div
              key={task.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('nodeId', task.id);
              }}
              className="group"
            >
              <KanbanCard node={task} />
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            <p>Arraste tarefas aqui</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function KanbanBoard() {
  const { nodes, updateNode } = useMindmapStore();
  const { currentUser } = useUserStore();
  const [filter, setFilter] = useState('all'); // 'all' | userId

  // Get tasks (nodes with status)
  const tasks = useMemo(() => {
    return nodes.filter(n => n.status);
  }, [nodes]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.assigned_to === filter);
  }, [tasks, filter]);

  // Group by status
  const tasksByStatus = useMemo(() => ({
    todo: filteredTasks.filter(t => t.status === 'todo'),
    doing: filteredTasks.filter(t => t.status === 'doing'),
    done: filteredTasks.filter(t => t.status === 'done')
  }), [filteredTasks]);

  const handleDrop = async (nodeId, newStatus) => {
    try {
      await tasksAPI.updateStatus(nodeId, newStatus, currentUser?.id);
      updateNode(nodeId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Quadro Kanban
        </h2>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtrar:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input !w-auto !py-1.5"
          >
            <option value="all">Todas as tarefas</option>
            <option value={currentUser?.id}>Minhas tarefas</option>
          </select>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-h-full">
          <KanbanColumn 
            status="todo" 
            tasks={tasksByStatus.todo} 
            onDrop={handleDrop}
          />
          <KanbanColumn 
            status="doing" 
            tasks={tasksByStatus.doing} 
            onDrop={handleDrop}
          />
          <KanbanColumn 
            status="done" 
            tasks={tasksByStatus.done} 
            onDrop={handleDrop}
          />
        </div>
      </div>
    </div>
  );
}
