import React, { useMemo, useRef } from 'react';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdgeClick?: (event: MouseEvent, edge: Edge) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMoveEnd?: (event: MouseEvent, viewport: { x: number; y: number; zoom: number }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInit?: (instance: unknown) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function FlowCanvas({ nodes, edges, options, onNodeClick, onEdgeClick, onMoveEnd, onInit, containerRef }: FlowCanvasProps): React.ReactElement {
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
    onNodeClick: onNodeClick as ReactFlowProps['onNodeClick'],
    onEdgeClick: onEdgeClick as ReactFlowProps['onEdgeClick'],
    onMoveEnd: onMoveEnd as ReactFlowProps['onMoveEnd'],
    onInit: (instance) => {
      // Store the ReactFlow instance ref for fitView access
      if (containerRef?.current) {
        (containerRef.current as unknown as { _rfInstance?: unknown })._rfInstance = instance;
      }
      onInit?.(instance);
    },
  };

  return (
    <ReactFlow {...reactFlowProps}>
      {showBackground && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
      {showControls && <Controls />}
      {showMiniMap && <MiniMap />}
    </ReactFlow>
  );
}
