import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

// Os 3 usuários do grupo - PABLO, GUILHERME e HELEN
const TEAM_PROFILES = [
  {
    id: 'guilherme-001',
    name: 'Guilherme',
    email: 'guilherme@mindmap.app',
    role: 'Pesquisador/Dev',
    avatar: '👨‍💻',
    color: '#4ECDC4',
    description: 'Cria mapas de pesquisa, analisa papers e delega tarefas',
  },
  {
    id: 'helen-002', 
    name: 'Helen',
    email: 'helen@mindmap.app',
    role: 'Pesquisadora',
    avatar: '👩‍🔬',
    color: '#FF6B6B',
    description: 'Recebe delegações, comenta e expande subárvores',
  },
  {
    id: 'pablo-003',
    name: 'Pablo',
    email: 'pablo@mindmap.app',
    role: 'Pesquisador',
    avatar: '👨‍🔬',
    color: '#45B7D1',
    description: 'Colabora em tempo real, usa templates e revisa trabalhos',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithProfile } = useAuthStore();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfile(profileId);
  };

  const handleLogin = () => {
    if (!selectedProfile) return;
    
    const profile = TEAM_PROFILES.find(p => p.id === selectedProfile);
    if (profile) {
      loginWithProfile({
        id: profile.id,
        email: profile.email,
        display_name: profile.name,
        avatar_url: profile.avatar,
        color: profile.color,
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">MindMap Hub</CardTitle>
          <CardDescription className="text-white/70 text-lg">
            Pesquisa Cooperativa • Mapas Mentais Compartilhados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-white/60">
            Selecione seu perfil para entrar
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEAM_PROFILES.map((profile) => {
              const isSelected = selectedProfile === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`
                    p-6 rounded-2xl border-2 transition-all duration-300 text-left
                    ${isSelected 
                      ? 'border-white bg-white/20 shadow-xl scale-105' 
                      : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="text-center mb-4">
                    <span className="text-5xl">{profile.avatar}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white text-center mb-1">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-center mb-3" style={{ color: profile.color }}>
                    {profile.role}
                  </p>
                  <p className="text-xs text-white/50 text-center">
                    {profile.description}
                  </p>
                </button>
              );
            })}
          </div>

          <Button 
            onClick={handleLogin}
            disabled={!selectedProfile}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-lg shadow-purple-500/30"
            size="lg"
          >
            Entrar no MindMap Hub
          </Button>

          <p className="text-xs text-center text-white/40">
            Hub cooperativo de mindmaps para pesquisa e planejamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
