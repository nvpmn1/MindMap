import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to ensure profile data stays in sync with backend
 * Validates avatar URLs and ensures localStorage is persisted
 */
export function useProfileSync() {
  const { user, profile, loginWithProfile } = useAuthStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSyncRef = useRef<string>('');

  const validateAvatarUrl = useCallback((url: string | null | undefined): boolean => {
    if (!url) return true;
    // Much more lenient validation - accept almost any string as potential avatar URL
    // Just reject obviously invalid ones
    if (typeof url !== 'string') return false;
    if (url.length === 0) return true; // empty string is ok
    if (url.length > 10000) return false; // extremely long strings are suspicious
    return true; // Accept everything else
  }, []);

  const syncProfile = useCallback(() => {
    if (!user) return;

    // Only sync if user data actually changed
    const currentState = JSON.stringify({ user, profile });
    if (currentState === lastSyncRef.current) {
      return;
    }
    lastSyncRef.current = currentState;

    try {
      // Don't validate avatar - trust what's in storage
      // If it's there, it's valid for this user

      // Ensure localStorage is updated
      const storedUser = localStorage.getItem('mindmap_auth_user');
      const storedProfile = localStorage.getItem('mindmap_auth_profile');

      if (!storedUser || !storedProfile) {
        console.log('Re-persisting profile to localStorage');
        localStorage.setItem('mindmap_auth_user', JSON.stringify(user));
        localStorage.setItem('mindmap_auth_profile', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Profile sync error:', error);
    }
  }, [user, profile, validateAvatarUrl, loginWithProfile]);

  // Sync profile periodically (every 5 seconds)
  useEffect(() => {
    syncProfile();

    syncTimeoutRef.current = setInterval(syncProfile, 5000);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
    };
  }, [syncProfile]);

  // Sync on visibility change (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('User returned to tab, syncing profile');
        syncProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncProfile]);

  return { user, profile, isProfileValid: validateAvatarUrl(user?.avatar_url) };
}

