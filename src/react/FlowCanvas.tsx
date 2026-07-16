import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type ReactFlowProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '../nodes/nodeTypes.js';
import { edgeTypes } from '../edges/edgeTypes.js';

interface FlowCanvasProps {
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

export function FlowCanvas({ nodes, edges, options }: FlowCanvasProps): React.ReactElement {
  const {
    interactive = false,
    fitView = true,
    showControls = true,
    showBackground = true,
    showMiniMap = false,
  } = options ?? {};

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: false,
  }), []);

  const reactFlowProps: ReactFlowProps = {
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    defaultEdgeOptions,
    fitView,
    nodesDraggable: interactive,
    nodesConnectable: interactive,
    elementsSelectable: interactive,
    panOnDrag: interactive,
    zoomOnScroll: true,
    fitViewOptions: { padding: 0.2 },
    minZoom: 0.1,
    maxZoom: 2,
  };

  return (
    <ReactFlow {...reactFlowProps}>
      {showBackground && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
      {showControls && <Controls />}
      {showMiniMap && <MiniMap />}
    </ReactFlow>
  );
}
