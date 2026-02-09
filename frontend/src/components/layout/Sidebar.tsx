import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Map,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Meus Mapas', href: '/maps', icon: Map },
];

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleLogout = () => {
    signOut();
    navigate('/login');
    toast.success('Até logo!', { duration: 2500 });
  };

  const isActive = (href: string) =>
    location.pathname === href || (href !== '/dashboard' && location.pathname.startsWith(href));

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative flex flex-col bg-[#0A0E18]/80 border-r border-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-[60px] px-4 border-b border-white/[0.04]">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/15 group-hover:shadow-cyan-500/25 transition-shadow flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap"
              >
                NeuralMap
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            'ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0',
            collapsed && 'ml-0'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                active
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-cyan-400" />
              )}

              <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', active && 'text-cyan-400')} />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="text-[13px] font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.04] p-3 space-y-2">
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group',
            collapsed && 'justify-center'
          )}
          title={collapsed ? user?.display_name || 'Perfil' : undefined}
        >
          {/* Avatar with automatic fallback */}
          <div className="flex items-center justify-center">
            {user ? (
              <UserAvatar
                url={user.avatar_url}
                displayName={user.display_name}
                size="sm"
                className="border border-white/10"
              />
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.12 }}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-[13px] font-medium text-white truncate">
                  {user?.display_name || 'Usuário'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className={cn('flex gap-1.5', collapsed ? 'flex-col' : 'flex-row')}>
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] font-medium whitespace-nowrap"
                >
                  Config
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] font-medium whitespace-nowrap"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
