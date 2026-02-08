/**
 * Mock User Database with Avatar Preferences
 * This stores the avatar choices made by users in Settings
 */

import { AvatarOption, findAvatarById } from './avatarLibrary';

export interface StoredUserProfile {
  id: string;
  name: string;
  email: string;
  color: string;
  description?: string;
  avatar_id?: string;
  avatar_url?: string;
}

/**
 * Default avatars for demo users (saved from Settings)
 * These can be updated when users change their avatars in Settings
 */
export const DEFAULT_USER_PROFILES: Record<string, StoredUserProfile> = {
  guilherme: {
    id: 'f7a2d3b1-6b1f-4e0e-8a2b-1f3e2d4c5b6a',
    name: 'Guilherme',
    email: 'guilherme@mindmap.app',
    color: '#06E5FF',
    description: 'Research Lead',
    avatar_id: 'game-valorant', // Default chosen avatar
    avatar_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IiMwRjFlMjgiLz48Y2lyY2xlIGN4PSIxMjgiIGN5PSIxMjgiIHI9IjYwIiBmaWxsPSIjRkYwMDAwIi8+PHBhdGggZD0iTTEyOCA4MCBMODAgMTI4IEwxMjggMTc2IEwxNzYgMTI4IFoxMjggODBaIiBmaWxsPSIjMDYxMTI4Ii8+PC9zdmc+',
  },
  helen: {
    id: '3b9c1f8a-2a1f-4c4f-9d3b-7c6a5e4d3f2b',
    name: 'Helen',
    email: 'helen@mindmap.app',
    color: '#06FFD0',
    description: 'Team Coordinator',
    avatar_id: 'budpok-panda',
    avatar_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IiNGRkY4RDciLz48Y2lyY2xlIGN4PSI2NSIgY3k9IjY1IiByPSIyNSIgZmlsbD0iIzAwMDAwMCIvPjxjaXJjbGUgY3g9IjE5MCIgY3k9IjY1IiByPSIyNSIgZmlsbD0iIzAwMDAwMCIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9IjEzMCIgcj0iNDUiIGZpbGw9IiNGRkZGRkYiLz48Y2lyY2xlIGN4PSIxMDUiIGN5PSIxMzAiIHI9IjI1IiBmaWxsPSIjMDAwMDAwIi8+PGNpcmNsZSBjeD0iMTUxIiBjeT0iMTMwIiByPSIyNSIgZmlsbD0iIzAwMDAwMCIvPjwvc3ZnPg==',
  },
  pablo: {
    id: '9c2b7d4a-1f3e-4b6a-8d2c-5e1f9a0b7c6d',
    name: 'Pablo',
    email: 'pablo@mindmap.app',
    color: '#0D99FF',
    description: 'Security Specialist',
    avatar_id: 'logo-github',
    avatar_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IiMyNDI4MjQiLz48cGF0aCBkPSJNMTI4IDQwQzc2LjEyODI0IDQwIDMyIDg0LjEyODI0IDMyIDEzNkMzMiAxODIuMjEwMDMgNjcuMDQ0NzMgMjIwLjM2MzQyIDEwNC4wNDQ2MyAyMzYuNjJDMTExLjQyMzEyIDI0MC4xNTkxNiAxMDMuMjM3MzEgMjI3LjI5NzA0IDEwMy4yMzczMSAyMjQuMzhWMjA1LjE5MzA5QzEwMS4zNTc1OCAyMDUuODEzODYgOTkuMzAwMzMyIDIwNi4xMzE3NyA5Ny4xMjM3NzMgMjA2LjEzMTc3QzY5LjA5NDMyMiAyMDYuMTMxNzcgNjAgMTkxLjc2MTU3IDYwIDE2Ny4wMjQxNEM2MCAxNTMuMzg5ODIgNjcuMDk0MzIyIDE0MS42MjczMSA3Ny4yMDE3MzMgMTM4LjIzNDMzQzcgMTE2LjI5MjczIDczLjE0MDQwMiAxMDEuNTAxNDggODIuNzE0MzA5IDEwMC43OTUwNDNDOTAuODk5ODcgMTAwLjE3NzEgOTguMTA5MTM4IDEwMS45ODA4OCA5OC4xMDkxMzggMTAxLjk4MDg4TDk4LjQzNDk3IDg4LjMxOTA0OEM5My43MjI4ODEgODcuNDk3MzE5IDg1LjAzNDQ1NyA4Ni4zMTExMzEgNzAuNjU0NzA1IDg2LjMxMTEzMUM0OC42MDMxNjkgODYuMzExMTMxIDQwIDEwMy4zMzExMjMgNDAgMTM2QzQwIDE3Mi4xOTk5MyA3Ni4xMjgyNCAyMDggMTI4IDIwOEMxNzkuODcxNzYgMjA4IDIxNiAxNzIuMTk5OTMgMjE2IDEzNkMyMTYgODQuMTI4MjQgMTcxLjg3MTc2IDQwIDEyOCA0MFoiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4=',
  },
};

/**
 * Get user profile by key (name or email)
 */
export function getUserProfile(key: string): StoredUserProfile | undefined {
  return DEFAULT_USER_PROFILES[key.toLowerCase()];
}

/**
 * Get avatar URL for user
 */
export function getUserAvatarUrl(userKey: string): string | undefined {
  const user = getUserProfile(userKey);
  if (!user) return undefined;
  
  // Return saved avatar_url if available
  if (user.avatar_url) {
    return user.avatar_url;
  }
  
  // If avatar_id is set but URL isn't, look it up
  if (user.avatar_id) {
    const avatar = findAvatarById(user.avatar_id);
    if (avatar) {
      return avatar.url;
    }
  }
  
  // Fallback to a default
  return undefined;
}

/**
 * Update user avatar preference
 * (In real app, this would write to database)
 */
export function updateUserAvatar(
  userKey: string,
  avatarId: string,
  avatarUrl: string
): void {
  const user = getUserProfile(userKey);
  if (user) {
    DEFAULT_USER_PROFILES[userKey.toLowerCase()] = {
      ...user,
      avatar_id: avatarId,
      avatar_url: avatarUrl,
    };
    // In real app: POST to /api/users/userKey/avatar
    console.log(`[Avatar] Updated ${userKey} with avatar: ${avatarId}`);
  }
}

/**
 * Get all users with their avatar info
 * CRITICAL: This syncs with localStorage to ensure avatars updated in Settings appear in login
 */
export function getAllUserProfiles(): StoredUserProfile[] {
  // First, get the baseline from defaults
  let profiles = Object.values(DEFAULT_USER_PROFILES);
  
  // Then, sync with localStorage data - this is the source of truth for changes
  try {
    const savedUser = localStorage.getItem('mindmap_auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      
      // Find the matching profile and update it with the saved data
      profiles = profiles.map(profile => {
        if (profile.id === user.id) {
          return {
            ...profile,
            display_name: user.display_name || profile.name,
            avatar_url: user.avatar_url !== undefined ? user.avatar_url : profile.avatar_url,
          };
        }
        return profile;
      });
    }
  } catch (error) {
    console.error('⚠️ Failed to sync user profiles with localStorage:', error);
    // Fall back to defaults if localStorage read fails
  }
  
  return profiles;
}
