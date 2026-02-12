// ============================================================================
// NeuralMap - Context Menu (Right-click menu)
// ============================================================================

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Copy,
  Trash2,
  Scissors,
  Clipboard,
  Link,
  Unlink,
  Sparkles,
  Palette,
  Tag,
  Pin,
  PinOff,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Brain,
  Lightbulb,
  ListTodo,
  Search,
  BarChart3,
  MessageSquare,
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  FolderPlus,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { NODE_TYPE_CONFIG } from '../editor/constants';
import type { NeuralNodeType } from '../editor/types';

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  isCanvas: boolean;
}

interface ContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
  onAction: (action: ContextMenuAction) => void;
}

export type ContextMenuAction =
  | { type: 'add-node'; nodeType: NeuralNodeType; position: { x: number; y: number } }
  | { type: 'delete-node'; nodeId: string }
  | { type: 'duplicate-node'; nodeId: string }
  | { type: 'copy-node'; nodeId: string }
  | { type: 'paste-node'; position: { x: number; y: number } }
  | { type: 'cut-node'; nodeId: string }
  | { type: 'disconnect-all'; nodeId: string }
  | { type: 'pin-node'; nodeId: string }
  | { type: 'lock-node'; nodeId: string }
  | { type: 'collapse-node'; nodeId: string }
  | { type: 'expand-all' }
  | { type: 'fit-view' }
  | { type: 'select-all' }
  | { type: 'group-selected' }
  | { type: 'ai-expand'; nodeId: string }
  | { type: 'ai-analyze'; nodeId: string }
  | { type: 'ai-generate-tasks'; nodeId: string }
  | { type: 'ai-research'; nodeId: string }
  | { type: 'ai-chart'; nodeId: string }
  | { type: 'delete-edge'; edgeId: string }
  | { type: 'change-type'; nodeId: string; nodeType: NeuralNodeType };

const QUICK_NODE_TYPES: NeuralNodeType[] = [
  'idea',
  'task',
  'note',
  'reference',
  'research',
  'data',
];

