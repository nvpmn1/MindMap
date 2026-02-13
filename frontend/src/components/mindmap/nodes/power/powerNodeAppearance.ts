import { NODE_TYPE_CONFIG } from '../../editor/constants';
import type { NeuralNodeData, NodeArchetype, NodeSurface } from '../../editor/types';

interface ArchetypeVisual {
  accent: string;
  glow: string;
  overlay: string;
  accentRing: string;
}

interface SurfaceClassMap {
  wrapper: string;
  header: string;
}

const ARCHETYPE_VISUALS: Record<NodeArchetype, ArchetypeVisual> = {
  spark: {
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.24)',
    overlay: 'from-amber-400/10 via-amber-200/0 to-transparent',
    accentRing: 'ring-amber-400/40',
  },
  task_flow: {
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.24)',
    overlay: 'from-emerald-400/10 via-emerald-200/0 to-transparent',
    accentRing: 'ring-emerald-400/40',
  },
  knowledge: {
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,0.24)',
    overlay: 'from-cyan-400/10 via-cyan-200/0 to-transparent',
    accentRing: 'ring-cyan-400/40',
  },
  evidence: {
    accent: '#14b8a6',
    glow: 'rgba(20,184,166,0.24)',
    overlay: 'from-teal-400/10 via-teal-200/0 to-transparent',
    accentRing: 'ring-teal-400/40',
  },
  questioning: {
    accent: '#f97316',
    glow: 'rgba(249,115,22,0.24)',
    overlay: 'from-orange-400/10 via-orange-200/0 to-transparent',
    accentRing: 'ring-orange-400/40',
  },
  decision: {
    accent: '#eab308',
    glow: 'rgba(234,179,8,0.24)',
    overlay: 'from-yellow-400/10 via-yellow-200/0 to-transparent',
    accentRing: 'ring-yellow-400/40',
  },
  milestone: {
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.24)',
    overlay: 'from-lime-400/10 via-lime-200/0 to-transparent',
    accentRing: 'ring-lime-400/40',
  },
  risk: {
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.24)',
    overlay: 'from-red-400/10 via-red-200/0 to-transparent',
    accentRing: 'ring-red-400/40',
  },
  document: {
    accent: '#6366f1',
    glow: 'rgba(99,102,241,0.24)',
    overlay: 'from-indigo-400/10 via-indigo-200/0 to-transparent',
    accentRing: 'ring-indigo-400/40',
  },
  archive: {
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,0.24)',
    overlay: 'from-violet-400/10 via-violet-200/0 to-transparent',
    accentRing: 'ring-violet-400/40',
  },
  ai_brief: {
    accent: '#22d3ee',
    glow: 'rgba(34,211,238,0.24)',
    overlay: 'from-sky-400/10 via-sky-200/0 to-transparent',
    accentRing: 'ring-sky-400/40',
  },
};

const SURFACE_STYLES: Record<NodeSurface, SurfaceClassMap> = {
  'soft-card': {
    wrapper: 'rounded-[26px]',
    header: 'rounded-t-[24px]',
  },
  capsule: {
    wrapper: 'rounded-[999px] md:rounded-[38px]',
    header: 'rounded-t-[999px] md:rounded-t-[36px]',
  },
  notebook: {
    wrapper: 'rounded-[20px]',
    header: 'rounded-t-[20px]',
  },
  signal: {
    wrapper: 'rounded-[30px]',
    header: 'rounded-t-[26px]',
  },
  module: {
    wrapper: 'rounded-[16px]',
    header: 'rounded-t-[14px]',
  },
};

const DEFAULT_VISUAL = ARCHETYPE_VISUALS.spark;
const DEFAULT_SURFACE = SURFACE_STYLES['soft-card'];

export interface PowerNodeAppearance {
  accentColor: string;
  glowColor: string;
  overlayClass: string;
  ringClass: string;
  surface: SurfaceClassMap;
  typeColor: string;
}

export function resolvePowerNodeAppearance(data: NeuralNodeData): PowerNodeAppearance {
  const typeConfig = NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.idea;
  const archetype = data.archetype || 'spark';
  const visual = ARCHETYPE_VISUALS[archetype] || DEFAULT_VISUAL;
  const surfaceStyle = SURFACE_STYLES[data.surface || 'soft-card'] || DEFAULT_SURFACE;

  return {
    accentColor: visual.accent || typeConfig.color,
    glowColor: visual.glow,
    overlayClass: visual.overlay,
    ringClass: visual.accentRing,
    surface: surfaceStyle,
    typeColor: typeConfig.color,
  };
}

export function estimateNodeWidth(data: NeuralNodeData): number {
  const titleLength = (data.label || '').length;
  const descriptionLength = (data.description || '').length;
  const tagsBonus = (data.tags?.length || 0) * 12;
  const todoBonus = (data.todoSeed?.length || 0) * 10;
  const raw =
    260 + titleLength * 1.4 + Math.min(descriptionLength, 220) * 0.35 + tagsBonus + todoBonus;
  return Math.min(460, Math.max(260, Math.round(raw)));
}
