import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Avatar with presence indicator for real-time collaboration
interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string | null;
  name: string;
  email?: string;
  showPresence?: boolean;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

const presenceSizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

const UserAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  UserAvatarProps
>(({ className, src, name, showPresence = false, isOnline = false, size = 'md', ...props }, ref) => {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  
  return (
    <div className="relative inline-flex">
      <Avatar
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      >
        {src && <AvatarImage src={src} alt={name} />}
        <AvatarFallback className={cn(bgColor, 'text-white')}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showPresence && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            presenceSizeClasses[size],
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
});
UserAvatar.displayName = 'UserAvatar';

// Avatar group for showing multiple collaborators
interface AvatarGroupProps {
  users: Array<{
    id: string;
    name: string;
    avatar_url?: string | null;
    isOnline?: boolean;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showPresence?: boolean;
}

const AvatarGroup = ({ users, max = 4, size = 'md', showPresence = true }: AvatarGroupProps) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;
  
  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <UserAvatar
          key={user.id}
          name={user.name}
          src={user.avatar_url}
          isOnline={user.isOnline}
          showPresence={showPresence}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center rounded-full bg-muted ring-2 ring-background',
            sizeClasses[size]
          )}
        >
          <span className="text-muted-foreground">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, AvatarGroup };
