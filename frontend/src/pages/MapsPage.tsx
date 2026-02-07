import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { mapsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
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
  MoreHorizontal,
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
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  useEffect(() => {
    loadMaps();
  }, [workspaces]);

  const loadMaps = async () => {
    setIsLoading(true);
    const workspaceId = workspaces[0]?.id;

    if (workspaceId) {
      try {
        const response = await mapsApi.list({ workspace_id: workspaceId, limit: 100, offset: 0 });
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
        toast.success('Mapa criado!');
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
    toast.success('Mapa criado!');
    navigate(`/map/${newMap.id}`);
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      await mapsApi.delete(mapId);
      setMaps((prev) => prev.filter((m) => m.id !== mapId));
      toast.success('Mapa excluído');
    } catch {
      // Fallback: delete from localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
        const updated = existing.filter((m: MapItem) => m.id !== mapId);
        localStorage.setItem('mindmap_maps', JSON.stringify(updated));
        setMaps((prev) => prev.filter((m) => m.id !== mapId));
        
        // Also delete associated nodes
        localStorage.removeItem(`mindmap_nodes_${mapId}`);
        
        toast.success('Mapa excluído');
      } catch {
        toast.error('Erro ao excluir');
      }
    }
    setContextMenu(null);
  };

  const handleDuplicateMap = async (mapId: string) => {
    try {
      const response = await mapsApi.duplicate(mapId);
      const map = response.data as any;
      toast.success('Mapa duplicado!');
      loadMaps();
    } catch {
      // Fallback: duplicate from localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
        const mapToDuplicate = existing.find((m: MapItem) => m.id === mapId);
        
        if (mapToDuplicate) {
          const newMap: MapItem = {
            ...mapToDuplicate,
            id: crypto.randomUUID(),
            title: `${mapToDuplicate.title} (Cópia)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          localStorage.setItem('mindmap_maps', JSON.stringify([newMap, ...existing]));
          
          // Also duplicate nodes
          const nodesCacheKey = `mindmap_nodes_${mapId}`;
          const nodes = JSON.parse(localStorage.getItem(nodesCacheKey) || '[]');
          if (nodes.length > 0) {
            localStorage.setItem(`mindmap_nodes_${newMap.id}`, JSON.stringify(nodes));
          }
          
          toast.success('Mapa duplicado!');
          loadMaps();
        } else {
          toast.error('Mapa não encontrado');
        }
      } catch {
        toast.error('Erro ao duplicar');
      }
    }
    setContextMenu(null);
  };

  const safeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Recente' : formatRelativeTime(d);
  };

  const filteredMaps = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? maps.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            (m.description ?? '').toLowerCase().includes(q)
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

  const iconColors = [
    'from-cyan-500/20 to-blue-600/20 text-cyan-400',
    'from-purple-500/20 to-pink-600/20 text-purple-400',
    'from-emerald-500/20 to-teal-600/20 text-emerald-400',
    'from-amber-500/20 to-orange-600/20 text-amber-400',
    'from-rose-500/20 to-red-600/20 text-rose-400',
    'from-indigo-500/20 to-violet-600/20 text-indigo-400',
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
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Meus Mapas</h1>
            <p className="text-sm text-slate-400 mt-1">
              {maps.length} {maps.length === 1 ? 'mapa' : 'mapas'} no total
            </p>
          </div>
          <button
            onClick={handleCreateMap}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-medium hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/15"
          >
            <Plus className="w-4 h-4" />
            Novo Mapa
          </button>
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
                  viewMode === 'grid' ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`rounded-xl bg-white/[0.02] animate-pulse ${viewMode === 'grid' ? 'h-[130px]' : 'h-[72px]'}`} />
            ))}
          </div>
        ) : filteredMaps.length === 0 ? (
          <motion.div variants={fadeUp} className="text-center py-16 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative"
          >
            <AnimatePresence>
              {filteredMaps.map((map, i) => (
                <motion.div
                  key={map.id}
                  variants={fadeUp}
                  layout
                  className="relative group"
                >
                  <button
                    onClick={() => navigate(`/map/${map.id}`)}
                    className="w-full text-left p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/15 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${iconColors[i % iconColors.length]} flex items-center justify-center flex-shrink-0`}>
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
                  </button>

                  {/* Context Menu Button */}
                  <div className="absolute top-3 right-3 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(contextMenu === map.id ? null : map.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>

                    {contextMenu === map.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/[0.12] rounded-xl shadow-2xl shadow-black/50 p-1.5 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateMap(map.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-lg transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMap(map.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.1] rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-1"
          >
            {filteredMaps.map((map, i) => (
              <motion.div key={map.id} variants={fadeUp} className="relative group">
                <button
                  onClick={() => navigate(`/map/${map.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent hover:border-white/[0.04] bg-transparent hover:bg-white/[0.02] transition-all duration-200"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${iconColors[i % iconColors.length]} flex items-center justify-center flex-shrink-0`}>
                    <Network className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-[13px] font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                      {map.title}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Layers className="w-3 h-3" />
                    {map.nodes_count}
                  </span>
                  <span className="text-[11px] text-slate-500 flex-shrink-0 w-20 text-right">
                    {safeDate(map.updated_at)}
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

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
      )}
    </div>
  );
}
