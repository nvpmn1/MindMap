import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedNeuralBackground } from '@/components/OptimizedNeuralBackground';
import { getAllUserProfiles } from '@/lib/userProfiles';
import { Sparkles, ArrowRight, Zap, Shield, Users } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithProfile } = useAuthStore();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved user profiles with their chosen avatars
  const profilesWithAvatars = useMemo(() => {
    const users = getAllUserProfiles();
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      color: user.color,
      description: user.description || '',
      icon: user.name === 'Guilherme' ? Zap : user.name === 'Helen' ? Users : Shield,
      avatarUrl: user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name,
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
              className="flex flex-col items-center justify-center"
            >
              <AnimatePresence mode="wait">
                {/* Dynamic large avatar display */}
                <motion.div
                  key={selectedProfile || 'empty'}
                  initial={{ opacity: 0, scale: 0.65, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.65, y: -8 }}
                  transition={{ duration: 0.11, type: 'spring', stiffness: 650, damping: 18 }}
                    className="flex flex-col items-center justify-center space-y-3 py-2"
                  >
                    {selectedProfileData ? (
                      <>
                        {/* Avatar with realistic animations */}
                        <motion.div
                          className="relative flex items-center justify-center"
                          animate={{ 
                            scale: [1, 1.015, 1],
                            y: [0, -1.5, 0],
                          }}
                          transition={{ 
                            duration: 3.5, 
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          {/* Breathing aura glow */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                              background: `radial-gradient(circle, ${selectedProfileData.color}20, transparent)`,
                            }}
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                              scale: [0.95, 1.05, 0.95],
                            }}
                            transition={{
                              duration: 3.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />

                          <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/15 shadow-xl relative flex-shrink-0 bg-slate-900/50">
                            <img
                              src={selectedProfileData.avatarUrl}
                              alt={selectedProfileData.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Realistic gloss overlay */}
                            <motion.div
                              className="absolute inset-0 rounded-2xl pointer-events-none"
                              style={{
                                background: `linear-gradient(135deg, ${selectedProfileData.color}15 0%, transparent 50%)`,
                                border: `2px solid ${selectedProfileData.color}`,
                                boxShadow: `inset 0 0 15px ${selectedProfileData.color}20, 0 0 25px ${selectedProfileData.color}35`,
                              }}
                              animate={{
                                boxShadow: [
                                  `inset 0 0 15px ${selectedProfileData.color}20, 0 0 25px ${selectedProfileData.color}35`,
                                  `inset 0 0 25px ${selectedProfileData.color}35, 0 0 40px ${selectedProfileData.color}50`,
                                  `inset 0 0 15px ${selectedProfileData.color}20, 0 0 25px ${selectedProfileData.color}35`,
                                ],
                              }}
                              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
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
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.12, delay: 0.03 }}
                        >
                          <h2 className="text-xl font-semibold text-white">{selectedProfileData.name}</h2>
                          <p className="text-xs text-slate-400">{selectedProfileData.description}</p>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div
                        className="flex flex-col items-center justify-center space-y-2 py-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.1 }}
                      >
                        <motion.div 
                          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center"
                          animate={{ scale: [1, 1.01, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="w-6 h-6 text-cyan-400/40" strokeWidth={1} />
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
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
