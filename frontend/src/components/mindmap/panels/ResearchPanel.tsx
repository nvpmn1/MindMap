// ============================================================================
// NeuralMap - Research & Knowledge Panel
// ============================================================================

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, BookOpen, FileText, ExternalLink, Sparkles,
  ChevronDown, ChevronRight, X, Loader2, BookMarked, Link2,
  Quote, Tag, Plus, ArrowRight, Brain, Lightbulb, AlertTriangle,
  TrendingUp, Clock, Star, Copy, CheckCircle2
} from 'lucide-react';
import { neuralAgent } from '../ai/NeuralAgent';

interface ResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeTitle?: string;
  onInsertAsNode?: (data: ResearchResult) => void;
}

interface ResearchResult {
  title: string;
  summary: string;
  keyPoints: string[];
  sources: string[];
  relatedTopics: string[];
  confidence: number;
}

interface ResearchSession {
  id: string;
  query: string;
  timestamp: Date;
  result: ResearchResult | null;
  isLoading: boolean;
  error?: string;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({
  isOpen, onClose, selectedNodeTitle, onInsertAsNode
}) => {
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [savedResults, setSavedResults] = useState<ResearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'research' | 'saved' | 'topics'>('research');

  const handleResearch = useCallback(async () => {
    if (!query.trim()) return;

    const sessionId = `res_${Date.now()}`;
    const newSession: ResearchSession = {
      id: sessionId,
      query: query.trim(),
      timestamp: new Date(),
      result: null,
      isLoading: true,
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(sessionId);
    setQuery('');

    try {
      const response = await neuralAgent.processMessage(
        `Pesquise profundamente sobre: "${newSession.query}". Retorne um resumo completo, pontos-chave, fontes relevantes e tópicos relacionados.`,
        [], [],
        undefined
      );

      const result: ResearchResult = {
        title: newSession.query,
        summary: response.response,
        keyPoints: response.insights || [],
        sources: [],
        relatedTopics: response.nextSteps || [],
        confidence: response.confidence || 0.7,
      };

      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, result, isLoading: false } : s
      ));
    } catch (error) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, isLoading: false, error: 'Erro na pesquisa' } : s
      ));
    }
  }, [query]);

  const handleSaveResult = useCallback((result: ResearchResult) => {
    setSavedResults(prev => {
      if (prev.find(r => r.title === result.title)) return prev;
      return [result, ...prev];
    });
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-14 bottom-0 w-[420px] bg-[#0a0f1a]/95 backdrop-blur-xl
            border-l border-white/[0.06] z-40 flex flex-col shadow-2xl"
        >
          {/* ─── Header ──────────────────────────────────────────────── */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Pesquisa & Conhecimento</h3>
                  <p className="text-[10px] text-slate-500">IA pesquisa profunda sobre qualquer tema</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/[0.03] rounded-lg p-0.5">
              {[
                { id: 'research' as const, label: 'Pesquisar', icon: Search },
                { id: 'saved' as const, label: 'Salvos', icon: BookMarked },
                { id: 'topics' as const, label: 'Tópicos', icon: Tag },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs 
                    font-medium transition-all ${activeTab === id 
                      ? 'bg-white/[0.08] text-white' 
                      : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Search Input ────────────────────────────────────────── */}
          {activeTab === 'research' && (
            <div className="p-3 border-b border-white/[0.04]">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                    placeholder={selectedNodeTitle 
                      ? `Pesquisar sobre "${selectedNodeTitle}"` 
                      : 'O que você quer pesquisar?'}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] 
                      text-sm text-white placeholder:text-slate-600 outline-none
                      focus:border-emerald-500/30 transition-colors"
                  />
                </div>
                <button
                  onClick={handleResearch}
                  disabled={!query.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-medium
                    border border-emerald-500/20 hover:bg-emerald-500/20 
                    disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Suggestions */}
              {selectedNodeTitle && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {[
                    `Conceitos de ${selectedNodeTitle}`,
                    `Tendências em ${selectedNodeTitle}`,
                    `Melhores práticas: ${selectedNodeTitle}`,
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setQuery(suggestion); }}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] text-[10px] text-slate-500 
                        hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Content ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'research' && (
              <div className="p-3 space-y-3">
                {sessions.length === 0 ? (
                  <EmptyState />
                ) : (
                  sessions.map((session) => (
                    <ResearchSessionCard
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      onSelect={() => setActiveSessionId(session.id)}
                      onSave={() => session.result && handleSaveResult(session.result)}
                      onInsert={() => session.result && onInsertAsNode?.(session.result)}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="p-3 space-y-3">
                {savedResults.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhuma pesquisa salva
                  </div>
                ) : (
                  savedResults.map((result, idx) => (
                    <SavedResultCard
                      key={idx}
                      result={result}
                      onInsert={() => onInsertAsNode?.(result)}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'topics' && (
              <div className="p-3 space-y-3">
                <TopicsExplorer
                  sessions={sessions}
                  onResearch={(topic) => { setQuery(topic); setActiveTab('research'); }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Research Session Card ──────────────────────────────────────────────────

const ResearchSessionCard: React.FC<{
  session: ResearchSession;
  isActive: boolean;
  onSelect: () => void;
  onSave: () => void;
  onInsert: () => void;
}> = ({ session, isActive, onSelect, onSave, onInsert }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden transition-all
        ${isActive 
          ? 'bg-white/[0.04] border-emerald-500/20' 
          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'}`}
    >
      {/* Header */}
      <button
        onClick={() => { onSelect(); setExpanded(!expanded); }}
        className="flex items-center gap-2 w-full p-3 text-left"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span className="text-xs font-medium text-white flex-1 truncate">{session.query}</span>
        <span className="text-[10px] text-slate-600">
          {session.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {session.isLoading ? (
          <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
        ) : (
          expanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {session.isLoading ? (
              <div className="px-3 pb-3 space-y-2">
                <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
              </div>
            ) : session.error ? (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  {session.error}
                </div>
              </div>
            ) : session.result ? (
              <div className="px-3 pb-3 space-y-3">
                {/* Summary */}
                <div className="text-xs text-slate-300 leading-relaxed">
                  {session.result.summary}
                </div>

                {/* Key Points */}
                {session.result.keyPoints.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Pontos-Chave
                    </div>
                    <div className="space-y-1">
                      {session.result.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Topics */}
                {session.result.relatedTopics.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Tópicos Relacionados
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {session.result.relatedTopics.map((topic, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 
                          text-emerald-300 text-[10px] border border-emerald-500/20">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      style={{ width: `${Math.round(session.result.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {Math.round(session.result.confidence * 100)}% confiança
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={onInsert}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg 
                      bg-emerald-500/10 text-emerald-300 text-[10px] font-medium
                      hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                    <Plus className="w-3 h-3" />
                    Inserir como Nó
                  </button>
                  <button onClick={onSave}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg 
                      bg-white/5 text-slate-300 text-[10px] font-medium
                      hover:bg-white/10 transition-all">
                    <BookMarked className="w-3 h-3" />
                    Salvar
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(session.result?.summary || '')}
                    className="flex items-center justify-center px-2 py-1.5 rounded-lg 
                      bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Saved Result Card ──────────────────────────────────────────────────────

const SavedResultCard: React.FC<{
  result: ResearchResult;
  onInsert: () => void;
}> = ({ result, onInsert }) => (
  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
    <div className="flex items-start gap-2">
      <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-xs font-medium text-white">{result.title}</h4>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">{result.summary}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button onClick={onInsert}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 
          text-emerald-300 text-[10px] hover:bg-emerald-500/20 transition-all">
        <Plus className="w-2.5 h-2.5" />
        Inserir
      </button>
    </div>
  </div>
);

// ─── Topics Explorer ────────────────────────────────────────────────────────

const TopicsExplorer: React.FC<{
  sessions: ResearchSession[];
  onResearch: (topic: string) => void;
}> = ({ sessions, onResearch }) => {
  const allTopics = sessions
    .filter(s => s.result)
    .flatMap(s => s.result!.relatedTopics);

  const uniqueTopics = [...new Set(allTopics)];

  if (uniqueTopics.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs">
        <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
        Faça pesquisas para descobrir tópicos relacionados
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        Tópicos Descobertos ({uniqueTopics.length})
      </div>
      <div className="grid grid-cols-2 gap-2">
        {uniqueTopics.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => onResearch(topic)}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] 
              border border-white/[0.06] hover:border-emerald-500/20 hover:bg-emerald-500/5
              text-left transition-all group"
          >
            <TrendingUp className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
            <span className="text-[11px] text-slate-400 group-hover:text-white truncate">{topic}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Empty State ────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-6">
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10
      flex items-center justify-center mx-auto mb-4 border border-emerald-500/10">
      <Brain className="w-7 h-7 text-emerald-400/60" />
    </div>
    <h4 className="text-sm font-semibold text-white mb-1">Pesquisa Inteligente</h4>
    <p className="text-xs text-slate-500 leading-relaxed">
      Pesquise qualquer tema e a IA irá trazer resumos, pontos-chave 
      e tópicos relacionados que você pode inserir diretamente no mapa.
    </p>
    <div className="mt-4 space-y-2">
      {['Inteligência Artificial', 'Design Thinking', 'Product Strategy'].map((t) => (
        <div key={t} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02]
          text-[11px] text-slate-500">
          <Search className="w-3 h-3" />
          {t}
          <ArrowRight className="w-3 h-3 ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

export default ResearchPanel;
