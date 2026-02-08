/**
 * Avatar Fallback System
 * Generates fallback avatars when images fail to load
 */

export interface AvatarFallbackOptions {
  name?: string | null;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Generate a color palette from a name or fixed color
 */
export function getAvatarColor(name?: string | null, color?: string | null): string {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  // Default color palette if no valid color provided
  const colors = ['#06E5FF', '#06FFD0', '#0D99FF', '#FF006E', '#FFBE0B', '#8338EC'];

  if (!name) {
    return colors[0];
  }

  // Generate color based on name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

/**
 * Generate SVG avatar with initials
 */
export function generateAvatarSvg(
  name?: string | null,
  color?: string | null,
  size: number = 200
): string {
  const initial = (name || '?').charAt(0).toUpperCase();
  const bgColor = getAvatarColor(name, color);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${adjustBrightness(bgColor, -20)};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#grad)" />
      <text
        x="${size / 2}"
        y="${size / 2}"
        font-size="${size * 0.6}"
        font-weight="bold"
        text-anchor="middle"
        dy=".3em"
        fill="white"
        font-family="system-ui, -apple-system, sans-serif"
      >
        ${initial}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

/**
 * Adjust brightness of hex color
 */
function adjustBrightness(hexColor: string, percent: number): string {
  const hex = hexColor.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

/**
 * Create fallback avatar data URL
 * Can be used as src attribute fallback
 */
export function createFallbackAvatarUrl(
  options: AvatarFallbackOptions
): string {
  return generateAvatarSvg(options.name, options.color);
}

/**
 * Cache for generated fallback avatars to avoid regeneration
 */
const avatarCache = new Map<string, string>();

/**
 * Get or create fallback avatar (cached)
 */
export function getFallbackAvatarUrl(
  name?: string | null,
  color?: string | null
): string {
  const cacheKey = `${name || 'unnamed'}_${color || 'default'}`;

  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }

  const url = generateAvatarSvg(name, color);
  avatarCache.set(cacheKey, url);
  return url;
}

/**
 * Validate if avatar URL is actually valid
 */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(url);
  const isValidHttpUrl = url.startsWith('http://') || url.startsWith('https://');

  return isValidDataUrl || isValidHttpUrl;
}
