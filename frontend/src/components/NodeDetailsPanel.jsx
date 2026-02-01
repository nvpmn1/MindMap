import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Calendar, 
  User, 
  Flag,
  MessageSquare,
  Paperclip,
  Clock,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { useViewStore, useMindmapStore, useUserStore } from '../store';
import { nodesAPI, tasksAPI } from '../lib/api';

const priorityOptions = [
  { value: 'low', label: 'Baixa', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'medium', label: 'Média', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'high', label: 'Alta', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
];

const statusOptions = [
  { value: null, label: 'Nenhum', icon: Circle },
  { value: 'todo', label: 'A fazer', icon: Circle },
  { value: 'doing', label: 'Fazendo', icon: Clock },
  { value: 'done', label: 'Concluído', icon: CheckCircle2 },
];

export default function NodeDetailsPanel() {
  const { detailsPanelNodeId, closeDetailsPanel } = useViewStore();
  const { nodes, updateNode } = useMindmapStore();
  const { currentUser, users, getUserColor } = useUserStore();
  
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const node = nodes.find(n => n.id === detailsPanelNodeId);

  useEffect(() => {
    if (detailsPanelNodeId) {
      loadComments();
    }
  }, [detailsPanelNodeId]);

  const loadComments = async () => {
    if (!detailsPanelNodeId) return;
    setIsLoadingComments(true);
    try {
      const result = await nodesAPI.getComments(detailsPanelNodeId);
      setComments(result.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    if (!node) return;
    
    try {
      const updateData = { [field]: value, userId: currentUser?.id };
      
      if (field === 'status') {
        await tasksAPI.updateStatus(node.id, value, currentUser?.id);
      } else {
        await nodesAPI.update(node.id, updateData);
      }
      
      updateNode(node.id, { [field]: value });
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !node) return;
    
    try {
      await nodesAPI.addComment(node.id, {
        content: newComment.trim(),
        userId: currentUser?.id
      });
      
      setComments(prev => [...prev, {
        id: Date.now(),
        content: newComment.trim(),
        user_id: currentUser?.id,
        user: currentUser,
        created_at: new Date().toISOString()
      }]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (!detailsPanelNodeId || !node) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-white">Detalhes</h2>
        <button 
          onClick={closeDetailsPanel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Título</label>
          <input
            type="text"
            value={node.content}
            onChange={(e) => handleUpdateField('content', e.target.value)}
            className="input text-lg font-medium"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value || 'none'}
                onClick={() => handleUpdateField('status', option.value)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer
                  ${node.status === option.value 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
              >
                <option.icon size={16} />
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">
            <Flag size={14} className="inline mr-1" />
            Prioridade
          </label>
          <div className="flex gap-2">
            {priorityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleUpdateField('priority', option.value)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all
                  ${node.priority === option.value 
                    ? `${option.bg} ${option.color} font-medium` 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">
            <User size={14} className="inline mr-1" />
            Responsável
          </label>
          <div className="flex gap-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleUpdateField('assigned_to', user.id === node.assigned_to ? null : user.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer
                  ${node.assigned_to === user.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getUserColor(user.id) }}
                >
                  {user.name[0]}
                </div>
                <span className="text-sm">{user.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">
            <Calendar size={14} className="inline mr-1" />
            Data de Entrega
          </label>
          <input
            type="date"
            value={node.due_date ? node.due_date.split('T')[0] : ''}
            onChange={(e) => handleUpdateField('due_date', e.target.value || null)}
            className="input"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Descrição</label>
          <textarea
            value={node.description || ''}
            onChange={(e) => handleUpdateField('description', e.target.value)}
            placeholder="Adicione uma descrição..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">
            <MessageSquare size={14} className="inline mr-1" />
            Comentários ({comments.length})
          </label>
          
          <div className="space-y-3 mb-3">
            {comments.map(comment => {
              const commentUser = users.find(u => u.id === comment.user_id) || comment.user;
              return (
                <div key={comment.id} className="flex gap-2">
                  <div 
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: commentUser ? getUserColor(commentUser.id) : '#6366f1' }}
                  >
                    {commentUser?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {commentUser?.name || 'Usuário'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.created_at).toLocaleString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{comment.content}</p>
                  </div>
                </div>
              );
            })}
            
            {comments.length === 0 && !isLoadingComments && (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum comentário ainda</p>
            )}
          </div>
          
          {/* Add Comment */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Escreva um comentário..."
              className="input flex-1"
            />
            <button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="btn-primary !px-3"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Criado em {new Date(node.created_at).toLocaleDateString('pt-BR')}
          </span>
          {node.updated_at && (
            <span>
              Atualizado {new Date(node.updated_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
