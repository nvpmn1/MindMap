import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NodeCardShellProps {
  selected: boolean;
  isHovered: boolean;
  glowColor: string;
  borderClass: string;
  backgroundClass: string;
  onDoubleClick?: () => void;
  aiGenerated?: boolean;
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
}

export function NodeCardShell({
  selected,
  isHovered,
  glowColor,
  borderClass,
  backgroundClass,
  onDoubleClick,
  aiGenerated,
  header,
  body,
  footer,
  actions,
}: NodeCardShellProps) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className="relative"
    >
      <AnimatePresence>
        {(selected || isHovered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute -inset-2 rounded-[24px] blur-2xl"
            style={{ backgroundColor: glowColor }}
          />
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ y: -3 }}
        onDoubleClick={onDoubleClick}
        className={cn(
          'relative min-w-[220px] max-w-[320px] rounded-2xl border-2 transition-all duration-200',
          'bg-[#0B1220]/95 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]',
          borderClass,
          backgroundClass,
          aiGenerated && 'ring-2 ring-cyan-500/40 ring-offset-2 ring-offset-[#080C14]'
        )}
      >
        {header}
        {body}
        {footer}

        {actions && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute -bottom-11 left-1/2 -translate-x-1/2"
              >
                {actions}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
