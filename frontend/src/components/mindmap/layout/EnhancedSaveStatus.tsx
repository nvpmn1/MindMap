/**
 * Enhanced Save Status Indicator Component
 * ============================================================================
 * Real-time visual feedback for the queue-based save system
 * Shows queue length, retry status, and last successful save time
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Loader2, AlertCircle, Check, Clock } from 'lucide-react';
import type { SaveStatus } from '@/lib/advanced-save-queue';

interface EnhancedSaveStatusProps {
  status: SaveStatus;
  lastSaved: Date | null;
  showDetails?: boolean;
}

export const EnhancedSaveStatus: React.FC<EnhancedSaveStatusProps> = ({
  status,
  lastSaved,
  showDetails = true,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update "time ago" text
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo('Nunca');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();

      if (diff < 1000) {
        setTimeAgo('Agora');
      } else if (diff < 60000) {
        setTimeAgo(`${Math.floor(diff / 1000)}s atrás`);
      } else if (diff < 3600000) {
        setTimeAgo(`${Math.floor(diff / 60000)}m atrás`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600000)}h atrás`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Determine status icon and color
  const getStatusDisplay = () => {
    if (status.isSaving) {
      return {
        icon: Loader2,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        label: 'Salvando...',
      };
    }

    if (status.queueLength > 0) {
      if (status.activeRetries > 0 && status.failedOperations.length > 0) {
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: `${status.failedOperations.length} erro(s) na fila`,
        };
      }
      return {
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        label: `${status.queueLength} operação(ões) na fila`,
      };
    }

    return {
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      label: 'Tudo sincronizado',
    };
  };

  const display = getStatusDisplay();
  const StatusIcon = display.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Main Status Indicator */}
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 ${display.bgColor}`}
        animate={{
          opacity: status.isSaving ? [0.8, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: status.isSaving ? Infinity : 0,
        }}
      >
        <StatusIcon
          className={`w-4 h-4 ${display.color} ${status.isSaving ? 'animate-spin' : ''}`}
        />
        <span className={`text-xs font-medium ${display.color}`}>{display.label}</span>
        <span className="text-xs text-gray-500">{timeAgo}</span>
      </motion.div>

      {/* Details Popover */}
      <AnimatePresence>
        {showDetails && status.queueLength > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs w-48 z-50"
          >
            <div className="font-semibold mb-2 text-gray-900">Fila de Salvamento</div>

            {/* Operation breakdown */}
            <div className="space-y-1 mb-2 pb-2 border-b border-gray-200">
              {Object.entries(status.pendingByType).map(([type, count]) => {
                if (count === 0) return null;
                return (
                  <div key={type} className="flex justify-between text-gray-600">
                    <span className="capitalize">{type.replace('-', ' ')}:</span>
                    <span className="font-mono">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Retry info */}
            {status.activeRetries > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                <div className="flex items-center gap-1 text-amber-700">
                  <AlertCircle className="w-3 h-3" />
                  <span>{status.activeRetries} operação(ões) com retry</span>
                </div>
              </div>
            )}

            {/* Failed operations */}
            {status.failedOperations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-center gap-1 text-red-700 mb-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{status.failedOperations.length} erro(s)</span>
                </div>
                <div className="text-xs text-red-600 max-h-20 overflow-y-auto">
                  {status.failedOperations.map((op) => (
                    <div key={op.id} className="mb-1">
                      <div className="font-mono text-gray-700">{op.type}</div>
                      {op.lastError && <div className="italic">{op.lastError}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Minimal inline save indicator (for headers, etc)
 */
export const MinimalSaveIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
  if (status.isSaving) {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-4 h-4"
      >
        <Loader2 className="w-4 h-4 text-blue-500" />
      </motion.div>
    );
  }

  if (status.queueLength > 0) {
    return <Clock className="w-4 h-4 text-amber-500" />;
  }

  if (status.failedOperations.length > 0) {
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  }

  return <Check className="w-4 h-4 text-green-500" />;
};
