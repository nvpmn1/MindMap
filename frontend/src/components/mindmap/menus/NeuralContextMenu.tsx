// ============================================================================
// NeuralMap - Context Menu (Right-click menu)
// ============================================================================

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Copy, Trash2, Scissors, Clipboard, Link, Unlink,
  Sparkles, Palette, Tag, Pin, PinOff, Lock, Unlock,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Brain, Lightbulb, ListTodo, Search, BarChart3,
  MessageSquare, Zap, Eye, EyeOff, Maximize2,
  FolderPlus, RefreshCw, Layers
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
  | { type: 'connect-to'; nodeId: string }
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

const QUICK_NODE_TYPES: NeuralNodeType[] = ['idea', 'task', 'note', 'reference', 'research', 'data'];

export const NeuralContextMenu: React.FC<ContextMenuProps> = ({ state, onClose, onAction }) => {
  if (!state) return null;

  const handleAction = useCallback((action: ContextMenuAction) => {
    onAction(action);
    onClose();
  }, [onAction, onClose]);

  return (
    <AnimatePresence>
      {state && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[61] w-60 bg-[#111827]/95 backdrop-blur-xl border border-white/10 
              rounded-xl shadow-2xl overflow-hidden py-1"
            style={{ left: state.x, top: state.y }}
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
            onClick={() => onAction({ type: 'add-node', nodeType: type, position: { x: state.x, y: state.y } })}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all group"
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} 
              flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity`}>
              {React.createElement(config.icon, { className: 'w-3.5 h-3.5 text-white' })}
            </div>
            <span className="text-[9px] text-slate-500 group-hover:text-slate-300">{config.label}</span>
          </button>
        );
      })}
    </div>
    <Divider />
    <MenuItem icon={Clipboard} label="Colar" shortcut="Ctrl+V"
      onClick={() => onAction({ type: 'paste-node', position: { x: state.x, y: state.y } })} />
    <MenuItem icon={Layers} label="Selecionar Tudo" shortcut="Ctrl+A"
      onClick={() => onAction({ type: 'select-all' })} />
    <MenuItem icon={Maximize2} label="Ajustar Visualização" shortcut="Ctrl+0"
      onClick={() => onAction({ type: 'fit-view' })} />
    <MenuItem icon={RefreshCw} label="Expandir Todos"
      onClick={() => onAction({ type: 'expand-all' })} />
  </>
);

// ─── Node Menu ──────────────────────────────────────────────────────────────

const NodeContextMenu: React.FC<{
  state: ContextMenuState;
  onAction: (a: ContextMenuAction) => void;
}> = ({ state, onAction }) => (
  <>
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      Ações do Nó
    </div>
    <MenuItem icon={Copy} label="Duplicar" shortcut="Ctrl+D"
      onClick={() => onAction({ type: 'duplicate-node', nodeId: state.nodeId! })} />
    <MenuItem icon={Scissors} label="Recortar" shortcut="Ctrl+X"
      onClick={() => onAction({ type: 'cut-node', nodeId: state.nodeId! })} />
    <MenuItem icon={Copy} label="Copiar" shortcut="Ctrl+C"
      onClick={() => onAction({ type: 'copy-node', nodeId: state.nodeId! })} />
    
    <Divider />
    
    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      🤖 IA
    </div>
    <MenuItem icon={Sparkles} label="Expandir com IA" accent="purple"
      onClick={() => onAction({ type: 'ai-expand', nodeId: state.nodeId! })} />
    <MenuItem icon={Brain} label="Analisar" accent="purple"
      onClick={() => onAction({ type: 'ai-analyze', nodeId: state.nodeId! })} />
    <MenuItem icon={ListTodo} label="Gerar Tarefas" accent="purple"
      onClick={() => onAction({ type: 'ai-generate-tasks', nodeId: state.nodeId! })} />
    <MenuItem icon={Search} label="Pesquisar Tema" accent="purple"
      onClick={() => onAction({ type: 'ai-research', nodeId: state.nodeId! })} />
    <MenuItem icon={BarChart3} label="Gerar Gráfico" accent="purple"
      onClick={() => onAction({ type: 'ai-chart', nodeId: state.nodeId! })} />
    
    <Divider />
    
    <SubmenuTrigger icon={Palette} label="Mudar Tipo">
      {Object.entries(NODE_TYPE_CONFIG).slice(1).map(([type, config]) => (
        <MenuItem
          key={type}
          icon={() => React.createElement(config.icon, { className: 'w-3.5 h-3.5' }) as any}
          label={config.label}
          onClick={() => onAction({ type: 'change-type', nodeId: state.nodeId!, nodeType: type as NeuralNodeType })}
        />
      ))}
    </SubmenuTrigger>
    
    <MenuItem icon={Link} label="Conectar a…"
      onClick={() => onAction({ type: 'connect-to', nodeId: state.nodeId! })} />
    <MenuItem icon={Unlink} label="Desconectar Todos"
      onClick={() => onAction({ type: 'disconnect-all', nodeId: state.nodeId! })} />
    <MenuItem icon={Pin} label="Fixar Posição"
      onClick={() => onAction({ type: 'pin-node', nodeId: state.nodeId! })} />
    <MenuItem icon={Lock} label="Bloquear Edição"
      onClick={() => onAction({ type: 'lock-node', nodeId: state.nodeId! })} />
    <MenuItem icon={FolderPlus} label="Agrupar Seleção"
      onClick={() => onAction({ type: 'group-selected' })} />
    
    <Divider />
    
    <MenuItem icon={Trash2} label="Excluir" shortcut="Del" danger
      onClick={() => onAction({ type: 'delete-node', nodeId: state.nodeId! })} />
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
    <MenuItem icon={Trash2} label="Remover Conexão" danger
      onClick={() => onAction({ type: 'delete-edge', edgeId: state.edgeId! })} />
  </>
);

// ─── Shared UI ──────────────────────────────────────────────────────────────

const Divider: React.FC = () => (
  <div className="my-1 h-px bg-white/[0.06]" />
);

const MenuItem: React.FC<{
  icon: React.FC<any>;
  label: string;
  onClick: () => void;
  shortcut?: string;
  accent?: 'purple' | 'cyan';
  danger?: boolean;
}> = ({ icon: Icon, label, onClick, shortcut, accent, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs transition-all
      ${danger 
        ? 'text-red-400 hover:bg-red-500/10' 
        : accent === 'purple' 
          ? 'text-purple-300 hover:bg-purple-500/10' 
          : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
  >
    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-slate-600 font-mono">{shortcut}</span>
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
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-slate-300 
        hover:bg-white/5 hover:text-white transition-all cursor-pointer">
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
