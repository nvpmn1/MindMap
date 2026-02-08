import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedNeuralBackground } from '@/components/OptimizedNeuralBackground';
import { generateAvatarSvg } from '@/lib/avatarFallback';
import { Sparkles, ArrowRight, Zap, Shield, Users } from 'lucide-react';

const TEAM_PROFILES = [
  {
    id: 'f7a2d3b1-6b1f-4e0e-8a2b-1f3e2d4c5b6a',
    name: 'Guilherme',
    email: 'guilherme@mindmap.app',
    color: '#06E5FF',
    icon: Zap,
    description: 'Research Lead',
  },
  {
    id: '3b9c1f8a-2a1f-4c4f-9d3b-7c6a5e4d3f2b',
    name: 'Helen',
    email: 'helen@mindmap.app',
    color: '#06FFD0',
    icon: Users,
    description: 'Team Coordinator',
  },
  {
    id: '9c2b7d4a-1f3e-4b6a-8d2c-5e1f9a0b7c6d',
    name: 'Pablo',
    email: 'pablo@mindmap.app',
    color: '#0D99FF',
    icon: Shield,
    description: 'Security Specialist',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithProfile } = useAuthStore();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-generate avatars for each profile
  const profilesWithAvatars = useMemo(() => {
    return TEAM_PROFILES.map(profile => ({
      ...profile,
      avatarUrl: generateAvatarSvg(profile.name, profile.color, 200),
    }));
  }, []);

  // Get current selected profile
  const selectedProfileData = profilesWithAvatars.find(p => p.id === selectedProfile);

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfile(profileId);
  };

  const handleLogin = async () => {
    if (!selectedProfile || !selectedProfileData) return;

    setIsLoading(true);
    try {
      loginWithProfile({
        id: selectedProfileData.id,
        email: selectedProfileData.email,
        display_name: selectedProfileData.name,
        avatar_url: selectedProfileData.avatarUrl,
        color: selectedProfileData.color,
      });
      
      // Small delay to allow state update
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
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
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden">
      {/* Optimized neural background */}
      <OptimizedNeuralBackground />

      {/* Main content container - CENTERED SINGLE COLUMN */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 w-full max-w-md px-4"
      >
        {/* Card background */}
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-purple-500/10 rounded-2xl blur-xl" />

          <div className="relative bg-[#080C14]/70 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Header: Logo + Title */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center space-y-2"
            >
              <motion.div variants={itemVariants} className="flex justify-center mb-2">
                <motion.div
                  className="p-2 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-lg border border-cyan-400/30 backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-2xl font-light tracking-tight">
                <span className="text-white">Neural</span>
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Map
                </span>
              </motion.h1>
              <motion.p variants={itemVariants} className="text-xs text-cyan-400/60 tracking-widest uppercase">
                Collaborative Intelligence Platform
              </motion.p>
            </motion.div>

            {/* Dynamic Avatar Display */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center justify-center"
            >
              <AnimatePresence mode="wait">
                {/* Dynamic large avatar display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedProfile || 'empty'}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
                    className="flex flex-col items-center justify-center space-y-3 py-2"
                  >
                    {selectedProfileData ? (
                      <>
                        {/* Avatar with glow */}
                        <motion.div
                          className="relative flex items-center justify-center"
                          animate={{ 
                            scale: [1, 1.04, 1],
                            y: [0, -3, 0],
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg relative flex-shrink-0">
                            <img
                              src={selectedProfileData.avatarUrl}
                              alt={selectedProfileData.name}
                              className="w-full h-full object-cover"
                            />
                            <motion.div
                              className="absolute inset-0 rounded-2xl pointer-events-none"
                              style={{
                                border: `2px solid ${selectedProfileData.color}`,
                                boxShadow: `inset 0 0 10px ${selectedProfileData.color}25, 0 0 20px ${selectedProfileData.color}40`,
                              }}
                              animate={{
                                boxShadow: [
                                  `inset 0 0 10px ${selectedProfileData.color}25, 0 0 20px ${selectedProfileData.color}40`,
                                  `inset 0 0 20px ${selectedProfileData.color}40, 0 0 35px ${selectedProfileData.color}60`,
                                  `inset 0 0 10px ${selectedProfileData.color}25, 0 0 20px ${selectedProfileData.color}40`,
                                ],
                              }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </div>

                          {/* Pulsing ring */}
                          <motion.div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              border: `1.5px solid ${selectedProfileData.color}40`,
                              width: '144px',
                              height: '144px',
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.6, 0, 0],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                          />
                        </motion.div>

                        {/* Profile name only */}
                        <motion.div
                          className="text-center space-y-1"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          <h2 className="text-xl font-semibold text-white">{selectedProfileData.name}</h2>
                          <p className="text-xs text-slate-400">{selectedProfileData.description}</p>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div
                        className="flex flex-col items-center justify-center space-y-3 py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div 
                          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Sparkles className="w-8 h-8 text-cyan-400/50" strokeWidth={1} />
                        </motion.div>
                        <p className="text-sm text-slate-400 font-medium hidden">Select a profile</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </AnimatePresence>
            </motion.div>

            {/* Profile buttons grid - 3 columns */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <div className="grid grid-cols-3 gap-2">
                {profilesWithAvatars.map((profile) => {
                  const isSelected = selectedProfile === profile.id;
                  const Icon = profile.icon;

                  return (
                    <motion.button
                      key={profile.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectProfile(profile.id)}
                      className={`
                        relative group overflow-hidden rounded-lg p-3
                        border transition-all duration-200 flex flex-col items-center gap-1
                        ${isSelected
                          ? `border-cyan-400/60 bg-gradient-to-b from-cyan-500/25 to-cyan-500/10 shadow-lg shadow-cyan-500/20`
                          : `border-slate-700/50 bg-slate-800/20 hover:bg-slate-700/30 hover:border-cyan-400/40`
                        }
                      `}
                    >
                      {/* Small avatar */}
                      <motion.div
                        className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/20 bg-slate-700"
                      >
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>

                      {/* Name */}
                      <p className="text-xs font-semibold text-white text-center">{profile.name}</p>

                      {/* Icon indicator */}
                      <Icon
                        className="w-3 h-3"
                        style={{ color: profile.color, opacity: isSelected ? 1 : 0.6 }}
                      />

                      {/* Selection dot */}
                      {isSelected && (
                        <motion.div
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: profile.color }}
                          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Login button */}
            <motion.div
              variants={itemVariants}
              className="pt-2"
            >
              <Button
                onClick={handleLogin}
                disabled={!selectedProfile || isLoading}
                className={`
                  w-full h-10 text-xs font-semibold
                  bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500
                  hover:from-cyan-400 hover:via-teal-400 hover:to-cyan-400
                  border-0 shadow-lg shadow-cyan-500/30
                  disabled:opacity-40 disabled:shadow-none
                  transition-all duration-300
                  relative overflow-hidden
                `}
              >
                <motion.span
                  className="flex items-center justify-center gap-1.5"
                  whileHover={selectedProfile ? { letterSpacing: '0.05em' } : {}}
                >
                  {isLoading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block text-sm"
                      >
                        ⚡
                      </motion.span>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </motion.span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
