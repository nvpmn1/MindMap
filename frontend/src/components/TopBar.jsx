import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon,
  Settings,
  Sparkles,
  Users,
  X,
  Check,
  Info
} from 'lucide-react';
import { useViewStore, useMindmapStore, useUserStore, useNotificationStore } from '../store';

export default function TopBar() {
  const { currentView } = useViewStore();
  const { currentMindmap, onlineUsers } = useMindmapStore();
  const { currentUser, users, getUserColor } = useUserStore();
  const { notifications, markAsRead, clearAll } = useNotificationStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const viewTitles = {
    home: 'Início',
    mindmap: currentMindmap?.name || 'Mapa Mental',
    kanban: 'Quadro Kanban',
    list: 'Lista de Ideias'
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          {viewTitles[currentView]}
        </h1>
        
        {/* Online Users (for mindmap view) */}
        {currentView === 'mindmap' && onlineUsers.length > 0 && (
          <div className="flex items-center gap-1 ml-4">
            <Users size={16} className="text-slate-400" />
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 4).map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return (
                  <div
                    key={userId}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: getUserColor(userId) }}
                    title={`${user.name} está online`}
                  >
                    {user.name[0]}
                  </div>
                );
              })}
              {onlineUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-medium">
                  +{onlineUsers.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search Toggle */}
        <AnimatePresence>
          {showSearch ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ideias..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <button 
                onClick={() => setShowSearch(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Search size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </AnimatePresence>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isDark ? (
            <Sun size={20} className="text-slate-600 dark:text-slate-400" />
          ) : (
            <Moon size={20} className="text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
          >
            <Bell size={20} className="text-slate-600 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Notificações</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAll}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Limpar todas
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map(notif => (
                      <div
                        key={notif.id}
                        className={`
                          px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0
                          ${notif.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${notif.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
                            ${notif.type === 'success' ? 'bg-green-100 text-green-600' : ''}
                            ${notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
                          `}>
                            <Info size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-slate-300">{notif.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notif.timestamp).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            >
                              <Check size={14} className="text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <Bell size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Assistant Indicator */}
        <div className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
          <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">IA Ativa</span>
        </div>
      </div>
    </header>
  );
}
