import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AdvancedNeuralBackground } from '@/components/AdvancedNeuralBackground';
import { generateAvatarSvg } from '@/lib/avatarFallback';
import { Network, ArrowRight, Zap, Shield, Users } from 'lucide-react';

// Os 3 usuários do grupo - PABLO, GUILHERME e HELEN
const TEAM_PROFILES = [
  {
    id: 'f7a2d3b1-6b1f-4e0e-8a2b-1f3e2d4c5b6a',
    name: 'Guilherme',
    email: 'guilherme@mindmap.app',
    avatar: 'G',
    color: '#06E5FF',
    icon: Zap,
  },
  {
    id: '3b9c1f8a-2a1f-4c4f-9d3b-7c6a5e4d3f2b', 
    name: 'Helen',
    email: 'helen@mindmap.app',
    avatar: 'H',
    color: '#06FFD0',
    icon: Users,
  },
  {
    id: '9c2b7d4a-1f3e-4b6a-8d2c-5e1f9a0b7c6d',
    name: 'Pablo',
    email: 'pablo@mindmap.app',
    avatar: 'P',
    color: '#0D99FF',
    icon: Shield,
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithProfile } = useAuthStore();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  // Pré-gerar avatares para cada perfil
  const profilesWithAvatars = useMemo(() => {
    return TEAM_PROFILES.map(profile => ({
      ...profile,
      avatarUrl: generateAvatarSvg(profile.name, profile.color, 200),
    }));
  }, []);

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfile(profileId);
  };

  const handleLogin = () => {
    if (!selectedProfile) return;
    
    const profile = profilesWithAvatars.find(p => p.id === selectedProfile);
    if (profile) {
      loginWithProfile({
        id: profile.id,
        email: profile.email,
        display_name: profile.name,
        avatar_url: profile.avatarUrl,
        color: profile.color,
      });
      navigate('/dashboard');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden">
      {/* Advanced neural background */}
      <AdvancedNeuralBackground />

      {/* Main content with glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="relative z-20 w-full max-w-3xl mx-auto px-4"
      >
        <div className="relative">
          {/* Accent glow background */}
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-purple-500/10 rounded-3xl blur-2xl" />

          {/* Main card */}
          <div className="relative bg-[#080C14]/40 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl p-12 shadow-2xl">
            {/* Header */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center mb-12">
              <motion.div variants={itemVariants} className="flex justify-center mb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 bg-gradient-to-br from-cyan-500/30 to-teal-500/20 rounded-2xl border border-cyan-400/40 shadow-lg shadow-cyan-500/20"
                >
                  <Network className="w-12 h-12 text-cyan-300" strokeWidth={1.5} />
                </motion.div>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-4xl font-light tracking-tight mb-2">
                <span className="text-white">Neural</span>
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Map</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-cyan-400/80 text-sm tracking-widest uppercase">
                Collaborative Research Intelligence Platform
              </motion.p>

              <motion.p variants={itemVariants} className="text-slate-400 text-sm mt-4">
                Powered by neural networks. Designed for teams.
              </motion.p>
            </motion.div>

            {/* Profiles Section */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-8">
              <p className="text-center text-slate-500 text-sm mb-6 tracking-wide">
                Select your profile to enter the neural workspace
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profilesWithAvatars.map((profile, idx) => {
                  const isSelected = selectedProfile === profile.id;
                  const isHovered = hoveredProfile === profile.id;
                  const Icon = profile.icon;

                  return (
                    <motion.button
                      key={profile.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={() => setHoveredProfile(profile.id)}
                      onMouseLeave={() => setHoveredProfile(null)}
                      onClick={() => handleSelectProfile(profile.id)}
                      className={`
                        relative group overflow-hidden rounded-xl p-6 text-left
                        border backdrop-blur-sm transition-all duration-300
                        ${isSelected
                          ? `border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-teal-500/10
                             shadow-lg shadow-cyan-500/30`
                          : `border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/40
                             hover:border-cyan-400/40`
                        }
                      `}
                    >
                      {/* Glow effect on hover */}
                      {isSelected && (
                        <motion.div
                          layoutId="profileGlow"
                          className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-teal-500/5 rounded-xl"
                          initial={false}
                          transition={{ duration: 0.3 }}
                        />
                      )}

                      <div className="relative z-10 space-y-3">
                        {/* Avatar and name */}
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center text-sm font-semibold relative border border-white/20"
                            whileHover={{ scale: 1.1 }}
                          >
                            <img 
                              src={profile.avatarUrl}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initial letter
                                const img = e.currentTarget;
                                img.style.display = 'none';
                                img.parentElement!.textContent = profile.avatar;
                              }}
                            />
                            {isSelected && (
                              <motion.div
                                className="absolute inset-0 rounded-lg"
                                style={{
                                  border: `1.5px solid ${profile.color}`,
                                  boxShadow: `0 0 12px ${profile.color}40`,
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </motion.div>
                          <h3 className="text-white font-semibold">{profile.name}</h3>
                        </div>

                        {/* Icon indicator */}
                        <div className="flex items-center gap-2 pt-1">
                          <Icon className="w-3 h-3" style={{ color: profile.color, opacity: 0.6 }} />
                          <motion.div
                            className="h-px flex-1"
                            style={{
                              background: `linear-gradient(90deg, ${profile.color}40, transparent)`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute top-2 right-2 w-2 h-2 rounded-full"
                          style={{ backgroundColor: profile.color }}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Login Button */}
            <motion.div variants={itemVariants} className="mb-6">
              <Button
                onClick={handleLogin}
                disabled={!selectedProfile}
                className={`
                  w-full h-12 text-sm font-semibold
                  bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500
                  hover:from-cyan-400 hover:via-teal-400 hover:to-cyan-400
                  border-0 shadow-lg shadow-cyan-500/30
                  disabled:opacity-40 disabled:shadow-none
                  transition-all duration-300
                  group relative overflow-hidden
                `}
                size="lg"
              >
                <motion.span
                  className="flex items-center justify-center gap-2"
                  whileHover={{ letterSpacing: '0.05em' }}
                >
                  Access Neural Workspace
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.span>

                {/* Shimmer effect on button */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                  animate={selectedProfile ? { opacity: [0, 0.3, 0], x: ['-100%', '100%'] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </Button>
            </motion.div>

            {/* Footer */}
            <motion.div variants={itemVariants} className="space-y-4 text-center border-t border-slate-700/30 pt-6">
              <p className="text-xs text-slate-500">
                🔐 Secure collaborative environment for research teams
              </p>

              {/* Features grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { icon: '🧠', text: 'Neural AI' },
                  { icon: '🔗', text: 'Real-time' },
                  { icon: '🛡️', text: 'Secure' },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    className="text-xs text-slate-400 py-2 rounded-lg bg-slate-800/20 border border-slate-700/30"
                    whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.3)', borderColor: 'rgba(6, 148, 213, 0.2)' }}
                  >
                    <span className="mr-1">{feature.icon}</span>
                    {feature.text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
