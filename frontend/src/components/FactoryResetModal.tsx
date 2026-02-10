import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { overlayManager } from '@/lib/overlay-manager';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function FactoryResetModal({ isOpen, onClose, onConfirm }: FactoryResetModalProps) {
  const [step, setStep] = useState<'warning' | 'confirmation' | 'final'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const modalIdRef = useRef('factory-reset-modal-' + Math.random().toString(36));

  // Track overlay lifecycle
  useEffect(() => {
    if (isOpen) {
      overlayManager.registerOverlay(modalIdRef.current, 'factory-reset');
    }

    return () => {
      overlayManager.unregisterOverlay(modalIdRef.current, 'factory-reset');
    };
  }, [isOpen]);

  // Reset estados ao fechar
  useEffect(() => {
    if (!isOpen) {
      setStep('warning');
      setConfirmText('');
      setCountdown(5);
    }
  }, [isOpen]);

  // Contagem regressiva
  useEffect(() => {
    if (step !== 'confirmation' || countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleClose = () => {
    // Always close immediately
    onClose();
    // Force cleanup
    overlayManager.unregisterOverlay(modalIdRef.current, 'factory-reset');
  };

  const handleConfirmStep = () => {
    setStep('confirmation');
    setCountdown(5);
  };

  const handleFinalReset = async () => {
    if (confirmText !== 'DELETAR TUDO') {
      toast.error('Digite "DELETAR TUDO" para confirmar', { duration: 3500 });
      return;
    }

    if (countdown > 0) {
      toast.error(`Aguarde ${countdown} segundos...`, { duration: 2000 });
      return;
    }

    setIsLoading(true);
    setStep('final');

    try {
      await onConfirm();

      toast.success('Todos os dados foram deletados. Redirecionando...', { duration: 4000 });

      // Wait before closing to allow redirect
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      toast.error('Erro ao deletar dados', { duration: 3500 });
      setIsLoading(false);
      setStep('warning');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="factory-reset-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-overlay="factory-reset"
          style={{ willChange: 'opacity' }}
        >
          <motion.div
            key="factory-reset-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-orange-500/20 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Factory Reset</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {step === 'warning' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-orange-300">⚠️ AVISO CRÍTICO</h3>
                    
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>Esta ação vai deletar <strong>PERMANENTEMENTE</strong>:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>✂️ Todos os seus mapas mentais</li>
                        <li>✂️ Todos os nós e conexões</li>
                        <li>✂️ Histórico de alterações</li>
                        <li>✂️ Configurações de workspace</li>
                        <li>✂️ Todos os dados da plataforma</li>
                      </ul>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <p className="text-xs text-red-300 font-semibold">
                        🔥 NÃO HÁ BACKUP! ESTA AÇÃO NÃO PODE SER DESFEITA!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleConfirmStep}
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-medium hover:bg-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Entendo o Risco, Continuar
                    </button>

                    <button
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'confirmation' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-red-300">🔐 CONFIRMAÇÃO FINAL</h3>
                    
                    <p className="text-sm text-slate-300">
                      Para confirmar, digite exatamente: <br />
                      <strong className="text-red-400">DELETAR TUDO</strong>
                    </p>

                    <input
                      type="text"
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value.toUpperCase())}
                      placeholder="DELETAR TUDO"
                      disabled={isLoading || countdown > 0}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 disabled:opacity-50 font-mono text-center"
                    />

                    {countdown > 0 && (
                      <div className="text-center py-3">
                        <p className="text-sm text-slate-400">Aguarde para continuar:</p>
                        <p className="text-3xl font-bold text-orange-400 mt-2">
                          {countdown}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleFinalReset}
                      disabled={
                        isLoading ||
                        confirmText !== 'DELETAR TUDO' ||
                        countdown > 0
                      }
                      className="w-full px-4 py-3 rounded-xl bg-red-600/80 border border-red-500/40 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isLoading ? 'Deletando...' : 'DELETAR TODOS OS DADOS'}
                    </button>

                    <button
                      onClick={() => {
                        setStep('warning');
                        setConfirmText('');
                      }}
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Voltar
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'final' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 text-red-400 animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Deletando Dados...</h3>
                    <p className="text-sm text-slate-400">
                      Por favor aguarde enquanto limpamos tudo
                    </p>
                  </div>

                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-full bg-gradient-to-r from-transparent via-red-500 to-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
