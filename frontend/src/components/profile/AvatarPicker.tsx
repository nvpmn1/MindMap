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

/* ─── Avatar Image component with intelligent fallback handling ─── */
function AvatarImage({
  src,
  alt,
  fallbackSrc,
  className = '',
  objectFit = 'cover',
}: {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [useFallback, setUseFallback] = useState(false);

  const currentSrc = useFallback && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* shimmer while loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-slate-700/60 animate-pulse rounded-2xl" />
      )}

      <img
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus('ok')}
        onError={(e) => {
          console.warn(`Avatar image failed to load: ${currentSrc}`);
          if (!useFallback && fallbackSrc) {
            // Try fallback URL if available
            console.log(`Attempting fallback URL: ${fallbackSrc}`);
            setUseFallback(true);
            setStatus('loading');
          } else {
            // No more fallbacks, use dicebear as last resort
            setStatus('error');
            (e.target as HTMLImageElement).src =
              'https://api.dicebear.com/7.x/shapes/svg?seed=' +
              encodeURIComponent(alt) +
              '&size=512';
          }
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
      (a) => a.name.toLowerCase().includes(q) || (a.desc && a.desc.toLowerCase().includes(q))
    );
  }, [activeCategory, searchTerm]);

  const selectedAvatar = useMemo(() => ALL_AVATARS.find((a) => a.id === previewId), [previewId]);

  const handleSelectAvatar = useCallback(
    async (avatar: AvatarOption) => {
      setPreviewId(avatar.id);
      await updateProfile({ avatar_url: avatar.url });
      onSelect?.(avatar);
    },
    [onSelect, updateProfile]
  );

  /* fit mode per category: games → cover (art), others → contain (icon) */
  const fitMode: 'cover' | 'contain' = activeCategory === 'games' ? 'cover' : 'contain';

  const activeCatMeta = AVATAR_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="w-full space-y-7">
      {/* ─── TOP SECTION: PREMIUM PREVIEW WITH ELEGANT BACKGROUND ─── */}
      <motion.div
        className="flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Premium Preview with Subtle Background */}
        <div className={`relative w-full ${activeCategory === 'games' ? 'max-w-3xl' : 'max-w-md'}`}>
          {/* Animated background glow effect - subtle backdrop */}
          <motion.div
            className="absolute inset-0 rounded-3xl blur-3xl -z-10"
            style={{
              background:
                'radial-gradient(ellipse 800px 400px at center, rgba(6,182,212,0.3), transparent)',
            }}
            animate={{
              opacity: [0.25, 0.45, 0.25],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute inset-0 rounded-3xl blur-3xl -z-10"
            style={{
              background:
                'radial-gradient(ellipse 700px 350px at center, rgba(168,85,247,0.2), transparent)',
            }}
            animate={{
              opacity: [0.18, 0.38, 0.18],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />

          {/* Main Preview Card */}
          <motion.div
            key={previewId}
            className="relative w-full rounded-3xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/40"
            style={{
              aspectRatio: activeCategory === 'games' ? '460/215' : '1/1',
            }}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Inner gradient frame */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 to-slate-950" />

            {/* Main image */}
            <div className="relative z-5 w-full h-full">
              <AvatarImage
                src={
                  selectedAvatar?.url ||
                  'https://api.dicebear.com/7.x/shapes/svg?seed=default&size=512'
                }
                fallbackSrc={selectedAvatar?.fallbackUrl}
                alt="Preview"
                objectFit={fitMode}
              />
            </div>

            {/* Glass reflection */}
            <div
              className="absolute inset-0 z-20 pointer-events-none rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,.2) 0%, transparent 40%)',
              }}
            />
          </motion.div>
        </div>

        {/* Avatar Name & Info */}
        <motion.div
          key={`info-${previewId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white leading-tight">{selectedAvatar?.name}</p>
            {selectedAvatar?.desc && (
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                {selectedAvatar.desc}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center">
            <span className="inline-flex text-xs font-semibold uppercase tracking-wider text-cyan-300 bg-gradient-to-r from-cyan-500/20 to-purple-600/10 px-4 py-2 rounded-lg border border-cyan-500/40">
              {activeCatMeta?.name}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ─── CATEGORY FILTERS (CENTERED) ─── */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        className="flex flex-wrap justify-center gap-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
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
                relative flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold
                transition-all select-none backdrop-blur-md border
                ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/90 to-purple-600/80 text-white shadow-xl shadow-cyan-500/50 border-cyan-300/60'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border-slate-700/60 hover:border-slate-600/60'
                }
              `}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
              {isActive && (
                <motion.div
                  layoutId="category-pill-bg"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/90 to-purple-600/80 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ─── SEARCH BAR (CENTERED) ─── */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        className="flex justify-center px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <div className="relative w-full max-w-lg">
          <svg
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
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
            className="w-full pl-14 pr-6 py-4 bg-slate-800/70 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/50 focus:bg-slate-800/90 transition-all backdrop-blur-sm"
          />
        </div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ─── LARGE AVATAR GRID WITH PREMIUM BACKGROUND ─── */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        className="relative -mx-4 md:-mx-6 rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
      >
        {/* Multi-layer background effect */}
        <div className="absolute inset-0 z-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-950/60 to-slate-950/80"></div>

          {/* Top accent glow */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 z-0"
            style={{
              background:
                'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Side accent glows */}
          <motion.div
            className="absolute top-1/3 -left-32 w-64 h-64 rounded-full z-0"
            style={{
              background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />

          <motion.div
            className="absolute top-1/2 -right-32 w-72 h-72 rounded-full z-0"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          {/* Animated grid lines */}
          <div className="absolute inset-0 opacity-[0.03] z-0">
            <svg
              className="w-full h-full"
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(148,163,184,0.4)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 p-6 md:p-8 max-h-[850px] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {avatarsInCategory.length > 0 ? (
              <motion.div
                key={activeCategory + searchTerm}
                className={`grid gap-3 ${
                  activeCategory === 'games'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 xl:grid-cols-14'
                    : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-18'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {avatarsInCategory.map((avatar, idx) => {
                  const isSelected = previewId === avatar.id;
                  return (
                    <motion.button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar)}
                      title={avatar.name}
                      className={`
                        group relative rounded-lg overflow-hidden
                        transition-all duration-200 outline-none
                        ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/50 scale-110'
                            : 'ring-1 ring-slate-700/70 hover:ring-slate-500/90'
                        }
                      `}
                      whileHover={{
                        scale: isSelected ? 1.1 : 1.15,
                        y: -4,
                        transition: { type: 'spring', stiffness: 400, damping: 15 },
                      }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{
                        opacity: 1,
                        scale: isSelected ? 1.1 : 1,
                      }}
                      transition={{ delay: idx * 0.01, duration: 0.25 }}
                    >
                      {/* Thumbnail Container */}
                      <div
                        className={`
                          w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900
                          ${activeCategory === 'games' ? 'aspect-[460/215]' : 'aspect-square'}
                        `}
                      >
                        <AvatarImage
                          src={avatar.url}
                          fallbackSrc={avatar.fallbackUrl}
                          alt={avatar.name}
                          objectFit={fitMode}
                        />
                      </div>

                      {/* Name Label */}
                      <div className="px-2 py-1.5 text-center bg-slate-950/95 border-t border-slate-800/70">
                        <p className="text-[9px] font-semibold text-slate-100 truncate leading-tight">
                          {avatar.name}
                        </p>
                        {avatar.desc && activeCategory === 'games' && (
                          <p className="text-[7px] text-slate-500 truncate mt-0.5">{avatar.desc}</p>
                        )}
                      </div>

                      {/* Hover Glow */}
                      <motion.div
                        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{
                          boxShadow:
                            'inset 0 0 30px rgba(6,182,212,.25), 0 0 20px rgba(168,85,247,.15)',
                        }}
                      />

                      {/* Selected Indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-xl"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 450,
                            damping: 20,
                          }}
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
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
                className="flex flex-col items-center justify-center py-40 text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg
                  className="w-20 h-20 mb-4 text-slate-600/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg font-semibold">Nenhum avatar encontrado</p>
                <p className="text-sm text-slate-600 mt-2">
                  Tente ajustar sua busca ou mudar de categoria
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ─── FOOTER STATS ─── */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        className="flex items-center justify-center text-xs text-slate-400 font-medium gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.32 }}
      >
        <span className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-emerald-500/80 rounded-full animate-pulse" />
          <span>
            {avatarsInCategory.length} avatar{avatarsInCategory.length !== 1 ? 's' : ''} disponível
            {avatarsInCategory.length !== 1 ? 'is' : ''}
          </span>
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-500 font-medium">{ALL_AVATARS.length} total</span>
      </motion.div>
    </div>
  );
}
