import { useEffect, useState } from 'react';
import { Loader, CheckCircle2, AlertCircle, Database, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DatabaseSetup() {
  const [status, setStatus] = useState('checking'); // checking, initializing, complete, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Verificando banco de dados...');
  const [details, setDetails] = useState({});

  useEffect(() => {
    const checkDB = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const statusRes = await fetch('http://localhost:3001/api/setup/status', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const statusData = await statusRes.json();

        if (statusData.summary?.ready) {
          // Database is ready - just mark as complete and notify parent
          setStatus('complete');
          setProgress(100);
          setMessage('✅ Banco de dados pronto!');
          setDetails(statusData.summary);
          
          // Notify parent via localStorage
          localStorage.setItem('databaseReady', 'true');
          return;
        }

        // Database needs initialization
        setStatus('initializing');
        setMessage('Inicializando banco de dados...');
        setProgress(25);

        const initController = new AbortController();
        const initTimeoutId = setTimeout(() => initController.abort(), 30000);

        const initRes = await fetch('http://localhost:3001/api/setup/init-database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: initController.signal
        });

        clearTimeout(initTimeoutId);
        setProgress(75);

        const initData = await initRes.json();

        if (initData.success) {
          setProgress(100);
          setStatus('complete');
          setMessage('✅ Banco de dados inicializado com sucesso!');
          setDetails(initData.stats);
          
          // Notify parent via localStorage
          localStorage.setItem('databaseReady', 'true');
        } else {
          throw new Error(initData.error || 'Erro desconhecido');
        }
      } catch (error) {
        console.error('Setup error:', error);
        setStatus('error');
        setMessage(`❌ Erro ao conectar. Clique em "Pular" para continuar.`);
      }
    };

    checkDB();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
            {status === 'checking' || status === 'initializing' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <Database size={32} />
              </motion.div>
            ) : status === 'complete' ? (
              <CheckCircle2 size={32} />
            ) : (
              <AlertCircle size={32} />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">
          {status === 'complete' ? '🎉 Pronto!' : '🔧 Configurando'}
        </h2>

        {/* Message */}
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>

        {/* Progress Bar */}
        {status !== 'error' && (
          <div className="mb-6">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">{progress}%</p>
          </div>
        )}

        {/* Details */}
        {Object.keys(details).length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
            {status === 'complete' ? (
              <div className="space-y-2">
                <p>✅ Usuários: {details.users || 3}</p>
                <p>✅ Mapas: {details.mindmaps || 0}</p>
                <p>✅ Nós: {details.nodes || 0}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(details).map(([key, value]) => (
                  <p key={key}>
                    {typeof value === 'boolean' ? (value ? '✅' : '⏳') : '📊'} {key}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error details */}
        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                // Skip setup and continue
                localStorage.setItem('skipDatabaseSetup', 'true');
                localStorage.setItem('databaseReady', 'true');
                window.dispatchEvent(new Event('storage'));
              }}
              className="w-full btn-primary"
            >
              Continuar Mesmo Assim
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {(status === 'checking' || status === 'initializing') && (
          <div>
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              ))}
            </div>
            <button
              onClick={() => {
                // Skip setup and go to app
                localStorage.setItem('skipDatabaseSetup', 'true');
                localStorage.setItem('databaseReady', 'true');
                window.dispatchEvent(new Event('storage'));
              }}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Pular (Entrar mesmo assim)
            </button>
          </div>
        )}

        {/* Complete - Auto close */}
        {status === 'complete' && (
          <button
            onClick={() => {
              window.dispatchEvent(new Event('storage'));
            }}
            className="w-full btn-primary"
          >
            Começar a Usar
          </button>
        )}
      </motion.div>
    </div>
  );
}
