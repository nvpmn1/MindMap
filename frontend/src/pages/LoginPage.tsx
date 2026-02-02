import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, User, Sparkles, Briefcase, Code, Palette } from 'lucide-react';

// Perfis pré-definidos para seleção
const PROFILES = [
  {
    id: 'user-1',
    name: 'Guilherme',
    email: 'guilherme@mindmap.app',
    avatar: null,
    color: '#4ECDC4',
    icon: User,
  },
  {
    id: 'user-2', 
    name: 'Designer',
    email: 'designer@mindmap.app',
    avatar: null,
    color: '#FF6B6B',
    icon: Palette,
  },
  {
    id: 'user-3',
    name: 'Developer',
    email: 'dev@mindmap.app',
    avatar: null,
    color: '#45B7D1',
    icon: Code,
  },
  {
    id: 'user-4',
    name: 'Manager',
    email: 'manager@mindmap.app',
    avatar: null,
    color: '#96CEB4',
    icon: Briefcase,
  },
  {
    id: 'user-5',
    name: 'Convidado',
    email: 'guest@mindmap.app',
    avatar: null,
    color: '#DDA0DD',
    icon: Sparkles,
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
    
    const profile = PROFILES.find(p => p.id === selectedProfile);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Brain className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">MindMap Hub</CardTitle>
          <CardDescription>
            Selecione seu perfil para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROFILES.map((profile) => {
              const Icon = profile.icon;
              const isSelected = selectedProfile === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 hover:scale-105
                    ${isSelected 
                      ? 'border-primary bg-primary/10 shadow-lg' 
                      : 'border-border hover:border-primary/50 bg-card'
                    }
                  `}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: profile.color + '20' }}
                  >
                    <Icon 
                      className="w-6 h-6" 
                      style={{ color: profile.color }}
                    />
                  </div>
                  <span className="text-sm font-medium">{profile.name}</span>
                </button>
              );
            })}
          </div>

          <Button 
            onClick={handleLogin}
            disabled={!selectedProfile}
            className="w-full mt-6"
            size="lg"
          >
            Entrar
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Selecione um perfil para acessar o MindMap Hub
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
