/**
 * Overlay Manager Utility
 * Prevents stray overlays/modals from getting stuck on navigation
 * Ensures proper cleanup of fixed position elements
 */

type OverlayType = 'modal' | 'menu' | 'dropdown' | 'tooltip' | 'factory-reset';

class OverlayManager {
  private activeOverlays = new Set<string>();
  private lastPathname = '';

  constructor() {
    // Monitor route changes
    window.addEventListener('popstate', () => this.handleNavigationChange());
  }

  /**
   * Track when an overlay is mounted
   */
  registerOverlay(id: string, type: OverlayType): void {
    this.activeOverlays.add(`${type}:${id}`);
    console.log(`[OverlayManager] Registered ${type}:${id}`, {
      total: this.activeOverlays.size,
    });
  }

  /**
   * Untrack when an overlay is unmounted
   */
  unregisterOverlay(id: string, type: OverlayType): void {
    this.activeOverlays.delete(`${type}:${id}`);
    console.log(`[OverlayManager] Unregistered ${type}:${id}`, {
      total: this.activeOverlays.size,
    });
  }

  /**
   * Handle navigation - clean up all active overlays
   */
  handleNavigationChange(): void {
    const currentPathname = window.location.pathname;
    if (currentPathname !== this.lastPathname) {
      console.log('[OverlayManager] Route changed, cleaning up overlays');
      this.cleanupAllOverlays();
      this.lastPathname = currentPathname;
    }
  }

  /**
   * Emergency cleanup - remove all stray overlays
   */
  cleanupAllOverlays(): void {
    // Remove stray overlay divs
    document.querySelectorAll('[data-overlay]').forEach((el) => {
      // Only remove if it looks like a stray overlay (completely transparent or hidden)
      const style = window.getComputedStyle(el);
      const isStray = style.display === 'none' || style.pointerEvents === 'none';

      if (isStray) {
        console.log('[OverlayManager] Removing stray overlay:', el.getAttribute('data-overlay'));
        el.remove();
        return;
      }

      // Also remove any overlay that's been here for more than 30s without user interaction
      const createdAt = (el as any).__createdAt || Date.now();
      if (Date.now() - createdAt > 30000) {
        console.log('[OverlayManager] Removing old overlay:', el.getAttribute('data-overlay'));
        el.remove();
      }
    });

    // Restore body scroll in case it got stuck
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
      console.log('[OverlayManager] Restored body scroll');
    }

    // Clear active overlays if they're all gone
    if (document.querySelectorAll('[data-overlay]').length === 0) {
      this.activeOverlays.clear();
    }
  }

  /**
   * Force close all overlays (nuclear option)
   */
  forceCloseAll(): void {
    console.warn('[OverlayManager] Force closing ALL overlays');

    // Remove all overlay elements
    document.querySelectorAll('[data-overlay]').forEach((el) => {
      el.remove();
    });

    // Restore body state
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Clear tracking
    this.activeOverlays.clear();
  }

  /**
   * Get current overlay status
   */
  getStatus(): {
    activeCount: number;
    overlays: string[];
    bodyOverflow: string;
    domOverlays: number;
  } {
    const domOverlays = document.querySelectorAll('[data-overlay]').length;
    return {
      activeCount: this.activeOverlays.size,
      overlays: Array.from(this.activeOverlays),
      bodyOverflow: document.body.style.overflow || 'auto',
      domOverlays,
    };
  }
}

// Singleton instance
export const overlayManager = new OverlayManager();

/**
 * Hook for managing overlay lifecycle
 */
export function useOverlayManager(id: string, type: OverlayType = 'modal') {
  React.useEffect(() => {
    overlayManager.registerOverlay(id, type);

    return () => {
      overlayManager.unregisterOverlay(id, type);
    };
  }, [id, type]);
}

// Make available globally in development
if (import.meta.env.DEV) {
  (window as any).overlayManager = overlayManager;
  console.log('[OverlayManager] Available as window.overlayManager');
}

export default overlayManager;

import React from 'react';
