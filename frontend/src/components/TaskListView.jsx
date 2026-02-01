import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Check, 
  Circle,
  User,
  Calendar,
  Flag,
  MoreHorizontal,
  GripVertical,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import { useMindmapStore, useUserStore, useViewStore } from '../store';
import { nodesAPI, tasksAPI, aiAPI } from '../lib/api';

const statusIcons = {
  todo: <Circle size={14} className="text-slate-400" />,
  doing: <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />,
  done: <Check size={14} className="text-green-500" />
};

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-green-500'
};

function ListItem({ node, depth = 0, onToggleExpand, expandedNodes }) {
  const { currentUser, users, getUserColor } = useUserStore();
  const { updateNode, removeNode, addNode, currentMindmap, nodes } = useMindmapStore();
  const { openDetailsPanel } = useViewStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const children = nodes.filter(n => n.parent_id === node.id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  const assignee = node.assigned_to ? users.find(u => u.id === node.assigned_to) : null;
  const assigneeColor = assignee ? getUserColor(assignee.id) : null;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== node.content) {
      try {
        await nodesAPI.update(node.id, { 
          content: editContent.trim(),
          userId: currentUser?.id 
        });
        updateNode(node.id, { content: editContent.trim() });
      } catch (error) {
        console.error('Failed to update:', error);
      }
    }
    setIsEditing(false);
  };

  const handleStatusToggle = async () => {
    const statuses = [null, 'todo', 'doing', 'done'];
    const currentIndex = statuses.indexOf(node.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
      if (nextStatus) {
        await tasksAPI.updateStatus(node.id, nextStatus, currentUser?.id);
      }
      updateNode(node.id, { status: nextStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddChild = async () => {
    try {
      const result = await nodesAPI.create({
        mindmapId: currentMindmap?.id,
        parentId: node.id,
        content: 'Nova ideia',
        type: 'idea',
        userId: currentUser?.id
      });
      addNode(result.data);
      onToggleExpand(node.id, true); // Expand to show new child
    } catch (error) {
      console.error('Failed to create:', error);
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Excluir este item e todos os filhos?')) return;
    try {
      await nodesAPI.delete(node.id, currentUser?.id);
      removeNode(node.id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setShowMenu(false);
  };

  const handleExpandWithAI = async () => {
    setIsExpanding(true);
    setShowMenu(false);
    
    try {
      const result = await aiAPI.expandNode(node.id, node.content, {
        mindmapId: currentMindmap?.id,
        userId: currentUser?.id
      });
      
      for (const suggestion of result.data.suggestions) {
        await nodesAPI.create({
          mindmapId: currentMindmap.id,
          parentId: node.id,
          content: suggestion,
          type: 'idea',
          userId: currentUser?.id
        });
      }
      onToggleExpand(node.id, true);
    } catch (error) {
      console.error('Failed to expand:', error);
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
          group flex items-center gap-2 py-2 px-3 rounded-lg
          hover:bg-slate-100 dark:hover:bg-slate-800
          transition-colors cursor-pointer
          ${node.status === 'done' ? 'opacity-60' : ''}
        `}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={handleToggle}
          className={`p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${!hasChildren ? 'invisible' : ''}`}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Status Checkbox */}
        <button
          onClick={handleStatusToggle}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          title={node.status ? `Status: ${node.status}` : 'Clique para definir status'}
        >
          {node.status ? statusIcons[node.status] : <Circle size={14} className="text-slate-300" />}
        </button>

        {/* Content */}
        {isEditing ? (
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={`flex-1 text-sm ${node.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}
            onDoubleClick={() => setIsEditing(true)}
          >
            {node.content}
          </span>
        )}

        {/* AI Expanding indicator */}
        {isExpanding && (
          <div className="flex items-center gap-1 text-purple-500 text-xs">
            <Sparkles size={12} className="animate-pulse" />
            <span>Gerando...</span>
          </div>
        )}

        {/* Metadata badges */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.priority && (
            <Flag size={12} className={priorityColors[node.priority]} />
          )}
          
          {node.due_date && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={12} />
              {new Date(node.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
          
          {assignee && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: assigneeColor }}
              title={assignee.name}
            >
              {assignee.name[0]}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddChild}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
            title="Adicionar filho"
          >
            <Plus size={14} />
          </button>
          
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Context Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute right-4 mt-8 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[140px]"
            >
              <button
                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Editar
              </button>
              <button
                onClick={handleExpandWithAI}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-purple-600"
              >
                <Sparkles size={14} />
                Expandir com IA
              </button>
              <button
                onClick={() => { openDetailsPanel(node.id); setShowMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                Ver detalhes
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              <button
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children.map(child => (
              <ListItem 
                key={child.id} 
                node={child} 
                depth={depth + 1}
                onToggleExpand={onToggleExpand}
                expandedNodes={expandedNodes}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TaskListView() {
  const { nodes, currentMindmap, addNode } = useMindmapStore();
  const { currentUser } = useUserStore();
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all' | 'tasks' | 'ideas'
  const [searchQuery, setSearchQuery] = useState('');

  // Get root nodes
  const rootNodes = useMemo(() => {
    let filtered = nodes.filter(n => !n.parent_id);
    
    if (filter === 'tasks') {
      // Show only task branches
      const getTaskBranch = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node?.status) return true;
        const children = nodes.filter(n => n.parent_id === nodeId);
        return children.some(c => getTaskBranch(c.id));
      };
      filtered = filtered.filter(n => getTaskBranch(n.id));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchingIds = new Set();
      
      const addBranch = (nodeId) => {
        matchingIds.add(nodeId);
        // Add parents
        const node = nodes.find(n => n.id === nodeId);
        if (node?.parent_id) addBranch(node.parent_id);
        // Add children
        nodes.filter(n => n.parent_id === nodeId).forEach(c => matchingIds.add(c.id));
      };
      
      nodes.forEach(n => {
        if (n.content.toLowerCase().includes(query)) {
          addBranch(n.id);
        }
      });
      
      filtered = filtered.filter(n => matchingIds.has(n.id));
    }
    
    return filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [nodes, filter, searchQuery]);

  const handleToggleExpand = useCallback((nodeId, forceExpand = false) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (forceExpand || !next.has(nodeId)) {
        next.add(nodeId);
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = () => {
    setExpandedNodes(new Set(nodes.map(n => n.id)));
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleAddRoot = async () => {
    try {
      const result = await nodesAPI.create({
        mindmapId: currentMindmap?.id,
        content: 'Nova ideia',
        type: 'idea',
        userId: currentUser?.id
      });
      addNode(result.data);
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Lista de Ideias
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input !w-48"
          />
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input !w-auto !py-1.5"
          >
            <option value="all">Todos</option>
            <option value="tasks">Apenas tarefas</option>
          </select>
          
          {/* Expand/Collapse */}
          <div className="flex gap-1">
            <button onClick={handleExpandAll} className="btn-ghost !px-2" title="Expandir todos">
              <ChevronDown size={16} />
            </button>
            <button onClick={handleCollapseAll} className="btn-ghost !px-2" title="Recolher todos">
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Add Root */}
          <button onClick={handleAddRoot} className="btn-primary">
            <Plus size={16} />
            <span>Nova Ideia</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {rootNodes.length > 0 ? (
          rootNodes.map(node => (
            <ListItem
              key={node.id}
              node={node}
              depth={0}
              onToggleExpand={handleToggleExpand}
              expandedNodes={expandedNodes}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p className="text-lg">Nenhuma ideia ainda</p>
            <p className="text-sm mt-1">Clique em "Nova Ideia" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
