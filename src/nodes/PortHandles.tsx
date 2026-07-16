import React from 'react';
import { Handle, Position, type HandleProps } from '@xyflow/react';

export interface PortDef {
  id: string;
  type: 'source' | 'target';
  side?: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
  offset?: number;
}

const SIDE_TO_POSITION: Record<string, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

/**
 * Renders named React Flow Handles from architecture document ports.
 * Falls back to default left-target / right-source when no ports are defined,
 * so edges without sourceHandle/targetHandle still connect.
 */
export function PortHandles({ ports }: { ports?: PortDef[] | undefined }): React.ReactElement {
  if (!ports || ports.length === 0) {
    return (
      <>
        <Handle type="target" position={Position.Left} className="af-handle" />
        <Handle type="source" position={Position.Right} className="af-handle" />
      </>
    );
  }

  return (
    <>
      {ports.map((port) => {
        const defaultSide = port.type === 'target' ? 'left' : 'right';
        const side = port.side ?? defaultSide;
        const position = SIDE_TO_POSITION[side] ?? Position.Left;
        const handleProps: HandleProps = {
          id: port.id,
          type: port.type,
          position,
          className: 'af-handle',
        };
        if (typeof port.offset === 'number') {
          // offset is a percentage along the side (0–100)
          if (side === 'left' || side === 'right') {
            handleProps.style = { top: `${port.offset}%` };
          } else {
            handleProps.style = { left: `${port.offset}%` };
          }
        }
        if (port.label) {
          handleProps.title = port.label;
        }
        return <Handle key={port.id} {...handleProps} />;
      })}
    </>
  );
}
