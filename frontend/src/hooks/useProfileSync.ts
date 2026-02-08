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
    const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(url);
    const isValidHttpUrl = url.startsWith('http://') || url.startsWith('https://');
    return isValidDataUrl || isValidHttpUrl;
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
      // Validate current state
      if (!validateAvatarUrl(user.avatar_url)) {
        console.warn('Invalid avatar URL detected, clearing from profile cache');
        const cleanedUser = { ...user, avatar_url: null };
        loginWithProfile(cleanedUser);
        return;
      }

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
