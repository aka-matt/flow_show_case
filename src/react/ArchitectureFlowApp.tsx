import React, { useRef } from 'react';
import { FlowCanvas } from './FlowCanvas.js';
import { ErrorView } from './ErrorView.js';
import { LoadingView } from './LoadingView.js';
import { EmptyView } from './EmptyView.js';
import type { Node, Edge } from '@xyflow/react';

type AppState = 'loading' | 'loaded' | 'error' | 'empty';

interface ArchitectureFlowAppProps {
  nodes: unknown[];
  edges: unknown[];
  options?: {
    interactive?: boolean;
    fitView?: boolean;
    showControls?: boolean;
    showBackground?: boolean;
    showMiniMap?: boolean;
  };
  state?: AppState;
  errorMessage?: string;
  loadingText?: string;
  emptyText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdgeClick?: (event: MouseEvent, edge: Edge) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMoveEnd?: (event: MouseEvent, viewport: { x: number; y: number; zoom: number }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInit?: (instance: unknown) => void;
}

export function ArchitectureFlowApp({
  nodes,
  edges,
  options,
  state = 'loaded',
  errorMessage,
  loadingText,
  emptyText,
  onNodeClick,
  onEdgeClick,
  onMoveEnd,
  onInit,
}: ArchitectureFlowAppProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  switch (state) {
    case 'loading':
      return React.createElement(LoadingView, {
        ...(loadingText !== undefined && { text: loadingText }),
      });
    case 'error':
      return React.createElement(ErrorView, { message: errorMessage ?? 'Unknown error' });
    case 'empty':
      return React.createElement(EmptyView, {
        ...(emptyText !== undefined && { text: emptyText }),
      });
    default:
      return React.createElement(FlowCanvas, {
        nodes: nodes as Node[],
        edges: edges as Edge[],
        ...(options !== undefined && { options }),
        ...(onNodeClick !== undefined && { onNodeClick }),
        ...(onEdgeClick !== undefined && { onEdgeClick }),
        ...(onMoveEnd !== undefined && { onMoveEnd }),
        ...(onInit !== undefined && { onInit }),
        containerRef,
      });
  }
}
