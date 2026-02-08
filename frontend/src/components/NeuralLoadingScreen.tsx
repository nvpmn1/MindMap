import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

/**
 * Neural Map Loading Screen Component
 * Modern, elegant loading screen with animated background and spinner
 */
export const NeuralLoadingScreen: React.FC<{
  message?: string;
  subtitle?: string;
}> = ({ message = 'Carregando Mapa Neural', subtitle = 'Preparando canvas inteligente...' }) => {
  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#060910] via-[#0f1419] to-[#060910] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main loader container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Brain icon with modern spinner */}
        <div className="relative w-24 h-24">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner pulsing ring */}
          <motion.div
            className="absolute inset-2 rounded-full border border-cyan-400/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Brain icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Brain className="w-10 h-10 text-cyan-400" />
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Brain className="w-10 h-10 text-cyan-300" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-3">
          <motion.h2
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}
          </motion.h2>

          <p className="text-sm text-slate-400">{subtitle}</p>

          {/* Loading dots animation */}
          <div className="flex items-center justify-center gap-1 pt-4">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative mt-4">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default NeuralLoadingScreen;
