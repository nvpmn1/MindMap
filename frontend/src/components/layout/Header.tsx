import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { mapsApi, nodesApi } from '@/lib/api';
import { mapPersistence } from '@/lib/mapPersistence';
import { overlayManager } from '@/lib/overlay-manager';
import {
  Home,
  Map as MapIcon,
  Settings,
  ChevronRight,
  Search,
  User,
  Network,
  CircleDot,
  Loader2,
  X,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';

interface SearchMapResult {
  id: string;
  title: string;
  description?: string | null;
  updated_at?: string | null;
}

interface SearchNodeResult {
  id: string;
  label: string;
  content?: string | null;
  mapId: string;
  mapTitle: string;
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, workspaces } = useAuthStore();

  // Search state
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ maps: SearchMapResult[]; nodes: SearchNodeResult[] }>({
    maps: [],
    nodes: [],
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const nodesCacheRef = useRef(new Map<string, any[]>());
  const lastQueryRef = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Page config
  const getPageConfig = useCallback(() => {
    const path = location.pathname;
    if (path === '/maps')
      return { title: 'Meus Mapas', icon: MapIcon, crumbs: ['Dashboard', 'Meus Mapas'] };
    if (path.includes('/map/'))
      return { title: 'Editor', icon: MapIcon, crumbs: ['Dashboard', 'Mapas', 'Editor'] };
    return { title: 'Dashboard', icon: Home, crumbs: ['Dashboard'] };
  }, [location.pathname]);

  const config = getPageConfig();

  // Main search function with improved error handling
  const runSearch = useCallback(
    async (query: string) => {
      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const q = query.trim().toLowerCase();
        if (!q) {
          setResults({ maps: [], nodes: [] });
          setIsSearching(false);
          return;
        }

        lastQueryRef.current = q;
        setIsSearching(true);
        const workspaceId = workspaces[0]?.id;

        let maps: any[] = [];

        // Fetch maps
        try {
          if (workspaceId) {
            const response = await mapsApi.list({
              workspace_id: workspaceId,
              limit: 200,
              offset: 0,
            });
            maps = Array.isArray(response.data) ? response.data : [];
          } else {
            maps = mapPersistence.getCachedMaps() as any[];
          }
        } catch (error) {
          console.warn('Error fetching maps, trying localStorage fallback:', error);
          try {
            maps = mapPersistence.getCachedMaps() as any[];
          } catch {
            maps = [];
          }
        }

        // Ensure maps is array
        if (!Array.isArray(maps)) maps = [];

        // Filter maps
        const mapResults: SearchMapResult[] = maps
          .filter((m) => {
            if (!m || typeof m !== 'object') return false;
            const title = String(m.title || '').toLowerCase();
            const desc = String(m.description || '').toLowerCase();
            return title.includes(q) || desc.includes(q);
          })
          .map((m) => ({
            id: m.id,
            title: m.title || 'Mapa Sem Título',
            description: m.description || null,
            updated_at: m.updated_at || m.created_at || null,
          }))
          .slice(0, 8); // Limit results

        // Search nodes
        const nodeResults: SearchNodeResult[] = [];

        if (workspaceId && maps.length > 0) {
          try {
            const nodesByMap = await Promise.all(
              maps.map(async (m) => {
                if (!m?.id) return { map: m, nodes: [] };
                if (nodesCacheRef.current.has(m.id)) {
                  return { map: m, nodes: nodesCacheRef.current.get(m.id) || [] };
                }
                try {
                  const response = await nodesApi.listByMap(m.id);
                  const nodes = Array.isArray(response.data) ? response.data : [];
                  nodesCacheRef.current.set(m.id, nodes);
                  return { map: m, nodes };
                } catch {
                  return { map: m, nodes: [] };
                }
              })
            );

            nodesByMap.forEach(({ map, nodes }) => {
              if (!map || !Array.isArray(nodes)) return;
              nodes.forEach((node: any) => {
                if (!node) return;
                const label = String(node.label ?? node.data?.label ?? 'Nó').toLowerCase();
                const content = String(
                  node.content ?? node.data?.content ?? node.data?.description ?? ''
                ).toLowerCase();
                const searchText = `${label} ${content}`;

                if (searchText.includes(q)) {
                  nodeResults.push({
                    id: node.id,
                    label: node.label ?? node.data?.label ?? 'Nó',
                    content: node.content ?? node.data?.content ?? node.data?.description ?? '',
                    mapId: map.id,
                    mapTitle: map.title || 'Mapa',
                  });
                }
              });
            });
          } catch (error) {
            console.warn('Error searching nodes:', error);
          }
        } else if (!workspaceId && maps.length > 0) {
          // Search in localStorage
          maps.forEach((m) => {
            if (!m?.id) return;
            try {
              const raw = localStorage.getItem(`mindmap_nodes_${m.id}`);
              if (!raw) return;
              const data = JSON.parse(raw);
              const nodes = data.nodes || [];
              if (!Array.isArray(nodes)) return;

              nodes.forEach((node: any) => {
                if (!node) return;
                const label = String(node.data?.label ?? node.label ?? 'Nó').toLowerCase();
                const content = String(
                  node.data?.content ?? node.content ?? node.data?.description ?? ''
                ).toLowerCase();
                const searchText = `${label} ${content}`;

                if (searchText.includes(q)) {
                  nodeResults.push({
                    id: node.id,
                    label: node.data?.label ?? node.label ?? 'Nó',
                    content: node.data?.content ?? node.content ?? node.data?.description ?? '',
                    mapId: m.id,
                    mapTitle: m.title || 'Mapa',
                  });
                }
              });
            } catch (error) {
              console.warn(`Error parsing nodes for map ${m.id}:`, error);
            }
          });
        }

        // Limit and deduplicate node results
        const uniqueNodes = nodeResults.slice(0, 12);

        if (lastQueryRef.current === q) {
          setResults({ maps: mapResults, nodes: uniqueNodes });
        }
      } catch (error) {
        console.error('Search error:', error);
        if (lastQueryRef.current !== query.toLowerCase()) return;
        setResults({ maps: [], nodes: [] });
      } finally {
        setIsSearching(false);
      }
    },
    [workspaces]
  );

  // Debounced search effect
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults({ maps: [], nodes: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      runSearch(q);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => {
          searchRef.current?.querySelector('input')?.focus();
        }, 0);
      }

      // Escape to close search
      if (e.key === 'Escape' && searchOpen) {
        e.preventDefault();
        setSearchOpen(false);
        setSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = useMemo(() => results.maps.length + results.nodes.length, [results]);

  return (
    <header className="h-16 border-b border-white/[0.06] bg-gradient-to-r from-[#0A0E18] via-[#0D1323] to-[#0A0E18] backdrop-blur-xl flex items-center px-6 gap-6">
      {/* Breadcrumbs */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 min-w-fit"
      >
        {config.crumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
            <span
              className={cn(
                'text-sm whitespace-nowrap',
                i === config.crumbs.length - 1 ? 'text-white font-semibold' : 'text-slate-500'
              )}
            >
              {crumb}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Search - Centered and Beautiful */}
      <div ref={searchRef} className="flex-1 max-w-xl mx-auto hidden md:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'relative flex items-center gap-3 px-4 py-2.5 rounded-full border-2 transition-all duration-200 group',
            searchFocused
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/70 shadow-xl shadow-cyan-500/20'
              : 'bg-white/[0.05] border-white/[0.12] hover:bg-white/[0.07] hover:border-white/[0.18]'
          )}
        >
          <Search
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-colors duration-200',
              searchFocused ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
            )}
          />
          <input
            type="text"
            placeholder="Procure mapas, nós, ideias..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setSearchOpen(true);
              }
            }}
            onFocus={() => {
              setSearchFocused(true);
              if (searchQuery.trim()) {
                setSearchOpen(true);
              }
            }}
            onBlur={() => {
              setSearchFocused(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
                setSearchOpen(false);
              } else if (e.key === 'Enter' && results.maps.length > 0) {
                e.preventDefault();
                navigate(`/map/${results.maps[0].id}`);
                setSearchOpen(false);
                setSearchQuery('');
              }
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setResults({ maps: [], nodes: [] });
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-white/[0.08] rounded-md"
              title="Limpar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden lg:inline text-xs text-slate-600 bg-white/[0.06] px-2 py-1 rounded border border-white/[0.1] font-mono">
              ⌘K
            </kbd>
          )}
        </motion.div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-14 left-0 right-0 rounded-2xl border border-white/[0.1] bg-[#0D1323]/98 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-white/[0.02] to-transparent">
                <div>
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                    {isSearching
                      ? '🔍 Buscando...'
                      : totalResults > 0
                        ? `${totalResults} resultado(s)`
                        : '✨ Pronto'}
                  </p>
                  {searchQuery && (
                    <p className="text-xs text-slate-500 mt-1">
                      para{' '}
                      <span className="text-white font-medium">&ldquo;{searchQuery}&rdquo;</span>
                    </p>
                  )}
                </div>
                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
              </div>

              {/* Results Container */}
              <div className="overflow-y-auto flex-1">
                {!searchQuery && (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/15 to-purple-500/15 mb-3">
                      <Search className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Digite para buscar em seus <br />
                      mapas, nós e ideias
                    </p>
                  </div>
                )}

                {searchQuery && !isSearching && totalResults === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-600">
                      Nenhum resultado para{' '}
                      <span className="text-white font-medium">&ldquo;{searchQuery}&rdquo;</span>
                    </p>
                    <p className="text-xs text-slate-700 mt-2">Tente outro termo de busca</p>
                  </div>
                )}

                {/* Maps Results */}
                {results.maps.length > 0 && (
                  <div className="border-b border-white/[0.05]">
                    <div className="px-5 pt-4 pb-2">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <Network className="w-3.5 h-3.5 text-cyan-400" />
                        Mapas{' '}
                        <span className="text-slate-700 font-normal">({results.maps.length})</span>
                      </p>
                    </div>
                    <div className="space-y-0.5 px-3 pb-3">
                      {results.maps.map((map) => (
                        <button
                          key={map.id}
                          onClick={() => {
                            overlayManager.cleanupAllOverlays();
                            navigate(`/map/${map.id}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium group-hover:text-cyan-300 transition-colors truncate">
                                {map.title}
                              </p>
                              {map.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                  {map.description}
                                </p>
                              )}
                            </div>
                            {map.updated_at && (
                              <span className="text-xs text-slate-600 flex-shrink-0">
                                {formatRelativeTime(map.updated_at)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nodes Results */}
                {results.nodes.length > 0 && (
                  <div>
                    <div className="px-5 py-3 border-t border-white/[0.05]">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <CircleDot className="w-3.5 h-3.5 text-purple-400" />
                        Nós{' '}
                        <span className="text-slate-700 font-normal">({results.nodes.length})</span>
                      </p>
                    </div>
                    <div className="space-y-0.5 px-3 pb-3">
                      {results.nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => {
                            overlayManager.cleanupAllOverlays();
                            navigate(
                              `/map/${node.mapId}?node=${node.id}&q=${encodeURIComponent(
                                searchQuery
                              )}`
                            );
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium group-hover:text-purple-300 transition-colors truncate">
                                {node.label}
                              </p>
                              {node.content && (
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                  {node.content}
                                </p>
                              )}
                              <p className="text-xs text-slate-700 mt-1">
                                em <span className="text-slate-500">{node.mapTitle}</span>
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] ml-auto">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
        <span className="text-xs text-slate-500 font-medium">Online</span>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-2.5 pl-3 pr-1 border-l border-white/[0.06]">
        <div className="hidden lg:block text-right">
          <p className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">
            {user?.display_name || 'Usuário'}
          </p>
          <p className="text-[10px] text-slate-600">Perfil</p>
        </div>
        <UserAvatar url={user?.avatar_url} displayName={user?.display_name} size="md" />
      </div>
    </header>
  );
}

export default Header;
