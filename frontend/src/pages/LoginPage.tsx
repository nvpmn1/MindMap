import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';

// Os 3 usuários do grupo - PABLO, GUILHERME e HELEN
const TEAM_PROFILES = [
  {
    id: 'f7a2d3b1-6b1f-4e0e-8a2b-1f3e2d4c5b6a',
    name: 'Guilherme',
    email: 'guilherme@mindmap.app',
    role: 'Lead Researcher',
    avatar: 'G',
    color: '#00D9FF',
    description: 'Arquitetura de sistemas e análise de dados',
  },
  {
    id: '3b9c1f8a-2a1f-4c4f-9d3b-7c6a5e4d3f2b', 
    name: 'Helen',
    email: 'helen@mindmap.app',
    role: 'Data Scientist',
    avatar: 'H',
    color: '#00FFC8',
    description: 'Machine learning e modelagem preditiva',
  },
  {
    id: '9c2b7d4a-1f3e-4b6a-8d2c-5e1f9a0b7c6d',
    name: 'Pablo',
    email: 'pablo@mindmap.app',
    role: 'Research Engineer',
    avatar: 'P',
    color: '#00B4D8',
    description: 'Infraestrutura e integração de sistemas',
  },
];

// Neural Network Background Animation
function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Neural nodes
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const nodes: Node[] = [];
    const nodeCount = 60;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
      });
    }

    let rafId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw connections
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            const opacity = (1 - dist / 150) * 0.15;
            ctx.strokeStyle = `rgba(0, 217, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 217, 255, 0.6)';
        ctx.fill();
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(180deg, #080C14 0%, #0A1628 50%, #080C14 100%)' }}
    />
  );
}

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <NeuralBackground />
      
      <Card className="w-full max-w-2xl bg-[#0D1520]/90 backdrop-blur-xl border-[#1E3A5F]/50 shadow-2xl shadow-cyan-500/5 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl border border-cyan-500/30">
              <Network className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-light tracking-wide text-white">
            Neural<span className="font-semibold text-cyan-400">Map</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm tracking-wide">
            Collaborative Research Intelligence Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <p className="text-center text-slate-500 text-sm">
            Select your profile to access the workspace
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEAM_PROFILES.map((profile) => {
              const isSelected = selectedProfile === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`
                    p-5 rounded-xl border transition-all duration-200 text-left relative overflow-hidden
                    ${isSelected 
                      ? 'border-cyan-500/50 bg-cyan-500/10' 
                      : 'border-slate-700/50 hover:border-slate-600/50 bg-slate-800/30 hover:bg-slate-800/50'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
                  )}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold"
                        style={{ 
                          backgroundColor: `${profile.color}15`,
                          color: profile.color,
                          border: `1px solid ${profile.color}30`
                        }}
                      >
                        {profile.avatar}
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm">{profile.name}</h3>
                        <p className="text-xs" style={{ color: profile.color }}>{profile.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <Button 
            onClick={handleLogin}
            disabled={!selectedProfile}
            className="w-full h-12 text-sm font-medium bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 border-0 shadow-lg shadow-cyan-500/20 disabled:opacity-30 disabled:shadow-none"
            size="lg"
          >
            Access Platform
          </Button>

          <p className="text-xs text-center text-slate-600">
            Secure collaborative environment for research teams
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
