import React, { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Command,
  Keyboard,
  Lock,
  PlusCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import { NODE_TYPE_CONFIG } from '../editor/constants';
import type { NeuralNodeType } from '../editor/types';
import {
  NODE_BLUEPRINT_CATEGORY_LABELS,
  NODE_BLUEPRINTS,
  NODE_BLUEPRINTS_BY_CATEGORY,
  type NodeBlueprint,
  type NodeBlueprintCategory,
} from '../editor/nodeBlueprints';

interface CommandToolbarProps {
  onCreateNode: (type: NeuralNodeType, blueprintId?: string) => void;
  onToggleAI: () => void;
  isLocked: boolean;
  className?: string;
}

const PRIMARY_TYPES: NeuralNodeType[] = ['idea', 'task', 'note', 'research', 'data', 'reference'];
const CATEGORY_ORDER: NodeBlueprintCategory[] = [
  'ideation',
  'execution',
  'research',
  'data',
  'documents',
  'ai',
];

const BlueprintCard: React.FC<{
  blueprint: NodeBlueprint;
  onCreate: (blueprint: NodeBlueprint) => void;
}> = ({ blueprint, onCreate }) => {
  const Icon = blueprint.icon;
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onCreate(blueprint)}
      className="w-full rounded-2xl border border-white/10 bg-[#0b1325]/90 p-3 text-left transition-all hover:border-white/20 hover:bg-[#111d34]"
    >
      <div className="flex items-start gap-2.5">
        <div
          className="h-10 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center"
          style={{
            boxShadow: `0 0 0 1px ${blueprint.accentColor}30`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: blueprint.accentColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-white">{blueprint.title}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">{blueprint.subtitle}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
          {NODE_TYPE_CONFIG[blueprint.type]?.label || blueprint.type}
        </span>
        <span className="text-[10px] text-cyan-300">template ready</span>
      </div>
    </motion.button>
  );
};

const CommandToolbarComponent: React.FC<CommandToolbarProps> = ({
  onCreateNode,
  onToggleAI,
  isLocked,
}) => {
  const [activeCategory, setActiveCategory] = useState<NodeBlueprintCategory>('ideation');
  const [collapsed, setCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBlueprints = useMemo(() => {
    const base = NODE_BLUEPRINTS_BY_CATEGORY[activeCategory] || [];
    if (!searchTerm.trim()) return base;
    const query = searchTerm.trim().toLowerCase();
    return base.filter(
      (blueprint) =>
        blueprint.title.toLowerCase().includes(query) ||
        blueprint.subtitle.toLowerCase().includes(query) ||
        blueprint.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [activeCategory, searchTerm]);

  const handleCreateBlueprint = (blueprint: NodeBlueprint) => {
    onCreateNode(blueprint.type, blueprint.id);
    setMobileOpen(false);
  };

  if (isLocked) {
    return (
      <div className="fixed left-4 top-[6.5rem] z-50 rounded-2xl border border-amber-400/25 bg-[#171a2a]/92 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <Lock className="h-4 w-4" />
          <span>Mapa bloqueado. Pressione L para editar.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed left-4 top-[6.5rem] z-50 hidden md:block">
        <motion.aside
          animate={{ width: collapsed ? 86 : 368 }}
          transition={{ type: 'spring', damping: 24, stiffness: 240 }}
          className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#0b1324]/96 via-[#091122]/96 to-[#08101d]/96 shadow-[0_24px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl"
        >
          <div className="flex items-center gap-2 border-b border-white/8 px-3 py-3">
            <button
              onClick={() => setCollapsed((previous) => !previous)}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-1.5 text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
              title={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {!collapsed && (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="h-7 w-7 rounded-xl border border-cyan-400/25 bg-cyan-400/10 flex items-center justify-center">
                    <Command className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Node Studio</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                      Refined templates
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleAI}
                  className="ml-auto rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-400/20"
                >
                  AI Agent
                </button>
              </>
            )}
          </div>

          <div className={`${collapsed ? 'px-2 py-2' : 'px-3 py-3'} space-y-3`}>
            <div className="grid grid-cols-2 gap-1.5">
              {(collapsed ? PRIMARY_TYPES.slice(0, 2) : PRIMARY_TYPES).map((type) => {
                const config = NODE_TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => onCreateNode(type)}
                    className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left hover:border-white/20 hover:bg-white/[0.07]"
                    title={config.description}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: config.color }} />
                    {!collapsed && (
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-medium text-slate-200">{config.label}</div>
                        {showShortcuts && (
                          <div className="text-[9px] text-slate-500">{config.shortcut}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!collapsed && (
              <>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search templates..."
                    className="w-full bg-transparent text-[11px] text-slate-200 placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {CATEGORY_ORDER.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        activeCategory === category
                          ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30'
                          : 'bg-white/[0.02] text-slate-400 border border-white/8 hover:text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      {NODE_BLUEPRINT_CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>

                <div className="max-h-[370px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredBlueprints.map((blueprint) => (
                    <BlueprintCard
                      key={blueprint.id}
                      blueprint={blueprint}
                      onCreate={handleCreateBlueprint}
                    />
                  ))}
                  {filteredBlueprints.length === 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-4 text-center text-[11px] text-slate-500">
                      No templates found for this filter.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-2">
                  <button
                    onClick={() => setShowShortcuts((previous) => !previous)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    {showShortcuts ? 'Hide shortcuts' : 'Show shortcuts'}
                  </button>
                  <div className="text-[10px] text-slate-500">{NODE_BLUEPRINTS.length} templates</div>
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </div>

      <div className="fixed inset-x-0 bottom-3 z-50 px-3 md:hidden">
        <div className="mx-auto max-w-[720px] rounded-2xl border border-white/10 bg-[#0a1222]/95 p-2 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen((previous) => !previous)}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-200"
            >
              <PlusCircle className="h-4 w-4 text-cyan-300" />
              {mobileOpen ? 'Hide templates' : 'Show templates'}
            </button>
            <button
              onClick={onToggleAI}
              className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs text-cyan-100"
            >
              <Brain className="h-4 w-4" />
              AI
            </button>
            <button
              onClick={() => onCreateNode('idea')}
              className="ml-auto inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-200"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Quick node
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {NODE_BLUEPRINTS.slice(0, 8).map((blueprint) => (
                    <button
                      key={blueprint.id}
                      onClick={() => handleCreateBlueprint(blueprint)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-left"
                    >
                      <div className="text-[11px] font-medium text-slate-200">{blueprint.title}</div>
                      <div className="text-[10px] text-slate-500">{blueprint.subtitle}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export const CommandToolbar = memo(CommandToolbarComponent);
export default CommandToolbar;
