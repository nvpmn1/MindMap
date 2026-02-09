import { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  url?: string | null;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Robust user avatar component with proper fallback handling
 * - Tries to load avatar image
 * - Falls back to initial letter on error
 * - Falls back to User icon if no name available
 */
export function UserAvatar({
  url,
  displayName = 'U',
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const iconSizes = {
    sm: 4,
    md: 4,
    lg: 6,
  };

  const initial = displayName?.charAt(0)?.toUpperCase() || 'U';
  const showImage = !imageError && url;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden
        bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-white/[0.15]
        ${className}
      `}
    >
      {showImage && (
        <img
          src={url}
          alt={displayName}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            console.warn(`Avatar image failed to load: ${url}`);
            setImageError(true);
            setImageLoading(false);
          }}
          style={{
            display: imageLoading ? 'none' : 'block',
          }}
        />
      )}

      {imageError && (
        <span
          className={`
            font-bold text-white
            ${textSizeClasses[size]}
          `}
        >
          {initial}
        </span>
      )}

      {!url && <User className="text-slate-500" width={iconSizes[size]} height={iconSizes[size]} />}
    </div>
  );
}
