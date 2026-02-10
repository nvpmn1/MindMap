/**
 * Debug utilities for the advanced save queue
 * Use these to diagnose save system issues
 */

import { advancedSaveQueue } from './advanced-save-queue';

export const queueDebug = {
  /**
   * Get current queue status
   */
  getStatus() {
    const status = advancedSaveQueue.getStatus();
    console.log('=== QUEUE STATUS ===');
    console.log(`Queue length: ${status.queueLength}`);
    console.log(`Active retries: ${status.activeRetries}`);
    console.log(`Is saving: ${status.isSaving}`);
    console.log(
      `Last successful save: ${status.lastSuccessfulSave ? new Date(status.lastSuccessfulSave).toLocaleTimeString() : 'Never'}`
    );
    console.log('Pending by type:', status.pendingByType);
    if (status.failedOperations.length > 0) {
      console.warn(
        `Failed operations (${status.failedOperations.length}):`,
        status.failedOperations
      );
    }
    return status;
  },

  /**
   * Force immediate sync
   */
  async forceSync() {
    console.log('[QueueDebug] Forcing queue sync...');
    try {
      await advancedSaveQueue.forceSync();
      console.log('[QueueDebug] Sync completed');
      this.getStatus();
    } catch (err) {
      console.error('[QueueDebug] Sync failed:', err);
    }
  },

  /**
   * Clear the queue (only for development/testing)
   */
  clearQueue() {
    if (confirm('🚨 This will clear ALL pending save operations. Are you sure?')) {
      console.warn('[QueueDebug] Clearing queue...');
      advancedSaveQueue.clear();
      console.log('[QueueDebug] Queue cleared');
      this.getStatus();
    }
  },

  /**
   * Log queue diagnostics
   */
  diagnose() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║       MINDMAP SAVE QUEUE DIAGNOSTICS                  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    const status = advancedSaveQueue.getStatus();

    // Queue Health
    console.log('\n📊 QUEUE HEALTH:');
    console.log(`  Queue length: ${status.queueLength} operations`);
    console.log(`  Is processing: ${status.isSaving}`);
    console.log(`  Active retries: ${status.activeRetries}`);

    // Operation Types
    console.log('\n📋 OPERATION BREAKDOWN:');
    let totalOps = 0;
    for (const [type, count] of Object.entries(status.pendingByType)) {
      if (count > 0) {
        console.log(`  ${type}: ${count}`);
        totalOps += count;
      }
    }
    if (totalOps === 0) {
      console.log('  ✅ Queue is empty - all changes saved!');
    }

    // Last Save Status
    console.log('\n🕐 SAVE HISTORY:');
    if (status.lastSuccessfulSave) {
      const lastSaveDate = new Date(status.lastSuccessfulSave);
      const secondsAgo = Math.floor((Date.now() - status.lastSuccessfulSave) / 1000);
      console.log(`  Last sync: ${secondsAgo}s ago (${lastSaveDate.toLocaleTimeString()})`);
    } else {
      console.log('  Last sync: Never');
    }

    // Failed Operations
    if (status.failedOperations.length > 0) {
      console.log(`\n⚠️  FAILED OPERATIONS (${status.failedOperations.length}):`);
      status.failedOperations.forEach((op, i) => {
        console.log(`  ${i + 1}. [${op.type}] Map: ${op.mapId}`);
        console.log(`     Error: ${op.lastError}`);
        console.log(`     Retries: ${op.retries}/${op.maxRetries}`);
      });
    }

    console.log('');
    console.log('💡 QUICK COMMANDS:');
    console.log('  queueDebug.getStatus()   - Get current queue status');
    console.log("  queueDebug.forceSync()   - Force immediate sync (don't wait for interval)");
    console.log(
      '  queueDebug.clearQueue()  - Clear all pending operations (⚠️  will lose unsaved data)'
    );
    console.log('  queueDebug.diagnose()    - Show this diagnostic report');
    console.log('');
  },

  /**
   * Make available globally for browser console
   */
  bindToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).queueDebug = this;
      console.log(
        '✅ Queue debug utilities available as window.queueDebug - Try: queueDebug.diagnose()'
      );
    }
  },
};

// Auto-bind if in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    queueDebug.bindToWindow();
  }, 1000);
}

export default queueDebug;
