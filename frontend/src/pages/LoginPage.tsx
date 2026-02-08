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
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden">
      {/* Optimized neural background */}
      <OptimizedNeuralBackground />

      {/* Main content container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 w-full max-w-5xl mx-auto px-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left section: Hero content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Logo and title */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-3 bg-gradient-to-br from-cyan-500/30 to-teal-500/10 rounded-xl border border-cyan-400/40 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Sparkles className="w-6 h-6 text-cyan-300" strokeWidth={1.5} />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-light tracking-tight">
                    <span className="text-white">Neural</span>
                    <span className="font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      Map
                    </span>
                  </h1>
                  <p className="text-xs text-cyan-400/60 tracking-widest uppercase mt-1">
                    Collaborative Intelligence
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-slate-300 text-lg leading-relaxed">
                Powered by advanced neural networks, designed for teams who think differently.
              </p>
              <p className="text-slate-400 text-sm">
                Map your ideas, collaborate in real-time, and unlock insights together.
              </p>
            </motion.div>

            {/* Features list */}
            <motion.div variants={itemVariants} className="space-y-3 pt-4">
              {[
                { icon: '⚡', text: 'Real-time Neural AI Processing' },
                { icon: '🔗', text: 'Seamless Team Collaboration' },
                { icon: '🛡️', text: 'Enterprise-Grade Security' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-3 text-sm text-slate-300"
                  whileHover={{ x: 8 }}
                >
                  <span className="text-lg">{feature.icon}</span>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right section: Profile selection with dynamic avatar */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            {/* Card background */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-purple-500/10 rounded-3xl blur-2xl" />

              <div className="relative bg-[#080C14]/60 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-10 shadow-2xl space-y-8">
                {/* Dynamic large avatar display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedProfile || 'empty'}
                    initial={{ opacity: 0, scale: 0.3, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.3, y: -30 }}
                    transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex flex-col items-center justify-center space-y-8 min-h-[420px]"
                  >
                    {selectedProfileData ? (
                      <>
                        {/* Large avatar with glow */}
                        <motion.div
                          className="relative flex items-center justify-center"
                          animate={{ 
                            scale: [1, 1.04, 1],
                            y: [0, -4, 0],
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          <div className="w-60 h-60 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl relative flex-shrink-0">
                            <img
                              src={selectedProfileData.avatarUrl}
                              alt={selectedProfileData.name}
                              className="w-full h-full object-cover"
                            />
                            <motion.div
                              className="absolute inset-0 rounded-3xl pointer-events-none"
                              style={{
                                border: `2px solid ${selectedProfileData.color}`,
                                boxShadow: `inset 0 0 20px ${selectedProfileData.color}30, 0 0 40px ${selectedProfileData.color}50`,
                              }}
                              animate={{
                                boxShadow: [
                                  `inset 0 0 20px ${selectedProfileData.color}30, 0 0 40px ${selectedProfileData.color}50`,
                                  `inset 0 0 35px ${selectedProfileData.color}50, 0 0 60px ${selectedProfileData.color}70`,
                                  `inset 0 0 20px ${selectedProfileData.color}30, 0 0 40px ${selectedProfileData.color}50`,
                                ],
                              }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </div>

                          {/* Pulsing rings around avatar */}
                          <motion.div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              border: `2px solid ${selectedProfileData.color}40`,
                              width: '264px',
                              height: '264px',
                            }}
                            animate={{
                              scale: [1, 1.15, 1],
                              opacity: [0.8, 0.2, 0],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                          />
                          <motion.div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              border: `1px solid ${selectedProfileData.color}25`,
                              width: '308px',
                              height: '308px',
                            }}
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.4, 0, 0],
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
                          />
                        </motion.div>

                        {/* Profile info */}
                        <motion.div
                          className="text-center space-y-2 w-full"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.15 }}
                        >
                          <h2 className="text-3xl font-semibold text-white tracking-tight">
                            {selectedProfileData.name}
                          </h2>
                          <p className="text-sm text-slate-400 font-medium">
                            {selectedProfileData.description}
                          </p>
                          <motion.div
                            className="h-1 w-20 rounded-full mx-auto mt-3"
                            style={{
                              background: `linear-gradient(90deg, ${selectedProfileData.color}, transparent)`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: '80px' }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                          />
                        </motion.div>

                        {/* Quick info */}
                        <motion.div
                          className="grid grid-cols-3 gap-4 w-full text-center text-xs"
                          variants={itemVariants}
                        >
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Status</p>
                            <p className="text-cyan-400 font-semibold mt-1">Ready</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Access</p>
                            <p className="text-teal-400 font-semibold mt-1">Full</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Role</p>
                            <p className="text-blue-400 font-semibold mt-1">Active</p>
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div
                        className="flex flex-col items-center justify-center space-y-8 text-center"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.3 }}
                        transition={{ duration: 0.25, type: 'spring', stiffness: 400 }}
                      >
                        <motion.div 
                          className="w-48 h-48 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 flex items-center justify-center"
                          animate={{ 
                            scale: [1, 1.03, 1],
                            y: [0, -3, 0],
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <motion.div 
                            className="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 flex items-center justify-center border border-cyan-500/20"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
                          </motion.div>
                        </motion.div>
                        <motion.div
                          className="space-y-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <p className="text-slate-300 font-semibold text-lg">Select your profile</p>
                          <p className="text-sm text-slate-500">Choose an account below to enter the workspace</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Profile selector buttons */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 border-t border-slate-700/30 pt-8"
                >
                  <p className="text-xs text-slate-500 text-center uppercase tracking-widest">
                    Choose your workspace
                  </p>

                  <div className="space-y-2">
                    {profilesWithAvatars.map((profile) => {
                      const isSelected = selectedProfile === profile.id;
                      const Icon = profile.icon;

                      return (
                        <motion.button
                          key={profile.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectProfile(profile.id)}
                          className={`
                            w-full group relative overflow-hidden rounded-xl p-4
                            border backdrop-blur-sm transition-all duration-300
                            flex items-center gap-4 text-left
                            ${isSelected
                              ? `border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 to-teal-500/10`
                              : `border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/40 hover:border-cyan-400/40`
                            }
                          `}
                        >
                          {/* Selection glow */}
                          {isSelected && (
                            <motion.div
                              layoutId="profileGlow"
                              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-teal-500/5 rounded-xl"
                              initial={false}
                              transition={{ duration: 0.3 }}
                            />
                          )}

                          <div className="relative z-10 flex items-center gap-4 flex-1">
                            {/* Small avatar */}
                            <motion.div
                              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 shadow-lg"
                              whileHover={{ scale: 1.08 }}
                            >
                              <img
                                src={profile.avatarUrl}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>

                            {/* Profile name and email */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {profile.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {profile.email}
                              </p>
                            </div>

                            {/* Icon */}
                            <Icon
                              className="w-4 h-4 flex-shrink-0 opacity-60"
                              style={{ color: profile.color }}
                            />
                          </div>

                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                              style={{ backgroundColor: profile.color }}
                              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Login button */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Button
                    onClick={handleLogin}
                    disabled={!selectedProfile || isLoading}
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
                      whileHover={selectedProfile ? { letterSpacing: '0.05em' } : {}}
                    >
                      {isLoading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block"
                          >
                            ⚡
                          </motion.span>
                          Entering Neural Workspace...
                        </>
                      ) : (
                        <>
                          Access Neural Workspace
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </motion.span>

                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                      animate={selectedProfile && !isLoading ? { opacity: [0, 0.3, 0], x: ['-100%', '100%'] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    🔐 Secure environment • Real-time collaboration
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
