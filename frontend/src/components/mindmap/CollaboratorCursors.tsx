import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { getInitials } from '@/lib/utils';

interface Collaborator {
  id: string;
  name: string;
  avatar_url?: string;
  color: string;
  cursor?: { x: number; y: number };
}

interface CollaboratorCursorsProps {
  collaborators: Map<string, Collaborator>;
}

export const CollaboratorCursors = memo(
  ({ collaborators }: CollaboratorCursorsProps) => {
    const collaboratorsList = useMemo(
      () => Array.from(collaborators.values()),
      [collaborators]
    );

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        <AnimatePresence>
          {collaboratorsList.map(
            (collaborator) =>
              collaborator.cursor && (
                <CollaboratorCursor
                  key={collaborator.id}
                  collaborator={collaborator}
                />
              )
          )}
        </AnimatePresence>
      </div>
    );
  }
);

CollaboratorCursors.displayName = 'CollaboratorCursors';

interface CollaboratorCursorProps {
  collaborator: Collaborator;
}

const CollaboratorCursor = memo(({ collaborator }: CollaboratorCursorProps) => {
  if (!collaborator.cursor) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: collaborator.cursor.x,
        y: collaborator.cursor.y,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 200,
        mass: 0.5,
      }}
      className="absolute top-0 left-0"
      style={{ transform: `translate(${collaborator.cursor.x}px, ${collaborator.cursor.y}px)` }}
    >
      {/* Cursor Arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.65376 12.4563L6.99573 10.5965L13.9966 4.24968L5.65376 12.4563Z"
          fill={collaborator.color}
        />
        <path
          d="M5.65376 12.4563L6.99573 10.5965L13.9966 4.24968L5.65376 12.4563Z"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.9966 4.24968L5.65376 12.4563L6.99573 10.5965L13.9966 4.24968Z"
          fill={collaborator.color}
        />
        <path
          d="M5.65376 12.4563L13.9966 4.24968"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.65376 12.4563L6.99573 17.3442L8.88795 13.0959L13.9966 4.24968"
          fill={collaborator.color}
        />
        <path
          d="M5.65376 12.4563L6.99573 17.3442L8.88795 13.0959L13.9966 4.24968"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-5 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full shadow-md whitespace-nowrap"
        style={{ backgroundColor: collaborator.color }}
      >
        <Avatar size="xs" className="border border-white/30">
          <AvatarImage src={collaborator.avatar_url} alt={collaborator.name} />
          <AvatarFallback
            className="text-[8px] text-white"
            style={{ backgroundColor: 'transparent' }}
          >
            {getInitials(collaborator.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-white">
          {collaborator.name.split(' ')[0]}
        </span>
      </motion.div>
    </motion.div>
  );
});

CollaboratorCursor.displayName = 'CollaboratorCursor';
