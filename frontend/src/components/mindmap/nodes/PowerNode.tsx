import React, { memo, useCallback, useMemo, useState } from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  Circle,
  Copy,
  FileArchive,
  GitBranch,
  Lock,
  LockOpen,
  MessageSquare,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConnectionHandlesSet } from './ConnectionHandles';
import { NODE_TYPE_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from '../editor/constants';
import type { DocumentVaultItem, NeuralNodeData } from '../editor/types';
import { estimateNodeWidth, resolvePowerNodeAppearance } from './power/powerNodeAppearance';

type NodeAction =
  | 'addChild'
  | 'aiExpand'
  | 'duplicate'
  | 'delete'
  | 'togglePin'
  | 'toggleLock'
  | 'confirmLink';

type NodeRuntimeCallbacks = {
  onAddChild?: (nodeId: string) => void;
  onAIExpand?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateData?: (nodeId: string, data: Partial<NeuralNodeData>) => void;
  onStartConnection?: (nodeId: string, position: string) => void;
  onConfirmConnection?: () => void;
  onCancelConnection?: () => void;
  isInLinkingMode?: boolean;
  isLinkingSource?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const resolveProgress = (value?: number) => clamp(Number(value || 0), 0, 100);

const ProgressRing: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (resolveProgress(value) / 100) * circumference;

  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
        <circle cx="20" cy="20" r={radius} strokeWidth="3" className="fill-none stroke-white/10" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          strokeWidth="3"
          className="fill-none transition-all duration-500"
          style={{
            stroke: color,
            strokeLinecap: 'round',
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-200">
        {resolveProgress(value)}
      </span>
    </div>
  );
};

const MiniLineChart: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 180;
  const height = 42;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-[42px]">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const StatsPill: React.FC<{ label: string; value: string | number; tone?: string }> = ({
  label,
  value,
  tone,
}) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium border border-white/10 bg-white/[0.03] ${tone || 'text-slate-300'}`}
  >
    <span className="text-slate-500 uppercase tracking-wide">{label}</span>
    <span>{value}</span>
  </div>
);

const DocumentBadge: React.FC<{ document: DocumentVaultItem }> = ({ document }) => (
  <div
    className={`rounded-lg px-2.5 py-2 border text-[10px] transition-colors ${
      document.archived
        ? 'bg-slate-500/10 border-slate-500/30 text-slate-400'
        : 'bg-cyan-500/8 border-cyan-500/30 text-cyan-100'
    }`}
  >
    <div className="font-medium break-words">{document.title}</div>
    <div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-wide">
      <span>{document.type}</span>
      <span>{document.archived ? 'Archived' : 'Active'}</span>
    </div>
  </div>
);

const ToolbarButton: React.FC<{
  label: string;
  icon: React.FC<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
}> = ({ label, icon: Icon, onClick, danger }) => (
  <motion.button
    whileHover={{ scale: 1.08, y: -1 }}
    whileTap={{ scale: 0.96 }}
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    className={`group relative h-8 w-8 rounded-xl border text-slate-200 transition-all ${
      danger
        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
        : 'bg-[#0f1728]/90 border-white/10 hover:bg-[#172036] hover:border-white/20'
    }`}
    title={label}
  >
    <Icon className={`mx-auto h-4 w-4 ${danger ? 'text-red-300' : 'text-slate-100'}`} />
  </motion.button>
);

const PowerNodeComponent: React.FC<NodeProps> = ({ id, data: rawData, selected }) => {
  const data = rawData as NeuralNodeData;
  const runtime = rawData as unknown as NeuralNodeData & NodeRuntimeCallbacks;

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState(false);

  const config = NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.idea;
  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.active;
  const priorityConfig = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;
  const appearance = resolvePowerNodeAppearance(data);

  const width = useMemo(() => estimateNodeWidth(data), [data]);

  const checklistItems = data.checklist || [];
  const checklistDone = checklistItems.filter((item) => item.completed).length;
  const checklistProgress =
    checklistItems.length > 0 ? Math.round((checklistDone / checklistItems.length) * 100) : 0;
  const chartValues = data.chart?.datasets?.[0]?.data || [];
  const vaultItems = data.documentVault || [];
  const todoSeed = data.todoSeed || [];

  const isInLinkingMode = Boolean(runtime.isInLinkingMode);
  const isLinkingSource = Boolean(runtime.isLinkingSource);

  const runAction = useCallback(
    (action: NodeAction) => {
      switch (action) {
        case 'addChild':
          runtime.onAddChild?.(id);
          return;
        case 'aiExpand':
          runtime.onAIExpand?.(id);
          return;
        case 'duplicate':
          runtime.onDuplicate?.(id);
          return;
        case 'delete':
          runtime.onDeleteNode?.(id);
          return;
        case 'togglePin':
          runtime.onUpdateData?.(id, { pinned: !Boolean(data.pinned) });
          return;
        case 'toggleLock':
          runtime.onUpdateData?.(id, { locked: !Boolean((data as { locked?: boolean }).locked) });
          return;
        case 'confirmLink':
          runtime.onConfirmConnection?.();
          return;
      }
    },
    [data.pinned, id, runtime]
  );

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{
        opacity: 1,
        scale: isLinkingSource ? 1.05 : selected ? 1.02 : 1,
        y: 0,
      }}
      transition={{ type: 'spring', damping: 22, stiffness: 340 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isInLinkingMode && !isLinkingSource) {
          runAction('confirmLink');
        }
      }}
      className={`relative border bg-[#090f1f]/92 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.45)] transition-all duration-300 ${
        appearance.surface.wrapper
      } ${isInLinkingMode && !isLinkingSource ? 'cursor-crosshair opacity-80 hover:opacity-100' : 'cursor-pointer'} ${
        selected ? `ring-2 ${appearance.ringClass}` : ''
      }`}
      style={{
        width,
        borderColor: selected ? `${appearance.accentColor}70` : 'rgba(255,255,255,0.10)',
        boxShadow: isHovered || selected ? `0 0 30px ${appearance.glowColor}` : undefined,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${appearance.overlayClass} opacity-90`}
      />

      <div className="relative px-4 pt-3 pb-2">
        <div className="mb-2 flex items-start gap-2">
          <div
            className={`h-9 w-9 flex-shrink-0 rounded-xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
          >
            <Icon className="h-4 w-4" style={{ color: config.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]"
                style={{ color: appearance.typeColor, borderColor: `${appearance.typeColor}55` }}
              >
                {config.label}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {data.blueprintId && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-400">
                  {data.blueprintId.replace(/-/g, ' ')}
                </span>
              )}
              {data.ai?.generated && <Sparkles className="h-3.5 w-3.5 text-cyan-300" />}
            </div>

            {isEditing ? (
              <input
                autoFocus
                defaultValue={data.label}
                onBlur={(event) => {
                  const nextLabel = event.target.value.trim();
                  if (nextLabel && nextLabel !== data.label) {
                    runtime.onUpdateData?.(id, { label: nextLabel });
                  }
                  setIsEditing(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const nextLabel = (event.target as HTMLInputElement).value.trim();
                    if (nextLabel && nextLabel !== data.label) {
                      runtime.onUpdateData?.(id, { label: nextLabel });
                    }
                    setIsEditing(false);
                  }
                  if (event.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                className="w-full bg-transparent border-b border-white/20 pb-1 text-base font-semibold text-white outline-none"
              />
            ) : (
              <h3
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  setIsEditing(true);
                }}
                className="break-words text-base font-semibold leading-snug text-white"
              >
                {data.label}
              </h3>
            )}
          </div>

          <span className={`text-sm ${priorityConfig.color}`} title={priorityConfig.label}>
            {priorityConfig.icon}
          </span>
        </div>

        {data.description && (
          <p className="max-h-36 overflow-y-auto pr-1 break-words whitespace-pre-wrap text-[12px] leading-relaxed text-slate-200/90">
            {data.description}
          </p>
        )}
      </div>

      <div className="relative border-t border-white/8 px-4 py-2.5 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatsPill label="Imp" value={data.impact} tone="text-emerald-300" />
          <StatsPill label="Eff" value={data.effort} tone="text-amber-300" />
          <StatsPill label="Conf" value={data.confidence} tone="text-cyan-300" />
          <div className="ml-auto">
            <ProgressRing value={resolveProgress(data.progress)} color={appearance.accentColor} />
          </div>
        </div>

        {chartValues.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
              <span>{data.chart?.title || 'Data preview'}</span>
            </div>
            <MiniLineChart values={chartValues} color={appearance.accentColor} />
          </div>
        )}

        {checklistItems.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setExpandedChecklist((previous) => !previous);
              }}
              className="mb-2 flex w-full items-center justify-between text-[11px] text-slate-300"
            >
              <span>
                Checklist {checklistDone}/{checklistItems.length}
              </span>
              <span className="text-cyan-300">{checklistProgress}%</span>
            </button>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            <div className="space-y-1">
              {(expandedChecklist ? checklistItems : checklistItems.slice(0, 3)).map((item) => (
                <div key={item.id} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  {item.completed ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span className={item.completed ? 'line-through text-slate-500' : 'break-words'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {todoSeed.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Todo Seed</div>
            <div className="space-y-1">
              {todoSeed.slice(0, 4).map((item, index) => (
                <div key={`${item}_${index}`} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  <span className="break-words">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {vaultItems.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
              <FileArchive className="h-3.5 w-3.5 text-violet-300" />
              <span>Document Vault</span>
              <span className="ml-auto text-[10px] text-slate-500">{vaultItems.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {vaultItems.slice(0, 4).map((document) => (
                <DocumentBadge key={document.id} document={document} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative border-t border-white/8 px-4 py-2">
        {data.tags?.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {data.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            {data.commentCount ? (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {data.commentCount}
              </span>
            ) : null}
            {data.attachments?.length ? (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                {data.attachments.length}
              </span>
            ) : null}
            {data.connectionCount ? (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                {data.connectionCount}
              </span>
            ) : null}
          </div>
          <span>{data.readingMode || 'comfortable'} mode</span>
        </div>
      </div>

      <AnimatePresence>
        {(isHovered || selected) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -bottom-11 left-1/2 z-30 -translate-x-1/2"
          >
            <div className="flex items-center gap-1 rounded-2xl border border-white/12 bg-[#0a1428]/96 px-2 py-1.5 shadow-[0_12px_32px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <ToolbarButton label="Add child" icon={Plus} onClick={() => runAction('addChild')} />
              <ToolbarButton label="AI expand" icon={Sparkles} onClick={() => runAction('aiExpand')} />
              <ToolbarButton label="Duplicate" icon={Copy} onClick={() => runAction('duplicate')} />
              <ToolbarButton
                label={data.pinned ? 'Unpin' : 'Pin'}
                icon={data.pinned ? PinOff : Pin}
                onClick={() => runAction('togglePin')}
              />
              <ToolbarButton
                label={(data as { locked?: boolean }).locked ? 'Unlock' : 'Lock'}
                icon={(data as { locked?: boolean }).locked ? LockOpen : Lock}
                onClick={() => runAction('toggleLock')}
              />
              <ToolbarButton label="Delete" icon={Trash2} onClick={() => runAction('delete')} danger />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConnectionHandlesSet
        nodeId={id}
        onStartConnection={runtime.onStartConnection || (() => {})}
        allowedPositions={[Position.Top, Position.Bottom, Position.Left, Position.Right]}
        isNodeHovered={isHovered || selected}
      />
    </motion.article>
  );
};

export const PowerNode = memo(PowerNodeComponent);
export default PowerNode;
