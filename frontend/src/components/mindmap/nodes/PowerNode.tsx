// ============================================================================
// NeuralMap - PowerNode Component (Revolutionary Node)
// ============================================================================

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionHandlesSet } from './ConnectionHandles';
import {
  Plus,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Copy,
  Sparkles,
  Edit3,
  Link,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  ArrowUpRight,
  Users,
  Eye,
  GitBranch,
  Zap,
  Brain,
  ListTodo,
  Search,
  BarChart3,
  Lock,
  LockOpen,
  Pin,
  PinOff,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { NODE_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '../editor/constants';
import type { NeuralNodeData, ChartData, ChecklistItem } from '../editor/types';

// ─── Mini Chart Components ──────────────────────────────────────────────────

const MiniBarChart: React.FC<{ data: number[]; color?: string; height?: number }> = ({
  data,
  color = '#06b6d4',
  height = 32,
}) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="flex-1 rounded-t-sm min-w-[3px]"
          style={{ backgroundColor: color, opacity: 0.4 + (val / max) * 0.6 }}
        />
      ))}
    </div>
  );
};

const MiniPieChart: React.FC<{ data: number[]; colors?: string[]; size?: number }> = ({
  data,
  colors = ['#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ef4444'],
  size = 40,
}) => {
  const total = data.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const radius = size / 2 - 2;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((val, i) => {
        const startAngle = (cumulative / total) * 360;
        cumulative += val;
        const endAngle = (cumulative / total) * 360;
        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return <path key={i} d={d} fill={colors[i % colors.length]} opacity={0.8} />;
      })}
    </svg>
  );
};

const MiniLineChart: React.FC<{
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}> = ({ data, color = '#06b6d4', height = 32, width = 80 }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      {/* Last point dot */}
      <circle
        cx={step * (data.length - 1)}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2.5"
        fill={color}
      />
    </svg>
  );
};

// ─── Progress Ring ──────────────────────────────────────────────────────────

const ProgressRing: React.FC<{ progress: number; size?: number; color?: string }> = ({
  progress,
  size = 28,
  color = '#06b6d4',
}) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          style={{ strokeDasharray: circumference }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/60">
        {progress}
      </span>
    </div>
  );
};

// ─── Toolbar Components ─────────────────────────────────────────────────────

