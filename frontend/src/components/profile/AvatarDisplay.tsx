import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { getFallbackAvatarUrl, isValidAvatarUrl } from '@/lib/avatarFallback';

interface AvatarDisplayProps {
  src?: string | null;
  name?: string | null;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showInitial?: boolean;
  onError?: () => void;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-24 h-24',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-10 h-10',
};

/**
 * Reusable avatar component with fallback handling
 * Shows image if valid, otherwise shows generated fallback or icon
 */
export function AvatarDisplay({
  src,
  name,
  color,
  size = 'md',
  className,
  showInitial = true,
  onError,
}: AvatarDisplayProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(!!src && isValidAvatarUrl(src));
  const [imageError, setImageError] = useState(false);

  // Generate fallback avatar URL (cached)
  const fallbackUrl = useMemo(() => {
    return getFallbackAvatarUrl(name, color);
  }, [name, color]);

  const handleImageError = () => {
    console.warn(`Avatar failed to load for user: ${name}`);
    setImageError(true);
    setIsImageLoaded(false);
    onError?.();
  };

  const getInitial = () => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Determine which image to show
  const imageToShow = imageError || !src || !isValidAvatarUrl(src) ? fallbackUrl : src;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color || '#06E5FF'}20, ${color || '#8338EC'}15)`,
      }}
    >
      {/* Image */}
      <img
        src={imageToShow}
        alt={name || 'Avatar'}
        className="w-full h-full object-cover"
        onLoad={() => setIsImageLoaded(true)}
        onError={handleImageError}
        style={!isImageLoaded ? { display: 'none' } : undefined}
      />

      {/* Fallback - show initial or icon only while loading */}
      {!isImageLoaded && (
        <div className="flex items-center justify-center w-full h-full">
          {showInitial && (name || !src) ? (
            <span className="text-sm font-semibold text-slate-300">
              {getInitial()}
            </span>
          ) : (
            <User className={cn('text-slate-400', iconSizes[size])} />
          )}
        </div>
      )}
    </div>
  );
}
