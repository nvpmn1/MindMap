import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapData {
  id: string;
  title: string;
  description: string | null;
}

export function MapEditorPage() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMap = async () => {
      if (!mapId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('maps')
          .select('*')
          .eq('id', mapId)
          .single();

        if (error) throw error;
        setCurrentMap(data);
      } catch (error) {
        console.error('Error fetching map:', error);
        setCurrentMap(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, [mapId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentMap) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Mapa não encontrado</p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-semibold">{currentMap.title}</h1>
      </div>
      <div className="flex-1 relative bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Canvas do Mapa Mental</p>
      </div>
    </div>
  );
}
