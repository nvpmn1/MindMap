import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Map, Calendar, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MapItem {
  id: string;
  title: string;
  description: string | null;
  workspace_id: string;
  created_at: string;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMaps(data || []);
    } catch (error) {
      console.error('Error fetching maps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaps = maps.filter(map =>
    map.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMap = async () => {
    try {
      const { data, error } = await supabase
        .from('maps')
        .insert({
          title: 'Novo Mapa',
          description: 'Mapa criado em ' + new Date().toLocaleDateString(),
          workspace_id: user?.id || '',
          created_by: user?.id || '',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Mapa criado!');
      if (data) {
        navigate(`/map/${data.id}`);
      }
    } catch (error) {
      toast.error('Erro ao criar mapa');
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {user?.email?.split('@')[0] || 'usuário'}!
          </p>
        </div>
        <Button onClick={handleCreateMap}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Mapa
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mapas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredMaps.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Map className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum mapa encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro mapa mental para começar
            </p>
            <Button onClick={handleCreateMap}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Mapa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaps.map((map) => (
            <Link key={map.id} to={`/map/${map.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-primary" />
                    {map.title}
                  </CardTitle>
                  <CardDescription>{map.description || 'Sem descrição'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(map.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
