import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Network, Users, Activity, GitBranch, Layers, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface MapItem {
  id: string;
  title: string;
  description: string | null;
  workspace_id: string;
  created_at: string;
  nodes_count: number;
  collaborators: string[];
  status: 'active' | 'archived' | 'draft';
}

// Dados mock locais - mapas do workspace compartilhado
const MOCK_MAPS: MapItem[] = [
  {
    id: 'map-001',
    title: 'Neural Architecture Analysis',
    description: 'Deep learning model comparison and performance benchmarks',
    workspace_id: 'mindlab-001',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    nodes_count: 47,
    collaborators: ['Guilherme', 'Helen', 'Pablo'],
    status: 'active',
  },
  {
    id: 'map-002',
    title: 'Research Pipeline Q1',
    description: 'Sprint planning and milestone tracking for Q1 deliverables',
    workspace_id: 'mindlab-001',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    nodes_count: 32,
    collaborators: ['Pablo', 'Guilherme'],
    status: 'active',
  },
  {
    id: 'map-003',
    title: 'System Integration Map',
    description: 'API architecture and data flow documentation',
    workspace_id: 'mindlab-001',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    nodes_count: 58,
    collaborators: ['Helen', 'Guilherme'],
    status: 'active',
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
      title: 'New Research Map',
      description: `Created by ${user?.display_name} on ${new Date().toLocaleDateString('en-US')}`,
      workspace_id: 'mindlab-001',
      created_at: new Date().toISOString(),
      nodes_count: 1,
      collaborators: [user?.display_name || 'User'],
      status: 'draft',
    };
    
    const updatedMaps = [newMap, ...maps];
    setMaps(updatedMaps);
    saveMaps(updatedMaps);
    toast.success('Map created successfully');
    navigate(`/map/${newMap.id}`);
  };

  const totalNodes = maps.reduce((acc, m) => acc + m.nodes_count, 0);

  return (
    <div className="min-h-screen bg-[#080C14]">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-[#0A0E18]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Network className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-white">
                  Neural<span className="text-cyan-400">Map</span>
                </h1>
                <p className="text-xs text-slate-500">Research Workspace</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: user?.color || '#00D9FF' }}
                />
                <span className="text-sm text-slate-300">{user?.display_name}</span>
              </div>
              <Button 
                onClick={handleCreateMap}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Map
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1520] border-slate-800/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Total Maps</p>
                  <p className="text-2xl font-semibold text-white mt-1">{maps.length}</p>
                </div>
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Layers className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1520] border-slate-800/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Total Nodes</p>
                  <p className="text-2xl font-semibold text-white mt-1">{totalNodes}</p>
                </div>
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <GitBranch className="w-5 h-5 text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1520] border-slate-800/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Team Members</p>
                  <p className="text-2xl font-semibold text-white mt-1">3</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1520] border-slate-800/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Active Sessions</p>
                  <p className="text-2xl font-semibold text-white mt-1">2</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search maps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0D1520] border-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
          />
        </div>

        {/* Maps Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : filteredMaps.length === 0 ? (
          <Card className="text-center py-16 bg-[#0D1520] border-slate-800/50">
            <CardContent>
              <Network className="w-12 h-12 mx-auto text-slate-700 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-white">No maps found</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Create your first neural map to start organizing your research
              </p>
              <Button onClick={handleCreateMap} className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Map
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaps.map((map) => (
              <Link key={map.id} to={`/map/${map.id}`}>
                <Card className="group bg-[#0D1520] border-slate-800/50 hover:border-cyan-500/30 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Network className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        map.status === 'active' 
                          ? 'bg-green-500/10 text-green-400' 
                          : map.status === 'draft'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {map.status}
                      </span>
                    </div>
                    <CardTitle className="text-white text-base font-medium mt-3 group-hover:text-cyan-400 transition-colors">
                      {map.title}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm line-clamp-2">
                      {map.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(map.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {map.nodes_count} nodes
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {map.collaborators.slice(0, 3).map((name, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-medium border border-slate-700/50"
                          title={name}
                        >
                          {name[0]}
                        </div>
                      ))}
                      {map.collaborators.length > 3 && (
                        <span className="text-xs text-slate-600 ml-1">
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
