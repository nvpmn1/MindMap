import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  BookOpen,
  Target,
  AlertCircle,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { nodesApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface Node {
  id: string;
  type: string;
  label: string;
}

interface MapCardCompactProps {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  nodes_count: number;
  colorIndex: number;
  onClick: () => void;
  index: number;
}

const iconColors = [
  'from-cyan-500/8 to-blue-500/8 hover:border-cyan-500/20',
  'from-purple-500/8 to-pink-500/8 hover:border-purple-500/20',
  'from-emerald-500/8 to-teal-500/8 hover:border-emerald-500/20',
  'from-amber-500/8 to-orange-500/8 hover:border-amber-500/20',
  'from-rose-500/8 to-red-500/8 hover:border-rose-500/20',
  'from-indigo-500/8 to-violet-500/8 hover:border-indigo-500/20',
];

const bgIconColors = [
  'from-cyan-500/20 to-blue-600/20 text-cyan-400',
  'from-purple-500/20 to-pink-600/20 text-purple-400',
  'from-emerald-500/20 to-teal-600/20 text-emerald-400',
  'from-amber-500/20 to-orange-600/20 text-amber-400',
  'from-rose-500/20 to-red-600/20 text-rose-400',
  'from-indigo-500/20 to-violet-600/20 text-indigo-400',
];

const typeConfig: Record<string, { icon: any; label: string }> = {
  idea: { icon: Zap, label: 'Ideia' },
  task: { icon: Target, label: 'Tarefa' },
  note: { icon: BookOpen, label: 'Nota' },
  reference: { icon: BookOpen, label: 'Ref' },
  question: { icon: AlertCircle, label: 'Pergunta' },
  research: { icon: BookOpen, label: 'Pesquisa' },
  data: { icon: Layers, label: 'Dado' },
  group: { icon: Layers, label: 'Grupo' },
  image: { icon: Layers, label: 'Imagem' },
};

export function MapCardCompact({
  id,
  title,
  description,
  updated_at,
  nodes_count,
  colorIndex,
  onClick,
  index,
}: MapCardCompactProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  useEffect(() => {
    loadNodePreview();
  }, [id]);

  const loadNodePreview = async () => {
    setIsLoadingNodes(true);
    try {
      const response = await nodesApi.listByMap(id);
      if (response.success && response.data) {
        const nodesList = Array.isArray(response.data) ? response.data : [response.data];
        setNodes(nodesList.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  const analysis = useMemo(() => {
    const rootNodes = nodes.filter((n: any) => !n.parent_id);
    return {
      mainTopic: rootNodes[0]?.label || title,
      taskCount: nodes.filter((n: any) => n.type === 'task').length,
      hasContent: nodes.length > 0,
    };
  }, [nodes, title]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className={`text-left p-4 rounded-xl border border-white/[0.04] bg-gradient-to-br ${iconColors[colorIndex]} transition-all duration-200 group w-full hover:border-white/[0.08]`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgIconColors[colorIndex]} flex items-center justify-center flex-shrink-0`}>
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
            {title}
          </h3>
          
          {!isLoadingNodes && analysis.hasContent && (
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {analysis.mainTopic}
            </p>
          )}
          
          {description && !analysis.hasContent && (
            <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">{description}</p>
          )}
          
          <div className="flex items-center gap-3 mt-2.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {nodes_count} nós
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(new Date(updated_at))}
            </span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
      </div>
    </motion.button>
  );
}
