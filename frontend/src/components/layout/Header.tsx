import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { mapsApi, nodesApi } from '@/lib/api';
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
import { useState, useCallback, useEffect, useRef } from 'react';
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

// Header component for the app layout
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, workspaces } = useAuthStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ maps: SearchMapResult[]; nodes: SearchNodeResult[] }>(
    { maps: [], nodes: [] }
  );
  const searchRef = useRef<HTMLDivElement>(null);
  const nodesCacheRef = useRef(new Map<string, any[]>());
  const lastQueryRef = useRef('');

  // Page config
  const getPageConfig = useCallback(() => {
    const path = location.pathname;
    if (path === '/maps') return { title: 'Meus Mapas', icon: MapIcon, crumbs: ['Dashboard', 'Meus Mapas'] };
    if (path.includes('/map/')) return { title: 'Editor', icon: MapIcon, crumbs: ['Dashboard', 'Mapas', 'Editor'] };
    if (path === '/settings') return { title: 'Configurações', icon: Settings, crumbs: ['Dashboard', 'Configurações'] };
    return { title: 'Dashboard', icon: Home, crumbs: ['Dashboard'] };
  }, [location.pathname]);

  const config = getPageConfig();

  const runSearch = useCallback(async (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults({ maps: [], nodes: [] });
      setIsSearching(false);
      return;
    }

    lastQueryRef.current = q;
    setIsSearching(true);
    const workspaceId = workspaces[0]?.id;

    let maps: Array<any> = [];

    if (workspaceId) {
      try {
        const response = await mapsApi.list({ workspace_id: workspaceId, limit: 200, offset: 0 });
        maps = (response.data as any[]) || [];
      } catch {
        maps = [];
      }
    } else {
      maps = JSON.parse(localStorage.getItem('mindmap_maps') || '[]');
    }

    const mapResults: SearchMapResult[] = maps
      .filter((m) => {
        const title = (m.title || '').toString().toLowerCase();
        const desc = (m.description || '').toString().toLowerCase();
        return title.includes(q) || desc.includes(q);
      })
      .map((m) => ({
        id: m.id,
        title: m.title || 'Mapa',
        description: m.description || null,
        updated_at: m.updated_at || m.created_at || null,
      }));

    const nodeResults: SearchNodeResult[] = [];

    if (workspaceId) {
      const nodesByMap = await Promise.all(
        maps.map(async (m) => {
          if (nodesCacheRef.current.has(m.id)) {
            return { map: m, nodes: nodesCacheRef.current.get(m.id) || [] };
          }
          try {
            const response = await nodesApi.listByMap(m.id);
            const nodes = (response.data as any[]) || [];
            nodesCacheRef.current.set(m.id, nodes);
            return { map: m, nodes };
          } catch {
            return { map: m, nodes: [] };
          }
        })
      );

      nodesByMap.forEach(({ map, nodes }) => {
        nodes.forEach((node: any) => {
          const label = (node.label ?? node.data?.label ?? 'Nó').toString();
          const content = (node.content ?? node.data?.content ?? node.data?.description ?? '').toString();
          const hay = `${label} ${content}`.toLowerCase();
          if (hay.includes(q)) {
            nodeResults.push({
              id: node.id,
              label,
              content,
              mapId: map.id,
              mapTitle: map.title || 'Mapa',
            });
          }
        });
      });
    } else {
      maps.forEach((m) => {
        const raw = localStorage.getItem(`mindmap_nodes_${m.id}`);
        if (!raw) return;
        try {
          const data = JSON.parse(raw);
          const nodes = data.nodes || [];
          nodes.forEach((node: any) => {
            const label = (node.data?.label ?? node.label ?? 'Nó').toString();
            const content = (node.data?.content ?? node.content ?? node.data?.description ?? '').toString();
            const hay = `${label} ${content}`.toLowerCase();
            if (hay.includes(q)) {
              nodeResults.push({
                id: node.id,
                label,
                content,
                mapId: m.id,
                mapTitle: m.title || 'Mapa',
              });
            }
          });
        } catch {
          return;
        }
      });
    }

    if (lastQueryRef.current !== q) return;
    setResults({ maps: mapResults, nodes: nodeResults });
    setIsSearching(false);
  }, [workspaces]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults({ maps: [], nodes: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      runSearch(q);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[60px] border-b border-white/[0.04] bg-[#0A0E18]/60 backdrop-blur-xl flex items-center px-6 gap-4">
      {/* Breadcrumbs */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5 min-w-0"
      >
        {config.crumbs.map((crumb, i) => (
          <div key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
            <span
              className={cn(
                'text-[13px] whitespace-nowrap',
                i === config.crumbs.length - 1
                  ? 'text-white font-medium'
                  : 'text-slate-500'
              )}
            >
              {crumb}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div ref={searchRef} className="relative hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center gap-2 px-3 h-9 rounded-xl border transition-all duration-200',
            searchFocused
              ? 'bg-white/[0.06] border-cyan-500/30 w-64'
              : 'bg-white/[0.02] border-white/[0.06] w-52 hover:bg-white/[0.04]'
          )}
        >
          <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar em mapas e nós..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setSearchFocused(true);
              setSearchOpen(true);
            }}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchOpen(false);
              }
              if (e.key === 'Enter' && results.maps[0]) {
                navigate(`/map/${results.maps[0].id}`);
                setSearchOpen(false);
              }
            }}
            className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setResults({ maps: [], nodes: [] });
              }}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline text-[10px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          )}
        </motion.div>

        {searchOpen && (
          <div className="absolute right-0 top-11 w-[520px] rounded-2xl border border-white/[0.06] bg-[#0D1323]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <div>
                <p className="text-[12px] text-slate-500">Busca avançada</p>
                <p className="text-[13px] text-white">
                  {searchQuery ? `Resultados para “${searchQuery}”` : 'Digite para buscar'}
                </p>
              </div>
              {isSearching && (
                <div className="flex items-center gap-2 text-[12px] text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Buscando...
                </div>
              )}
            </div>

            <div className="max-h-[420px] overflow-auto">
              {!searchQuery && (
                <div className="px-4 py-6 text-[13px] text-slate-500">
                  Busque por nomes de mapas, nós, conteúdos e palavras-chave.
                </div>
              )}

              {searchQuery && !isSearching && results.maps.length === 0 && results.nodes.length === 0 && (
                <div className="px-4 py-6 text-[13px] text-slate-500">
                  Nenhum resultado encontrado.
                </div>
              )}

              {results.maps.length > 0 && (
                <div className="px-4 pt-4">
                  <div className="flex items-center gap-2 text-[12px] text-slate-500 mb-2">
                    <Network className="w-3.5 h-3.5" />
                    Mapas ({results.maps.length})
                  </div>
                  <div className="space-y-1">
                    {results.maps.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          navigate(`/map/${m.id}`);
                          setSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] text-white truncate">{m.title || 'Mapa'}</p>
                          <span className="text-[11px] text-slate-500">
                            {m.updated_at ? formatRelativeTime(m.updated_at) : 'Recente'}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-[12px] text-slate-500 line-clamp-1">{m.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.nodes.length > 0 && (
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 text-[12px] text-slate-500 mb-2">
                    <CircleDot className="w-3.5 h-3.5" />
                    Nós ({results.nodes.length})
                  </div>
                  <div className="space-y-1">
                    {results.nodes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          navigate(`/map/${n.mapId}?node=${n.id}&q=${encodeURIComponent(searchQuery)}`);
                          setSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] text-white truncate">{n.label || 'Nó'}</p>
                          <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {n.mapTitle}
                          </span>
                        </div>
                        {n.content && (
                          <p className="text-[12px] text-slate-500 line-clamp-1">{n.content}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Dot */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
        <span className="text-[11px] text-slate-400 font-medium">Online</span>
      </div>

      {/* User */}
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2.5 pl-3 border-l border-white/[0.04] hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden border border-white/10">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-[12px] font-medium text-white leading-tight truncate max-w-[100px]">
            {user?.display_name || 'Usuário'}
          </p>
        </div>
      </button>
    </header>
  );
}

export default Header;
