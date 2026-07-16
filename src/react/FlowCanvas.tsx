import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnInit,
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
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  onEdgeClick?: (event: MouseEvent, edge: Edge) => void;
  onMoveEnd?: (event: MouseEvent, viewport: { x: number; y: number; zoom: number }) => void;
  onInit?: (instance: unknown) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

function FlowCanvasInner({
  nodes: initialNodes,
  edges: initialEdges,
  options,
  onNodeClick,
  onEdgeClick,
  onMoveEnd,
  onInit,
  containerRef,
}: FlowCanvasProps): React.ReactElement {
  const {
    interactive = false,
    fitView = true,
    showControls = true,
    showBackground = true,
    showMiniMap = false,
  } = options ?? {};

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync external node/edge updates into React Flow state
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: false,
    }),
    [],
  );

  const handleInit: OnInit = useCallback(
    (instance) => {
      if (containerRef?.current) {
        (containerRef.current as unknown as { _rfInstance?: unknown })._rfInstance = instance;
      }
      onInit?.(instance);
    },
    [containerRef, onInit],
  );

  // Build props carefully for exactOptionalPropertyTypes — never pass undefined
  const rfProps: ReactFlowProps = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    nodeTypes,
    edgeTypes,
    defaultEdgeOptions,
    fitView,
    nodesDraggable: interactive,
    nodesConnectable: false,
    elementsSelectable: interactive,
    panOnDrag: true,
    zoomOnScroll: true,
    fitViewOptions: { padding: 0.2 },
    minZoom: 0.1,
    maxZoom: 2,
    proOptions: { hideAttribution: true },
    onInit: handleInit,
    style: { width: '100%', height: '100%' },
  };

  if (onNodeClick) {
    rfProps.onNodeClick = (event, node) => onNodeClick(event.nativeEvent as MouseEvent, node);
  }
  if (onEdgeClick) {
    rfProps.onEdgeClick = (event, edge) => onEdgeClick(event.nativeEvent as MouseEvent, edge);
  }
  if (onMoveEnd) {
    rfProps.onMoveEnd = (event, viewport) => {
      const native =
        (event as unknown as { nativeEvent?: MouseEvent })?.nativeEvent ?? (event as MouseEvent);
      onMoveEnd(native, viewport);
    };
  }

  return (
    <ReactFlow {...rfProps}>
      {showBackground && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
      {showControls && <Controls />}
      {showMiniMap && <MiniMap />}
    </ReactFlow>
  );
}

export function FlowCanvas(props: FlowCanvasProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100%' }}>
        <FlowCanvasInner {...props} />
      </div>
    </ReactFlowProvider>
  );
}
