// ============================================================================
// NeuralMap - PowerEdge Component (Animated Neural Connections)
// ============================================================================

import React, { memo, useMemo } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps, type Edge } from '@xyflow/react';

interface PowerEdgeData {
  label?: string;
  style?: 'neural' | 'bezier' | 'straight' | 'step' | 'animated';
  strength?: number;
  animated?: boolean;
  color?: string;
  [key: string]: unknown;
}

const PowerEdgeComponent: React.FC<EdgeProps<Edge<PowerEdgeData>>> = ({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  selected,
  data,
  style: edgeStyle,
}) => {
  const color = data?.color || '#06b6d4';
  const strength = data?.strength || 1;
  const isAnimated = data?.animated !== false;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const pathLength = useMemo(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    return Math.sqrt(dx * dx + dy * dy);
  }, [sourceX, sourceY, targetX, targetY]);

  const particles = useMemo(() => {
    const count = Math.max(3, Math.min(8, Math.floor(pathLength / 60)));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: (i / count) * 3,
      duration: 2.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 2,
    }));
  }, [pathLength]);

  return (
    <g className="react-flow__edge-group">
      {/* Glow layer (behind) */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 6 : 4}
        strokeOpacity={selected ? 0.15 : 0.05}
        className="transition-all duration-300"
        style={{ filter: 'blur(4px)' }}
      />

      {/* Main edge path */}
      <path
        id={`edge-${id}`}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 2 : 1.5}
        strokeOpacity={selected ? 0.8 : 0.4}
        strokeLinecap="round"
        className="transition-all duration-300"
        style={{
          ...edgeStyle,
          filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
      />

      {/* Animated dash overlay */}
      {isAnimated && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.6}
          strokeDasharray="6 8"
          strokeLinecap="round"
          className="transition-all duration-300"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-28"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* Animated particles */}
      {isAnimated && particles.map((particle) => (
        <circle key={particle.id} r={particle.size} fill={color} opacity={0.7}>
          <animateMotion
            dur={`${particle.duration}s`}
            repeatCount="indefinite"
            begin={`${particle.delay}s`}
            path={edgePath}
          />
          <animate
            attributeName="opacity"
            values="0;0.8;0.8;0"
            dur={`${particle.duration}s`}
            repeatCount="indefinite"
            begin={`${particle.delay}s`}
          />
          <animate
            attributeName="r"
            values={`${particle.size * 0.5};${particle.size};${particle.size * 0.5}`}
            dur={`${particle.duration}s`}
            repeatCount="indefinite"
            begin={`${particle.delay}s`}
          />
        </circle>
      ))}

      {/* Connection pulse at source */}
      <circle cx={sourceX} cy={sourceY} r="2" fill={color} opacity={0.3}>
        <animate attributeName="r" values="2;6;2" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Edge label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-all px-2 py-0.5 rounded-md 
              bg-[#111827]/90 border border-white/10 text-[10px] text-slate-300
              backdrop-blur-sm shadow-lg"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
};

export const PowerEdge = memo(PowerEdgeComponent);
export default PowerEdge;
