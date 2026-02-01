import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Map, 
  Users, 
  ListTodo,
  ArrowRight,
  Columns
} from 'lucide-react';
import { useUserStore, useViewStore, useMindmapStore } from '../store';

const features = [
  {
    icon: Map,
    title: 'Mapas Mentais',
    description: 'Visualize suas ideias de forma interativa com nós conectados'
  },
  {
    icon: Columns,
    title: 'Kanban',
    description: 'Organize tarefas em colunas de status'
  },
  {
    icon: ListTodo,
    title: 'Listas',
    description: 'Veja suas ideias em formato hierárquico'
  },
  {
    icon: Sparkles,
    title: 'IA Integrada',
    description: 'Gere mapas e expanda ideias com inteligência artificial'
  },
];

export default function HomePage() {
  const { users, currentUser, setCurrentUser, getUserColor } = useUserStore();
  const { setView } = useViewStore();
  const { mindmaps } = useMindmapStore();

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    setView('mindmap');
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="text-white" size={36} />
        </div>
        
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
          MindMap Colaborativo
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Transforme suas ideias em ação com mapas mentais inteligentes, 
          colaboração em tempo real e assistente de IA
        </p>
      </motion.div>

      {/* User Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
          <Users className="inline mr-2" size={16} />
          Selecione seu perfil
        </h2>
        
        <div className="flex gap-4 justify-center">
          {users.map((user, index) => (
            <motion.button
              key={user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectUser(user)}
              className={`
                flex flex-col items-center p-6 rounded-2xl border-2 transition-all min-w-[140px] cursor-pointer
                ${currentUser?.id === user.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md bg-white dark:bg-slate-800'
                }
              `}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md"
                style={{ backgroundColor: getUserColor(user.id) }}
              >
                {user.name[0]}
              </div>
              <span className="font-semibold text-slate-800 dark:text-white">{user.name}</span>
              <span className="text-xs text-slate-400 mt-1">{user.role || 'Colaborador'}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
              <feature.icon className="text-blue-500" size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-slate-400">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Stats */}
      {mindmaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex gap-8 text-center"
        >
          <div>
            <p className="text-3xl font-bold text-blue-500">{mindmaps.length}</p>
            <p className="text-sm text-slate-500">Mapas criados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-500">{users.length}</p>
            <p className="text-sm text-slate-500">Colaboradores</p>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={() => currentUser ? setView('mindmap') : null}
        disabled={!currentUser}
        className="mt-8 btn-primary text-lg py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {currentUser ? 'Começar agora' : 'Selecione um perfil para continuar'}
        {currentUser && <ArrowRight size={20} className="ml-2 inline" />}
      </motion.button>
    </div>
  );
}
