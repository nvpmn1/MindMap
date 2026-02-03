import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard, StatsCard, MapCard, FeatureCard, ActionCard, LoadingCard } from '@/components/ui/AnimatedCards';
import { 
  Plus, 
  Search, 
  Network, 
  Users, 
  Activity, 
  GitBranch, 
  Layers, 
  Clock,
  Sparkles,
  Brain,
  Zap,
  TrendingUp,
  Calendar,
  ChevronRight,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  Filter,
  LayoutGrid,
  List,
  Star,
  Archive,
  Folder,
  MessageSquare,
  Target,
  Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MapItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  nodes_count: number;
  collaborators: Array<{ name: string; color: string }>;
  status: 'active' | 'archived' | 'draft';
  starred?: boolean;
  thumbnail?: string;
}

// Mock data
const MOCK_MAPS: MapItem[] = [
  {
    id: 'map-001',
    title: 'Pesquisa de IA Generativa',
    description: 'Análise de papers e arquiteturas de LLMs para o projeto de pesquisa',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    nodes_count: 47,
    collaborators: [
      { name: 'Guilherme', color: '#00D9FF' },
      { name: 'Helen', color: '#00FFC8' },
      { name: 'Pablo', color: '#A78BFA' },
    ],
    status: 'active',
    starred: true,
  },
  {
    id: 'map-002',
    title: 'Roadmap Q1 2026',
    description: 'Planejamento de sprints e entregas do trimestre',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    nodes_count: 32,
    collaborators: [
      { name: 'Pablo', color: '#A78BFA' },
      { name: 'Guilherme', color: '#00D9FF' },
    ],
    status: 'active',
  },
  {
    id: 'map-003',
    title: 'Arquitetura do Sistema',
    description: 'Diagramas e decisões técnicas do MindMap Hub',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    nodes_count: 58,
    collaborators: [
      { name: 'Helen', color: '#00FFC8' },
      { name: 'Guilherme', color: '#00D9FF' },
    ],
    status: 'active',
    starred: true,
  },
  {
    id: 'map-004',
    title: 'Brainstorm - Novos Features',
    description: 'Ideias para próximas versões do produto',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    nodes_count: 23,
    collaborators: [
      { name: 'Guilherme', color: '#00D9FF' },
    ],
    status: 'draft',
  },
];

