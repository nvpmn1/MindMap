import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ALL_AVATARS,
  AVATAR_CATEGORIES,
  getAvatarsByCategory,
  type AvatarCategory,
  type AvatarOption,
} from '@/lib/avatarLibrary';
import { useAuthStore } from '@/stores/authStore';

interface AvatarPickerProps {
  onSelect?: (avatar: AvatarOption) => void;
  selectedAvatarId?: string;
}

/* ─── Tiny image component with loading + error fallback ─── */
function AvatarImage({
  src,
  alt,
  className = '',
  objectFit = 'cover',
}: {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* shimmer while loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-slate-700/60 animate-pulse rounded-xl" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus('ok')}
        onError={(e) => {
          setStatus('error');
          (e.target as HTMLImageElement).src =
            'https://api.dicebear.com/7.x/shapes/svg?seed=' +
            encodeURIComponent(alt) +
            '&size=256';
        }}
        className={`w-full h-full transition-opacity duration-300 ${
          status === 'loading' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectFit }}
      />
    </div>
  );
}

/* ─── Main Component ─── */
export function AvatarPicker({ onSelect, selectedAvatarId }: AvatarPickerProps) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('games');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewId, setPreviewId] = useState(selectedAvatarId || 'game-cs2');
  const { updateProfile } = useAuthStore();

  const avatarsInCategory = useMemo(() => {
    const filtered = getAvatarsByCategory(activeCategory);
    if (!searchTerm) return filtered;
    const q = searchTerm.toLowerCase();
    return filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.desc && a.desc.toLowerCase().includes(q)),
    );
  }, [activeCategory, searchTerm]);

  const selectedAvatar = useMemo(
    () => ALL_AVATARS.find((a) => a.id === previewId),
    [previewId],
  );

  const handleSelectAvatar = useCallback(
    async (avatar: AvatarOption) => {
      setPreviewId(avatar.id);
      await updateProfile({ avatar_url: avatar.url });
      onSelect?.(avatar);
    },
    [onSelect, updateProfile],
  );

  /* fit mode per category: games → cover (art), others → contain (icon) */
  const fitMode: 'cover' | 'contain' =
    activeCategory === 'games' ? 'cover' : 'contain';

  const activeCatMeta = AVATAR_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="w-full max-w-5xl mx-auto py-6 space-y-5">
      {/* ─── Header ─── */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Escolha seu Avatar
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Selecione um avatar que represente você
        </p>
      </div>

      {/* ─── Two-column layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* ══════ LEFT: Preview ══════ */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[.18em]">
            Preview
          </span>

          {/* Preview card */}
          <motion.div
            key={previewId}
            className="relative w-52 h-52 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/30"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Animated glow */}
            <motion.div
              className="absolute -inset-1 rounded-2xl z-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(6,182,212,.25), rgba(168,85,247,.25))',
              }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden bg-slate-900">
              <AvatarImage
                src={
                  selectedAvatar?.url ||
                  'https://api.dicebear.com/7.x/shapes/svg?seed=default&size=256'
                }
                alt="Preview"
                objectFit={fitMode}
              />
            </div>

            {/* Glass reflection */}
            <div
              className="absolute inset-0 z-20 pointer-events-none rounded-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 50%)',
              }}
            />
          </motion.div>

          {/* Info */}
          <motion.div
            key={`info-${previewId}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <p className="text-lg font-bold text-white leading-tight">
              {selectedAvatar?.name}
            </p>
            {selectedAvatar?.desc && (
              <p className="text-xs text-slate-400">{selectedAvatar.desc}</p>
            )}
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full mt-1">
              {activeCatMeta?.name}
            </span>
          </motion.div>
        </motion.div>

        {/* ══════ RIGHT: Selection ══════ */}
        <motion.div
          className="space-y-4 min-w-0"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {/* ── Category pills ── */}
          <div className="flex flex-wrap gap-2">
            {AVATAR_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as AvatarCategory);
                    setSearchTerm('');
                  }}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    transition-colors select-none
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                    }
                  `}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="category-pill-bg"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* ── Search ── */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={`Buscar em ${activeCatMeta?.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
            />
          </div>

          {/* ── Avatar grid ── */}
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 p-3 max-h-[520px] overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {avatarsInCategory.length > 0 ? (
                <motion.div
                  key={activeCategory + searchTerm}
                  className={`grid gap-3 ${
                    activeCategory === 'games'
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {avatarsInCategory.map((avatar, idx) => {
                    const isSelected = previewId === avatar.id;
                    return (
                      <motion.button
                        key={avatar.id}
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`
                          group relative rounded-xl overflow-hidden
                          transition-all duration-200 outline-none
                          ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40 scale-[1.02]'
                              : 'ring-1 ring-slate-700/50 hover:ring-slate-500/70'
                          }
                        `}
                        whileHover={{ scale: isSelected ? 1.02 : 1.06, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: isSelected ? 1.02 : 1 }}
                        transition={{ delay: idx * 0.02, duration: 0.25 }}
                      >
                        {/* Thumbnail */}
                        <div
                          className={`
                            w-full overflow-hidden bg-slate-800
                            ${activeCategory === 'games' ? 'aspect-[460/215]' : 'aspect-square'}
                          `}
                        >
                          <AvatarImage
                            src={avatar.url}
                            alt={avatar.name}
                            objectFit={fitMode}
                          />
                        </div>

                        {/* Name label (always visible) */}
                        <div
                          className={`
                            px-2 py-1.5 text-center
                            ${activeCategory === 'games' ? 'bg-slate-900/95' : 'bg-slate-800/90'}
                          `}
                        >
                          <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">
                            {avatar.name}
                          </p>
                          {avatar.desc && activeCategory === 'games' && (
                            <p className="text-[9px] text-slate-500 truncate">
                              {avatar.desc}
                            </p>
                          )}
                        </div>

                        {/* Hover glow */}
                        <motion.div
                          className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{
                            boxShadow:
                              'inset 0 0 20px rgba(6,182,212,.15), 0 0 12px rgba(168,85,247,.1)',
                          }}
                        />

                        {/* Selected check */}
                        {isSelected && (
                          <motion.div
                            className="absolute top-1.5 right-1.5 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 15,
                            }}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="flex flex-col items-center justify-center py-16 text-slate-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <svg
                    className="w-10 h-10 mb-3 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-sm">Nenhum avatar encontrado</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Tente outra busca
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer stats ── */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              {avatarsInCategory.length} avatar
              {avatarsInCategory.length !== 1 ? 's' : ''} •{' '}
              {ALL_AVATARS.length} total
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Clique para selecionar
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
