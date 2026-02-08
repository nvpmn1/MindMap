/**
 * Realistic Avatar Generator
 * Generates beautiful, realistic humanoid avatars using DiceBear API
 */

interface AvatarOptions {
  seed: string;
  style?: 'avataaars' | 'adventurer' | 'big-ears' | 'open-peeps' | 'micah';
  size?: number;
  scale?: number;
  seed_variant?: string;
}

/**
 * Generate a realistic humanoid avatar URL
 * Uses DiceBear API with avataaars style for best appearance
 */
export function generateRealisticAvatarUrl(options: AvatarOptions): string {
  const {
    seed,
    style = 'avataaars',
    size = 256,
    scale = 80,
  } = options;

  // Build DiceBear API URL with parameters for variety
  const params = new URLSearchParams({
    seed: seed,
    size: size.toString(),
    scale: scale.toString(),
    // Add randomization for more variety
    backgroundColor: generateRandomBackground(),
  });

  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
}

/**
 * Generate random background color for variety
 */
function generateRandomBackground(): string {
  const backgrounds = [
    'c0aede',
    'ffd4a3',
    'd2f0f0',
    'f3d5dc',
    'e0d8f3',
    'fce8e8',
    'd5f0ff',
    'fffec8',
  ];
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

/**
 * Generate avatar URLs for team members
 */
export function generateTeamAvatars() {
  return {
    guilherme: generateRealisticAvatarUrl({
      seed: 'guilherme-lead',
      style: 'avataaars',
      scale: 85,
    }),
    helen: generateRealisticAvatarUrl({
      seed: 'helen-coordinator',
      style: 'avataaars',
      scale: 82,
    }),
    pablo: generateRealisticAvatarUrl({
      seed: 'pablo-security',
      style: 'avataaars',
      scale: 88,
    }),
  };
}

/**
 * Avatar styles available
 */
export const AVATAR_STYLES = [
  'avataaars',
  'adventurer',
  'big-ears',
  'open-peeps',
  'micah',
] as const;