const QUICK_ACTIONS = [
  { icon: <Plus className="w-4 h-4" />, title: 'Novo Mapa', description: 'Criar do zero', gradient: 'cyan' as const },
  { icon: <Sparkles className="w-4 h-4" />, title: 'Gerar com IA', description: 'Criar automaticamente', gradient: 'purple' as const },
  { icon: <Folder className="w-4 h-4" />, title: 'Importar', description: 'De arquivo externo', gradient: 'emerald' as const },
  { icon: <Users className="w-4 h-4" />, title: 'Colaborar', description: 'Convidar time', gradient: 'amber' as const },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'starred' | 'active' | 'draft' | 'archived'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setMaps(MOCK_MAPS);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredMaps = useMemo(() => {
    let result = [...maps];
    
    // Apply filter
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
        m.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [maps, filter, searchQuery]);

  const stats = useMemo(() => ({
    totalMaps: maps.length,
    totalNodes: maps.reduce((acc, m) => acc + m.nodes_count, 0),
    activeCollaborators: 3,
    aiGenerations: 156,
  }), [maps]);

  const handleCreateMap = () => {
    const newMap: MapItem = {
      id: `map-${Date.now()}`,
      title: 'Novo Mapa Mental',
      description: 'Clique para começar a adicionar ideias',
      created_at: new Date().toISOString(),
      nodes_count: 1,
      collaborators: [{ name: user?.display_name || 'User', color: user?.color || '#00D9FF' }],
      status: 'draft',
    };
    
    // Save to localStorage
    const existingMaps = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
    localStorage.setItem('mindmap_maps', JSON.stringify([newMap, ...existingMaps]));
    
    toast.success('Mapa criado com sucesso!');
    navigate(`/map/${newMap.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logout realizado!');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-full bg-[#080C14] pb-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#080C14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center"
            >
              <Network className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-white">NeuralMap</h1>
              <p className="text-[10px] text-slate-500">Mind Mapping Platform</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar mapas, nós, tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: `${user?.color || '#00D9FF'}20`,
                  color: user?.color || '#00D9FF',
                }}
              >
                {user?.display_name?.[0] || 'U'}
              </motion.div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.display_name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500">{user?.role || 'Researcher'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            Olá, {user?.display_name || 'Pesquisador'}! 👋
          </h2>
          <p className="text-slate-500">
            Continue de onde parou ou crie um novo mapa mental
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatsCard
            title="Total de Mapas"
            value={stats.totalMaps}
            icon={<Layers className="w-5 h-5 text-white" />}
            gradient="cyan"
            trend={{ value: 12, isUp: true }}
          />
          <StatsCard
            title="Total de Nós"
            value={stats.totalNodes}
            icon={<GitBranch className="w-5 h-5 text-white" />}
            gradient="purple"
            trend={{ value: 24, isUp: true }}
          />
          <StatsCard
            title="Colaboradores"
            value={stats.activeCollaborators}
            icon={<Users className="w-5 h-5 text-white" />}
            gradient="emerald"
          />
          <StatsCard
            title="Gerações IA"
            value={stats.aiGenerations}
            icon={<Sparkles className="w-5 h-5 text-white" />}
            gradient="amber"
            trend={{ value: 45, isUp: true }}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, i) => (
              <ActionCard
                key={i}
                icon={action.icon}
                title={action.title}
                description={action.description}
                gradient={action.gradient}
                onClick={i === 0 ? handleCreateMap : () => toast.success(`${action.title} em breve!`)}
              />
            ))}
          </div>
        </motion.div>

        {/* AI Features Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <GlassCard gradient="purple" glow>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                >
                  <Brain className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    IA Agent Ativo
                  </h3>
                  <p className="text-sm text-slate-400">
                    Use o poder da IA para gerar, expandir e organizar seus mapas automaticamente
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/map/new')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Experimentar
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Maps Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">Seus Mapas</h3>
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-lg">
                {(['all', 'starred', 'active', 'draft'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      filter === f
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'starred' ? '⭐ Favoritos' : f === 'active' ? 'Ativos' : 'Rascunhos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'text-cyan-400' : 'text-slate-500'}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'text-cyan-400' : 'text-slate-500'}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button onClick={handleCreateMap} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Mapa
              </Button>
            </div>
          </div>

          {/* Maps Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : filteredMaps.length === 0 ? (
            <GlassCard gradient="none" className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Layers className="w-8 h-8 text-slate-600" />
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
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              <AnimatePresence mode="popLayout">
                {filteredMaps.map((map, index) => (
                  <motion.div
                    key={map.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MapCard
                      id={map.id}
                      title={map.title}
                      description={map.description || undefined}
                      nodes={map.nodes_count}
                      lastEdited={formatDate(map.created_at)}
                      collaborators={map.collaborators}
                      status={map.status}
                      onClick={() => navigate(`/map/${map.id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Recursos da Plataforma
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Cpu className="w-6 h-6 text-white" />}
              title="AI Agent Integrado"
              description="Gere ideias, expanda conceitos e organize automaticamente com Claude"
              gradient="cyan"
              badge="NOVO"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-white" />}
              title="Colaboração Real-time"
              description="Edite mapas simultaneamente com sua equipe"
              gradient="emerald"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6 text-white" />}
              title="Gestão de Tarefas"
              description="Converta ideias em tarefas e acompanhe o progresso"
              gradient="amber"
            />
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-500">
          <p>© 2026 NeuralMap. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <button className="hover:text-white transition-colors">Documentação</button>
            <button className="hover:text-white transition-colors">Suporte</button>
            <button onClick={handleLogout} className="hover:text-red-400 transition-colors flex items-center gap-1">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
