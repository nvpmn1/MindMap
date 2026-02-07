// ============================================================================
// NeuralMap - Editor Header (Top Bar)
// ============================================================================

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Brain, Save, Share2, Sparkles, Users, 
  MoreHorizontal, Map, List, Columns, Calendar, Activity,
  Download, Upload, Undo2, Redo2, Lock, Unlock, Grid3X3,
  Maximize, Trash2, HelpCircle, Loader2, Cloud, CloudOff,
  Eye, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MapInfo, ViewMode, CollaboratorInfo, EditorSettings } from '../editor/types';

interface EditorHeaderProps {
  mapInfo: MapInfo | null;
  onUpdateMapInfo: (info: Partial<MapInfo>) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  collaborators: CollaboratorInfo[];
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onShare: () => void;
  onToggleAI: () => void;
  onToggleAnalytics: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  nodeCount: number;
  edgeCount: number;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
  onImport?: () => void;
  onDeleteMap?: () => void;
}

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: React.FC<any> }> = [
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'list', label: 'Lista', icon: List },
  { id: 'kanban', label: 'Kanban', icon: Columns },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: Activity },
];

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  mapInfo, onUpdateMapInfo,
  viewMode, onViewModeChange,
  collaborators, isSaving, lastSaved,
  onSave, onShare, onToggleAI, onToggleAnalytics,
  settings, onSettingsChange,
  canUndo, canRedo, onUndo, onRedo,
  nodeCount, edgeCount,
  onExportPNG, onExportJSON, onImport, onDeleteMap
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const formatSavedTime = useCallback(() => {
    if (isSaving) return 'Salvando...';
    if (!lastSaved) return '';
    const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (diff < 10) return 'Salvo agora';
    if (diff < 60) return `Salvo há ${diff}s`;
    if (diff < 3600) return `Salvo há ${Math.floor(diff / 60)}min`;
    return `Salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }, [isSaving, lastSaved]);

  return (
    <div className="h-14 bg-[#080d16]/90 backdrop-blur-xl border-b border-white/[0.04]
      flex items-center justify-between px-4 z-30 relative">
      
      {/* ─── Left Section ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Back */}
        <button
          onClick={() => navigate('/maps')}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 
            flex items-center justify-center border border-cyan-500/20">
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col">
          {isEditingTitle ? (
            <input
              autoFocus
              value={mapInfo?.title || ''}
              onChange={(e) => onUpdateMapInfo({ title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="bg-transparent text-sm font-semibold text-white outline-none
                border-b border-cyan-500/30 pb-0.5 min-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-white hover:text-cyan-300 transition-colors text-left"
            >
              {mapInfo?.title || 'Novo Mapa Neural'}
            </button>
          )}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{nodeCount} nós</span>
            <span>•</span>
            <span>{edgeCount} conexões</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {isSaving ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : lastSaved ? (
                <Cloud className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <CloudOff className="w-2.5 h-2.5" />
              )}
              {formatSavedTime()}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Center Section - View Modes ───────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 
        bg-white/[0.03] rounded-xl border border-white/[0.06] p-1">
        {VIEW_MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewModeChange(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all ${viewMode === id 
                ? 'bg-white/[0.08] text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Right Section ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 mr-1">
          <button onClick={onUndo} disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 
              disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="Desfazer (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRedo} disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 
              disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="Refazer (Ctrl+Y)">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collaborators */}
        {collaborators.length > 0 && (
          <div className="flex items-center -space-x-2 mr-2">
            {collaborators.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="w-7 h-7 rounded-full border-2 border-[#080d16] flex items-center justify-center
                  text-[10px] font-bold text-white relative"
                style={{ backgroundColor: c.color }}
                title={c.displayName}
              >
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  c.displayName?.charAt(0).toUpperCase() || 'U'
                )}
                {c.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 
                    rounded-full border-2 border-[#080d16]" />
                )}
              </div>
            ))}
            {collaborators.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-[#080d16] bg-white/10
                flex items-center justify-center text-[10px] text-slate-300">
                +{collaborators.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        <button onClick={onToggleAnalytics}
          className="p-2 rounded-xl text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 transition-all"
          title="Analytics">
          <Activity className="w-4 h-4" />
        </button>

        {/* AI Button */}
        <button onClick={onToggleAI}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
            text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 
            border border-purple-500/20 hover:border-purple-500/30 transition-all
            shadow-[0_0_12px_rgba(139,92,246,0.1)]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Agent</span>
        </button>

        {/* Share */}
        <button onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
            text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all">
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compartilhar</span>
        </button>

        {/* Save */}
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold
            bg-gradient-to-r from-cyan-500 to-blue-600 text-white
            hover:from-cyan-400 hover:to-blue-500
            disabled:opacity-50 transition-all
            shadow-[0_2px_12px_rgba(6,182,212,0.3)]"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </button>

        {/* More Menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-56 bg-[#111827] border border-white/10 
                  rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                onMouseLeave={() => setShowMenu(false)}
              >
                <MenuSection label="Visualização">
                  <MenuItem icon={Grid3X3} label="Grade" 
                    active={settings.showGrid}
                    onClick={() => onSettingsChange({ showGrid: !settings.showGrid })} />
                  <MenuItem icon={Eye} label="Minimap" 
                    active={settings.showMinimap}
                    onClick={() => onSettingsChange({ showMinimap: !settings.showMinimap })} />
                  <MenuItem icon={settings.isLocked ? Lock : Unlock} 
                    label={settings.isLocked ? 'Desbloquear' : 'Bloquear'} 
                    onClick={() => onSettingsChange({ isLocked: !settings.isLocked })} />
                  <MenuItem icon={Maximize} label="Tela Cheia" 
                    onClick={() => document.documentElement.requestFullscreen()} />
                </MenuSection>

                <MenuSection label="Arquivo">
                  <MenuItem icon={Download} label="Exportar PNG" onClick={() => { onExportPNG?.(); setShowMenu(false); }} />
                  <MenuItem icon={Download} label="Exportar JSON" onClick={() => { onExportJSON?.(); setShowMenu(false); }} />
                  <MenuItem icon={Upload} label="Importar" onClick={() => { onImport?.(); setShowMenu(false); }} />
                </MenuSection>

                <MenuSection label="Zona de Perigo">
                  <MenuItem icon={Trash2} label="Excluir Mapa" danger onClick={() => { onDeleteMap?.(); setShowMenu(false); }} />
                </MenuSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── Menu Components ────────────────────────────────────────────────────────

const MenuSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="py-1">
    <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </div>
    {children}
  </div>
);

const MenuItem: React.FC<{
  icon: React.FC<any>;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}> = ({ icon: Icon, label, onClick, active, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-all
      ${danger 
        ? 'text-red-400 hover:bg-red-500/10' 
        : active 
          ? 'text-cyan-400 bg-cyan-500/5' 
          : 'text-slate-300 hover:bg-white/5'}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
    {active !== undefined && (
      <div className={`ml-auto w-1.5 h-1.5 rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
    )}
  </button>
);

export default EditorHeader;
