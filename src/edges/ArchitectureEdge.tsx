import React, { memo } from 'react';
import {
  type EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
} from '@xyflow/react';

const STATUS_COLORS: Record<string, string> = {
  default: 'var(--af-color-edge)',
  healthy: 'var(--af-color-success)',
  warning: 'var(--af-color-warning)',
  error: 'var(--af-color-danger)',
  disabled: 'var(--af-color-disabled)',
};

export const ArchitectureEdge = memo(function ArchitectureEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  animated,
  type,
}: EdgeProps) {
  // Prefer smoothstep (schema default); support bezier/straight for explicit types
  const pathArgs = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };
  const [edgePath, labelX, labelY] =
    type === 'bezier'
      ? getBezierPath(pathArgs)
      : type === 'straight'
        ? (() => {
            const [p, x, y] = getStraightPath(pathArgs);
            return [p, x, y] as const;
          })()
        : getSmoothStepPath(pathArgs);

  const status = String(data?.['status'] ?? 'default');
  const color = selected ? 'var(--af-color-edge-active)' : STATUS_COLORS[status];
  const label = data?.['label'];
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      {animated && !reducedMotion && (
        <circle r="10" fill={color} opacity="0.4">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
        markerEnd={`url(#arrow-${id})`}
      />
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 12 6 L 0 12 z" fill={color} />
        </marker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="edge-label nodrag nopan"
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
