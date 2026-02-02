import { ReactNode, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue' | 'none';
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const GRADIENTS = {
  cyan: {
    border: 'from-cyan-500/50 via-transparent to-cyan-500/50',
    glow: 'rgba(0, 217, 255, 0.15)',
    accent: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
  },
  purple: {
    border: 'from-purple-500/50 via-transparent to-purple-500/50',
    glow: 'rgba(167, 139, 250, 0.15)',
    accent: 'bg-gradient-to-r from-purple-500 to-purple-400',
  },
  emerald: {
    border: 'from-emerald-500/50 via-transparent to-emerald-500/50',
    glow: 'rgba(52, 211, 153, 0.15)',
    accent: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  },
  amber: {
    border: 'from-amber-500/50 via-transparent to-amber-500/50',
    glow: 'rgba(251, 191, 36, 0.15)',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-400',
  },
  rose: {
    border: 'from-rose-500/50 via-transparent to-rose-500/50',
    glow: 'rgba(244, 63, 94, 0.15)',
    accent: 'bg-gradient-to-r from-rose-500 to-rose-400',
  },
  blue: {
    border: 'from-blue-500/50 via-transparent to-blue-500/50',
    glow: 'rgba(59, 130, 246, 0.15)',
    accent: 'bg-gradient-to-r from-blue-500 to-blue-400',
  },
  none: {
    border: 'from-slate-500/20 via-transparent to-slate-500/20',
    glow: 'transparent',
    accent: 'bg-slate-700',
  },
};

export function GlassCard({ 
  children, 
  className, 
  gradient = 'none',
  hover = true,
  glow = false,
  onClick,
}: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const style = GRADIENTS[gradient];

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Glow Effect */}
      {glow && (
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-1 rounded-xl blur-xl"
              style={{ backgroundColor: style.glow }}
            />
          )}
        </AnimatePresence>
      )}

      {/* Animated Border */}
      <div className="absolute inset-0 rounded-xl p-px">
        <motion.div
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-r",
            style.border
          )}
        />
      </div>

      {/* Content */}
      <div className="relative bg-[#0D1520]/90 backdrop-blur-xl rounded-xl border border-slate-800/50 h-full">
        {children}
      </div>
    </motion.div>
  );
}

// 3D Tilt Card
interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      className={cn("relative", className)}
    >
      <div style={{ transform: 'translateZ(75px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </motion.div>
  );
}

// Stats Card
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isUp: boolean };
  gradient?: GlassCardProps['gradient'];
  className?: string;
}

export function StatsCard({ title, value, icon, trend, gradient = 'cyan', className }: StatsCardProps) {
  return (
    <GlassCard gradient={gradient} glow hover className={className}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold text-white"
            >
              {value}
            </motion.p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs",
                trend.isUp ? "text-emerald-400" : "text-rose-400"
              )}>
                <span>{trend.isUp ? '↑' : '↓'}</span>
                <span>{trend.value}% este mês</span>
              </div>
            )}
          </div>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className={cn(
              "p-3 rounded-xl",
              GRADIENTS[gradient].accent
            )}
          >
            {icon}
          </motion.div>
        </div>
      </div>
    </GlassCard>
  );
}

// Map Card
interface MapCardProps {
  id: string;
  title: string;
  description?: string;
  nodes: number;
  lastEdited: string;
  collaborators: Array<{ name: string; color: string }>;
  thumbnail?: string;
  status?: 'active' | 'draft' | 'archived';
  onClick?: () => void;
}

export function MapCard({ 
  id, 
  title, 
  description, 
  nodes, 
  lastEdited, 
  collaborators,
  thumbnail,
  status = 'active',
  onClick,
}: MapCardProps) {
  const statusColors = {
    active: 'bg-emerald-500',
    draft: 'bg-amber-500',
    archived: 'bg-slate-500',
  };

  return (
    <GlassCard 
      gradient="cyan" 
      glow 
      hover
      onClick={onClick}
      className="group"
    >
      {/* Thumbnail */}
      <div className="relative h-32 overflow-hidden rounded-t-xl">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center"
            >
              <div className="w-3 h-3 bg-cyan-500 rounded-full" />
            </motion.div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
          <div className={cn("w-1.5 h-1.5 rounded-full", statusColors[status])} />
          <span className="text-[10px] text-white capitalize">{status}</span>
        </div>

        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-[#0D1520] via-transparent to-transparent"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-cyan-500 rounded-full" />
              {nodes} nós
            </span>
            <span>{lastEdited}</span>
          </div>

          {/* Collaborators */}
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((collab, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -2, zIndex: 10 }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0D1520] relative"
                style={{
                  backgroundColor: `${collab.color}30`,
                  color: collab.color,
                }}
                title={collab.name}
              >
                {collab.name[0]}
              </motion.div>
            ))}
            {collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 border-2 border-[#0D1520]">
                +{collaborators.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Feature Card
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient?: GlassCardProps['gradient'];
  badge?: string;
}

export function FeatureCard({ icon, title, description, gradient = 'cyan', badge }: FeatureCardProps) {
  return (
    <GlassCard gradient={gradient} glow hover>
      <div className="p-6">
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-cyan-500/20 text-cyan-400 rounded-full mb-3 inline-block">
            {badge}
          </span>
        )}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            GRADIENTS[gradient].accent
          )}
        >
          {icon}
        </motion.div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </GlassCard>
  );
}

// Action Card
interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  gradient?: GlassCardProps['gradient'];
  size?: 'sm' | 'md' | 'lg';
}

export function ActionCard({ icon, title, description, onClick, gradient = 'cyan', size = 'md' }: ActionCardProps) {
  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <GlassCard gradient={gradient} glow hover onClick={onClick}>
      <div className={cn("flex items-center gap-3", sizes[size])}>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={cn(
            "flex-shrink-0 rounded-lg flex items-center justify-center",
            size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12',
            GRADIENTS[gradient].accent
          )}
        >
          {icon}
        </motion.div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{title}</h4>
          {description && (
            <p className="text-xs text-slate-500 truncate">{description}</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// Loading Card
export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-[#0D1520] border border-slate-800/50 overflow-hidden", className)}>
      <div className="h-32 bg-slate-800/50 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-800/50 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-800/50 rounded animate-pulse w-1/2" />
        <div className="flex gap-2 pt-2">
          <div className="w-6 h-6 bg-slate-800/50 rounded-full animate-pulse" />
          <div className="w-6 h-6 bg-slate-800/50 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
