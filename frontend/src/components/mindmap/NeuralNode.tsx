import { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  CheckSquare, 
  FileText, 
  Link2, 
  Database, 
  Cpu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit3,
  GitBranch,
  Zap,
  ChevronRight,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NeuralNodeData {
  label: string;
  type: 'idea' | 'task' | 'note' | 'reference' | 'data' | 'process' | 'root';
  description?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tasks?: number;
  comments?: number;
  progress?: number;
  creator?: {
    name: string;
    color: string;
    avatar?: string;
  };
  tags?: string[];
  aiGenerated?: boolean;
  connections?: number;
}

const NODE_STYLES = {
  root: { 
    icon: Zap, 
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    glow: 'rgba(139, 92, 246, 0.4)',
    border: 'border-violet-400/50',
    bg: 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20',
  },
  idea: { 
    icon: Lightbulb, 
    gradient: 'from-amber-400 via-yellow-400 to-orange-400',
    glow: 'rgba(251, 191, 36, 0.4)',
    border: 'border-yellow-400/50',
    bg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
  },
  task: { 
    icon: CheckSquare, 
    gradient: 'from-emerald-400 via-green-400 to-teal-400',
    glow: 'rgba(52, 211, 153, 0.4)',
    border: 'border-emerald-400/50',
    bg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20',
  },
  note: { 
    icon: FileText, 
    gradient: 'from-sky-400 via-blue-400 to-indigo-400',
    glow: 'rgba(56, 189, 248, 0.4)',
    border: 'border-sky-400/50',
    bg: 'bg-gradient-to-br from-sky-500/20 to-indigo-500/20',
  },
  reference: { 
    icon: Link2, 
    gradient: 'from-cyan-400 via-teal-400 to-emerald-400',
    glow: 'rgba(34, 211, 238, 0.4)',
    border: 'border-cyan-400/50',
    bg: 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20',
  },
  data: { 
    icon: Database, 
    gradient: 'from-purple-400 via-violet-400 to-indigo-400',
    glow: 'rgba(167, 139, 250, 0.4)',
    border: 'border-purple-400/50',
    bg: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20',
  },
  process: { 
    icon: Cpu, 
    gradient: 'from-pink-400 via-rose-400 to-red-400',
    glow: 'rgba(244, 114, 182, 0.4)',
    border: 'border-pink-400/50',
    bg: 'bg-gradient-to-br from-pink-500/20 to-red-500/20',
  },
};

const PRIORITY_COLORS = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

function NeuralNodeComponent({ data, selected, id }: NodeProps<NeuralNodeData>) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { deleteElements, setNodes } = useReactFlow();
  
  const type = data.type || 'idea';
  const style = NODE_STYLES[type];
  const Icon = style.icon;

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);

  const handleAddChild = useCallback(() => {
    // Trigger add child node event
    const event = new CustomEvent('addChildNode', { detail: { parentId: id, parentLabel: data.label } });
    window.dispatchEvent(event);
  }, [id, data.label]);

  const handleExpand = useCallback(() => {
    // Trigger AI expand event
    const event = new CustomEvent('expandNode', { detail: { nodeId: id, nodeData: data } });
    window.dispatchEvent(event);
  }, [id, data]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      className="relative"
    >
      {/* Glow Effect */}
      <AnimatePresence>
        {(selected || isHovered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -inset-2 rounded-2xl blur-xl"
            style={{ backgroundColor: style.glow }}
          />
        )}
      </AnimatePresence>

      {/* Handle Top */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "!w-3 !h-3 !border-2 !border-slate-700 !bg-slate-800 transition-all duration-200",
          (selected || isHovered) && "!border-cyan-400 !bg-cyan-500"
        )}
      />

      {/* Main Card */}
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          "relative min-w-[180px] max-w-[260px] rounded-xl border-2 transition-all duration-200",
          "bg-[#0D1520]/95 backdrop-blur-sm",
          selected ? style.border : "border-slate-700/50 hover:border-slate-600",
          data.aiGenerated && "ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-[#080C14]"
        )}
      >
        {/* AI Generated Badge */}
        {data.aiGenerated && (
          <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-cyan-500 rounded text-[9px] font-bold text-white flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            AI
          </div>
        )}

        {/* Header */}
        <div className={cn("px-3 py-2.5 rounded-t-lg", style.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 15 }}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br", style.gradient
                )}
              >
                <Icon className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {type === 'root' ? 'Central' : type}
              </span>
            </div>
            
            {data.priority && (
              <div className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[data.priority])} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 py-2.5">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
            {data.label}
          </h3>
          
          {data.description && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{data.description}</p>
          )}

          {/* Progress Bar */}
          {typeof data.progress === 'number' && (
            <div className="mt-2">
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.progress}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn("h-full rounded-full bg-gradient-to-r", style.gradient)}
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{data.progress}% completo</span>
            </div>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400"
                >
                  #{tag}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span className="px-1.5 py-0.5 text-[9px] text-slate-500">
                  +{data.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {typeof data.tasks === 'number' && data.tasks > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <CheckSquare className="w-3 h-3" />
                {data.tasks}
              </span>
            )}
            {typeof data.comments === 'number' && data.comments > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <MessageSquare className="w-3 h-3" />
                {data.comments}
              </span>
            )}
            {typeof data.connections === 'number' && data.connections > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <GitBranch className="w-3 h-3" />
                {data.connections}
              </span>
            )}
          </div>
          
          {data.creator && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: `${data.creator.color}20`,
                color: data.creator.color,
              }}
              title={data.creator.name}
            >
              {data.creator.avatar ? (
                <img src={data.creator.avatar} alt={data.creator.name} className="w-full h-full rounded-full" />
              ) : (
                data.creator.name[0].toUpperCase()
              )}
            </motion.div>
          )}
        </div>

        {/* Hover Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-700 shadow-xl"
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAddChild}
                className="h-6 w-6 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleExpand}
                className="h-6 w-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                <Zap className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              {type !== 'root' && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-6 w-6 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Handle Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-3 !h-3 !border-2 !border-slate-700 !bg-slate-800 transition-all duration-200",
          (selected || isHovered) && "!border-cyan-400 !bg-cyan-500"
        )}
      />

      {/* Handle Left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={cn(
          "!w-2 !h-2 !border-2 !border-slate-700 !bg-slate-800 transition-all duration-200 opacity-0",
          isHovered && "opacity-100"
        )}
      />

      {/* Handle Right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={cn(
          "!w-2 !h-2 !border-2 !border-slate-700 !bg-slate-800 transition-all duration-200 opacity-0",
          isHovered && "opacity-100"
        )}
      />
    </motion.div>
  );
}

export const NeuralNode = memo(NeuralNodeComponent);
export default NeuralNode;
