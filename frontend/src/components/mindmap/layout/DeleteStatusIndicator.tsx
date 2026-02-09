/**
 * Delete Status Indicator
 * Shows real-time feedback about delete status
 */

import React, { useEffect, useState } from 'react';
import { Trash2, Loader2, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { robustMapDelete } from '@/lib/robustMapDelete';

interface DeleteStatusIndicatorProps {
  compact?: boolean;
}

export const DeleteStatusIndicator: React.FC<DeleteStatusIndicatorProps> = ({
  compact = false,
}) => {
  const [deleteStatus, setDeleteStatus] = useState<
    'deleting' | 'deleted' | 'error' | 'offline' | 'idle'
  >('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[DeleteStatus] Back online');
      setIsOnline(true);
      if (pendingCount > 0) {
        setDeleteStatus('deleting');
        setTimeout(() => setDeleteStatus('deleted'), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[DeleteStatus] Went offline');
      setIsOnline(false);
      if (pendingCount > 0) {
        setDeleteStatus('offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount]);

  // Monitor pending deletes
  useEffect(() => {
    const checkStatus = () => {
      const count = robustMapDelete.getPendingCount();
      setPendingCount(count);

      if (!isOnline && count > 0) {
        setDeleteStatus('offline');
        return;
      }

      if (count > 0) {
        setDeleteStatus('deleting');
      } else {
        setDeleteStatus('deleted');
      }
    };

    const interval = setInterval(checkStatus, 2000);
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [isOnline]);

  // Auto-hide after success
  useEffect(() => {
    if (deleteStatus === 'deleted' && pendingCount === 0) {
      const timeout = setTimeout(() => {
        setDeleteStatus('idle');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [deleteStatus, pendingCount]);

  const getStatusInfo = () => {
    switch (deleteStatus) {
      case 'deleting':
        return {
          icon: Loader2,
          label: pendingCount > 1 ? `Deletando ${pendingCount}...` : 'Deletando...',
          color: 'text-amber-400',
          animateSpin: true,
        };
      case 'deleted':
        return {
          icon: CheckCircle2,
          label: 'Deletado com sucesso',
          color: 'text-emerald-400',
          animateSpin: false,
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Erro ao deletar',
          color: 'text-red-400',
          animateSpin: false,
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Offline - deletando depois',
          color: 'text-amber-400',
          animateSpin: false,
        };
      case 'idle':
      default:
        return {
          icon: Trash2,
          label: 'Pronto',
          color: 'text-slate-400',
          animateSpin: false,
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  if (compact && deleteStatus === 'idle') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {deleteStatus !== 'idle' && (
        <motion.div
          key={deleteStatus}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]"
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
