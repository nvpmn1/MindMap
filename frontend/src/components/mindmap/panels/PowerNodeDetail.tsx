// ============================================================================
// NeuralMap - Node Detail Panel (Rich Editing Side Panel)
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronDown, Plus, Trash2, CheckCircle2, Circle,
  BarChart3, FileText, MessageSquare, Paperclip, Clock, Users,
  Sparkles, Edit3, ExternalLink, Target, GitBranch, Calendar,
  Tag, ArrowUpDown, Eye, Maximize2, Minimize2
} from 'lucide-react';
import { NODE_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '../editor/constants';
import type { PowerNode, NeuralNodeData, ChecklistItem, NodeStatus, NodePriority } from '../editor/types';
import { useAuthStore } from '@/stores/authStore';

interface NodeDetailPanelProps {
  node: PowerNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<NeuralNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

type DetailTab = 'overview' | 'metrics' | 'checklist' | 'attachments' | 'comments' | 'ai';

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node, isOpen, onClose, onUpdate, onDelete
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  if (!node || !isOpen) return null;

  const data = node.data;
  const config = NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.idea;

  const tabs: Array<{ id: DetailTab; label: string; icon: React.FC<any>; count?: number }> = [
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle2, count: data.checklist?.length },
    { id: 'attachments', label: 'Anexos', icon: Paperclip, count: data.attachments?.length },
    { id: 'comments', label: 'Comentários', icon: MessageSquare, count: data.commentCount },
    { id: 'ai', label: 'IA', icon: Sparkles },
  ];

  const panelWidth = isExpanded ? 'w-[560px]' : 'w-[420px]';

  return (
    <AnimatePresence>
      <motion.div
        key="detail-panel"
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-14 h-[calc(100%-3.5rem)] ${panelWidth} z-40 flex flex-col
          bg-[#080d16]/95 backdrop-blur-xl border-l border-white/[0.06]
          shadow-[-8px_0_32px_rgba(0,0,0,0.3)]`}
      >
        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center
              bg-gradient-to-br ${config.gradient} border ${config.borderColor}`}>
              {React.createElement(config.icon, { className: 'w-4 h-4', style: { color: config.color } })}
            </div>
            <div className="flex-1 min-w-0">
              <input
                value={data.label}
                onChange={(e) => onUpdate(node.id, { label: e.target.value })}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none
                  hover:bg-white/5 focus:bg-white/5 rounded px-1 -ml-1 transition-colors"
              />
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-medium" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-500">
                  {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('pt-BR') : 'Agora'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-white/5 overflow-x-auto
          scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                whitespace-nowrap transition-all
                ${activeTab === tab.id 
                  ? 'bg-white/[0.08] text-white' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'}`}
            >
              {React.createElement(tab.icon, { className: 'w-3.5 h-3.5' })}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/10 text-[9px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Content ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin 
          scrollbar-thumb-white/5 scrollbar-track-transparent">
          
          {activeTab === 'overview' && (
            <OverviewTab node={node} onUpdate={onUpdate} />
          )}
          {activeTab === 'metrics' && (
            <MetricsTab node={node} onUpdate={onUpdate} />
          )}
          {activeTab === 'checklist' && (
            <ChecklistTab node={node} onUpdate={onUpdate} />
          )}
          {activeTab === 'attachments' && (
            <AttachmentsTab node={node} onUpdate={onUpdate} />
          )}
          {activeTab === 'comments' && (
            <CommentsTab node={node} onUpdate={onUpdate} />
          )}
          {activeTab === 'ai' && (
            <AITab node={node} />
          )}
        </div>

        {/* ─── Footer Actions ──────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={() => onDelete(node.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Nó
          </button>
          <div className="text-[10px] text-slate-600">
            ID: {node.id.substring(0, 8)}...
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Overview Tab ───────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ node: PowerNode; onUpdate: (id: string, data: Partial<NeuralNodeData>) => void }> = ({ node, onUpdate }) => {
  const data = node.data;

  return (
    <div className="space-y-4">
      {/* Description */}
      <FieldGroup label="Descrição">
        <textarea
          value={data.description || ''}
          onChange={(e) => onUpdate(node.id, { description: e.target.value })}
          placeholder="Adicione uma descrição..."
          rows={3}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5
            text-sm text-slate-200 placeholder-slate-600 outline-none resize-none
            focus:border-cyan-500/30 transition-colors"
        />
      </FieldGroup>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Status">
          <select
            value={data.status}
            onChange={(e) => onUpdate(node.id, { status: e.target.value as NodeStatus })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
              text-sm text-slate-300 outline-none focus:border-cyan-500/30 transition-colors
              appearance-none cursor-pointer"
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key} className="bg-[#111827]">{config.label}</option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Prioridade">
          <select
            value={data.priority}
            onChange={(e) => onUpdate(node.id, { priority: e.target.value as NodePriority })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
              text-sm text-slate-300 outline-none focus:border-cyan-500/30 transition-colors
              appearance-none cursor-pointer"
          >
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key} className="bg-[#111827]">{config.label}</option>
            ))}
          </select>
        </FieldGroup>
      </div>

      {/* Progress */}
      <FieldGroup label={`Progresso: ${data.progress || 0}%`}>
        <input
          type="range"
          min={0} max={100} step={5}
          value={data.progress || 0}
          onChange={(e) => onUpdate(node.id, { progress: parseInt(e.target.value) })}
          className="w-full accent-cyan-500"
        />
      </FieldGroup>

      {/* Tags */}
      <FieldGroup label="Tags">
        <TagsEditor
          tags={data.tags || []}
          onChange={(tags) => onUpdate(node.id, { tags })}
        />
      </FieldGroup>

      {/* Due Date */}
      {(data.type === 'task' || data.type === 'milestone') && (
        <FieldGroup label="Data Limite">
          <input
            type="date"
            value={data.dueDate || ''}
            onChange={(e) => onUpdate(node.id, { dueDate: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
              text-sm text-slate-300 outline-none focus:border-cyan-500/30 transition-colors"
          />
        </FieldGroup>
      )}
    </div>
  );
};

// ─── Metrics Tab ────────────────────────────────────────────────────────────

const MetricsTab: React.FC<{ node: PowerNode; onUpdate: (id: string, data: Partial<NeuralNodeData>) => void }> = ({ node, onUpdate }) => {
  const data = node.data;

  return (
    <div className="space-y-4">
      {/* Impact/Effort/Confidence */}
      <div className="grid grid-cols-3 gap-3">
        <MetricSlider
          label="Impacto"
          value={data.impact}
          onChange={(v) => onUpdate(node.id, { impact: v })}
          color="#10b981"
        />
        <MetricSlider
          label="Esforço"
          value={data.effort}
          onChange={(v) => onUpdate(node.id, { effort: v })}
          color="#f59e0b"
        />
        <MetricSlider
          label="Confiança"
          value={data.confidence}
          onChange={(v) => onUpdate(node.id, { confidence: v })}
          color="#06b6d4"
        />
      </div>

      {/* Estimated vs Actual Hours */}
      {data.type === 'task' && (
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Horas Estimadas">
            <input
              type="number"
              min={0}
              value={data.estimatedHours || 0}
              onChange={(e) => onUpdate(node.id, { estimatedHours: parseFloat(e.target.value) })}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
                text-sm text-slate-300 outline-none focus:border-cyan-500/30"
            />
          </FieldGroup>
          <FieldGroup label="Horas Reais">
            <input
              type="number"
              min={0}
              value={data.actualHours || 0}
              onChange={(e) => onUpdate(node.id, { actualHours: parseFloat(e.target.value) })}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
                text-sm text-slate-300 outline-none focus:border-cyan-500/30"
            />
          </FieldGroup>
        </div>
      )}

      {/* Priority Matrix */}
      <FieldGroup label="Matriz de Prioridade">
        <div className="relative w-full aspect-square max-h-[200px] bg-white/[0.02] rounded-xl 
          border border-white/[0.06] overflow-hidden">
          {/* Quadrants */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-white/5 flex items-center justify-center">
              <span className="text-[9px] text-slate-600">Alto Imp / Baixo Esf</span>
            </div>
            <div className="border-b border-white/5 flex items-center justify-center">
              <span className="text-[9px] text-slate-600">Alto Imp / Alto Esf</span>
            </div>
            <div className="border-r border-white/5 flex items-center justify-center">
              <span className="text-[9px] text-slate-600">Baixo Imp / Baixo Esf</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[9px] text-slate-600">Baixo Imp / Alto Esf</span>
            </div>
          </div>
          {/* Node dot */}
          <div
            className="absolute w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg
              shadow-cyan-500/30 transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${data.effort}%`,
              top: `${100 - data.impact}%`,
            }}
          />
        </div>
      </FieldGroup>
    </div>
  );
};

// ─── Checklist Tab ──────────────────────────────────────────────────────────

const ChecklistTab: React.FC<{ node: PowerNode; onUpdate: (id: string, data: Partial<NeuralNodeData>) => void }> = ({ node, onUpdate }) => {
  const [newItem, setNewItem] = useState('');
  const items = node.data.checklist || [];

  const addItem = () => {
    if (!newItem.trim()) return;
    const item: ChecklistItem = {
      id: `check_${Date.now()}`,
      text: newItem.trim(),
      completed: false,
    };
    onUpdate(node.id, { checklist: [...items, item] });
    setNewItem('');
  };

  const toggleItem = (itemId: string) => {
    onUpdate(node.id, {
      checklist: items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i)
    });
  };

  const deleteItem = (itemId: string) => {
    onUpdate(node.id, { checklist: items.filter(i => i.id !== itemId) });
  };

  const progress = items.length > 0 
    ? Math.round((items.filter(i => i.completed).length / items.length) * 100) 
    : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{progress}%</span>
      </div>

      {/* Add item */}
      <div className="flex items-center gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Novo item..."
          className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
            text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/30"
        />
        <button onClick={addItem}
          className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            className="flex items-center gap-2 px-3 py-2 rounded-xl
              bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
          >
            <button onClick={() => toggleItem(item.id)}>
              {item.completed 
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300" />
              }
            </button>
            <span className={`flex-1 text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
              {item.text}
            </span>
            <button 
              onClick={() => deleteItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg 
                text-slate-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Nenhum item na checklist
        </div>
      )}
    </div>
  );
};

// ─── Attachments Tab ────────────────────────────────────────────────────────

const AttachmentsTab: React.FC<{ node: PowerNode; onUpdate: (id: string, data: Partial<NeuralNodeData>) => void }> = ({ node, onUpdate }) => {
  const attachments = node.data.attachments || [];
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newAttachments = [...attachments];
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit
      const reader = new FileReader();
      reader.onload = () => {
        const attachmentType = normalizeAttachmentType(file.type);
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: attachmentType,
          url: reader.result as string,
          size: file.size,
        });
        onUpdate(node.id, { attachments: [...newAttachments] });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteAttachment = (attId: string) => {
    onUpdate(node.id, { attachments: attachments.filter(a => a.id !== attId) });
  };

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFileSelect(e.dataTransfer.files); }}
        className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center
          hover:border-cyan-500/30 transition-all cursor-pointer"
      >
        <Paperclip className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Arraste arquivos ou clique para anexar</p>
        <p className="text-[10px] text-slate-600 mt-1">PNG, JPG, PDF, DOC até 10MB</p>
      </div>

      {/* Attachments list */}
      {attachments.map((att) => (
        <div key={att.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
          bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200 truncate">{att.name}</div>
            <div className="text-[10px] text-slate-500">{att.type}</div>
          </div>
          {att.url && (
            <a href={att.url} target="_blank" rel="noopener" 
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => handleDeleteAttachment(att.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {attachments.length === 0 && (
        <div className="text-center py-4 text-slate-500 text-sm">
          Nenhum anexo
        </div>
      )}
    </div>
  );
};

// ─── Comments Tab ───────────────────────────────────────────────────────────

const CommentsTab: React.FC<{ node: PowerNode; onUpdate?: (id: string, data: Partial<NeuralNodeData>) => void }> = ({ node, onUpdate }) => {
  const { profile, user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const comments = node.data.comments || [];

  const handleAddComment = () => {
    if (!newComment.trim() || !onUpdate) return;
    const userId = profile?.id || user?.id || 'local-user';
    const userName = profile?.display_name || user?.display_name || profile?.email || user?.email || 'Você';
    const userColor = profile?.color || user?.color || '#06b6d4';
    const comment = {
      id: `comment_${Date.now()}`,
      userId,
      content: newComment.trim(),
      userName,
      userColor,
      createdAt: new Date().toISOString(),
    };
    onUpdate(node.id, { comments: [...comments, comment], commentCount: (node.data.commentCount || 0) + 1 });
    setNewComment('');
  };

  return (
    <div className="space-y-3">
      {/* Comment input */}
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center
          text-[10px] font-bold text-cyan-400 flex-shrink-0 mt-1">
          U
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2
              text-sm text-white placeholder-slate-600 outline-none resize-none
              focus:border-cyan-500/30 transition-colors"
          />
          <div className="flex justify-end mt-1.5">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium
                bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 
                disabled:opacity-30 transition-all"
            >
              Comentar
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: comment.userColor }}>
            {comment.userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white">{comment.userName}</span>
              <span className="text-[10px] text-slate-600">
                {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-0.5">{comment.content}</p>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm">
          Nenhum comentário ainda
        </div>
      )}
    </div>
  );
};

// ─── AI Tab ─────────────────────────────────────────────────────────────────

const AITab: React.FC<{ node: PowerNode }> = ({ node }) => {
  const aiData = node.data.ai;

  return (
    <div className="space-y-4">
      {aiData?.generated ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Gerado por IA</span>
            {aiData.model && (
              <span className="text-[10px] text-purple-400/60 ml-auto">{aiData.model}</span>
            )}
          </div>

          {aiData.confidence !== undefined && (
            <FieldGroup label="Confiança da IA">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${aiData.confidence * 100}%` }} />
                </div>
                <span className="text-xs text-purple-300">{Math.round(aiData.confidence * 100)}%</span>
              </div>
            </FieldGroup>
          )}

          {aiData.reasoning && (
            <FieldGroup label="Raciocínio">
              <p className="text-sm text-slate-400 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                {aiData.reasoning}
              </p>
            </FieldGroup>
          )}

          {aiData.hypotheses && aiData.hypotheses.length > 0 && (
            <FieldGroup label="Hipóteses">
              <div className="space-y-2">
                {aiData.hypotheses.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02]">
                    <div className="flex-1 text-sm text-slate-300">{h.text}</div>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {Math.round(h.probability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </FieldGroup>
          )}

          {aiData.suggestions && aiData.suggestions.length > 0 && (
            <FieldGroup label="Sugestões">
              <div className="space-y-1">
                {aiData.suggestions.map((s, i) => (
                  <div key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    {s}
                  </div>
                ))}
              </div>
            </FieldGroup>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Este nó não foi gerado por IA</p>
          <p className="text-xs text-slate-600 mt-1">Use o Agent Panel para gerar conteúdo inteligente</p>
        </div>
      )}
    </div>
  );
};

// ─── Shared Components ──────────────────────────────────────────────────────

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
      {label}
    </label>
    {children}
  </div>
);

const MetricSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void; color: string }> = ({
  label, value, onChange, color
}) => (
  <div className="text-center">
    <div className="text-[10px] text-slate-500 mb-1">{label}</div>
    <div className="text-lg font-bold" style={{ color }}>{value}</div>
    <input
      type="range"
      min={0} max={100} step={5}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full mt-1"
      style={{ accentColor: color }}
    />
  </div>
);

const TagsEditor: React.FC<{ tags: string[]; onChange: (tags: string[]) => void }> = ({ tags, onChange }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    if (!input.trim() || tags.includes(input.trim())) return;
    onChange([...tags, input.trim()]);
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs
            bg-white/5 text-slate-300 border border-white/[0.06]">
            {tag}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))}
              className="text-slate-500 hover:text-red-400">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTag()}
          placeholder="Nova tag..."
          className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5
            text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/30"
        />
        <button onClick={addTag}
          className="px-2 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default NodeDetailPanel;

const normalizeAttachmentType = (mimeType: string): 'image' | 'video' | 'file' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
};
