// ============================================================================
// NeuralMap - Command Toolbar (Bottom floating toolbar)
// ============================================================================

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  CheckSquare,
  FileText,
  Link2,
  Search,
  BarChart3,
  HelpCircle,
  GitBranch,
  Users,
  Grid3X3,
  Milestone,
  Brain,
  Sparkles,
  Lock,
  Unlock,
  Keyboard,
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
  { type: 'group', shortcut: 'G' },
];

const CommandToolbarComponent: React.FC<CommandToolbarProps> = ({
  onCreateNode,
  onToggleAI,
  isLocked,
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
        className="fixed inset-x-0 bottom-2 mx-auto w-fit z-40"
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl
          bg-[#111827]/90 backdrop-blur-xl border border-amber-500/20 
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-300">
            Mapa bloqueado • Pressione L para desbloquear
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-2 mx-auto w-fit z-40"
    >
      {/* Dropdown menu for "Mais" */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="flex flex-wrap justify-center gap-2 px-4 py-3 rounded-2xl
              bg-gradient-to-br from-[#1a202c]/95 via-[#111827]/95 to-[#0f1419]/95
              backdrop-blur-xl border border-white/[0.1] 
              shadow-[0_20px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]
              w-fit min-w-[280px]"
            >
              {/* Extra actions in grid */}
              {extraActions.map(({ type, shortcut }) => {
                const config = NODE_TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <motion.button
                    key={type}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.12, y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      onCreateNode(type);
                      setShowAll(false);
                    }}
                    className="relative group flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
                      hover:bg-white/[0.08] transition-all"
                    title={`${config.label} (${shortcut})`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center
                      bg-gradient-to-br ${config.gradient} border ${config.borderColor}
                      group-hover:shadow-lg group-hover:scale-110 transition-all`}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
                    </div>
                    <span
                      className="text-[8px] text-slate-400 group-hover:text-slate-200 
                      transition-colors font-medium"
                    >
                      {config.label}
                    </span>
                    {showShortcuts && (
                      <span className="text-[7px] text-slate-600 group-hover:text-slate-400">
                        {shortcut}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toolbar */}
      <div
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-2xl
        bg-gradient-to-br from-[#1a202c]/95 via-[#111827]/95 to-[#0f1419]/95
        backdrop-blur-xl border border-white/[0.1] 
        shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]
        hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]
        transition-shadow w-fit"
      >
        {/* Left section: Primary node types */}
        <div className="flex items-center gap-1.5">
          {mainActions.map(({ type, shortcut }) => {
            const config = NODE_TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.12, y: -3 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onCreateNode(type)}
                className="relative group flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                  hover:bg-white/[0.08] transition-all"
                title={`${config.label} (${shortcut})`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center
                  bg-gradient-to-br ${config.gradient} border ${config.borderColor}
                  group-hover:shadow-[0_0_16px_${config.color}40] group-hover:scale-110 
                  transition-all`}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
                </div>
                <span
                  className="text-[8px] text-slate-400 group-hover:text-slate-200 
                  transition-colors font-medium whitespace-nowrap"
                >
                  {config.label}
                </span>

                {/* Shortcut badge */}
                {showShortcuts && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[7px] text-slate-600 group-hover:text-slate-400
                      font-bold"
                  >
                    {shortcut}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-white/[0.08] mx-1" />

        {/* Right section: Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* More button */}
          {extraActions.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.12, y: -3 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowAll(!showAll)}
              className="relative group flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                hover:bg-white/[0.08] transition-all"
              title="Mais opções"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center
                bg-gradient-to-br from-slate-600/20 to-slate-700/20 
                border border-slate-600/30
                group-hover:shadow-lg group-hover:scale-110 
                transition-all`}
              >
                <span className="text-sm text-slate-300 font-bold">{showAll ? '−' : '+'}</span>
              </div>
              <span
                className="text-[8px] text-slate-400 group-hover:text-slate-200 
                transition-colors font-medium"
              >
                {showAll ? 'Menos' : 'Mais'}
              </span>
            </motion.button>
          )}

          {/* AI Agent */}
          <motion.button
            whileHover={{ scale: 1.12, y: -3 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleAI}
            className="relative group flex flex-col items-center gap-1 px-3 py-2 rounded-xl
              hover:bg-purple-500/10 transition-all"
            title="Abrir AI Agent"
          >
            <div
              className="relative w-9 h-9 rounded-lg flex items-center justify-center
              bg-gradient-to-br from-purple-500/30 to-cyan-500/20 
              border border-purple-500/40 group-hover:border-purple-400/60
              group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
            >
              <Sparkles className="w-4.5 h-4.5 text-purple-300" />
              <div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full 
                border border-[#111827] animate-pulse shadow-lg shadow-emerald-400/50"
              />
            </div>
            <span
              className="text-[8px] text-purple-300 group-hover:text-purple-200 
              transition-colors font-medium"
            >
              AI Agent
            </span>
          </motion.button>

          {/* Shortcuts toggle */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl
              hover:bg-white/[0.06] transition-all"
            title="Mostrar atalhos"
          >
            <Keyboard
              className={`w-4 h-4 transition-colors ${
                showShortcuts ? 'text-cyan-400' : 'text-slate-600'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Hint text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-2 px-4"
      >
        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
          Clique para adicionar • <span className="text-slate-600">Atalhos: I, T, N, R, P, D</span>
        </span>
      </motion.div>
    </motion.div>
  );
};

export const CommandToolbar = memo(CommandToolbarComponent);
export default CommandToolbar;
