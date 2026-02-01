import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { UserAvatar, SimpleTooltip, ThemeSwitch } from '@/components/ui';
import {
  LayoutDashboard,
  Map,
  ListTodo,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNewMap?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Meus Mapas',
    href: '/maps',
    icon: <Map className="h-5 w-5" />,
  },
  {
    label: 'Tarefas',
    href: '/tasks',
    icon: <ListTodo className="h-5 w-5" />,
    badge: 5,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    label: 'Configurações',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export function Sidebar({ collapsed, onCollapsedChange, onNewMap }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const [isDark, setIsDark] = React.useState(
    document.documentElement.classList.contains('dark')
  );

  const handleThemeToggle = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

    const content = (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <SimpleTooltip content={item.label} side="right">
          {content}
        </SimpleTooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex h-16 items-center border-b px-4',
        collapsed && 'justify-center px-2'
      )}>
        {!collapsed ? (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">MindMap Hub</span>
          </Link>
        ) : (
          <SimpleTooltip content="MindMap Hub" side="right">
            <Link
              to="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Sparkles className="h-5 w-5" />
            </Link>
          </SimpleTooltip>
        )}
      </div>

      {/* New Map Button */}
      <div className={cn('p-3', collapsed && 'px-2')}>
        {collapsed ? (
          <SimpleTooltip content="Novo Mapa" side="right">
            <button
              onClick={onNewMap}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </SimpleTooltip>
        ) : (
          <button
            onClick={onNewMap}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Mapa
          </button>
        )}
      </div>

      {/* Search (only when expanded) */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <button className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <Search className="h-4 w-4" />
            <span>Buscar...</span>
            <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Recent Maps Section */}
        {!collapsed && (
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Recentes
              </span>
              <Link
                to="/maps"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ver todos
              </Link>
            </div>
            <div className="space-y-1">
              {/* Placeholder for recent maps - would be dynamic */}
              {['Projeto Alpha', 'Brainstorm Q1', 'Roadmap 2024'].map((name) => (
                <Link
                  key={name}
                  to={`/map/${name.toLowerCase().replace(/\s/g, '-')}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t px-3 py-3 space-y-1">
        {secondaryNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* Theme Toggle */}
      <div className={cn(
        'border-t px-3 py-3',
        collapsed && 'flex justify-center'
      )}>
        {collapsed ? (
          <SimpleTooltip content="Alternar tema" side="right">
            <button
              onClick={() => handleThemeToggle(!isDark)}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </SimpleTooltip>
        ) : (
          <div className="flex items-center justify-between px-3">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeSwitch isDark={isDark} onToggle={handleThemeToggle} />
          </div>
        )}
      </div>

      {/* User Section */}
      <div className={cn(
        'border-t p-3',
        collapsed && 'flex justify-center'
      )}>
        {collapsed ? (
          <SimpleTooltip content={user?.name || 'Usuário'} side="right">
            <button className="flex h-10 w-10 items-center justify-center">
              <UserAvatar
                name={user?.name || 'U'}
                src={user?.avatar_url}
                size="sm"
              />
            </button>
          </SimpleTooltip>
        ) : (
          <div className="flex items-center gap-3">
            <UserAvatar
              name={user?.name || 'U'}
              src={user?.avatar_url}
              size="md"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <SimpleTooltip content="Sair" side="top">
              <button
                onClick={() => signOut()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </SimpleTooltip>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            'flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'px-0'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="ml-2 text-sm">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
