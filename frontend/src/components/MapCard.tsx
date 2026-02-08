import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Clock,
  Zap,
  BookOpen,
  Target,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { nodesApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Node {
  id: string;
  map_id: string;
  parent_id: string | null;
  type: string;
  label: string;
  content?: string;
  position_x: number;
  position_y: number;
}

interface MapCardProps {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  nodes_count: number;
  colorIndex: number;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const iconColors = [
  'from-cyan-500/20 to-blue-600/20',
  'from-purple-500/20 to-pink-600/20',
  'from-emerald-500/20 to-teal-600/20',
  'from-amber-500/20 to-orange-600/20',
  'from-rose-500/20 to-red-600/20',
  'from-indigo-500/20 to-violet-600/20',
];

const textColors = [
  'text-cyan-400',
  'text-purple-400',
  'text-emerald-400',
  'text-amber-400',
  'text-rose-400',
  'text-indigo-400',
];

const borderColors = [
  'border-cyan-500/20 hover:border-cyan-500/40',
  'border-purple-500/20 hover:border-purple-500/40',
  'border-emerald-500/20 hover:border-emerald-500/40',
  'border-amber-500/20 hover:border-amber-500/40',
  'border-rose-500/20 hover:border-rose-500/40',
  'border-indigo-500/20 hover:border-indigo-500/40',
];

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  idea: { icon: Zap, label: 'Ideia', color: 'bg-cyan-500/20 text-cyan-300' },
  task: { icon: Target, label: 'Tarefa', color: 'bg-amber-500/20 text-amber-300' },
  note: { icon: BookOpen, label: 'Nota', color: 'bg-blue-500/20 text-blue-300' },
  reference: { icon: BookOpen, label: 'Ref', color: 'bg-purple-500/20 text-purple-300' },
  question: { icon: AlertCircle, label: 'Pergunta', color: 'bg-rose-500/20 text-rose-300' },
  research: { icon: BookOpen, label: 'Pesquisa', color: 'bg-indigo-500/20 text-indigo-300' },
  data: { icon: Layers, label: 'Dado', color: 'bg-emerald-500/20 text-emerald-300' },
  group: { icon: Layers, label: 'Grupo', color: 'bg-slate-500/20 text-slate-300' },
  image: { icon: Layers, label: 'Imagem', color: 'bg-pink-500/20 text-pink-300' },
};

export function MapCard({
  id,
  title,
  description,
  updated_at,
  nodes_count,
  colorIndex,
  onDelete,
  onDuplicate,
}: MapCardProps) {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadNodePreview();
  }, [id]);

  const loadNodePreview = async () => {
    setIsLoadingNodes(true);
    try {
      const response = await nodesApi.listByMap(id);
      if (response.success && response.data) {
        const nodesList = Array.isArray(response.data) ? response.data : [response.data];
        setNodes(nodesList.slice(0, 10)); // Limita a 10 nós para prévia
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  // Extrai dados estruturados para melhorar a visualização
  const analysis = useMemo(() => {
    const rootNodes = nodes.filter((n) => !n.parent_id);
    const taskNodes = nodes.filter((n) => n.type === 'task');
    const questionNodes = nodes.filter((n) => n.type === 'question');
    const ideaNodes = nodes.filter((n) => n.type === 'idea');

    return {
      rootNodes,
      mainTopic: rootNodes[0]?.label || title || 'Sem título',
      taskCount: taskNodes.length,
      questionCount: questionNodes.length,
      ideaCount: ideaNodes.length,
      hasContent: nodes.length > 0,
      primaryType: rootNodes[0]?.type || 'idea',
    };
  }, [nodes, title]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
    setShowMenu(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(id);
    setShowMenu(false);
  };

  const handleCardClick = () => {
    navigate(`/map/${id}`);
  };

  // Visualização compacta de nós principais
  const displayNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    // Mostra nós raiz primeiro, depois outros
    const roots = nodes.filter((n) => !n.parent_id).slice(0, 2);
    const others = nodes.filter((n) => n.parent_id).slice(0, 2);
    return [...roots, ...others].slice(0, 4);
  }, [nodes]);

  return (
    <motion.div
      onClick={handleCardClick}
      className="group relative h-full cursor-pointer"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className={`relative h-full rounded-2xl border-2 ${borderColors[colorIndex]} bg-gradient-to-br from-white/[0.02] to-white/[0.005] backdrop-blur-sm p-5 transition-all duration-300 hover:from-white/[0.05] hover:to-white/[0.01]`}
      >
        {/* Efeito de brilho no hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${iconColors[colorIndex]} blur-2xl`}
            style={{ opacity: 0.4 }}
          />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all"
                style={{
                  backgroundImage:
                    colorIndex === 0 ? 'linear-gradient(135deg, #06B6D4, #3B82F6)' :
                    colorIndex === 1 ? 'linear-gradient(135deg, #A855F7, #EC4899)' :
                    colorIndex === 2 ? 'linear-gradient(135deg, #10B981, #14B8A6)' :
                    colorIndex === 3 ? 'linear-gradient(135deg, #F59E0B, #F97316)' :
                    colorIndex === 4 ? 'linear-gradient(135deg, #F43F5E, #EF4444)' :
                    'linear-gradient(135deg, #6366F1, #8B5CF6)',
                }}>
                {title}
              </h3>
              
              {description && (
                <p className="text-[12px] text-slate-400 mt-1.5 line-clamp-1 group-hover:text-slate-300 transition-colors">
                  {description}
                </p>
              )}
            </div>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center flex-shrink-0"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>

              {/* Context Menu */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/[0.12] rounded-xl shadow-2xl shadow-black/50 p-1.5 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleDuplicate}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-lg transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.1] rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Preview de Nós - Visualização inteligente */}
          {!isLoadingNodes && analysis.hasContent ? (
            <div className="flex-1 space-y-3 mb-4">
              {/* Main Topic */}
              {analysis.mainTopic &&  (
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-3.5 h-3.5 ${textColors[colorIndex]}`} />
                    <span className="text-[12px] font-medium text-white truncate">
                      {analysis.mainTopic}
                    </span>
                  </div>
                </div>
              )}

              {/* Nós Relacionados Preview */}
              {displayNodes.length > 0 && (
                <div className="space-y-1.5">
                  {displayNodes.slice(0, 3).map((node, idx) => {
                    const config = typeConfig[node.type] || typeConfig.idea;
                    const Icon = config.icon;
                    return (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 p-1.5 rounded text-[11px] bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors"
                      >
                        <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${config.color.split(' ')[0]}`} />
                        <span className="text-slate-300 truncate flex-1">{node.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stats Line */}
              {(analysis.taskCount > 0 ||
                analysis.questionCount > 0 ||
                analysis.ideaCount > 0) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.taskCount > 0 && (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {analysis.taskCount} Tarefa{analysis.taskCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {analysis.questionCount > 0 && (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {analysis.questionCount} Pergunta{analysis.questionCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {analysis.ideaCount > 0 && (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {analysis.ideaCount} Ideia{analysis.ideaCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : isLoadingNodes ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-[11px] text-slate-500">Clique para começar</p>
            </div>
          )}

          {/* Footer Stats */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.05] group-hover:border-white/[0.1] transition-colors">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] font-medium text-slate-400">
                {nodes_count || 0} nó{nodes_count !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3 h-3" />
              <span className="text-[11px]">{formatRelativeTime(new Date(updated_at))}</span>
            </div>

            <ArrowRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