export const NeuralContextMenu: React.FC<ContextMenuProps> = ({ state, onClose, onAction }) => {
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state || !menuRef.current) return;

    const updatePosition = () => {
      const menuRect = menuRef.current?.getBoundingClientRect();
      if (!menuRect) return;

      let top = state.y;
      let left = Math.min(state.x, window.innerWidth - 260);

      // Check if menu goes below viewport - if so, position above cursor
      const spaceBelow = window.innerHeight - state.y;
      const menuHeight = menuRect.height;

      if (spaceBelow < menuHeight + 20) {
        // Not enough space below, try above
        top = state.y - menuHeight - 10;
      } else {
        // Enough space below, use normal position with small buffer
        top = state.y;
      }

      // Ensure menu doesn't go above viewport
      if (top < 10) {
        top = 10;
      }

      // Ensure menu doesn't go below viewport
      if (top + menuHeight + 10 > window.innerHeight) {
        top = window.innerHeight - menuHeight - 10;
      }

      setPosition({ left, top });
    };

    // Use requestAnimationFrame to ensure menu dimensions are calculated
    const rafId = requestAnimationFrame(() => {
      setTimeout(updatePosition, 0);
    });

    return () => cancelAnimationFrame(rafId);
  }, [state]);

  const handleAction = useCallback(
    (action: ContextMenuAction) => {
      onAction(action);
      onClose();
    },
    [onAction, onClose]
  );

  return (
    <AnimatePresence>
      {state && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[60]" onClick={onClose} />

          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[61] w-64 bg-[#111827]/95 backdrop-blur-xl border border-white/10 
              rounded-xl shadow-2xl overflow-hidden py-1 max-h-[80vh] overflow-y-auto"
            style={{ left: position.left, top: position.top }}
          >
            {state.nodeId ? (
              <NodeContextMenu state={state} onAction={handleAction} />
            ) : state.edgeId ? (
              <EdgeContextMenu state={state} onAction={handleAction} />
            ) : (
              <CanvasContextMenu state={state} onAction={handleAction} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Canvas Menu ────────────────────────────────────────────────────────────

const CanvasContextMenu: React.FC<{
  state: ContextMenuState;
  onAction: (a: ContextMenuAction) => void;
}> = ({ state, onAction }) => (
  <>
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      Adicionar Nó
    </div>
    <div className="grid grid-cols-3 gap-1 px-2 pb-2">
      {QUICK_NODE_TYPES.map((type) => {
        const config = NODE_TYPE_CONFIG[type];
        return (
          <button
            key={type}
            onClick={() =>
              onAction({ type: 'add-node', nodeType: type, position: { x: state.x, y: state.y } })
            }
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all group"
          >
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} 
              flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity`}
            >
              {React.createElement(config.icon, { className: 'w-3.5 h-3.5 text-white' })}
            </div>
            <span className="text-[9px] text-slate-500 group-hover:text-slate-300">
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
    <Divider />
    <MenuItem
      icon={Clipboard}
      label="Colar"
      shortcut="Ctrl+V"
      onClick={() => onAction({ type: 'paste-node', position: { x: state.x, y: state.y } })}
    />
    <MenuItem
      icon={Layers}
      label="Selecionar Tudo"
      shortcut="Ctrl+A"
      onClick={() => onAction({ type: 'select-all' })}
    />
    <MenuItem
      icon={Maximize2}
      label="Ajustar Visualização"
      shortcut="F"
      onClick={() => onAction({ type: 'fit-view' })}
    />
    <MenuItem
      icon={RefreshCw}
      label="Expandir Todos"
      onClick={() => onAction({ type: 'expand-all' })}
    />
  </>
);

// ─── Node Menu ──────────────────────────────────────────────────────────────

const NodeContextMenu: React.FC<{
  state: ContextMenuState;
  onAction: (a: ContextMenuAction) => void;
}> = ({ state, onAction }) => (
  <>
    {/* Operações básicas */}
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      Operações
    </div>
    <MenuItem
      icon={Copy}
      label="Duplicar"
      shortcut="Ctrl+D"
      onClick={() => onAction({ type: 'duplicate-node', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={Copy}
      label="Copiar"
      shortcut="Ctrl+C"
      onClick={() => onAction({ type: 'copy-node', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={Scissors}
      label="Recortar"
      shortcut="Ctrl+X"
      onClick={() => onAction({ type: 'cut-node', nodeId: state.nodeId! })}
    />

    <Divider />

    {/* Configurações do nó */}
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      Configurar
    </div>
    <SubmenuTrigger icon={Palette} label="Mudar Tipo">
      {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => (
        <MenuItem
          key={type}
          icon={() => React.createElement(config.icon, { className: 'w-3.5 h-3.5' }) as any}
          label={config.label}
          onClick={() =>
            onAction({
              type: 'change-type',
              nodeId: state.nodeId!,
              nodeType: type as NeuralNodeType,
            })
          }
        />
      ))}
    </SubmenuTrigger>

    <MenuItem
      icon={Pin}
      label="Fixar Posição"
      onClick={() => onAction({ type: 'pin-node', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={Lock}
      label="Bloquear Edição"
      onClick={() => onAction({ type: 'lock-node', nodeId: state.nodeId! })}
    />

    <Divider />

    {/* IA */}
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      🤖 IA
    </div>
    <MenuItem
      icon={Sparkles}
      label="Expandir com IA"
      accent="purple"
      title="Generate related ideas and subtopics"
      onClick={() => onAction({ type: 'ai-expand', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={Brain}
      label="Analisar"
      accent="purple"
      title="Deep analysis and insights"
      onClick={() => onAction({ type: 'ai-analyze', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={ListTodo}
      label="Gerar Tarefas"
      accent="purple"
      title="Create actionable tasks"
      onClick={() => onAction({ type: 'ai-generate-tasks', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={Search}
      label="Pesquisar Tema"
      accent="purple"
      title="Research and gather information"
      onClick={() => onAction({ type: 'ai-research', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={BarChart3}
      label="Gerar Gráfico"
      accent="purple"
      title="Create visualization charts"
      onClick={() => onAction({ type: 'ai-chart', nodeId: state.nodeId! })}
    />

    <Divider />

    {/* Conexões */}
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      Conexões
    </div>
    <MenuItem
      icon={Unlink}
      label="Desconectar Todos"
      onClick={() => onAction({ type: 'disconnect-all', nodeId: state.nodeId! })}
    />
    <MenuItem
      icon={FolderPlus}
      label="Agrupar Seleção"
      onClick={() => onAction({ type: 'group-selected' })}
    />

    <Divider />

    {/* Perigo */}
    <MenuItem
      icon={Trash2}
      label="Excluir"
      shortcut="Del"
      danger
      onClick={() => onAction({ type: 'delete-node', nodeId: state.nodeId! })}
    />
  </>
);

// ─── Edge Menu ──────────────────────────────────────────────────────────────

const EdgeContextMenu: React.FC<{
  state: ContextMenuState;
  onAction: (a: ContextMenuAction) => void;
}> = ({ state, onAction }) => (
  <>
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      Conexão
    </div>
    <MenuItem
      icon={Trash2}
      label="Remover Conexão"
      danger
      onClick={() => onAction({ type: 'delete-edge', edgeId: state.edgeId! })}
    />
  </>
);

// ─── Shared UI ──────────────────────────────────────────────────────────────

const Divider: React.FC = () => <div className="my-1 h-px bg-white/[0.06]" />;

const MenuItem: React.FC<{
  icon: React.FC<any>;
  label: string;
  onClick: () => void;
  shortcut?: string;
  accent?: 'purple' | 'cyan';
  danger?: boolean;
  title?: string;
  disabled?: boolean;
}> = ({ icon: Icon, label, onClick, shortcut, accent, danger, title, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs transition-all group relative
      ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : danger
            ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
            : accent === 'purple'
              ? 'text-purple-300 hover:bg-purple-500/10 active:bg-purple-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10'
      }`}
  >
    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-slate-600 font-mono group-hover:text-slate-500">
        {shortcut}
      </span>
    )}
  </button>
);

const SubmenuTrigger: React.FC<{
  icon: React.FC<any>;
  label: string;
  children: React.ReactNode;
}> = ({ icon: Icon, label, children }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-slate-300 
        hover:bg-white/5 hover:text-white transition-all cursor-pointer"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1">{label}</span>
        <ChevronRight className="w-3 h-3 text-slate-500" />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="absolute left-full top-0 ml-1 w-48 bg-[#111827]/95 backdrop-blur-xl 
              border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 max-h-64 overflow-y-auto"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeuralContextMenu;
