import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard, MapCard, LoadingCard } from '@/components/ui/AnimatedCards';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Star,
  Folder,
  FolderOpen,
  Clock,
  Archive,
  Trash2,
  SortAsc,
  SortDesc,
  Sparkles,
  ChevronRight,
  Network,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface MapItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  nodes_count: number;
  collaborators: Array<{ name: string; color: string }>;
  status: 'active' | 'archived' | 'draft';
  starred?: boolean;
  folder?: string;
  tags?: string[];
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
  count: number;
}

// Mock data
const MOCK_MAPS: MapItem[] = [
  {
    id: 'map-001',
    title: 'Pesquisa de IA Generativa',
    description: 'Análise de papers e arquiteturas de LLMs para o projeto de pesquisa',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    nodes_count: 47,
    collaborators: [
      { name: 'Guilherme', color: '#00D9FF' },
      { name: 'Helen', color: '#00FFC8' },
      { name: 'Pablo', color: '#A78BFA' },
    ],
    status: 'active',
    starred: true,
    folder: 'Pesquisa',
    tags: ['IA', 'LLM', 'GPT'],
  },
  {
    id: 'map-002',
    title: 'Roadmap Q1 2026',
    description: 'Planejamento de sprints e entregas do trimestre',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    nodes_count: 32,
    collaborators: [
      { name: 'Pablo', color: '#A78BFA' },
      { name: 'Guilherme', color: '#00D9FF' },
    ],
    status: 'active',
    folder: 'Planejamento',
    tags: ['Roadmap', 'Sprint'],
  },
  {
    id: 'map-003',
    title: 'Arquitetura do Sistema',
    description: 'Diagramas e decisões técnicas do MindMap Hub',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    nodes_count: 58,
    collaborators: [
      { name: 'Helen', color: '#00FFC8' },
      { name: 'Guilherme', color: '#00D9FF' },
    ],
    status: 'active',
    starred: true,
    folder: 'Técnico',
    tags: ['Arquitetura', 'Infra'],
  },
  {
    id: 'map-004',
    title: 'Brainstorm - Novos Features',
    description: 'Ideias para próximas versões do produto',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    nodes_count: 23,
    collaborators: [
      { name: 'Guilherme', color: '#00D9FF' },
    ],
    status: 'draft',
    tags: ['Brainstorm', 'Features'],
  },
  {
    id: 'map-005',
    title: 'Análise de Competidores',
    description: 'Estudo detalhado dos principais concorrentes do mercado',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    nodes_count: 35,
    collaborators: [
      { name: 'Pablo', color: '#A78BFA' },
    ],
    status: 'archived',
    folder: 'Pesquisa',
    tags: ['Mercado', 'Competidores'],
  },
  {
    id: 'map-006',
    title: 'Estratégia de Marketing',
    description: 'Plano de lançamento e growth hacking',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    nodes_count: 41,
    collaborators: [
      { name: 'Helen', color: '#00FFC8' },
      { name: 'Pablo', color: '#A78BFA' },
    ],
    status: 'active',
    starred: true,
    folder: 'Marketing',
    tags: ['Marketing', 'Growth'],
  },
];

const MOCK_FOLDERS: FolderItem[] = [
  { id: 'pesquisa', name: 'Pesquisa', color: '#00D9FF', count: 2 },
  { id: 'planejamento', name: 'Planejamento', color: '#A78BFA', count: 1 },
  { id: 'tecnico', name: 'Técnico', color: '#00FFC8', count: 1 },
  { id: 'marketing', name: 'Marketing', color: '#F59E0B', count: 1 },
];

