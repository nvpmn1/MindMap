import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button, Input, Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { getInitials } from '@/lib/utils';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Monitor,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Keyboard,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  actions,
  className,
}: HeaderProps) {
  const { user, signOut } = useAuthStore();
  const { theme, setTheme, openModal } = useUIStore();

  const themeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor;
  const ThemeIcon = themeIcon;

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header
      className={cn(
        'h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'flex items-center justify-between px-6 gap-4',
        className
      )}
    >
      {/* Left side - Title */}
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Center - Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mapas, ideias..."
              className="pl-10 bg-muted/50"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border hidden md:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={`Tema: ${theme}`}
        >
          <ThemeIcon className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar size="sm">
                <AvatarImage src={user?.avatar_url} alt={user?.name} />
                <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal('shortcuts')}>
              <Keyboard className="mr-2 h-4 w-4" />
              Atalhos de Teclado
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Ajuda
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
