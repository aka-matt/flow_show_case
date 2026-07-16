import React from 'react';
import { type Node, type Edge } from '@xyflow/react';

interface ArchitectureFlowAppProps {
  nodes: Node[];
  edges: Edge[];
  options?: {
    interactive?: boolean;
    fitView?: boolean;
    showControls?: boolean;
    showBackground?: boolean;
    showMiniMap?: boolean;
  };
}

export function ArchitectureFlowApp({ nodes, edges, options }: ArchitectureFlowAppProps): React.ReactElement {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {options
        ? <FlowCanvas nodes={nodes} edges={edges} options={options} />
        : <FlowCanvas nodes={nodes} edges={edges} />
      }
    </div>
  );
}

// Lazy import to avoid circular deps
import { FlowCanvas } from './FlowCanvas.js';
