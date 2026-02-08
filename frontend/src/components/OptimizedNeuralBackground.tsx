import React from 'react';
import { motion } from 'framer-motion';

/**
 * Optimized Neural Background
 * High performance with pure CSS animations and minimal Canvas rendering
 */
export const OptimizedNeuralBackground: React.FC = () => {
  // Generate random neural nodes for visual effect
  const generateNodes = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 12,
      delay: Math.random() * 4,
    }));
  };

  const nodes = generateNodes(40);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0">
        {/* Gradient orbs with blur */}
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, #06E5FF, transparent)',
            left: '-10%',
            top: '-10%',
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -40, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, #0D99FF, transparent)',
            right: '-10%',
            top: '20%',
          }}
          animate={{
            x: [0, -40, 40, 0],
            y: [0, 30, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />

        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, #06FFD0, transparent)',
            left: '20%',
            bottom: '-15%',
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {/* Neural nodes with floating animation */}
      <div className="absolute inset-0">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute rounded-full"
            style={{
              width: `${node.size}px`,
              height: `${node.size}px`,
              left: `${node.x}%`,
              top: `${node.y}%`,
              background: `radial-gradient(circle, rgba(6, 229, 255, 0.8), rgba(13, 153, 255, 0.4))`,
              boxShadow: '0 0 20px rgba(6, 229, 255, 0.6), 0 0 40px rgba(13, 153, 255, 0.3)',
            }}
            animate={{
              y: [0, -30, 30, 0],
              x: [0, 20, -20, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: node.duration,
              delay: node.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Animated grid lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
        <defs>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06E5FF" />
            <stop offset="50%" stopColor="#0D99FF" />
            <stop offset="100%" stopColor="#06FFD0" />
          </linearGradient>
        </defs>

        {/* Horizontal lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={`${(i + 1) * 12.5}%`}
            x2="100%"
            y2={`${(i + 1) * 12.5}%`}
            stroke="url(#gridGradient)"
            strokeWidth="1"
          />
        ))}

        {/* Vertical lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={`${(i + 1) * 12.5}%`}
            y1="0"
            x2={`${(i + 1) * 12.5}%`}
            y2="100%"
            stroke="url(#gridGradient)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-radial-gradient-to-edge from-transparent via-transparent to-slate-950/40" />

      {/* Top light leak effect */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
};
