import { useState } from 'react';
import { KanbanBoard, KanbanTask } from '@/components/views/KanbanBoard';
import { useAuthStore } from '@/stores/authStore';
import { Brain } from 'lucide-react';
import toast from 'react-hot-toast';

// Dados mock de tarefas
const MOCK_TASKS: KanbanTask[] = [
  {
    id: 'task-1',
    title: 'Pesquisar arquiteturas LLM',
    description: 'Analisar papers sobre transformers e atenção',
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 86400000 * 3),
    assignee: { id: '1', name: 'Guilherme', avatar_url: undefined },
    tags: ['pesquisa', 'IA'],
    position: 0,
  },
  {
    id: 'task-2',
    title: 'Revisar documento de requisitos',
    description: 'Validar specs do produto',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000 * 5),
    assignee: { id: '2', name: 'Helen', avatar_url: undefined },
    tags: ['docs'],
    position: 0,
  },
  {
    id: 'task-3',
    title: 'Implementar canvas de mindmap',
    description: 'Usar @xyflow/react para criar o canvas interativo',
    priority: 'urgent',
    status: 'done',
    dueDate: new Date(Date.now() - 86400000),
    assignee: { id: '3', name: 'Pablo', avatar_url: undefined },
    tags: ['dev', 'frontend'],
    position: 0,
  },
  {
    id: 'task-4',
    title: 'Configurar deploy na Vercel',
    description: 'Setup de CI/CD e variáveis de ambiente',
    priority: 'high',
    status: 'review',
    assignee: { id: '1', name: 'Guilherme', avatar_url: undefined },
    tags: ['devops'],
    position: 0,
  },
  {
    id: 'task-5',
    title: 'Criar templates de mapas',
    description: 'Templates para pesquisa, planejamento e brainstorm',
    priority: 'low',
    status: 'backlog',
    tags: ['feature'],
    position: 0,
  },
];

export function KanbanPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<KanbanTask[]>(MOCK_TASKS);

  const handleTaskMove = (taskId: string, newStatus: KanbanTask['status'], newPosition: number) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, position: newPosition }
          : task
      )
    );
    toast.success('Tarefa movida!');
  };

  const handleTaskClick = (task: KanbanTask) => {
    toast(`Tarefa: ${task.title}`, { icon: '📋' });
  };

  const handleAddTask = (status: KanbanTask['status']) => {
    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: 'Nova Tarefa',
      description: 'Descrição da tarefa',
      priority: 'medium',
      status,
      assignee: { id: user?.id || '1', name: user?.display_name || 'User', avatar_url: undefined },
      position: tasks.filter(t => t.status === status).length,
    };
    setTasks(prev => [...prev, newTask]);
    toast.success('Tarefa criada!');
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain className="w-7 h-7 text-purple-400" />
          Kanban Board
        </h1>
        <p className="text-white/60 mt-1">
          Gerencie tarefas do workspace <span className="text-pink-400">MindLab</span>
        </p>
      </div>
      <div className="h-[calc(100%-80px)] overflow-x-auto">
        <KanbanBoard 
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
      </div>
    </div>
  );
}
