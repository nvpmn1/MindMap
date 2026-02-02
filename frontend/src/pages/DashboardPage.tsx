import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Map, Calendar, Users, Brain, Sparkles, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';

interface MapItem {
  id: string;
  title: string;
  description: string | null;
  workspace_id: string;
  created_at: string;
  nodes_count: number;
  collaborators: string[];
}

// Dados mock locais - mapas do workspace compartilhado "MindLab"
const MOCK_MAPS: MapItem[] = [
  {
    id: 'map-001',
    title: 'Pesquisa de IA Generativa',
    description: 'Análise de papers e arquiteturas de LLMs para o projeto',
    workspace_id: 'mindlab-001',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    nodes_count: 24,
    collaborators: ['Guilherme', 'Helen', 'Pablo'],
  },
  {
    id: 'map-002',
    title: 'Roadmap Q1 2025',
    description: 'Planejamento de sprints e entregas do trimestre',
    workspace_id: 'mindlab-001',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    nodes_count: 18,
    collaborators: ['Pablo', 'Guilherme'],
  },
  {
    id: 'map-003',
    title: 'Arquitetura do Sistema',
    description: 'Diagramas e decisões técnicas do MindMap Hub',
    workspace_id: 'mindlab-001',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    nodes_count: 32,
    collaborators: ['Helen', 'Guilherme'],
  },
];

// Salva mapas no localStorage para persistência
const getStoredMaps = (): MapItem[] => {
  const stored = localStorage.getItem('mindmap_maps');
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem('mindmap_maps', JSON.stringify(MOCK_MAPS));
  return MOCK_MAPS;
};

const saveMaps = (maps: MapItem[]) => {
  localStorage.setItem('mindmap_maps', JSON.stringify(maps));
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Carrega mapas do localStorage (ou usa mock inicial)
    setTimeout(() => {
      setMaps(getStoredMaps());
      setIsLoading(false);
    }, 300);
  }, []);

  const filteredMaps = maps.filter(map =>
    map.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (map.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateMap = () => {
    const newMap: MapItem = {
      id: `map-${Date.now()}`,
      title: 'Novo Mapa Mental',
      description: `Criado por ${user?.display_name} em ${new Date().toLocaleDateString('pt-BR')}`,
      workspace_id: 'mindlab-001',
      created_at: new Date().toISOString(),
      nodes_count: 1,
      collaborators: [user?.display_name || 'Anônimo'],
    };
    
    const updatedMaps = [newMap, ...maps];
    setMaps(updatedMaps);
    saveMaps(updatedMaps);
    toast.success('Mapa criado com sucesso!');
    navigate(`/map/${newMap.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              MindMap Hub
            </h1>
            <p className="text-white/60 mt-1">
              Olá, <span className="text-purple-400 font-medium">{user?.display_name || 'usuário'}</span>! 
              Workspace: <span className="text-pink-400">MindLab</span>
            </p>
          </div>
          <Button 
            onClick={handleCreateMap}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Mapa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total de Mapas</p>
                  <p className="text-3xl font-bold text-white">{maps.length}</p>
                </div>
                <FolderTree className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total de Nodes</p>
                  <p className="text-3xl font-bold text-white">
                    {maps.reduce((acc, m) => acc + m.nodes_count, 0)}
                  </p>
                </div>
                <Sparkles className="w-10 h-10 text-pink-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Colaboradores</p>
                  <p className="text-3xl font-bold text-white">3</p>
                </div>
                <Users className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar mapas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Maps Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : filteredMaps.length === 0 ? (
          <Card className="text-center py-12 bg-white/5 border-white/10">
            <CardContent>
              <Map className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Nenhum mapa encontrado</h3>
              <p className="text-white/60 mb-4">
                Crie seu primeiro mapa mental para começar
              </p>
              <Button onClick={handleCreateMap} className="bg-purple-500 hover:bg-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Criar Mapa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaps.map((map) => (
              <Link key={map.id} to={`/map/${map.id}`}>
                <Card className="group bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white group-hover:text-purple-300 transition-colors">
                      <Map className="w-5 h-5 text-purple-400" />
                      {map.title}
                    </CardTitle>
                    <CardDescription className="text-white/50">
                      {map.description || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-white/40">
                        <Calendar className="w-4 h-4" />
                        {new Date(map.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1 text-white/40">
                        <Sparkles className="w-4 h-4" />
                        {map.nodes_count} nodes
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {map.collaborators.slice(0, 3).map((name, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-medium"
                          title={name}
                        >
                          {name[0]}
                        </div>
                      ))}
                      {map.collaborators.length > 3 && (
                        <span className="text-xs text-white/40">
                          +{map.collaborators.length - 3}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
