import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { robustMapsApi } from '@/lib/robustMapsApi';
import { mapPersistence } from '@/lib/mapPersistence';
import { robustMapDelete } from '@/lib/robustMapDelete';
import { formatRelativeTime } from '@/lib/utils';
import { DeleteStatusIndicator } from '@/components/mindmap/layout/DeleteStatusIndicator';
import { MapCard } from '@/components/MapCard';
import {
  Network,
  Layers,
  Clock,
  Search,
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Trash2,
  Copy,
  Zap,
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

type SortBy = 'updated' | 'created' | 'title' | 'nodes';
type ViewMode = 'grid' | 'list';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export function MapsPage() {
  const navigate = useNavigate();
  const { workspaces } = useAuthStore();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [syncStatus] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadMaps();
  }, [workspaces]);

  const loadMaps = async () => {
    try {
      setIsLoading(true);
      const workspaceId = workspaces[0]?.id;

      // Show cached maps immediately for better UX
      const cached = mapPersistence.getCachedMaps();
      if (cached.length > 0) {
        const normalized = cached.map((map) => ({
          id: map.id,
          title: map.title,
          description: map.description || null,
          created_at: map.created_at || map.updated_at || new Date().toISOString(),
          updated_at: map.updated_at || map.created_at || new Date().toISOString(),
          nodes_count: (map as any)._count?.count || (map as any).nodes_count || 0,
        })) as MapItem[];
        setMaps(normalized);
      }

      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      const response = await robustMapsApi.list({
        workspace_id: workspaceId,
        limit: 100,
        offset: 0,
      });
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
    } catch (error) {
      console.error('Critical error loading maps:', error);
      // Fallback to empty array on critical error
      try {
        setMaps([]);
        setIsLoading(false);
      } catch (setError) {
        console.error('Error setting empty maps:', setError);
      }
    }
  };

  const handleCreateMap = async () => {
    const workspaceId = workspaces[0]?.id;
    if (!workspaceId) {
      toast.error('Workspace não encontrado');
      return;
    }

    try {
      // Create map via backend API
      const response = await robustMapsApi.create({
        workspace_id: workspaceId,
        title: 'Novo Mapa Mental',
        description: '',
      });

      const created = response.data as any;
      if (created?.id) {
        toast.success('Mapa criado com sucesso!', { duration: 3000 });
        navigate(`/map/${created.id}`);
      } else {
        toast.error('Erro ao criar mapa');
      }
    } catch (err) {
      console.error('Failed to create map:', err);
      toast.error('Erro ao criar mapa. Verifique a conexão.');
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      // IMMEDIATELY remove from local state (instant UI feedback)
      setMaps((prev) => prev.filter((m) => m.id !== mapId));

      // Delete via API with retry
      const result = await robustMapDelete.queueDelete(mapId);

      if (result.success) {
        toast.success('Mapa excluído com sucesso!', { duration: 3000 });
      } else {
        toast.error('Erro ao excluir: ' + (result.error || 'tente novamente'));
        // Reload to restore state
        await loadMaps();
      }
    } catch (err) {
      console.error('Error in delete handler:', err);
      toast.error('Erro ao excluir mapa');
      await loadMaps();
    }
  };

  const handleDuplicateMap = async (mapId: string) => {
    try {
      const response = await robustMapsApi.duplicate(mapId);
      const map = response.data as any;
      toast.success('Mapa duplicado!');
      loadMaps();
    } catch (err) {
      console.error('Error duplicating map:', err);
      toast.error('Erro ao duplicar mapa');
    }
  };

  const filteredMaps = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? maps.filter(
          (m) =>
            m.title.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q)
        )
      : maps;

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'nodes':
          return b.nodes_count - a.nodes_count;
        default: // updated
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return list;
  }, [maps, query, sortBy]);

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'updated', label: 'Recentes' },
    { value: 'created', label: 'Criação' },
    { value: 'title', label: 'Nome' },
    { value: 'nodes', label: 'Nós' },
  ];

  return (
    <div className="min-h-full bg-[#060910]">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto px-6 py-8 space-y-6"
      >
        {/* Title + Create */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Meus Mapas</h1>
            <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>
                {maps.length} {maps.length === 1 ? 'mapa' : 'mapas'} no total
              </span>
              {syncStatus > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs">
                  <Zap className="w-3 h-3 animate-pulse" />
                  {syncStatus} sincronizando...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Delete Status Indicator */}
            <DeleteStatusIndicator compact={true} />
            <button
              onClick={handleCreateMap}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-medium hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/15"
            >
              <Plus className="w-4 h-4" />
              Novo Mapa
            </button>
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar mapas..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sort */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-1 h-10">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-2" />
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    sortBy === opt.value
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-10">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
                : 'space-y-2'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`rounded-xl bg-white/[0.02] animate-pulse ${viewMode === 'grid' ? 'h-[130px]' : 'h-[72px]'}`}
              />
            ))}
          </div>
        ) : filteredMaps.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="text-center py-16 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]"
          >
            <Network className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-[14px] text-slate-400 mb-1">
              {query ? 'Nenhum mapa encontrado' : 'Nenhum mapa ainda'}
            </p>
            <p className="text-[12px] text-slate-600 mb-4">
              {query ? 'Tente uma busca diferente' : 'Crie seu primeiro mapa mental'}
            </p>
            {!query && (
              <button
                onClick={handleCreateMap}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-medium hover:from-cyan-500 hover:to-blue-500 transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar mapa
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative"
          >
            <AnimatePresence>
              {filteredMaps.map((map, i) => (
                <MapCard
                  key={map.id}
                  id={map.id}
                  title={map.title}
                  description={map.description}
                  created_at={map.created_at}
                  updated_at={map.updated_at}
                  nodes_count={map.nodes_count}
                  colorIndex={i % 6}
                  onDelete={handleDeleteMap}
                  onDuplicate={handleDuplicateMap}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* List View */
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-1">
            {filteredMaps.map((map, i) => (
              <motion.div key={map.id} variants={fadeUp} className="relative group">
                <button
                  onClick={() => navigate(`/map/${map.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent hover:border-white/[0.04] bg-transparent hover:bg-white/[0.02] transition-all duration-200"
                >
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0`}
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-[13px] font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                      {map.title}
                    </h3>
                    {map.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {map.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Layers className="w-3 h-3" />
                    {map.nodes_count}
                  </span>
                  <span className="text-[11px] text-slate-500 flex-shrink-0 w-24 text-right">
                    {formatRelativeTime(new Date(map.updated_at))}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateMap(map.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMap(map.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-red-500/[0.06] flex items-center justify-center"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
