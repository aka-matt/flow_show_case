import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

export const GenericNode = memo(function GenericNode({ data, selected }: NodeProps) {
  return (
    <div className={`generic-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-title">{String(data['label'] ?? 'Unknown')}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

export const nodeTypes = {
  generic: GenericNode,
  service: GenericNode,
  database: GenericNode,
  queue: GenericNode,
  client: GenericNode,
  group: GenericNode,
};