export function MapsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'starred' | 'active' | 'draft' | 'archived'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name' | 'nodes'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSidebar] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMaps(MOCK_MAPS);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredMaps = useMemo(() => {
    let result = [...maps];
    
    // Apply folder filter
    if (selectedFolder) {
      result = result.filter(m => m.folder?.toLowerCase() === selectedFolder.toLowerCase());
    }
    
    // Apply status filter
    if (filter === 'starred') {
      result = result.filter(m => m.starred);
    } else if (filter !== 'all') {
      result = result.filter(m => m.status === filter);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query) ||
        m.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'nodes':
          comparison = a.nodes_count - b.nodes_count;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [maps, filter, searchQuery, selectedFolder, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: maps.length,
    active: maps.filter(m => m.status === 'active').length,
    draft: maps.filter(m => m.status === 'draft').length,
    archived: maps.filter(m => m.status === 'archived').length,
    starred: maps.filter(m => m.starred).length,
  }), [maps]);

  const handleCreateMap = () => {
    const newMap: MapItem = {
      id: `map-${Date.now()}`,
      title: 'Novo Mapa Mental',
      description: 'Clique para começar a adicionar ideias',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      nodes_count: 1,
      collaborators: [{ name: user?.display_name || 'User', color: user?.color || '#00D9FF' }],
      status: 'draft',
    };
    
    const existingMaps = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
    localStorage.setItem('mindmap_maps', JSON.stringify([newMap, ...existingMaps]));
    
    toast.success('Mapa criado com sucesso!');
    navigate(`/map/${newMap.id}`);
  };

  const handleToggleStar = (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMaps(prev => prev.map(m => 
      m.id === mapId ? { ...m, starred: !m.starred } : m
    ));
    toast.success('Favorito atualizado!');
  };

  const handleDeleteMap = (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMaps(prev => prev.filter(m => m.id !== mapId));
    toast.success('Mapa excluído!');
  };

  const handleArchiveMap = (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMaps(prev => prev.map(m => 
      m.id === mapId ? { ...m, status: m.status === 'archived' ? 'active' : 'archived' } : m
    ));
    toast.success('Status atualizado!');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#080C14] overflow-y-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex">
        {/* Sidebar com Folders */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="sticky top-0 h-screen border-r border-slate-800/50 bg-[#0A0E18]/80 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-4 h-full flex flex-col">
                {/* Create Button */}
                <Button
                  onClick={handleCreateMap}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white mb-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Mapa
                </Button>

                {/* Quick Filters */}
                <div className="space-y-1 mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                    Filtros Rápidos
                  </h3>
                  {[
                    { key: 'all', icon: <Folder className="w-4 h-4" />, label: 'Todos os Mapas', count: stats.total },
                    { key: 'starred', icon: <Star className="w-4 h-4 text-yellow-400" />, label: 'Favoritos', count: stats.starred },
                    { key: 'active', icon: <Clock className="w-4 h-4 text-green-400" />, label: 'Ativos', count: stats.active },
                    { key: 'draft', icon: <FolderOpen className="w-4 h-4 text-amber-400" />, label: 'Rascunhos', count: stats.draft },
                    { key: 'archived', icon: <Archive className="w-4 h-4 text-slate-400" />, label: 'Arquivados', count: stats.archived },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => { setFilter(item.key as any); setSelectedFolder(null); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                        filter === item.key && !selectedFolder
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      )}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Folders */}
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                    Pastas
                  </h3>
                  <div className="space-y-1">
                    {MOCK_FOLDERS.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => { setSelectedFolder(folder.name); setFilter('all'); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                          selectedFolder === folder.name
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        )}
                      >
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: folder.color + '40', border: `1px solid ${folder.color}` }}
                        />
                        <span className="flex-1 text-left">{folder.name}</span>
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
                          {folder.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Generate */}
                <div className="pt-4 border-t border-slate-800">
                  <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 text-purple-300 hover:border-purple-500/40 transition-all">
                    <Sparkles className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Gerar com IA</p>
                      <p className="text-xs text-purple-400/60">Crie mapas automaticamente</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {selectedFolder || (filter === 'all' ? 'Meus Mapas' : filter === 'starred' ? 'Favoritos' : filter === 'active' ? 'Mapas Ativos' : filter === 'draft' ? 'Rascunhos' : 'Arquivados')}
              </h1>
              <p className="text-slate-500 text-sm">
                {filteredMaps.length} mapa{filteredMaps.length !== 1 ? 's' : ''} encontrado{filteredMaps.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Buscar mapas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg border border-slate-800 p-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-sm text-slate-400 px-2 py-1 focus:outline-none"
                >
                  <option value="updated">Atualizado</option>
                  <option value="created">Criado</option>
                  <option value="name">Nome</option>
                  <option value="nodes">Nós</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg border border-slate-800 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Button onClick={handleCreateMap} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Mapa
              </Button>
            </div>
          </div>

          {/* Maps Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : filteredMaps.length === 0 ? (
            <GlassCard gradient="none" className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Network className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum mapa encontrado</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchQuery ? 'Tente outro termo de busca' : 'Crie seu primeiro mapa mental'}
              </p>
              <Button onClick={handleCreateMap} className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Criar Mapa
              </Button>
            </GlassCard>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredMaps.map((map, index) => (
                  <motion.div
                    key={map.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <MapCard
                      id={map.id}
                      title={map.title}
                      description={map.description || undefined}
                      nodes={map.nodes_count}
                      lastEdited={formatDate(map.updated_at)}
                      collaborators={map.collaborators}
                      status={map.status}
                      onClick={() => navigate(`/map/${map.id}`)}
                    />
                    
                    {/* Quick Actions Overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleToggleStar(map.id, e)}
                        className={cn(
                          'p-1.5 rounded-lg backdrop-blur-sm transition-colors',
                          map.starred 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-slate-900/80 text-slate-400 hover:text-yellow-400'
                        )}
                      >
                        <Star className={cn('w-4 h-4', map.starred && 'fill-current')} />
                      </button>
                      <button
                        onClick={(e) => handleArchiveMap(map.id, e)}
                        className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white backdrop-blur-sm transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteMap(map.id, e)}
                        className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-red-400 backdrop-blur-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredMaps.map((map, index) => (
                  <motion.div
                    key={map.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => navigate(`/map/${map.id}`)}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-cyan-500/30 hover:bg-slate-800/30 cursor-pointer transition-all"
                  >
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      map.status === 'draft' ? 'bg-amber-500/20' : map.status === 'archived' ? 'bg-slate-500/20' : 'bg-cyan-500/20'
                    )}>
                      <Network className={cn(
                        'w-6 h-6',
                        map.status === 'draft' ? 'text-amber-400' : map.status === 'archived' ? 'text-slate-400' : 'text-cyan-400'
                      )} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{map.title}</h3>
                        {map.starred && <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{map.description}</p>
                    </div>

                    {/* Tags */}
                    {map.tags && (
                      <div className="hidden lg:flex items-center gap-1">
                        {map.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Collaborators */}
                    <div className="flex items-center -space-x-1">
                      {map.collaborators.slice(0, 3).map((collab, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0A0E18]"
                          style={{ backgroundColor: collab.color + '20', color: collab.color }}
                        >
                          {collab.name[0]}
                        </div>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="text-right text-sm text-slate-500 min-w-[100px]">
                      <p>{map.nodes_count} nós</p>
                      <p className="text-xs">{formatDate(map.updated_at)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleToggleStar(map.id, e)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          map.starred ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'
                        )}
                      >
                        <Star className={cn('w-4 h-4', map.starred && 'fill-current')} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteMap(map.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MapsPage;
