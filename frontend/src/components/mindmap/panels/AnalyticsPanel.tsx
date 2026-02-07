// ============================================================================
// NeuralMap - Analytics Panel (Map Intelligence Dashboard)
// ============================================================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BarChart3, PieChart, TrendingUp, Users, Brain, Zap,
  CheckCircle2, Clock, AlertTriangle, Target, Activity, GitBranch
} from 'lucide-react';
import { NODE_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '../editor/constants';
import type { MapAnalytics, PowerNode, PowerEdge, NeuralNodeType } from '../editor/types';

interface AnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: MapAnalytics;
  nodes: PowerNode[];
  edges: PowerEdge[];
  isEmbedded?: boolean;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  isOpen, onClose, analytics, nodes, edges, isEmbedded
}) => {
  if (!isOpen) return null;

  const typeColors = useMemo(() => {
    return Object.entries(analytics.nodesByType).map(([type, count]) => ({
      type,
      count,
      label: NODE_TYPE_CONFIG[type as NeuralNodeType]?.label || type,
      color: NODE_TYPE_CONFIG[type as NeuralNodeType]?.color || '#6366f1',
    }));
  }, [analytics.nodesByType]);

  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  if (isEmbedded) {
    return (
      <div className="w-full h-full overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent bg-[#080d16]">
        <div className="grid grid-cols-2 gap-3">
          <KPICard icon={Brain} label="Total Nós" value={totalNodes} color="text-cyan-400" bgColor="bg-cyan-500/10" />
          <KPICard icon={GitBranch} label="Conexões" value={totalEdges} color="text-purple-400" bgColor="bg-purple-500/10" />
          <KPICard icon={CheckCircle2} label="Conclusão" value={`${Math.round(analytics.completionRate)}%`} color="text-emerald-400" bgColor="bg-emerald-500/10" />
          <KPICard icon={Zap} label="Nós IA" value={analytics.aiGeneratedNodes} color="text-amber-400" bgColor="bg-amber-500/10" />
        </div>
        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progresso Geral</span>
            <span className="text-xs font-bold text-cyan-400">{Math.round(analytics.averageProgress)}%</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" style={{ width: `${analytics.averageProgress}%` }} />
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
          <h4 className="text-xs font-semibold text-slate-300 mb-3">Distribuição por Tipo</h4>
          <div className="space-y-2">
            {typeColors.sort((a, b) => b.count - a.count).map(({ type, count, label, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-400 flex-1">{label}</span>
                <span className="text-xs font-medium text-slate-300">{count}</span>
                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${totalNodes > 0 ? (count / totalNodes) * 100 : 0}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
          <h4 className="text-xs font-semibold text-slate-300 mb-2">Densidade de Rede</h4>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-purple-400">{(analytics.connectionDensity * 100).toFixed(1)}%</div>
            <div className="flex-1">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(analytics.connectionDensity * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-14 h-[calc(100%-3.5rem)] w-[400px] z-40 flex flex-col
          bg-[#080d16]/95 backdrop-blur-xl border-l border-white/[0.06]
          shadow-[-8px_0_32px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 
              flex items-center justify-center border border-pink-500/30">
              <Activity className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Analytics</h3>
              <p className="text-[10px] text-slate-500">Inteligência do mapa em tempo real</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin 
          scrollbar-thumb-white/5 scrollbar-track-transparent">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <KPICard icon={Brain} label="Total Nós" value={totalNodes} color="text-cyan-400" bgColor="bg-cyan-500/10" />
            <KPICard icon={GitBranch} label="Conexões" value={totalEdges} color="text-purple-400" bgColor="bg-purple-500/10" />
            <KPICard icon={CheckCircle2} label="Conclusão" value={`${Math.round(analytics.completionRate)}%`} color="text-emerald-400" bgColor="bg-emerald-500/10" />
            <KPICard icon={Zap} label="Nós IA" value={analytics.aiGeneratedNodes} color="text-amber-400" bgColor="bg-amber-500/10" />
          </div>

          {/* Progress bar */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Progresso Geral</span>
              <span className="text-xs font-bold text-cyan-400">{Math.round(analytics.averageProgress)}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${analytics.averageProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Distribution by Type */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <h4 className="text-xs font-semibold text-slate-300 mb-3">Distribuição por Tipo</h4>
            <div className="space-y-2">
              {typeColors.sort((a, b) => b.count - a.count).map(({ type, count, label, color }) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-400 flex-1">{label}</span>
                  <span className="text-xs font-medium text-slate-300">{count}</span>
                  <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${totalNodes > 0 ? (count / totalNodes) * 100 : 0}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <h4 className="text-xs font-semibold text-slate-300 mb-3">Status dos Nós</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(analytics.nodesByStatus).map(([status, count]) => {
                const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                return config ? (
                  <div key={status} className={`text-center p-2 rounded-lg ${config.bg}`}>
                    <div className={`text-lg font-bold ${config.color}`}>{count}</div>
                    <div className="text-[9px] text-slate-500">{config.label}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Most Connected Nodes */}
          {analytics.mostConnectedNodes.length > 0 && (
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <h4 className="text-xs font-semibold text-slate-300 mb-3">Nós Mais Conectados</h4>
              <div className="space-y-2">
                {analytics.mostConnectedNodes.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 w-4">{i + 1}.</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{node.label}</span>
                    <div className="flex items-center gap-1 text-xs text-cyan-400">
                      <GitBranch className="w-3 h-3" />
                      <span>{node.connections}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Overview */}
          {analytics.totalTasks > 0 && (
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <h4 className="text-xs font-semibold text-slate-300 mb-3">Tarefas</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{analytics.totalTasks}</div>
                  <div className="text-[9px] text-slate-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">{analytics.completedTasks}</div>
                  <div className="text-[9px] text-slate-500">Concluídas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{analytics.totalTasks - analytics.completedTasks}</div>
                  <div className="text-[9px] text-slate-500">Pendentes</div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Density */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Densidade de Rede</h4>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-purple-400">
                {(analytics.connectionDensity * 100).toFixed(1)}%
              </div>
              <div className="flex-1">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(analytics.connectionDensity * 100, 100)}%` }} />
                </div>
                <div className="text-[9px] text-slate-600 mt-1">
                  {analytics.connectionDensity < 0.3 ? 'Baixa - considere mais conexões' :
                   analytics.connectionDensity < 0.6 ? 'Moderada - boa estrutura' :
                   'Alta - rede bem conectada'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── KPI Card ───────────────────────────────────────────────────────────────

const KPICard: React.FC<{
  icon: React.FC<any>;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}> = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className={`rounded-xl p-3 ${bgColor} border border-white/[0.04]`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

export default AnalyticsPanel;
