// ============================================================================
// NeuralMap - Command Toolbar (Bottom floating toolbar)
// ============================================================================

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, CheckSquare, FileText, Link2, Search, BarChart3,
  HelpCircle, GitBranch, Users, Grid3X3, Milestone, Brain,
  Sparkles, Lock, Unlock, Keyboard
} from 'lucide-react';
import { NODE_TYPE_CONFIG } from '../editor/constants';
import type { NeuralNodeType } from '../editor/types';

interface CommandToolbarProps {
  onCreateNode: (type: NeuralNodeType) => void;
  onToggleAI: () => void;
  isLocked: boolean;
  className?: string;
}

const nodeActions: Array<{ type: NeuralNodeType; shortcut: string }> = [
  { type: 'idea', shortcut: 'I' },
  { type: 'task', shortcut: 'T' },
  { type: 'note', shortcut: 'N' },
  { type: 'reference', shortcut: 'R' },
  { type: 'research', shortcut: 'P' },
  { type: 'data', shortcut: 'D' },
  { type: 'question', shortcut: 'Q' },
  { type: 'milestone', shortcut: 'M' },
  { type: 'decision', shortcut: 'X' },
  { type: 'resource', shortcut: 'U' },
];

const CommandToolbarComponent: React.FC<CommandToolbarProps> = ({
  onCreateNode, onToggleAI, isLocked
}) => {
  const [showAll, setShowAll] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const mainActions = nodeActions.slice(0, 6);
  const extraActions = nodeActions.slice(6);

  if (isLocked) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl
          bg-[#111827]/90 backdrop-blur-xl border border-amber-500/20 
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-300">Mapa bloqueado • Pressione L para desbloquear</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl
        bg-[#111827]/90 backdrop-blur-xl border border-white/[0.08] 
        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.02)]">
        
        {/* Main node types */}
        {mainActions.map(({ type, shortcut }) => {
          const config = NODE_TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <motion.button
              key={type}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCreateNode(type)}
              className="relative group flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl
                hover:bg-white/[0.06] transition-all"
              title={`${config.label} (${shortcut})`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                bg-gradient-to-br ${config.gradient} border ${config.borderColor}
                group-hover:shadow-lg transition-all`}
                style={{ boxShadow: `0 0 0 0 ${config.color}00` }}
              >
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <span className="text-[9px] text-slate-500 group-hover:text-slate-300 transition-colors">
                {config.label}
              </span>
              
              {/* Shortcut badge */}
              {showShortcuts && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-1 -right-0.5 w-4 h-4 rounded-md bg-white/10 
                    border border-white/20 flex items-center justify-center
                    text-[8px] font-bold text-white/60"
                >
                  {shortcut}
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* More button */}
        <AnimatePresence>
          {showAll && extraActions.map(({ type, shortcut }) => {
            const config = NODE_TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                whileHover={{ scale: 1.1, y: -2 }}
                onClick={() => onCreateNode(type)}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl
                  hover:bg-white/[0.06] transition-all overflow-hidden"
                title={`${config.label} (${shortcut})`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                  bg-gradient-to-br ${config.gradient} border ${config.borderColor}`}>
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                </div>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">{config.label}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {extraActions.length > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl
              hover:bg-white/[0.06] transition-all"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center
              bg-white/[0.03] border border-white/[0.08]">
              <span className="text-xs text-slate-400">{showAll ? '−' : '+'}</span>
            </div>
            <span className="text-[9px] text-slate-500">{showAll ? 'Menos' : 'Mais'}</span>
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-10 bg-white/[0.06] mx-1" />

        {/* AI Agent */}
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleAI}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl
            hover:bg-purple-500/10 transition-all group"
        >
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center
            bg-gradient-to-br from-purple-500/20 to-cyan-500/20 
            border border-purple-500/30 group-hover:border-purple-400/50
            group-hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] transition-all">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full 
              border border-[#111827] animate-pulse" />
          </div>
          <span className="text-[9px] text-purple-400/70 group-hover:text-purple-300">
            AI Agent
          </span>
        </motion.button>

        {/* Shortcuts toggle */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl
            hover:bg-white/[0.04] transition-all"
          title="Mostrar atalhos"
        >
          <Keyboard className={`w-4 h-4 ${showShortcuts ? 'text-cyan-400' : 'text-slate-600'}`} />
        </button>
      </div>

      {/* Hint text */}
      <div className="text-center mt-2">
        <span className="text-[10px] text-slate-600">
          Clique para adicionar nó • Atalhos: I, T, N, R, P, D, Q
        </span>
      </div>
    </motion.div>
  );
};

export const CommandToolbar = memo(CommandToolbarComponent);
export default CommandToolbar;
