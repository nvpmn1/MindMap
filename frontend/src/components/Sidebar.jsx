import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Map, 
  List, 
  Columns, 
  Settings,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Clock,
  Star,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useViewStore, useMindmapStore, useUserStore } from '../store';
import { mindmapsAPI } from '../lib/api';

const navItems = [
  { id: 'home', icon: Home, label: 'Início' },
  { id: 'mindmap', icon: Map, label: 'Mapa Mental' },
  { id: 'kanban', icon: Columns, label: 'Kanban' },
  { id: 'list', icon: List, label: 'Lista' },
];

export default function Sidebar() {
  const { currentView, setView } = useViewStore();
  const { mindmaps, currentMindmap, setCurrentMindmap, addMindmap } = useMindmapStore();
  const { currentUser, users, setCurrentUser, getUserColor } = useUserStore();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserSwitch, setShowUserSwitch] = useState(false);

  const handleCreateMindmap = async () => {
    try {
      const result = await mindmapsAPI.create(
        'Novo Mapa Mental',
        'Um novo mapa mental colaborativo',
        currentUser?.id
      );
      
      if (result.error) {
        console.error('Failed to create mindmap:', result.message);
        return;
      }
      
      addMindmap(result);
      setCurrentMindmap(result);
      setView('mindmap');
    } catch (error) {
      console.error('Failed to create mindmap:', error);
    }
  };

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    setShowUserSwitch(false);
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 260 }}
      className="h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white" size={18} />
                </div>
                <span className="font-bold text-lg text-slate-800 dark:text-white">MindMap</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 relative">
        <button
          onClick={() => setShowUserSwitch(!showUserSwitch)}
          className={`
            w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
            style={{ backgroundColor: currentUser ? getUserColor(currentUser.id) : '#6366f1' }}
          >
            {currentUser?.name?.[0] || '?'}
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-slate-800 dark:text-white truncate">
                {currentUser?.name || 'Selecione usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {currentUser?.email || ''}
              </p>
            </div>
          )}
        </button>

        {/* User Switch Dropdown */}
        <AnimatePresence>
          {showUserSwitch && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50"
            >
              <p className="px-3 py-1 text-xs text-slate-500">Trocar usuário:</p>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSwitchUser(user)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                    ${currentUser?.id === user.id ? 'bg-slate-50 dark:bg-slate-700/50' : ''}
                  `}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: getUserColor(user.id) }}
                  >
                    {user.name[0]}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{user.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer
                ${currentView === item.id 
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon size={20} />
              {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Mindmaps List */}
        {!isCollapsed && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Seus Mapas
              </span>
              <button 
                onClick={handleCreateMindmap}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <Plus size={16} className="text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-1">
              {mindmaps.length > 0 ? (
                mindmaps.slice(0, 5).map(map => (
                  <button
                    key={map.id}
                    onClick={() => {
                      setCurrentMindmap(map);
                      setView('mindmap');
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left
                      ${currentMindmap?.id === map.id 
                        ? 'bg-slate-100 dark:bg-slate-800' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <FolderOpen size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {map.name}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-slate-400">
                  Nenhum mapa criado
                </p>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setCurrentUser(null)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
