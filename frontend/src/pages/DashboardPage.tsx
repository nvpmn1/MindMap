import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { mapsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import {
  Plus,
  Network,
  Layers,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MapItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  nodes_count: number;
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, workspaces } = useAuthStore();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMaps = async () => {
      setIsLoading(true);
      const workspaceId = workspaces[0]?.id;

      if (workspaceId) {
        try {
          const response = await mapsApi.list({ workspace_id: workspaceId, limit: 50, offset: 0 });
          const data = (response.data as any[]) || [];
          const normalized = data.map((map) => ({
            id: map.id,
            title: map.title,
            description: map.description || null,
            created_at: map.created_at || map.updated_at || new Date().toISOString(),
            updated_at: map.updated_at || map.created_at || new Date().toISOString(),
            nodes_count: map._count?.count || map.nodes_count || 0,
          })) as MapItem[];
          setMaps(normalized);
          setIsLoading(false);
          return;
        } catch {
          // fallback
        }
      }

      const stored = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
      setMaps(stored);
      setIsLoading(false);
    };

    loadMaps();
  }, [workspaces]);

  const stats = useMemo(() => {
    const totalMaps = maps.length;
    const totalNodes = maps.reduce((acc, m) => acc + m.nodes_count, 0);
    
    let lastUpdate = 'Nenhum';
    if (maps.length > 0) {
      const dates = maps
        .map((m) => new Date(m.updated_at).getTime())
        .filter((t) => !isNaN(t));
      if (dates.length > 0) {
        lastUpdate = formatRelativeTime(new Date(Math.max(...dates)));
      }
    }

    // Maps created this week
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = maps.filter((m) => new Date(m.created_at).getTime() > weekAgo).length;

    return { totalMaps, totalNodes, lastUpdate, thisWeek };
  }, [maps]);

  const recentMaps = useMemo(
    () =>
      [...maps]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 6),
    [maps]
  );

  const handleCreateMap = async () => {
    const workspaceId = workspaces[0]?.id;
    if (workspaceId) {
      try {
        const response = await mapsApi.create({
          workspace_id: workspaceId,
          title: 'Novo Mapa Mental',
          description: '',
        });
        const map = response.data as any;
        toast.success('Mapa criado com sucesso!', { duration: 3500 });
        navigate(`/map/${map.id}`);
        return;
      } catch {
        // fallback
      }
    }

    const newMap: MapItem = {
      id: crypto.randomUUID(),
      title: 'Novo Mapa Mental',
      description: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      nodes_count: 1,
    };

    const existing = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
    localStorage.setItem('mindmap_maps', JSON.stringify([newMap, ...existing]));
    toast.success('Mapa criado com sucesso!');
    navigate(`/map/${newMap.id}`);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = (user?.display_name || 'Usuário').split(' ')[0];

  return (
    <div className="min-h-full bg-[#060910]">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto px-6 py-8 space-y-8"
      >
        {/* Greeting */}
        <motion.div variants={fadeUp} className="space-y-1">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-400">
            Aqui está um resumo da sua atividade no NeuralMap.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total de Mapas"
            value={stats.totalMaps}
            icon={<Network className="w-4 h-4" />}
            color="cyan"
          />
          <StatCard
            label="Nós Criados"
            value={stats.totalNodes}
            icon={<Layers className="w-4 h-4" />}
            color="purple"
          />
          <StatCard
            label="Última Atividade"
            value={stats.lastUpdate}
            icon={<Clock className="w-4 h-4" />}
            color="emerald"
          />
          <StatCard
            label="Esta Semana"
            value={stats.thisWeek}
            icon={<TrendingUp className="w-4 h-4" />}
            color="amber"
          />
        </motion.div>

        {/* Quick Action + Create */}
        <motion.div variants={fadeUp}>
          <button
            onClick={handleCreateMap}
            className="w-full group relative overflow-hidden rounded-2xl border border-dashed border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.04] to-blue-500/[0.04] hover:from-cyan-500/[0.08] hover:to-blue-500/[0.08] hover:border-cyan-500/40 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 flex items-center justify-center group-hover:from-cyan-500/25 group-hover:to-blue-600/25 transition-colors">
                  <Plus className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium text-white group-hover:text-cyan-300 transition-colors">
                    Criar novo mapa mental
                  </p>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Comece a organizar suas ideias em um novo mapa
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
            </div>
          </button>
        </motion.div>

        {/* Recent Maps */}
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[15px] font-semibold text-white">Mapas Recentes</h2>
            </div>
            {maps.length > 6 && (
              <button
                onClick={() => navigate('/maps')}
                className="text-[13px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[120px] rounded-xl bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : recentMaps.length === 0 ? (
            <EmptyState onCreateMap={handleCreateMap} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentMaps.map((map, i) => (
                <MapCard
                  key={map.id}
                  map={map}
                  index={i}
                  onClick={() => navigate(`/map/${map.id}`)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity Overview */}
        {maps.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h2 className="text-[15px] font-semibold text-white">Visão Geral</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Activity Chart Placeholder - Real data */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
                <p className="text-[13px] text-slate-400 mb-4">Atividade dos últimos 7 dias</p>
                <WeekActivity maps={maps} />
              </div>

              {/* Recent Activity Timeline */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
                <p className="text-[13px] text-slate-400 mb-4">Timeline de atividades</p>
                <ActivityTimeline maps={recentMaps.slice(0, 4)} />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Stat Card
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'emerald' | 'amber';
}) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/10',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/10',
  };

  const textColor = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };

  return (
    <div className={`rounded-xl border ${colorMap[color]} p-4 hover:bg-opacity-20 transition-all group`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-slate-400 font-medium uppercase tracking-wide">
          {label}
        </span>
        <span className={textColor[color]}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${textColor[color]}`}>{value}</p>
    </div>
  );
}

// Map Card
function MapCard({
  map,
  index,
  onClick,
}: {
  map: MapItem;
  index: number;
  onClick: () => void;
}) {
  const colors = [
    'from-cyan-500/8 to-blue-500/8 hover:border-cyan-500/20',
    'from-purple-500/8 to-pink-500/8 hover:border-purple-500/20',
    'from-emerald-500/8 to-teal-500/8 hover:border-emerald-500/20',
    'from-amber-500/8 to-orange-500/8 hover:border-amber-500/20',
    'from-rose-500/8 to-red-500/8 hover:border-rose-500/20',
    'from-indigo-500/8 to-violet-500/8 hover:border-indigo-500/20',
  ];

  const iconColors = [
    'from-cyan-500/20 to-blue-600/20 text-cyan-400',
    'from-purple-500/20 to-pink-600/20 text-purple-400',
    'from-emerald-500/20 to-teal-600/20 text-emerald-400',
    'from-amber-500/20 to-orange-600/20 text-amber-400',
    'from-rose-500/20 to-red-600/20 text-rose-400',
    'from-indigo-500/20 to-violet-600/20 text-indigo-400',
  ];

  const colorIndex = index % colors.length;

  const safeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Recente' : formatRelativeTime(d);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className={`text-left p-4 rounded-xl border border-white/[0.04] bg-gradient-to-br ${colors[colorIndex]} transition-all duration-200 group w-full`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${iconColors[colorIndex]} flex items-center justify-center flex-shrink-0`}>
          <Network className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
            {map.title}
          </h3>
          {map.description && (
            <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">{map.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {map.nodes_count} nós
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {safeDate(map.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Week Activity - real data based bar chart
function WeekActivity({ maps }: { maps: MapItem[] }) {
  const days = useMemo(() => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const result: { label: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const count = maps.filter((m) => {
        const t = new Date(m.updated_at).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;

      result.push({ label: labels[d.getDay()], count });
    }
    return result;
  }, [maps]);

  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {days.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full relative flex-1 flex items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((day.count / max) * 100, 6)}%` }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
              className={`w-full rounded-md ${
                day.count > 0
                  ? 'bg-gradient-to-t from-cyan-500/40 to-cyan-400/20'
                  : 'bg-white/[0.04]'
              }`}
            />
          </div>
          <span className="text-[10px] text-slate-600">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

// Activity Timeline
function ActivityTimeline({ maps }: { maps: MapItem[] }) {
  const safeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Recente' : formatRelativeTime(d);
  };

  return (
    <div className="space-y-3">
      {maps.map((map, i) => (
        <div key={map.id} className="flex items-start gap-3 group">
          <div className="relative flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-cyan-400/60 mt-1.5" />
            {i < maps.length - 1 && (
              <div className="w-px flex-1 bg-white/[0.04] mt-1" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-3">
            <p className="text-[13px] text-white truncate">{map.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-600" />
              <span className="text-[11px] text-slate-500">{safeDate(map.updated_at)}</span>
              <span className="text-[11px] text-slate-600">•</span>
              <span className="text-[11px] text-slate-500">{map.nodes_count} nós</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state
function EmptyState({ onCreateMap }: { onCreateMap: () => void }) {
  return (
    <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4">
        <Network className="w-7 h-7 text-cyan-500/40" />
      </div>
      <h3 className="text-[15px] font-medium text-white mb-1">Nenhum mapa ainda</h3>
      <p className="text-[13px] text-slate-500 mb-5 max-w-xs mx-auto">
        Crie seu primeiro mapa mental para começar a organizar suas ideias.
      </p>
      <button
        onClick={onCreateMap}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-medium hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
      >
        <Plus className="w-4 h-4" />
        Criar primeiro mapa
      </button>
    </div>
  );
}
