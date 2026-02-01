import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import {
  LayoutDashboard,
  Map,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Archive,
  Users,
  Sparkles,
  LogOut,
  Brain,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { getInitials } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Map, label: 'Meus Mapas', href: '/dashboard?filter=owned' },
  { icon: Users, label: 'Compartilhados', href: '/dashboard?filter=shared' },
  { icon: Star, label: 'Favoritos', href: '/dashboard?filter=favorites' },
  { icon: Archive, label: 'Arquivados', href: '/dashboard?filter=archived' },
];

const bottomNavItems = [
  { icon: Sparkles, label: 'IA Assistente', href: '/ai' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { sidebarOpen, toggleSidebar, openModal } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg">MindMap</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && 'absolute -right-3 top-6 bg-background border shadow-sm')}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Create Button */}
      <div className="p-3">
        <Button
          className="w-full"
          onClick={() => openModal('createMap')}
        >
          <Plus className="h-4 w-4" />
          {sidebarOpen && 'Novo Mapa'}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href.includes('?') && location.search.includes(item.href.split('?')[1]));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="px-3 py-2">
        <div className="border-t" />
      </div>

      {/* Bottom Navigation */}
      <nav className="px-3 py-2 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg bg-muted/50',
            !sidebarOpen && 'justify-center'
          )}
        >
          <Avatar size="sm">
            <AvatarImage src={user?.avatar_url} alt={user?.name} />
            <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
          </Avatar>
          
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => signOut()}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
