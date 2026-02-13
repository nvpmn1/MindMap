/**
 * Map Save Status Indicator
 * Shows real-time feedback about save status with comprehensive monitoring
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, CheckCircle2, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { advancedSaveQueue } from '@/lib/advanced-save-queue';

interface SaveStatusIndicatorProps {
  mapId?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ mapId }) => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'offline' | 'idle'>(
    'idle'
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastStatusChange, setLastStatusChange] = useState<number>(Date.now());

  // Monitor network status
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[SaveStatus] Back online - triggering sync');
      setIsOnline(true);
      setSaveStatus('saving');
      setLastStatusChange(Date.now());
      try {
        const result = await advancedSaveQueue.forceSync({
          timeoutMs: 4000,
          mapId,
          includeDeadLetter: true,
        });
        if (result.drained) {
          setSaveStatus('saved');
        }
      } catch {
        setSaveStatus('error');
      } finally {
        setLastStatusChange(Date.now());
      }
    };

    const handleOffline = () => {
      console.log('[SaveStatus] Went offline - switching to local save');
      setIsOnline(false);
      setSaveStatus('offline');
      setLastStatusChange(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mapId]);

  // Monitor pending saves with improved logic
  useEffect(() => {
    const checkStatus = () => {
      const queueStatus = advancedSaveQueue.getStatus(mapId);
      const count = queueStatus.queueLength;
      setPendingCount(count);
      if (queueStatus.failedOperations.length > 0) {
        setErrorMessage(
          queueStatus.failedOperations[queueStatus.failedOperations.length - 1].lastError ||
            'Erro ao salvar'
        );
      }

      if (!isOnline) {
        if (saveStatus !== 'offline') {
          setSaveStatus('offline');
          setLastStatusChange(Date.now());
        }
        return;
      }

      if (queueStatus.failedOperations.length > 0) {
        if (saveStatus !== 'error') {
          setSaveStatus('error');
          setLastStatusChange(Date.now());
        }
        return;
      }

      if (count > 0) {
        if (saveStatus !== 'saving') {
          setSaveStatus('saving');
          setLastStatusChange(Date.now());
        }
      } else if (saveStatus === 'saving' || saveStatus === 'error') {
        setSaveStatus('saved');
        setLastStatusChange(Date.now());
      }
    };

    const interval = setInterval(checkStatus, 1000); // Check every second for better responsiveness
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [isOnline, mapId, saveStatus]);

  // Auto-hide after success with reasonable timeout
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timeout = setTimeout(() => {
        setSaveStatus('idle');
        setLastStatusChange(Date.now());
      }, 4000); // 4 seconds for better visibility
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const getStatusInfo = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: Loader2,
          label: pendingCount > 1 ? `Salvando ${pendingCount} itens...` : 'Salvando...',
          color: 'text-cyan-400',
          animateSpin: true,
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/20',
        };
      case 'saved':
        return {
          icon: CheckCircle2,
          label: 'Salvo com sucesso',
          color: 'text-emerald-400',
          animateSpin: false,
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: errorMessage || 'Erro ao salvar',
          color: 'text-red-400',
          animateSpin: false,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Offline - salvando localmente',
          color: 'text-amber-400',
          animateSpin: false,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
        };
      case 'idle':
      default:
        return {
          icon: Cloud,
          label: 'Pronto',
          color: 'text-slate-400',
          animateSpin: false,
          bgColor: 'bg-white/[0.04]',
          borderColor: 'border-white/[0.08]',
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <AnimatePresence mode="wait">
      {saveStatus !== 'idle' && (
        <motion.div
          key={saveStatus}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bgColor} border ${status.borderColor}`}
          role="status"
          aria-live="polite"
          aria-label={status.label}
        >
          {status.animateSpin ? (
            <Icon className={`w-3.5 h-3.5 ${status.color} animate-spin`} />
          ) : (
            <Icon className={`w-3.5 h-3.5 ${status.color}`} />
          )}
          <span className="text-[11px] font-medium text-slate-300">{status.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
