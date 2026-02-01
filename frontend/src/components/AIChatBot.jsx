import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  X, 
  Minimize2,
  Maximize2,
  User,
  Bot,
  Loader2,
  Lightbulb,
  ListChecks,
  GitBranch,
  FileText
} from 'lucide-react';
import { useChatStore, useMindmapStore, useUserStore } from '../store';
import { aiAPI } from '../lib/api';

const quickActions = [
  { id: 'generate', icon: GitBranch, label: 'Gerar mapa', prompt: 'Gere um mapa mental sobre ' },
  { id: 'tasks', icon: ListChecks, label: 'Sugerir tarefas', prompt: 'Sugira tarefas para ' },
  { id: 'summarize', icon: FileText, label: 'Resumir', prompt: 'Resuma o conteúdo atual do mapa' },
  { id: 'ideas', icon: Lightbulb, label: 'Novas ideias', prompt: 'Sugira novas ideias para expandir ' },
];

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'}
      `}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      
      <div className={`
        max-w-[80%] px-4 py-2 rounded-2xl
        ${isUser 
          ? 'bg-blue-500 text-white rounded-tr-sm' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
        }
      `}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className={`text-[10px] mt-1 block ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

export default function AIChatBot() {
  const { messages, addMessage, isOpen, toggleChat, isMinimized, toggleMinimize, isLoading, setLoading } = useChatStore();
  const { nodes, currentMindmap, addNode } = useMindmapStore();
  const { currentUser } = useUserStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const getMapContext = () => {
    if (!nodes.length) return 'Mapa vazio';
    
    const buildTree = (parentId = null, depth = 0) => {
      const children = nodes.filter(n => n.parent_id === parentId);
      return children.map(node => {
        const prefix = '  '.repeat(depth) + '- ';
        const childTree = buildTree(node.id, depth + 1);
        return prefix + node.content + (childTree ? '\n' + childTree : '');
      }).join('\n');
    };
    
    return buildTree();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      const context = {
        mapName: currentMindmap?.name || 'Mapa sem nome',
        mapStructure: getMapContext(),
        userName: currentUser?.name || 'Usuário'
      };

      const response = await aiAPI.chat(userMessage, messages.slice(-10), context);
      
      addMessage({ 
        role: 'assistant', 
        content: response.data.message 
      });

      // If AI generated suggestions, offer to add them
      if (response.data.suggestions?.length > 0) {
        addMessage({
          role: 'assistant',
          content: `💡 Sugestões geradas:\n${response.data.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}\n\nDeseja que eu adicione essas ideias ao mapa?`
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action.prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow z-50"
      >
        <Sparkles size={24} />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? 'auto' : 500,
        width: isMinimized ? 300 : 380
      }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistente IA</h3>
            {!isMinimized && (
              <p className="text-[10px] text-white/80">Powered by Claude</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleMinimize}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button 
            onClick={toggleChat}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Quick Actions */}
            {messages.length === 0 && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Ações rápidas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                    >
                      <action.icon size={14} className="text-purple-500" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <Sparkles className="text-purple-500" size={24} />
                  </div>
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">
                    Olá, {currentUser?.name || 'usuário'}! 👋
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Como posso ajudar com seu mapa mental hoje?
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow max-h-24"
                  style={{ minHeight: '42px' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                >
                  <Send size={18} />
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                IA pode cometer erros. Verifique as informações importantes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