const ToolbarButton: React.FC<{
  icon: React.FC<any>;
  label: string;
  color: 'cyan' | 'blue' | 'purple' | 'amber' | 'red' | 'green';
  onClick: () => void;
  shortcut?: string;
  danger?: boolean;
}> = ({ icon: Icon, label, color, onClick, shortcut, danger }) => {
  const colorMap = {
    cyan: 'hover:bg-cyan-500/20 hover:text-cyan-300 text-cyan-400',
    blue: 'hover:bg-blue-500/20 hover:text-blue-300 text-blue-400',
    purple: 'hover:bg-purple-500/20 hover:text-purple-300 text-purple-400',
    amber: 'hover:bg-amber-500/20 hover:text-amber-300 text-amber-400',
    green: 'hover:bg-emerald-500/20 hover:text-emerald-300 text-emerald-400',
    red: 'hover:bg-red-500/20 hover:text-red-300 text-red-400',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group relative p-2 rounded-lg transition-all ${colorMap[color]} ${danger ? 'text-red-400' : ''}`}
      title={label}
    >
      <Icon className="w-4 h-4" />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 -bottom-10 px-2.5 py-1 
          bg-black/80 text-white text-[11px] font-medium rounded-lg whitespace-nowrap
          pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div>{label}</div>
        {shortcut && <div className="text-[9px] text-slate-400 mt-0.5">{shortcut}</div>}
      </motion.div>
    </motion.button>
  );
};

const AISubmenuTrigger: React.FC<{
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
  onAction: (action: string) => void;
}> = ({ isActive, onHover, onClick, onAction }) => (
  <div className="relative group">
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onMouseEnter={onHover}
      className={`relative p-2 rounded-lg transition-all
        ${
          isActive
            ? 'bg-purple-500/30 text-purple-300'
            : 'hover:bg-purple-500/20 hover:text-purple-300 text-purple-400'
        }`}
      title="IA - Expandir com IA"
    >
      <Sparkles className="w-4 h-4" />
      <ChevronDown
        className={`absolute -right-1 -bottom-1 w-3 h-3 transition-transform ${isActive ? 'rotate-180' : ''}`}
      />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 -bottom-10 px-2.5 py-1 
          bg-black/80 text-white text-[11px] font-medium rounded-lg whitespace-nowrap
          pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        IA
      </motion.div>
    </motion.button>
  </div>
);

const MoreSubmenuTrigger: React.FC<{
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
  isPinned?: boolean;
  isLocked?: boolean;
  nodeId: string;
  onUpdateData?: (nodeId: string, data: Partial<any>) => void;
}> = ({ isActive, onHover, onClick, isPinned, isLocked }) => (
  <div className="relative group">
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onMouseEnter={onHover}
      className={`relative p-2 rounded-lg transition-all
        ${
          isActive
            ? 'bg-slate-500/30 text-slate-300'
            : 'hover:bg-slate-500/20 hover:text-slate-300 text-slate-400'
        }`}
      title="Mais ações"
    >
      <MoreHorizontal className="w-4 h-4" />
      <ChevronDown
        className={`absolute -right-1 -bottom-1 w-3 h-3 transition-transform ${isActive ? 'rotate-180' : ''}`}
      />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 -bottom-10 px-2.5 py-1 
          bg-black/80 text-white text-[11px] font-medium rounded-lg whitespace-nowrap
          pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Mais
      </motion.div>
    </motion.button>
  </div>
);

// ─── Submenu Components ──────────────────────────────────────────────────────

const AISubmenu: React.FC<{
  onAction: (action: string) => void;
  nodeId: string;
  toolbarPosition: 'top' | 'bottom';
}> = ({ onAction, toolbarPosition }) => (
  <motion.div
    initial={{ opacity: 0, y: toolbarPosition === 'top' ? -8 : 8, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: toolbarPosition === 'top' ? -8 : 8, scale: 0.95 }}
    transition={{ duration: 0.15 }}
    className={`absolute left-1/2 -translate-x-1/2 w-56 z-30
      bg-gradient-to-b from-[#1a2332]/98 to-[#0f1419]/98 backdrop-blur-xl 
      border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden py-1
      ${toolbarPosition === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
  >
    <div className="px-3 py-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
      🚀 Inteligência
    </div>

    <AISubMenuButton
      icon={Sparkles}
      label="Expandir com IA"
      onClick={() => onAction('aiExpand')}
      description="Gera ideias relacionadas"
    />
    <AISubMenuButton
      icon={Brain}
      label="Analisar Profundo"
      onClick={() => onAction('aiAnalyze')}
      description="Análise detalhada"
    />
    <AISubMenuButton
      icon={ListTodo}
      label="Gerar Tarefas"
      onClick={() => onAction('aiTasks')}
      description="Cria ações"
    />
    <AISubMenuButton
      icon={Search}
      label="Pesquisar Tema"
      onClick={() => onAction('aiResearch')}
      description="Busca informações"
    />
    <AISubMenuButton
      icon={BarChart3}
      label="Gerar Gráfico"
      onClick={() => onAction('aiChart')}
      description="Cria visualizações"
    />
  </motion.div>
);

const MoreSubmenu: React.FC<{
  isPinned?: boolean;
  isLocked?: boolean;
  nodeId: string;
  onUpdateData?: (nodeId: string, data: Partial<any>) => void;
  onAction: (action: string) => void;
  toolbarPosition: 'top' | 'bottom';
}> = ({ isPinned, isLocked, nodeId, onUpdateData, toolbarPosition }) => (
  <motion.div
    initial={{ opacity: 0, y: toolbarPosition === 'top' ? -8 : 8, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: toolbarPosition === 'top' ? -8 : 8, scale: 0.95 }}
    transition={{ duration: 0.15 }}
    className={`absolute left-1/2 -translate-x-1/2 w-48 z-30
      bg-gradient-to-b from-[#1a2332]/98 to-[#0f1419]/98 backdrop-blur-xl 
      border border-slate-500/20 rounded-xl shadow-2xl overflow-hidden py-1
      ${toolbarPosition === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
  >
    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      Configurar
    </div>

    <button
      onClick={() => onUpdateData?.(nodeId, { pinned: !isPinned })}
      className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2 group"
    >
      {isPinned ? (
        <PinOff className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Pin className="w-3.5 h-3.5 text-amber-400" />
      )}
      <span className="flex-1">{isPinned ? 'Desafixar' : 'Fixar Posição'}</span>
    </button>

    <button
      onClick={() => onUpdateData?.(nodeId, { locked: !isLocked })}
      className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2 group"
    >
      {isLocked ? (
        <LockOpen className="w-3.5 h-3.5 text-orange-400" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-orange-400" />
      )}
      <span className="flex-1">{isLocked ? 'Desbloquear' : 'Bloquear'}</span>
    </button>

    <div className="my-1 h-px bg-white/[0.06]" />

    <button className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2">
      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
      <span>Compartilhar</span>
    </button>

    <button className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2">
      <Link className="w-3.5 h-3.5 text-blue-400" />
      <span>Vincular</span>
    </button>
  </motion.div>
);

const AISubMenuButton: React.FC<{
  icon: React.FC<any>;
  label: string;
  onClick: () => void;
  description: string;
}> = ({ icon: Icon, label, onClick, description }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className="w-full px-3 py-2.5 text-left flex items-start gap-2.5 hover:bg-purple-500/10 transition-all group"
  >
    <Icon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <div className="text-xs font-medium text-purple-300 group-hover:text-purple-200">{label}</div>
      <div className="text-[10px] text-slate-500 group-hover:text-slate-400">{description}</div>
    </div>
  </motion.button>
);

// ─── PowerNode Component ────────────────────────────────────────────────────

const PowerNodeComponent: React.FC<NodeProps> = ({ id, data: rawData, selected }) => {
  const data = rawData as unknown as NeuralNodeData;
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'top' | 'bottom'>('top');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smart positioning: detect available space and position toolbar accordingly
  useEffect(() => {
    if (!isHovered || !toolbarRef.current || !containerRef.current) return;

    const updatePosition = () => {
      const toolbarRect = toolbarRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!toolbarRect || !containerRect) return;

      // Check if toolbar goes below viewport (with 250px buffer for submenu)
      const spaceBelow = window.innerHeight - containerRect.bottom;
      const toolbarHeight = toolbarRect.height;
      const submenuHeight = 250; // Approximate submenu height

      if (
        spaceBelow < toolbarHeight + submenuHeight &&
        containerRect.top > toolbarHeight + submenuHeight
      ) {
        setToolbarPosition('bottom');
      } else {
        setToolbarPosition('top');
      }
    };

    // Delayed update to ensure measurements are accurate
    const timeoutId = setTimeout(updatePosition, 0);
    return () => clearTimeout(timeoutId);
  }, [isHovered]);

  const config = NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.idea;
  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.active;
  const priorityConfig = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;

  const hasChart = data.chart && data.chart.datasets?.[0]?.data?.length > 0;
  const hasTable = data.table && data.table.rows?.length > 0;
  const hasChecklist = data.checklist && data.checklist.length > 0;
  const checklistProgress = hasChecklist
    ? Math.round((data.checklist!.filter((c) => c.completed).length / data.checklist!.length) * 100)
    : 0;

  // Callbacks passed via node data from the parent page
  const onAddChild = (data as any).onAddChild as ((nodeId: string) => void) | undefined;
  const onAIExpand = (data as any).onAIExpand as ((nodeId: string) => void) | undefined;
  const onDuplicate = (data as any).onDuplicate as ((nodeId: string) => void) | undefined;
  const onDeleteNode = (data as any).onDeleteNode as ((nodeId: string) => void) | undefined;
  const onUpdateData = (data as any).onUpdateData as
    | ((nodeId: string, data: Partial<NeuralNodeData>) => void)
    | undefined;

  // Connection Mode callbacks
  const onStartConnection = (data as any).onStartConnection as
    | ((nodeId: string, position: string) => void)
    | undefined;
  const onConfirmConnection = (data as any).onConfirmConnection as (() => void) | undefined;
  const onCancelConnection = (data as any).onCancelConnection as (() => void) | undefined;
  const isInLinkingMode = (data as any).isInLinkingMode as boolean | undefined;
  const isLinkingSource = (data as any).isLinkingSource as boolean | undefined;

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'addChild':
          onAddChild?.(id);
          break;
        case 'aiExpand':
        case 'aiAnalyze':
        case 'aiTasks':
        case 'aiResearch':
        case 'aiChart':
          onAIExpand?.(id);
          break;
        case 'duplicate':
          onDuplicate?.(id);
          break;
        case 'delete':
          onDeleteNode?.(id);
          break;
      }
      setShowMenu(false);
    },
    [id, onAddChild, onAIExpand, onDuplicate, onDeleteNode]
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      ref={containerRef}
      onMouseEnter={() => {
        console.log('🖱️ Node hovered:', { nodeId: id, isHovered: true });
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        console.log('🖱️ Node unhovered:', { nodeId: id, isHovered: false });
        setIsHovered(false);
        setShowMenu(false);
      }}
      onClick={() => {
        // If in linking mode and nó isn't the source, confirm connection
        if (isInLinkingMode && !isLinkingSource) {
          console.log('🖱️ Node clicked during linking:', {
            nodeId: id,
            isInLinkingMode,
            isLinkingSource,
          });
          onConfirmConnection?.();
        }
      }}
      animate={{
        scale: isLinkingSource ? 1.05 : selected ? 1.02 : 1,
        boxShadow: isLinkingSource
          ? `0 0 32px #10b98160, 0 0 64px #10b98140`
          : selected
            ? `0 0 24px ${config.color}30, 0 0 48px ${config.color}10`
            : isHovered
              ? `0 0 16px ${config.color}15`
              : 'none',
      }}
      className={`relative group min-w-[240px] max-w-[340px]
        rounded-2xl overflow-hidden cursor-pointer transition-all
        ${isLinkingSource ? 'border-2 border-green-500/60' : ''}
        ${isInLinkingMode && !isLinkingSource ? 'opacity-75 hover:opacity-100 cursor-crosshair' : 'opacity-100'}
        bg-[#0c1220]/90 backdrop-blur-xl
        border transition-all duration-300
        ${selected ? `border-[${config.color}]/50` : 'border-white/[0.06]'}
        hover:border-white/[0.12]`}
      style={{
        borderColor: selected ? `${config.color}60` : undefined,
      }}
    >
      {/* Glow effect */}
      {(selected || isHovered) && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${config.color}15 0%, transparent 70%)`,
          }}
        />
      )}

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="relative px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Type badge */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
              bg-gradient-to-br ${config.gradient} border ${config.borderColor}`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Type & Status */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
                {data.ai?.generated && (
                  <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                )}
              </div>

              {/* Title */}
              {isEditing ? (
                <input
                  autoFocus
                  defaultValue={data.label}
                  onBlur={(e) => {
                    const newLabel = e.target.value.trim();
                    setIsEditing(false);
                    if (newLabel && newLabel !== data.label) {
                      onUpdateData?.(id, { label: newLabel });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newLabel = (e.target as HTMLInputElement).value.trim();
                      setIsEditing(false);
                      if (newLabel && newLabel !== data.label) {
                        onUpdateData?.(id, { label: newLabel });
                      }
                    }
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none
                    border-b border-cyan-500/30 pb-0.5"
                />
              ) : (
                <h3
                  className="text-sm font-semibold text-white truncate leading-tight"
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {data.label}
                </h3>
              )}
            </div>
          </div>

          {/* Priority indicator */}
          <div className={`flex-shrink-0 text-[10px] font-bold ${priorityConfig.color}`}>
            {priorityConfig.icon}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      {/* ─── Metrics Row ─────────────────────────────────────────── */}
      {((data.impact > 0 && data.impact !== 50) ||
        (data.effort > 0 && data.effort !== 50) ||
        (data.confidence > 0 && data.confidence !== 50) ||
        data.progress > 0) && (
        <div className="px-4 py-2 flex items-center gap-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500">IMP</span>
            <span className="text-[10px] font-bold text-emerald-400">{data.impact}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500">ESF</span>
            <span className="text-[10px] font-bold text-amber-400">{data.effort}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500">CONF</span>
            <span className="text-[10px] font-bold text-cyan-400">{data.confidence}</span>
          </div>
          <div className="ml-auto">
            <ProgressRing progress={data.progress} color={config.color} />
          </div>
        </div>
      )}

      {/* ─── Chart Preview ───────────────────────────────────────── */}
      {hasChart && (
        <div className="px-4 py-2 border-t border-white/[0.04]">
          <div className="text-[9px] text-slate-500 mb-1.5">{data.chart!.title}</div>
          {data.chart!.type === 'bar' && (
            <MiniBarChart data={data.chart!.datasets[0].data} color={config.color} />
          )}
          {data.chart!.type === 'line' && (
            <MiniLineChart data={data.chart!.datasets[0].data} color={config.color} />
          )}
          {data.chart!.type === 'pie' && (
            <div className="flex justify-center">
              <MiniPieChart data={data.chart!.datasets[0].data} />
            </div>
          )}
        </div>
      )}

      {/* ─── Table Preview ───────────────────────────────────────── */}
      {hasTable && (
        <div className="px-4 py-2 border-t border-white/[0.04]">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-slate-500 border-b border-white/5">
                {data.table!.columns.slice(0, 3).map((col) => (
                  <th key={col.key} className="text-left py-1 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.table!.rows.slice(0, 3).map((row, i) => (
                <tr key={i} className="text-slate-300 border-b border-white/[0.02]">
                  {data.table!.columns.slice(0, 3).map((col) => (
                    <td key={col.key} className="py-1">
                      {String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.table!.rows.length > 3 && (
            <div className="text-[9px] text-slate-500 text-center mt-1">
              +{data.table!.rows.length - 3} linhas
            </div>
          )}
        </div>
      )}

      {/* ─── Checklist Preview ───────────────────────────────────── */}
      {hasChecklist && (
        <div className="px-4 py-2 border-t border-white/[0.04]">
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 w-full"
          >
            {showChecklist ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>
              Checklist ({data.checklist!.filter((c) => c.completed).length}/
              {data.checklist!.length})
            </span>
            <div className="flex-1 h-1 bg-white/5 rounded-full ml-1">
              <div
                className="h-full rounded-full bg-emerald-400/50 transition-all"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
          </button>
          {showChecklist && (
            <div className="mt-1.5 space-y-1">
              {data.checklist!.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-[10px]">
                  {item.completed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Circle className="w-3 h-3 text-slate-500" />
                  )}
                  <span
                    className={item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tags ────────────────────────────────────────────────── */}
      {data.tags && data.tags.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1 border-t border-white/[0.04]">
          {data.tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[9px] font-medium
              bg-white/5 text-slate-400 border border-white/[0.06]"
            >
              {tag}
            </span>
          ))}
          {data.tags.length > 4 && (
            <span className="text-[9px] text-slate-500">+{data.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          {/* Creator avatar */}
          {data.creator && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ backgroundColor: data.creator.color || '#6366f1' }}
              title={data.creator.displayName}
            >
              {data.creator.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* Assignees */}
          {data.assignees && data.assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {data.assignees.slice(0, 3).map((a, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-[#0c1220] flex items-center justify-center
                  text-[8px] font-bold text-white"
                  style={{ backgroundColor: a.color }}
                  title={a.displayName}
                >
                  {a.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          {data.commentCount && data.commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="w-3 h-3" />
              <span>{data.commentCount}</span>
            </div>
          )}
          {data.attachments && data.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <Paperclip className="w-3 h-3" />
              <span>{data.attachments.length}</span>
            </div>
          )}
          {data.connectionCount !== undefined && data.connectionCount > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <GitBranch className="w-3 h-3" />
              <span>{data.connectionCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Premium Hover Toolbar ─────────────────────────────────────── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            ref={toolbarRef}
            initial={{ opacity: 0, y: toolbarPosition === 'top' ? -8 : 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: toolbarPosition === 'top' ? -8 : 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute left-1/2 -translate-x-1/2 z-20 ${
              toolbarPosition === 'top' ? '-top-14' : '-bottom-14'
            }`}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            {/* Main Toolbar */}
            <div
              className="flex items-center gap-0.5 px-3 py-2 
              bg-gradient-to-b from-[#1a2332]/98 to-[#0f1419]/98 backdrop-blur-xl 
              border border-white/10 rounded-2xl shadow-2xl
              relative before:absolute before:inset-0 before:rounded-2xl 
              before:bg-gradient-to-r before:from-cyan-500/0 before:via-cyan-500/5 before:to-purple-500/0 before:pointer-events-none"
            >
              {/* Primary Actions */}
              <ToolbarButton
                icon={Edit3}
                label="Editar"
                color="blue"
                onClick={() => setIsEditing(true)}
                shortcut="Double-click"
              />

              <ToolbarButton
                icon={Plus}
                label="Filho"
                color="cyan"
                onClick={() => handleAction('addChild')}
                shortcut="⤵"
              />

              <ToolbarButton
                icon={Copy}
                label="Duplicar"
                color="amber"
                onClick={() => handleAction('duplicate')}
                shortcut="Ctrl+D"
              />

              {/* AI Actions Submenu */}
              <AISubmenuTrigger
                isActive={activeSubmenu === 'ai'}
                onHover={() => setActiveSubmenu('ai')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'ai' ? null : 'ai')}
                onAction={handleAction}
              />

              {/* More Actions Submenu */}
              <MoreSubmenuTrigger
                isActive={activeSubmenu === 'more'}
                onHover={() => setActiveSubmenu('more')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'more' ? null : 'more')}
                isPinned={data.pinned}
                isLocked={data.locked}
                nodeId={id}
                onUpdateData={onUpdateData}
              />

              {/* Delete Action */}
              <ToolbarButton
                icon={Trash2}
                label="Excluir"
                color="red"
                onClick={() => handleAction('delete')}
                shortcut="Del"
                danger
              />
            </div>

            {/* AI Submenu */}
            <AnimatePresence>
              {activeSubmenu === 'ai' && (
                <AISubmenu onAction={handleAction} nodeId={id} toolbarPosition={toolbarPosition} />
              )}
            </AnimatePresence>

            {/* More Submenu */}
            <AnimatePresence>
              {activeSubmenu === 'more' && (
                <MoreSubmenu
                  isPinned={data.pinned}
                  isLocked={data.locked}
                  nodeId={id}
                  onUpdateData={onUpdateData}
                  onAction={handleAction}
                  toolbarPosition={toolbarPosition}
                />
              )}
            </AnimatePresence>

            {/* Arrow Indicator */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
              <div className="w-2.5 h-2.5 bg-[#1a2332]/98 border border-white/10 rotate-45 rounded-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Smart Connection Handles (Hidden until hover) ───────────────────────────────── */}
      <ConnectionHandlesSet
        nodeId={id}
        onStartConnection={onStartConnection || (() => {})}
        allowedPositions={[Position.Top, Position.Bottom, Position.Left, Position.Right]}
        isNodeHovered={isHovered}
      />
    </motion.div>
  );
};

export const PowerNode = memo(PowerNodeComponent);
export default PowerNode;
