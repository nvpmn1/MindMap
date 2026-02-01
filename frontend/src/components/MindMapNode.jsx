import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  User, 
  Calendar,
  Flag,
  MoreHorizontal,
  Link,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { useMindmapStore, useUserStore, useViewStore } from '../store';
import { nodesAPI, aiAPI } from '../lib/api';

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
};

const statusColors = {
  todo: 'border-l-slate-400',
  doing: 'border-l-blue-500',
  done: 'border-l-green-500',
};

const typeColors = {
  idea: 'from-indigo-500/20 to-purple-500/20',
  task: 'from-emerald-500/20 to-teal-500/20',
  note: 'from-amber-500/20 to-orange-500/20',
};

function MindMapNode({ id, data, selected }) {
  const { 
    addNode, 
    updateNode, 
    removeNode, 
    currentMindmap,
    selectedNodeId,
    setSelectedNodeId,
    editingNodeId,
    setEditingNodeId
  } = useMindmapStore();
  
  const { currentUser, users, getUserColor } = useUserStore();
  const { openDetailsPanel } = useViewStore();
  
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const [isExpanding, setIsExpanding] = useState(false);
  
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditContent(data.content);
    setEditingNodeId(id);
  }, [data.content, id, setEditingNodeId]);

  const handleSaveEdit = useCallback(async () => {
    if (editContent.trim() && editContent !== data.content) {
      try {
        await nodesAPI.update(id, { 
          content: editContent.trim(),
          userId: currentUser?.id 
        });
        updateNode(id, { content: editContent.trim() });
      } catch (error) {
        console.error('Failed to update node:', error);
      }
    }
    setIsEditing(false);
    setEditingNodeId(null);
  }, [editContent, data.content, id, currentUser, updateNode, setEditingNodeId]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(data.content);
    setEditingNodeId(null);
  }, [data.content, setEditingNodeId]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleAddChild = useCallback(async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    try {
      const result = await nodesAPI.create({
        mindmapId: currentMindmap.id,
        parentId: id,
        content: 'Nova ideia',
        type: 'idea',
        userId: currentUser?.id
      });
      addNode(result.data);
    } catch (error) {
      console.error('Failed to create child node:', error);
    }
  }, [id, currentMindmap, currentUser, addNode]);

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (!window.confirm('Excluir este nó e todos os seus filhos?')) return;
    
    try {
      await nodesAPI.delete(id, currentUser?.id);
      removeNode(id);
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  }, [id, currentUser, removeNode]);

  const handleExpandWithAI = useCallback(async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsExpanding(true);
    
    try {
      const result = await aiAPI.expandNode(id, data.content, {
        mindmapId: currentMindmap?.id,
        userId: currentUser?.id
      });
      
      // Create child nodes from suggestions
      for (const suggestion of result.data.suggestions) {
        await nodesAPI.create({
          mindmapId: currentMindmap.id,
          parentId: id,
          content: suggestion,
          type: 'idea',
          userId: currentUser?.id
        });
      }
    } catch (error) {
      console.error('Failed to expand node:', error);
    } finally {
      setIsExpanding(false);
    }
  }, [id, data.content, currentMindmap, currentUser]);

  const handleOpenDetails = useCallback((e) => {
    e.stopPropagation();
    setShowMenu(false);
    openDetailsPanel(id);
  }, [id, openDetailsPanel]);

  const assignee = data.assigned_to ? users.find(u => u.id === data.assigned_to) : null;
  const assigneeColor = assignee ? getUserColor(assignee.id) : null;

  const isRoot = !data.parent_id;
  const level = data.level || 0;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        relative group
        ${isRoot ? 'min-w-[180px]' : 'min-w-[140px]'}
      `}
    >
      {/* Node Card */}
      <div
        className={`
          relative px-4 py-3 rounded-xl
          bg-gradient-to-br ${typeColors[data.type] || typeColors.idea}
          bg-white dark:bg-slate-800
          border-2 border-slate-200 dark:border-slate-700
          ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${data.status ? `border-l-4 ${statusColors[data.status]}` : ''}
          shadow-node hover:shadow-node-hover
          transition-all duration-200
          cursor-pointer
        `}
        onDoubleClick={handleStartEdit}
      >
        {/* Priority indicator */}
        {data.priority && (
          <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[data.priority]}`}>
            <Flag size={10} className="inline mr-1" />
            {data.priority === 'high' ? 'Alta' : data.priority === 'medium' ? 'Média' : 'Baixa'}
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-700 rounded border-none focus:ring-2 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={handleSaveEdit} className="p-1 text-green-500 hover:bg-green-100 rounded">
              <Check size={14} />
            </button>
            <button onClick={handleCancelEdit} className="p-1 text-red-500 hover:bg-red-100 rounded">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isRoot ? 'text-lg' : 'text-sm'} text-slate-800 dark:text-slate-200`}>
              {data.content}
            </span>
            
            {/* Status badge */}
            {data.status === 'done' && (
              <Check size={14} className="text-green-500" />
            )}
          </div>
        )}

        {/* Description preview */}
        {data.description && !isEditing && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Footer info */}
        {(assignee || data.due_date) && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
            {assignee && (
              <div 
                className="flex items-center gap-1"
                style={{ color: assigneeColor }}
              >
                <User size={12} />
                <span>{assignee.name}</span>
              </div>
            )}
            {data.due_date && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{new Date(data.due_date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        )}

        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Context Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]"
            >
              <button
                onClick={handleAddChild}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Plus size={14} />
                Adicionar filho
              </button>
              
              <button
                onClick={handleStartEdit}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Editar
              </button>
              
              <button
                onClick={handleExpandWithAI}
                disabled={isExpanding}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-purple-600"
              >
                {isExpanding ? (
                  <div className="spinner !w-3.5 !h-3.5" />
                ) : (
                  <Sparkles size={14} />
                )}
                {isExpanding ? 'Gerando...' : 'Expandir com IA'}
              </button>
              
              <button
                onClick={handleOpenDetails}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Paperclip size={14} />
                Ver detalhes
              </button>
              
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanding indicator */}
        {isExpanding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-purple-500 text-xs"
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>IA pensando...</span>
          </motion.div>
        )}
      </div>

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
    </motion.div>
  );
}

export default memo(MindMapNode);
