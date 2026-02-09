// ============================================================================
// Smart Connection Handles v2 - Clean & Invisible (Hover to Reveal)
// ============================================================================

import React, { memo, useState } from 'react';
import { Position, type HandleType, Handle } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ArrowRight } from 'lucide-react';

interface SmartHandleProps {
  position: Position;
  type: HandleType;
  nodeId: string;
  onStartConnection: (nodeId: string, position: string) => void;
  isVisible: boolean;
}

/**
 * Individual Smart Handle - appears only on hover
 */
const SmartHandleComponent: React.FC<SmartHandleProps> = ({
  position,
  type,
  nodeId,
  onStartConnection,
  isVisible,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSource = type === 'source';

  const baseColor = isSource ? '#10b981' : '#3b82f6';
  const hoverColor = isSource ? '#34d399' : '#60a5fa';
  const subtleColor = '#6b7280'; // Cinza discreto

  const handleClick = (e: React.MouseEvent) => {
    console.log('🔲 Handle clicked:', { nodeId, position, isSource });
    e.preventDefault();
    e.stopPropagation();
    onStartConnection(nodeId, position);
  };

  const positionStyles = {
    [Position.Top]: { top: '-22px', left: '50%', transform: 'translateX(-50%)' },
    [Position.Bottom]: { bottom: '-22px', left: '50%', transform: 'translateX(-50%)' },
    [Position.Left]: { left: '-22px', top: '50%', transform: 'translateY(-50%)' },
    [Position.Right]: { right: '-22px', top: '50%', transform: 'translateY(-50%)' },
  }[position];

  return (
    <>
      {/* React Flow Handle (invisible, for connections) */}
      <Handle
        type={type}
        position={position}
        id={`${nodeId}-${position.toLowerCase()}`}
        className="!opacity-0 !pointer-events-none"
        isConnectable={false}
      />

      {/* Visible Handle (only on hover) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute"
            style={positionStyles as any}
          >
            <motion.button
              className="w-6 h-6 rounded-full border flex items-center justify-center
                focus:outline-none cursor-pointer relative transition-opacity"
              style={{
                backgroundColor: isHovered ? `${baseColor}20` : `${subtleColor}08`,
                borderColor: isHovered ? baseColor : `${subtleColor}30`,
                borderWidth: isHovered ? 1.5 : 1,
                boxShadow: isHovered ? `0 0 12px ${baseColor}40` : 'none',
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClick}
              onMouseDown={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              type="button"
              title={isSource ? 'Clique para linkar de aqui' : 'Clique para conectar'}
            >
              <motion.div
                animate={isSource ? { rotate: 360 } : { scale: [1, 1.1, 1] }}
                transition={
                  isSource
                    ? { duration: 2, repeat: Infinity, ease: 'linear' }
                    : { duration: 1.5, repeat: Infinity, repeatDelay: 0.3 }
                }
                className="opacity-60"
              >
                {isSource ? (
                  <ArrowRight
                    size={14}
                    color={isHovered ? baseColor : subtleColor}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Link2 size={14} color={isHovered ? baseColor : subtleColor} strokeWidth={2.5} />
                )}
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SmartHandle = memo(SmartHandleComponent);

/**
 * Connection Handles Set - All 4 handles (invisible until hover)
 */
interface ConnectionHandlesSetProps {
  nodeId: string;
  onStartConnection: (nodeId: string, position: string) => void;
  allowedPositions?: Position[];
  isNodeHovered: boolean;
}

const ConnectionHandlesSetComponent: React.FC<ConnectionHandlesSetProps> = ({
  nodeId,
  onStartConnection,
  allowedPositions = [Position.Top, Position.Bottom, Position.Left, Position.Right],
  isNodeHovered,
}) => {
  return (
    <>
      {allowedPositions.includes(Position.Top) && (
        <SmartHandle
          position={Position.Top}
          type="target"
          nodeId={nodeId}
          onStartConnection={onStartConnection}
          isVisible={isNodeHovered}
        />
      )}
      {allowedPositions.includes(Position.Bottom) && (
        <SmartHandle
          position={Position.Bottom}
          type="source"
          nodeId={nodeId}
          onStartConnection={onStartConnection}
          isVisible={isNodeHovered}
        />
      )}
      {allowedPositions.includes(Position.Left) && (
        <SmartHandle
          position={Position.Left}
          type="target"
          nodeId={nodeId}
          onStartConnection={onStartConnection}
          isVisible={isNodeHovered}
        />
      )}
      {allowedPositions.includes(Position.Right) && (
        <SmartHandle
          position={Position.Right}
          type="source"
          nodeId={nodeId}
          onStartConnection={onStartConnection}
          isVisible={isNodeHovered}
        />
      )}
    </>
  );
};

export const ConnectionHandlesSet = memo(ConnectionHandlesSetComponent);
export default ConnectionHandlesSet;
