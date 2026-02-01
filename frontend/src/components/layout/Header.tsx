import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore, useUIStore } from '@/stores';
import { 
  UserAvatar, 
  AvatarGroup,
  SimpleTooltip, 
  Button,
} from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  HelpCircle,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showCollaborators?: boolean;
  collaborators?: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    isOnline?: boolean;
  }>;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  showCollaborators = false,
  collaborators = [],
  actions,
  breadcrumbs,
}: HeaderProps) {
  const { user, signOut } = useAuthStore();
  const { setCommandPaletteOpen } = useUIStore();
  const [notifications] = React.useState([
    { id: '1', title: 'Novo comentário', message: 'Helen comentou no mapa Projeto Alpha', time: '5min' },
    { id: '2', title: 'Tarefa atribuída', message: 'Pablo atribuiu uma tarefa para você', time: '1h' },
  ]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.label}>
                {index > 0 && (
                  <span className="text-muted-foreground">/</span>
                )}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title */}
        {title && !breadcrumbs && (
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Center Section - Search */}
      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Buscar mapas, tarefas, pessoas...</span>
            <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Custom Actions */}
        {actions}

        {/* Collaborators */}
        {showCollaborators && collaborators.length > 0 && (
          <div className="hidden md:flex items-center gap-2 border-r pr-3 mr-1">
            <AvatarGroup users={collaborators} max={3} size="sm" />
            <span className="text-xs text-muted-foreground">
              {collaborators.filter(c => c.isOnline).length} online
            </span>
          </div>
        )}

        {/* AI Chat Toggle */}
        <SimpleTooltip content="Chat IA" side="bottom">
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </SimpleTooltip>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              <button className="text-xs text-primary hover:underline">
                Marcar todas como lidas
              </button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3">
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{notification.message}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <SimpleTooltip content="Ajuda" side="bottom">
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </SimpleTooltip>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors">
              <UserAvatar
                name={user?.name || 'Usuário'}
                src={user?.avatar_url}
                size="sm"
              />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
